# 射箭 AI 分析系统

基于计算机视觉的射箭训练辅助系统：上传射箭视频，由本地 YOLO 服务完成**箭矢检测计数**与**人体姿态识别**，在网页端直接查看带标注的结果视频和统计明细。

前后端一体，开箱可跑，不依赖任何云端服务。

## 功能

- **箭头计数** —— 逐帧追踪每支箭，用稳定性判定过滤抖动，输出中箭总数与逐箭明细（置信度、首末帧、稳定帧数）
- **箭头检测** —— 只做逐帧标注，不计数，适合快速看检测效果
- **姿态分析** —— YOLO-Pose 识别人体骨骼关键点，输出带骨架标注的视频
- **结果可视化** —— 标注视频在线播放、统计卡片、中箭累计趋势折线、逐箭明细表
- **健康检查** —— 页头实时显示后端服务与模型状态，不连通会明确提示而不是静默失败

## 系统架构

```
┌─────────────────┐   /ai-api/**    ┌──────────────────┐
│   浏览器 / 前端   │ ───────────────▶│  Vite 开发代理    │
│  Vue 3 + TS      │                 │  (开发时)         │
│  :4000           │◀─────────────── │                  │
└─────────────────┘   JSON + mp4     └────────┬─────────┘
                                              │ 去掉 /ai-api 前缀
                                              ▼
                                   ┌──────────────────────┐
                                   │  FastAPI 识别服务     │
                                   │  :8000               │
                                   │  ┌────────────────┐  │
                                   │  │ arrow.pt (计数) │  │
                                   │  │ pose.pt  (姿态) │  │
                                   │  └────────────────┘  │
                                   └──────────────────────┘
```

前端不直连后端，统一走 `/ai-api` 前缀由代理转发。这样后端端口不写死在业务代码里，开发时也不会有跨域问题。

## 目录结构

```
.
├── frontend/                 # Vue 3 + TypeScript + Vite 前端
│   ├── src/
│   │   ├── core/api/aiBackend.ts      # 对接识别服务的独立 axios 封装
│   │   ├── views/ai-analysis/         # AI 识别页面
│   │   └── ...                        # 原有的上传、历史、用户等模块
│   └── vite.config.ts                 # 含 /ai-api 代理配置
├── backend/                  # FastAPI + YOLO 识别服务
│   ├── main.py                        # 接口层
│   ├── models/video_processor.py      # 推理与追踪逻辑
│   ├── weights/                       # arrow.pt / pose.pt
│   ├── outputs/                       # 标注视频产物（不入库）
│   ├── requirements.txt               # 兼容区间，首次安装用
│   └── requirements.lock.txt          # 精确版本，复现环境用
├── dev.py                    # 一键启动前后端 + 环境自检
└── README.md
```

## 技术栈

| 层 | 用到的 |
| --- | --- |
| 前端 | Vue 3.5、TypeScript 5.9、Vite 7、Element Plus、Pinia、Vue Router、ECharts、Fabric |
| 后端 | FastAPI、Uvicorn、Ultralytics YOLO、OpenCV、NumPy |
| 工具 | pnpm、Playwright、Vitest、vue-tsc |

## 快速开始

### 环境要求

| 项目 | 版本 |
| --- | --- |
| Node.js | `^20.19.0` 或 `>=22.12.0` |
| pnpm | 10.x |
| Python | 3.9 ~ 3.12（torch 对 3.13 支持尚不完整） |

### 安装

```bash
# 后端依赖（建议用独立 conda / venv 环境）
conda activate jisuanji_shijue      # 或自建环境

# 方式 A：兼容区间（首次安装，允许日后小幅升级）
pip install -i https://mirrors.aliyun.com/pypi/simple/ -r backend/requirements.txt

# 方式 B：精确锁定（要复现完全相同的版本时用）
pip install -i https://mirrors.aliyun.com/pypi/simple/ -r backend/requirements.lock.txt

# 前端依赖
cd frontend && pnpm install && cd ..
```

`ultralytics` 会连带安装 torch，CPU 版约 200MB，首次安装需要几分钟。有 NVIDIA 显卡想用 GPU，先按 CUDA 版本单独装 torch 再装其余依赖。

两个依赖文件二选一即可：

| 文件 | 内容 | 适用场景 |
| --- | --- | --- |
| `requirements.txt` | 6 个顶层依赖的兼容区间 | 正常安装，允许依赖小幅升级 |
| `requirements.lock.txt` | 55 项精确版本（含全部传递依赖） | 版本完全复现，排查"我这里能跑他那里不行" |

`requirements.lock.txt` 在 Python 3.9.25 + Windows AMD64 + torch 2.8.0+cpu 下导出，并已用 `pip install --dry-run` 与 `pip check` 验证无冲突。它已剔除与本项目无关的包。若在 Linux 上只用 CPU，先单独装 `torch==2.8.0 torchvision==0.23.0`（`--index-url https://download.pytorch.org/whl/cpu`），否则会拉取数 GB 的 CUDA 运行时。

### 启动

```bash
# 一键启前后端（推荐）
python dev.py

# 指定后端解释器（不激活环境时）
python dev.py --python "<conda根目录>\envs\jisuanji_shijue\python.exe"

# 只启后端 / 只启前端 / 只做自检
python dev.py --backend
python dev.py --frontend
python dev.py --check
```

解释器优先级：`--python` > 环境变量 `ARCHERY_PYTHON` > 当前解释器。当前解释器缺依赖而系统里存在 `jisuanji_shijue` 环境时，脚本会打印提示后自动切换，不会静默换环境。

启动后访问：

- 识别页面 <http://localhost:4000/ai-analysis>
- 接口文档 <http://127.0.0.1:8000/docs>
- 健康检查 <http://127.0.0.1:8000/health>

也可以分别手动启动：

```bash
cd backend  && python -m uvicorn main:app --host 127.0.0.1 --port 8000
cd frontend && pnpm dev
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 服务信息与接口清单 |
| GET | `/health` | 权重与模型加载状态 |
| POST | `/upload/arrow/tracked` | 箭头计数，返回中箭总数与逐箭明细 |
| POST | `/upload/arrow` | 箭头检测，只标注不计数 |
| POST | `/upload/pose` | 姿态识别，输出带骨骼的视频 |
| GET | `/media/{filename}` | 内联播放（前端 `<video>` 使用） |
| GET | `/download/{filename}` | 下载标注视频 |

前端统一前缀 `/ai-api`，例如 `POST /ai-api/upload/arrow/tracked` 会被转发到 `POST http://127.0.0.1:8000/upload/arrow/tracked`。

接口细节以 <http://127.0.0.1:8000/docs> 的 OpenAPI 文档为准。

### 响应体体积

`/upload/arrow/tracked` 默认只返回汇总（末帧统计 + 最终箭矢清单 + 精简趋势），因为原始实现会把每一帧的追踪快照全塞进 JSON，30 秒 30fps 的视频能到几十 MB。需要全量逐帧数据时加查询参数 `?detail=full`。

## 配置

前端配置见 `frontend/.env.example`，复制为 `.env.local` 后按需修改：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `VITE_AI_BACKEND_BASE` | `/ai-api` | 浏览器侧请求前缀 |
| `VITE_AI_BACKEND_URL` | `http://127.0.0.1:8000` | 后端真实地址（仅 Vite 代理使用，不会进浏览器） |
| `VITE_ENABLE_MOCK` | `true` | 原有 Mock 链路开关，与识别服务无关 |

后端端口可通过环境变量 `AI_BACKEND_PORT` 调整，前端端口用 `FRONTEND_PORT`。

## 部署到生产

`pnpm build` 产出的静态文件里请求前缀仍是 `/ai-api`，但 **Vite 的 `server.proxy` 只在开发时生效**。上线需要反向代理把 `/ai-api` 转到后端，例如 nginx：

```nginx
location /ai-api/ {
    proxy_pass http://127.0.0.1:8000/;   # 结尾斜杠会去掉 /ai-api 前缀
    proxy_read_timeout 1800s;            # 推理耗时较长，超时要放宽
    client_max_body_size 512m;           # 与后端上传上限对齐
}
```

## 已知限制

- **推理是同步阻塞的**：请求要等模型跑完整个视频才返回，期间前端只能显示进度与计时。1 分钟视频在普通 CPU 上约需 1–3 分钟。改造成「提交任务 → 轮询进度」需要额外引入任务表和轮询接口。
- **产物不自动清理**：`backend/outputs/` 里的标注视频会持续累积，需要定期清理。
- **识别页免登录**：`/ai-analysis` 的 `requiresAuth` 设为 `false`，便于联调。要纳入原系统权限体系，改回 `true` 并在请求头带 token 即可。
- **单机单进程**：没有做并发控制，多个请求同时进来会排队抢 CPU。

## 项目来源

本项目由两个独立仓库合并而来：

- `AIMeasureArchery` —— Vue 3 前端，负责界面、上传、历史与结果展示
- `yolo_arrow_detector` —— FastAPI + YOLO 识别服务

合并时做的整合改造（响应信封差异、代理配置、权重路径、返回体瘦身、播放接口、健康检查）记录在 `frontend/doc/` 与本文档相应章节中。

## 许可证

MIT，见 `frontend/LICENSE`。

# -*- coding: utf-8 -*-
"""
@fileoverview 射箭视频 AI 识别服务（FastAPI）
@description 在原始 yolo_arrow_detector 基础上做了三点整合性改造：
             1. 对外提供 CORS，供前端（Vite dev server）跨域或代理调用；
             2. 权重目录、输出目录改为基于本文件位置解析，不再依赖启动时的工作目录；
             3. /upload/arrow/tracked 的返回做瘦身（逐帧 tracking_summary 体积过大），
                只回传汇总数据，可通过 ?detail=full 取原始全量数据。
             另外新增 /health 健康检查、/media/{filename} 内联播放接口，供前端 <video> 直接播放。
@dependencies fastapi, uvicorn, ultralytics, opencv-python, numpy
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

# 注意：VideoProcessor 不在这里 import。
# models/video_processor.py 顶部就 import 了 cv2 与 ultralytics，
# 若在模块级引入，缺少这些重依赖时整个服务连 /docs 都起不来。
# 改成在 get_processor() 内部按需 import，缺依赖时由 /health 明确报出来。
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.video_processor import VideoProcessor

# ==================== 路径与常量 ====================

BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = BASE_DIR / "weights"
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VALID_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v"}
MAX_UPLOAD_MB = 512

# ==================== 日志 ====================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("archery-api")


# ==================== 模型懒加载 ====================

_processor: Optional["VideoProcessor"] = None
_processor_lock = threading.Lock()


def get_processor() -> "VideoProcessor":
    """懒加载 YOLO 处理器。

    放在首次请求时加载而不是 create_app() 里，这样即使权重缺失或 torch/ultralytics
    没装好，/health 与 /docs 仍然可访问，便于排查环境问题。
    """
    global _processor
    if _processor is not None:
        return _processor

    with _processor_lock:
        if _processor is None:
            from models.video_processor import VideoProcessor

            logger.info("正在加载 YOLO 模型，权重目录: %s", WEIGHTS_DIR)
            _processor = VideoProcessor(weights_dir=str(WEIGHTS_DIR))
            logger.info("模型加载完成")
    return _processor


def require_processor() -> "VideoProcessor":
    """给接口用的版本：把「依赖没装 / 权重缺失」翻译成 503，而不是笼统的 500。"""
    try:
        return get_processor()
    except (ImportError, ModuleNotFoundError) as exc:
        raise HTTPException(
            status_code=503,
            detail=f"识别依赖未安装（{exc}）。请在 backend 目录执行 pip install -r requirements.txt",
        ) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"模型权重缺失：{exc}") from exc
    except Exception as exc:  # 权重损坏、torch 版本不匹配等
        raise HTTPException(status_code=503, detail=f"模型加载失败：{exc}") from exc


# ==================== 上传与输出处理 ====================


def _check_extension(filename: str) -> str:
    """校验视频扩展名，返回小写扩展名。"""
    ext = os.path.splitext(filename.lower())[1]
    if ext not in VALID_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式 {ext or '(无扩展名)'}，支持: {sorted(VALID_EXTENSIONS)}",
        )
    return ext


def _save_upload(file: UploadFile) -> str:
    """把上传文件落盘到临时路径并返回路径。调用方负责在 finally 中删除。"""
    ext = _check_extension(file.filename or "")
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        path = tmp.name

    size_mb = os.path.getsize(path) / 1024 / 1024
    if size_mb > MAX_UPLOAD_MB:
        os.unlink(path)
        raise HTTPException(
            status_code=413,
            detail=f"文件过大（{size_mb:.1f}MB），上限 {MAX_UPLOAD_MB}MB",
        )
    logger.info("收到视频 %s，大小 %.1fMB", file.filename, size_mb)
    return path


def _publish_output(temp_output_path: str) -> str:
    """把处理结果从临时目录搬到 outputs/，返回可对外访问的文件名。

    原先结果文件留在系统临时目录里，重启或临时目录清理后链接即失效；
    统一搬到 backend/outputs/ 后，前端拿到的链接可以长期复用。
    """
    filename = f"{uuid.uuid4().hex}.mp4"
    target = OUTPUT_DIR / filename
    shutil.move(temp_output_path, target)
    return filename


def _condense_tracking(detection_results: Dict[str, Any], full: bool = False) -> Dict[str, Any]:
    """裁剪 /upload/arrow/tracked 的返回体。

    原实现把每一帧的 tracking_summary 都塞进响应，一段 30 秒 30fps 的视频
    会产生近千条记录（每条还带完整 all_arrows 列表），JSON 可达几十 MB，
    浏览器解析会直接卡死。这里只保留末帧汇总 + 最终箭矢清单 + 精简趋势。
    """
    summary_list = detection_results.get("tracking_summary") or []
    last = summary_list[-1] if summary_list else {}

    condensed: Dict[str, Any] = {
        "video_info": detection_results.get("video_info", {}),
        "total_arrows_shot": last.get("total_arrows_shot", 0),
        "current_stable_arrows": last.get("current_stable_arrows", 0),
        "frame_count": last.get("frame_count", len(summary_list)),
        "arrows": last.get("all_arrows", []),
        # 保留按帧趋势但只取关键字段，体积可控
        "trend": [
            {
                "frame": item.get("frame_count", idx),
                "total": item.get("total_arrows_shot", 0),
                "stable": item.get("current_stable_arrows", 0),
            }
            for idx, item in enumerate(summary_list)
        ],
        "detection_count": len(detection_results.get("detections", [])),
    }

    if full:
        condensed["raw"] = detection_results

    return condensed


def _condense_pose(detection_results: Dict[str, Any], full: bool = False) -> Dict[str, Any]:
    """裁剪姿态结果：只统计「多少帧检出了人、平均关键点置信度」，明细按需返回。"""
    poses = detection_results.get("poses", [])
    frames = {p.get("frame") for p in poses if p.get("frame") is not None}

    confidences: list[float] = []
    for p in poses:
        conf = p.get("keypoint_confidence") or []
        # keypoint_confidence 可能是 [[...]] 或 [...]
        flat = conf[0] if conf and isinstance(conf[0], list) else conf
        confidences.extend([c for c in flat if isinstance(c, (int, float))])

    result: Dict[str, Any] = {
        "video_info": detection_results.get("video_info", {}),
        "detected_frames": len(frames),
        "person_instances": len(poses),
        "avg_keypoint_confidence": round(sum(confidences) / len(confidences), 4)
        if confidences
        else 0.0,
    }
    if full:
        result["poses"] = poses
    return result


# ==================== 应用 ====================


def create_app() -> FastAPI:
    app = FastAPI(
        title="射箭 AI 识别服务",
        description="基于 YOLO 的箭矢检测计数与人体姿态识别，供 AIMeasureArchery 前端调用。",
        version="1.0.0",
    )

    # 前端 dev server 跑在 4000 端口，走 Vite 代理时其实不需要 CORS，
    # 但保留放开配置，方便直接连 http://localhost:8000 联调或用其它工具调用。
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["系统"])
    async def root() -> Dict[str, Any]:
        return {
            "service": "射箭 AI 识别服务",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "endpoints": [
                "POST /upload/arrow",
                "POST /upload/arrow/tracked",
                "POST /upload/pose",
                "GET  /media/{filename}",
                "GET  /download/{filename}",
            ],
        }

    @app.get("/health", tags=["系统"])
    async def health() -> Dict[str, Any]:
        """健康检查：确认权重文件在位，并尝试加载模型。"""
        weights = {p.name: p.exists() for p in (WEIGHTS_DIR / "arrow.pt", WEIGHTS_DIR / "pose.pt")}
        try:
            get_processor()
            models_ready = True
            error = None
        except Exception as exc:  # 权重缺失 / torch 未装 / 权重损坏
            models_ready = False
            error = str(exc)

        return {
            "status": "ok" if models_ready else "degraded",
            "models_ready": models_ready,
            "weights": weights,
            "weights_dir": str(WEIGHTS_DIR),
            "error": error,
        }

    @app.post("/upload/arrow", tags=["分析"])
    async def upload_arrow_video(file: UploadFile = File(...)) -> Dict[str, Any]:
        """上传箭头视频，逐帧检测并输出带标注的视频（不做计数）。"""
        temp_input = _save_upload(file)
        try:
            out_path, results = require_processor().process_arrow_video(temp_input)
            filename = _publish_output(out_path)
            return {
                "status": "success",
                "output_video_url": f"/download/{filename}",
                "preview_url": f"/media/{filename}",
                "detection_results": {
                    "video_info": results.get("video_info", {}),
                    "detection_count": len(results.get("detections", [])),
                },
            }
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("箭头视频处理失败")
            raise HTTPException(status_code=500, detail=f"视频处理失败: {exc}") from exc
        finally:
            _safe_unlink(temp_input)

    @app.post("/upload/arrow/tracked", tags=["分析"])
    async def upload_arrow_video_tracked(
        file: UploadFile = File(...),
        detail: str = Query("summary", description="summary=只要汇总；full=附带原始逐帧数据"),
    ) -> Dict[str, Any]:
        """上传箭头视频并计数，返回中箭总数与每支箭的稳定信息。"""
        temp_input = _save_upload(file)
        try:
            out_path, results = require_processor().process_arrow_video_with_tracking(temp_input)
            filename = _publish_output(out_path)
            condensed = _condense_tracking(results, full=(detail == "full"))
            logger.info("计数完成：共 %s 箭", condensed["total_arrows_shot"])
            return {
                "status": "success",
                "output_video_url": f"/download/{filename}",
                "preview_url": f"/media/{filename}",
                "detection_results": condensed,
            }
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("箭头计数处理失败")
            raise HTTPException(status_code=500, detail=f"视频处理失败: {exc}") from exc
        finally:
            _safe_unlink(temp_input)

    @app.post("/upload/pose", tags=["分析"])
    async def upload_pose_video(
        file: UploadFile = File(...),
        detail: str = Query("summary", description="summary=只要汇总；full=附带逐帧关键点"),
    ) -> Dict[str, Any]:
        """上传动作视频，识别人体姿态关键点并输出带骨骼标注的视频。"""
        temp_input = _save_upload(file)
        try:
            out_path, results = require_processor().process_pose_video(temp_input)
            filename = _publish_output(out_path)
            return {
                "status": "success",
                "output_video_url": f"/download/{filename}",
                "preview_url": f"/media/{filename}",
                "detection_results": _condense_pose(results, full=(detail == "full")),
            }
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("姿态视频处理失败")
            raise HTTPException(status_code=500, detail=f"视频处理失败: {exc}") from exc
        finally:
            _safe_unlink(temp_input)

    @app.get("/media/{filename}", tags=["产物"])
    async def media(filename: str) -> FileResponse:
        """内联播放处理后的视频（<video> 标签用这个）。"""
        path = _resolve_output(filename)
        return FileResponse(
            path=path,
            media_type="video/mp4",
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )

    @app.get("/download/{filename}", tags=["产物"])
    async def download(filename: str) -> FileResponse:
        """下载处理后的视频（浏览器直接触发保存）。"""
        path = _resolve_output(filename)
        return FileResponse(
            path=path,
            media_type="video/mp4",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    return app


def _resolve_output(filename: str) -> Path:
    """解析产物路径，并挡住目录穿越。"""
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="非法文件名")
    path = OUTPUT_DIR / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在或已被清理")
    return path


def _safe_unlink(path: Optional[str]) -> None:
    if not path:
        return
    try:
        os.unlink(path)
    except OSError as exc:
        logger.warning("临时文件清理失败 %s: %s", path, exc)


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

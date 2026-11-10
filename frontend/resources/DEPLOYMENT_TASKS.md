# 部署后任务执行指南

本文档详细说明部署完成后可以执行的所有任务及其使用方法。

## 一、快速开始

### 使用任务执行脚本（推荐）

```bash
# 查看所有可用任务
bash resources/scripts/tasks.sh help

# 执行特定任务
bash resources/scripts/tasks.sh <任务类型>
```

### 直接执行脚本

```bash
# 健康检查
bash resources/scripts/health-check.sh

# 性能测试
bash resources/scripts/performance-test.sh http://localhost:8080

# 构建验证
bash resources/scripts/verify-build.sh
```

## 二、基础运维任务

### 2.1 健康检查

**任务**: 检查容器和服务健康状态

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh health
```

**方法2**:

```bash
bash resources/scripts/health-check.sh
```

**方法3（手动）**:

```bash
curl http://localhost:8080/health
docker inspect aimeasurearchery-frontend | grep Health
```

**输出内容**:

- 容器健康状态
- HTTP健康检查结果
- 容器资源使用情况

### 2.2 查看日志

#### 查看容器日志

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh logs
```

**方法2（手动）**:

```bash
# 查看所有日志
docker logs aimeasurearchery-frontend

# 查看实时日志
docker logs -f aimeasurearchery-frontend

# 查看最近100行日志
docker logs --tail 100 aimeasurearchery-frontend
```

#### 查看Nginx访问日志

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh logs-access
```

**方法2（手动）**:

```bash
docker exec aimeasurearchery-frontend tail -f /var/log/nginx/access.log
```

#### 查看Nginx错误日志

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh logs-error
```

**方法2（手动）**:

```bash
docker exec aimeasurearchery-frontend tail -f /var/log/nginx/error.log
```

### 2.3 查看容器状态

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh status
```

**方法2（手动）**:

```bash
docker ps -a | grep aimeasurearchery
docker-compose -f resources/docker/docker-compose.yml ps
```

### 2.4 查看资源使用

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh stats
```

**方法2（手动）**:

```bash
docker stats aimeasurearchery-frontend
```

## 三、调试和维护任务

### 3.1 进入容器调试

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh shell
```

**方法2（手动）**:

```bash
docker exec -it aimeasurearchery-frontend sh
```

**常用调试命令**:

```bash
# 查看Nginx配置
cat /etc/nginx/nginx.conf

# 查看构建产物
ls -la /usr/share/nginx/html

# 测试Nginx配置
nginx -t

# 查看进程
ps aux
```

### 3.2 查看容器内文件

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh files
```

**方法2（手动）**:

```bash
# 查看构建产物
docker exec aimeasurearchery-frontend ls -la /usr/share/nginx/html

# 查看Nginx配置
docker exec aimeasurearchery-frontend ls -la /etc/nginx
```

### 3.3 重启容器

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh restart
```

**方法2（手动）**:

```bash
docker-compose -f resources/docker/docker-compose.yml restart
# 或
docker restart aimeasurearchery-frontend
```

### 3.4 停止容器

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh stop
```

**方法2（手动）**:

```bash
docker-compose -f resources/docker/docker-compose.yml stop
# 或
docker stop aimeasurearchery-frontend
```

### 3.5 启动容器

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh start
```

**方法2（手动）**:

```bash
docker-compose -f resources/docker/docker-compose.yml start
# 或
docker start aimeasurearchery-frontend
```

### 3.6 停止并清理

```bash
docker-compose -f resources/docker/docker-compose.yml down
```

**注意**: 这会停止并删除容器，但不会删除镜像。

## 四、性能和分析任务

### 4.1 性能测试

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh performance
```

**方法2（手动）**:

```bash
bash resources/scripts/performance-test.sh http://localhost:8080
```

**输出内容**:

- Lighthouse性能分数
- 关键指标（FCP、LCP、TTI、TBT、CLS）
- 性能报告文件位置

**报告位置**: `resources/scripts/performance-reports/`

### 4.2 查看构建分析报告

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh build-analysis
```

**方法2（手动）**:

```bash
# Linux
xdg-open dist/stats.html

# macOS
open dist/stats.html

# Windows
start dist/stats.html
```

**报告内容**:

- 构建产物体积分析
- 代码分割情况
- 依赖关系图
- Gzip/Brotli压缩后大小

### 4.3 构建产物大小监控

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh build-monitor
```

**方法2（手动）**:

```bash
bash resources/scripts/build-monitor.sh
```

**输出内容**:

- 构建产物总大小
- 与上次构建的对比
- 大小变化趋势
- 警告阈值检查

**报告位置**: `resources/scripts/build-reports/`

### 4.4 验证构建产物

**方法1（推荐）**:

```bash
bash resources/scripts/tasks.sh verify-build
```

**方法2（手动）**:

```bash
bash resources/scripts/verify-build.sh
```

**验证内容**:

- index.html是否存在
- JS/CSS文件是否完整
- 是否有CDN链接（不应该有）
- vendor chunk文件是否存在
- 静态资源文件是否存在

**报告位置**: `resources/scripts/build-reports/`

## 五、更新部署任务

### 5.1 更新应用

**完整流程**:

```bash
# 1. 重新构建
pnpm build

# 2. 重新构建镜像
docker build -f resources/docker/nginx/Dockerfile -t aimeasurearchery:latest .

# 3. 停止旧容器
docker-compose -f resources/docker/docker-compose.yml down

# 4. 启动新容器
docker-compose -f resources/docker/docker-compose.yml up -d

# 5. 验证部署
bash resources/scripts/tasks.sh health
```

**使用完整部署脚本**:

```bash
bash resources/scripts/deploy-full.sh
```

### 5.2 回滚到之前的版本

```bash
# 1. 查看可用镜像
docker images aimeasurearchery

# 2. 使用指定标签的镜像
docker-compose -f resources/docker/docker-compose.yml up -d --image aimeasurearchery:previous-tag
```

## 六、常用任务组合

### 6.1 部署后验证

```bash
# 1. 健康检查
bash resources/scripts/tasks.sh health

# 2. 查看状态
bash resources/scripts/tasks.sh status

# 3. 性能测试（可选）
bash resources/scripts/tasks.sh performance
```

### 6.2 问题排查

```bash
# 1. 查看容器状态
bash resources/scripts/tasks.sh status

# 2. 查看错误日志
bash resources/scripts/tasks.sh logs-error

# 3. 进入容器调试
bash resources/scripts/tasks.sh shell

# 4. 检查文件
bash resources/scripts/tasks.sh files
```

### 6.3 日常维护

```bash
# 1. 查看资源使用
bash resources/scripts/tasks.sh stats

# 2. 查看访问日志
bash resources/scripts/tasks.sh logs-access

# 3. 健康检查
bash resources/scripts/tasks.sh health
```

## 七、任务执行脚本参考

### 7.1 tasks.sh 支持的任务

| 任务类型 | 说明 | 示例 |
|---------|------|------|
| `health` | 健康检查 | `bash resources/scripts/tasks.sh health` |
| `logs` | 查看容器日志 | `bash resources/scripts/tasks.sh logs` |
| `logs-access` | 查看Nginx访问日志 | `bash resources/scripts/tasks.sh logs-access` |
| `logs-error` | 查看Nginx错误日志 | `bash resources/scripts/tasks.sh logs-error` |
| `status` | 查看容器状态 | `bash resources/scripts/tasks.sh status` |
| `stats` | 查看资源使用 | `bash resources/scripts/tasks.sh stats` |
| `shell` | 进入容器Shell | `bash resources/scripts/tasks.sh shell` |
| `restart` | 重启容器 | `bash resources/scripts/tasks.sh restart` |
| `stop` | 停止容器 | `bash resources/scripts/tasks.sh stop` |
| `start` | 启动容器 | `bash resources/scripts/tasks.sh start` |
| `performance` | 性能测试 | `bash resources/scripts/tasks.sh performance` |
| `build-analysis` | 查看构建分析 | `bash resources/scripts/tasks.sh build-analysis` |
| `build-monitor` | 构建监控 | `bash resources/scripts/tasks.sh build-monitor` |
| `verify-build` | 验证构建产物 | `bash resources/scripts/tasks.sh verify-build` |
| `files` | 查看容器内文件 | `bash resources/scripts/tasks.sh files` |
| `help` | 显示帮助 | `bash resources/scripts/tasks.sh help` |

### 7.2 环境变量配置

可以通过环境变量自定义配置：

```bash
# 设置容器名称
export CONTAINER_NAME="my-container"

# 设置应用URL
export APP_URL="http://localhost:3000"

# 设置健康检查URL
export HEALTH_URL="http://localhost:3000/health"

# 设置Compose文件
export COMPOSE_FILE="resources/docker/docker-compose.prod.yml"

# 执行任务
bash resources/scripts/tasks.sh health
```

## 八、故障排查

### 8.1 容器无法启动

```bash
# 1. 查看容器日志
bash resources/scripts/tasks.sh logs

# 2. 检查端口占用
lsof -i :8080

# 3. 检查镜像是否存在
docker images aimeasurearchery

# 4. 重新构建镜像
docker build -f resources/docker/nginx/Dockerfile -t aimeasurearchery:latest .
```

### 8.2 健康检查失败

```bash
# 1. 检查容器是否运行
bash resources/scripts/tasks.sh status

# 2. 查看错误日志
bash resources/scripts/tasks.sh logs-error

# 3. 进入容器检查
bash resources/scripts/tasks.sh shell
# 在容器内执行: nginx -t
```

### 8.3 资源加载失败

```bash
# 1. 检查容器内文件
bash resources/scripts/tasks.sh files

# 2. 验证构建产物
bash resources/scripts/tasks.sh verify-build

# 3. 查看Nginx配置
docker exec aimeasurearchery-frontend cat /etc/nginx/nginx.conf
```

## 九、最佳实践

1. **定期健康检查**: 每天执行一次健康检查
2. **监控资源使用**: 定期查看容器资源使用情况
3. **日志管理**: 定期清理日志文件，避免占用过多空间
4. **备份策略**: 重要数据需要定期备份
5. **版本管理**: 使用镜像标签管理不同版本

## 十、更新记录

- 2026-01-08: 初始版本创建

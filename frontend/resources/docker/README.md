# Docker部署文档

本文档说明如何使用Docker部署AIMeasureArchery前端应用。

## 重要说明

**默认配置**: 所有内部资源（Vue、Element Plus等依赖库）都打包到构建产物中，**不使用CDN**。这确保了：

- 构建产物自包含，无需外部依赖
- 适合本地测试和Docker部署
- 资源加载稳定，不依赖CDN服务可用性

如需使用CDN，请参考 `resources/cdn/README.md`。

## 一、前置要求

### 1.1 环境要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 足够的磁盘空间（至少2GB）

### 1.2 系统要求

- Ubuntu 20.04+（推荐）
- 或支持Docker的其他Linux发行版

## 二、快速开始

### 2.1 构建镜像

```bash
# 在项目根目录执行
docker build -f resources/docker/nginx/Dockerfile -t aimeasurearchery:latest .
```

### 2.2 运行容器

```bash
# 使用Docker Compose（推荐）
docker-compose -f resources/docker/docker-compose.yml up -d

# 或直接使用docker run
docker run -d \
  --name aimeasurearchery-frontend \
  -p 8080:80 \
  aimeasurearchery:latest
```

### 2.3 访问应用

打开浏览器访问：<http://localhost:8080>

## 三、Docker Compose使用

### 3.1 开发环境

```bash
# 启动服务
docker-compose -f resources/docker/docker-compose.yml up -d

# 查看日志
docker-compose -f resources/docker/docker-compose.yml logs -f

# 停止服务
docker-compose -f resources/docker/docker-compose.yml down
```

### 3.2 生产环境

```bash
# 启动服务
docker-compose -f resources/docker/docker-compose.prod.yml up -d

# 查看日志
docker-compose -f resources/docker/docker-compose.prod.yml logs -f

# 停止服务
docker-compose -f resources/docker/docker-compose.prod.yml down
```

## 四、配置说明

### 4.1 环境变量

| 变量名               | 默认值 | 说明             |
| -------------------- | ------ | ---------------- |
| NGINX_PORT           | 80     | Nginx监听端口    |
| NGINX_SERVER_NAME    | \_     | 服务器名称       |
| STATIC_CACHE_EXPIRES | 1y     | 静态文件缓存时间 |

### 4.2 端口映射

- **开发环境**：8080:80（容器80端口映射到主机8080端口）
- **生产环境**：80:80, 443:443（直接映射到主机80和443端口）

### 4.3 卷挂载

- **日志目录**：`nginx-logs`卷，存储Nginx访问日志和错误日志
- **SSL证书**（可选）：挂载SSL证书目录以启用HTTPS

## 五、Nginx配置

### 5.1 Gzip压缩

已启用Gzip压缩，压缩级别为6，压缩以下类型：

- text/plain
- text/css
- text/xml
- text/javascript
- application/json
- application/javascript
- image/svg+xml

### 5.2 Brotli压缩

Brotli压缩需要支持Brotli的Nginx镜像。当前配置已注释，如需启用：

1. 使用支持Brotli的镜像（如`fholzer/nginx-brotli`）
2. 取消`nginx.conf`中Brotli相关配置的注释

### 5.3 静态文件缓存

- **静态资源**（图片、CSS、JS等）：缓存1年
- **HTML文件**：不缓存，确保SPA路由正常工作

### 5.4 SPA路由支持

配置了`try_files`指令，支持Vue Router的客户端路由。

## 六、健康检查

容器配置了健康检查，每30秒检查一次：

```bash
# 手动检查健康状态
docker ps
# 查看健康检查日志
docker inspect aimeasurearchery-frontend | grep Health -A 10
```

## 七、日志管理

### 7.1 查看日志

```bash
# 查看容器日志
docker logs aimeasurearchery-frontend

# 查看Nginx访问日志
docker exec aimeasurearchery-frontend tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
docker exec aimeasurearchery-frontend tail -f /var/log/nginx/error.log
```

### 7.2 日志轮转

生产环境配置了日志轮转：

- 单个日志文件最大10MB
- 保留3个日志文件

## 八、资源限制

### 8.1 开发环境

- CPU限制：1.0核心
- 内存限制：512MB

### 8.2 生产环境

- CPU限制：2.0核心
- 内存限制：1GB

## 九、HTTPS配置（可选）

### 9.1 使用Let's Encrypt

1. 安装certbot
2. 获取SSL证书
3. 挂载证书到容器

```bash
# 在docker-compose.prod.yml中取消SSL证书挂载注释
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### 9.2 更新Nginx配置

在`nginx.conf`中添加SSL配置：

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

## 十、故障排查

### 10.1 容器无法启动

```bash
# 查看容器日志
docker logs aimeasurearchery-frontend

# 检查端口占用
netstat -tulpn | grep 80
```

### 10.2 构建失败

```bash
# 清理构建缓存
docker builder prune

# 重新构建（不使用缓存）
docker build --no-cache -f resources/docker/nginx/Dockerfile -t aimeasurearchery:latest .
```

### 10.3 静态资源404

检查构建产物是否完整：

```bash
# 进入容器检查
docker exec -it aimeasurearchery-frontend ls -la /usr/share/nginx/html
```

## 十一、更新部署

### 11.1 更新应用

```bash
# 1. 构建新镜像
docker build -f resources/docker/nginx/Dockerfile -t aimeasurearchery:latest .

# 2. 停止旧容器
docker-compose -f resources/docker/docker-compose.prod.yml down

# 3. 启动新容器
docker-compose -f resources/docker/docker-compose.prod.yml up -d
```

### 11.2 回滚

```bash
# 使用之前的镜像标签
docker-compose -f resources/docker/docker-compose.prod.yml up -d --image aimeasurearchery:previous
```

## 十二、安全建议

1. **使用非root用户**：容器内使用nginx用户运行
2. **最小权限原则**：只挂载必要的目录
3. **定期更新镜像**：定期更新基础镜像以获取安全补丁
4. **启用HTTPS**：生产环境必须使用HTTPS
5. **配置防火墙**：只开放必要的端口

## 十三、部署后任务执行

### 13.1 使用任务执行脚本（推荐）

部署完成后，可以使用统一的任务执行脚本来执行各种任务：

```bash
# 查看所有可用任务
bash resources/scripts/tasks.sh help

# 健康检查
bash resources/scripts/tasks.sh health

# 查看日志
bash resources/scripts/tasks.sh logs

# 性能测试
bash resources/scripts/tasks.sh performance

# 查看构建分析
bash resources/scripts/tasks.sh build-analysis
```

### 13.2 常用任务

**健康检查**:
```bash
bash resources/scripts/tasks.sh health
# 或
bash resources/scripts/health-check.sh
```

**查看日志**:
```bash
# 容器日志
bash resources/scripts/tasks.sh logs

# Nginx访问日志
bash resources/scripts/tasks.sh logs-access

# Nginx错误日志
bash resources/scripts/tasks.sh logs-error
```

**容器管理**:
```bash
# 查看状态
bash resources/scripts/tasks.sh status

# 重启容器
bash resources/scripts/tasks.sh restart

# 停止容器
bash resources/scripts/tasks.sh stop

# 启动容器
bash resources/scripts/tasks.sh start
```

**调试**:
```bash
# 进入容器
bash resources/scripts/tasks.sh shell

# 查看容器内文件
bash resources/scripts/tasks.sh files

# 查看资源使用
bash resources/scripts/tasks.sh stats
```

**性能和分析**:
```bash
# 性能测试
bash resources/scripts/tasks.sh performance

# 构建分析
bash resources/scripts/tasks.sh build-analysis

# 构建监控
bash resources/scripts/tasks.sh build-monitor

# 验证构建产物
bash resources/scripts/tasks.sh verify-build
```

### 13.3 完整任务清单

详细的任务执行指南请参考：`resources/DEPLOYMENT_TASKS.md`

该文档包含：
- 所有可用任务的详细说明
- 任务执行方法（推荐方法和手动方法）
- 常用任务组合
- 故障排查指南
- 最佳实践

### 13.4 完整部署流程

使用完整部署脚本一键部署：

```bash
# 完整部署（包含所有验证步骤）
bash resources/scripts/deploy-full.sh

# 完整部署并执行性能测试
bash resources/scripts/deploy-full.sh latest resources/docker/docker-compose.yml true
```

部署脚本会自动执行：
1. 部署前检查
2. 构建验证
3. Docker镜像构建
4. 容器启动
5. 健康检查
6. 性能测试（可选）

## 十四、更新记录

- 2026-01-08: 添加部署后任务执行指南
- 2026-01-08: 初始版本创建

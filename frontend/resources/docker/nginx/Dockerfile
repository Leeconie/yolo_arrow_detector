# 多阶段构建Dockerfile
# 阶段一：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm@10

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖（使用frozen-lockfile确保版本一致）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 验证构建产物完整性
RUN echo "验证构建产物..." && \
    test -d dist || (echo "错误: dist目录不存在" && exit 1) && \
    test -f dist/index.html || (echo "错误: index.html不存在" && exit 1) && \
    test -n "$(find dist -name '*.js' -type f | head -1)" || (echo "错误: 未找到JS文件" && exit 1) && \
    test -n "$(find dist -name '*.css' -type f | head -1)" || (echo "警告: 未找到CSS文件" && true) && \
    echo "构建产物验证通过"

# 阶段二：运行阶段
FROM nginx:alpine

# 设置维护者信息
LABEL maintainer="AIMeasureArchery Team"
LABEL description="AIMeasureArchery Frontend Application"

# 复制构建产物到Nginx默认目录
# 注意：所有资源（JS、CSS、图片等）都包含在dist目录中，不使用CDN
COPY --from=builder /app/dist /usr/share/nginx/html

# 验证资源文件已正确复制
RUN echo "验证资源文件..." && \
    test -f /usr/share/nginx/html/index.html || (echo "错误: index.html未正确复制" && exit 1) && \
    echo "资源文件验证通过"

# 复制Nginx配置文件
COPY resources/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY resources/docker/nginx/nginx.conf.template /etc/nginx/templates/default.conf.template

# 创建日志目录
RUN mkdir -p /var/log/nginx

# 暴露端口
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]

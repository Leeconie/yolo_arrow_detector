#!/bin/bash

# Docker部署脚本
# 功能：自动化构建和部署流程

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="aimeasurearchery"
IMAGE_TAG="${1:-latest}"
COMPOSE_FILE="resources/docker/docker-compose.prod.yml"

echo -e "${GREEN}开始部署流程...${NC}"

# 步骤1: 构建应用
echo -e "${YELLOW}步骤1: 构建应用${NC}"
pnpm build

# 步骤2: 运行构建监控
echo -e "${YELLOW}步骤2: 运行构建监控${NC}"
if [ -f "resources/scripts/build-monitor.sh" ]; then
    bash resources/scripts/build-monitor.sh || echo -e "${YELLOW}构建监控警告，继续部署...${NC}"
fi

# 步骤3: 构建Docker镜像
echo -e "${YELLOW}步骤3: 构建Docker镜像${NC}"
docker build -f resources/docker/nginx/Dockerfile -t "$IMAGE_NAME:$IMAGE_TAG" .

# 步骤4: 停止旧容器
echo -e "${YELLOW}步骤4: 停止旧容器${NC}"
docker-compose -f "$COMPOSE_FILE" down || true

# 步骤5: 启动新容器
echo -e "${YELLOW}步骤5: 启动新容器${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# 步骤6: 等待服务就绪
echo -e "${YELLOW}步骤6: 等待服务就绪${NC}"
sleep 5

# 步骤7: 健康检查
echo -e "${YELLOW}步骤7: 健康检查${NC}"
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}部署成功！${NC}"
    echo "访问地址: http://localhost"
else
    echo -e "${RED}健康检查失败，请检查日志${NC}"
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

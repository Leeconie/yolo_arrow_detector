#!/bin/bash

# 健康检查脚本
# 功能：检查容器和服务健康状态

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
CONTAINER_NAME="${1:-aimeasurearchery-frontend}"
HEALTH_URL="${2:-http://localhost/health}"

echo -e "${GREEN}开始健康检查...${NC}"

# 检查容器是否存在
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}错误: 容器 $CONTAINER_NAME 不存在${NC}"
    exit 1
fi

# 检查容器是否运行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}错误: 容器 $CONTAINER_NAME 未运行${NC}"
    exit 1
fi

# 检查健康状态
HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "none")

if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo -e "${GREEN}容器健康状态: $HEALTH_STATUS${NC}"
elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
    echo -e "${RED}容器健康状态: $HEALTH_STATUS${NC}"
    exit 1
else
    echo -e "${YELLOW}容器健康状态: $HEALTH_STATUS (未配置健康检查)${NC}"
fi

# 检查HTTP端点
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}HTTP健康检查: 通过${NC}"
else
    echo -e "${RED}HTTP健康检查: 失败${NC}"
    exit 1
fi

# 显示容器资源使用
echo ""
echo "容器资源使用:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" "$CONTAINER_NAME"

echo -e "${GREEN}健康检查完成${NC}"

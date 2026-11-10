#!/bin/bash

# 完整Docker部署脚本
# 功能：自动化完整的部署流程，包括构建验证、镜像构建、容器启动、健康检查等

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="aimeasurearchery"
IMAGE_TAG="${1:-latest}"
COMPOSE_FILE="${2:-resources/docker/docker-compose.yml}"
ENABLE_PERFORMANCE_TEST="${3:-false}"
CONTAINER_NAME="aimeasurearchery-frontend"
HEALTH_URL="http://localhost:8080/health"
APP_URL="http://localhost:8080"

# 报告目录
REPORT_DIR="resources/scripts/deployment-reports"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
REPORT_FILE="$REPORT_DIR/deployment-report-$TIMESTAMP.txt"

# 创建报告目录
mkdir -p "$REPORT_DIR"

# 记录开始时间
START_TIME=$(date +%s)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}开始完整部署流程${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 记录到报告
{
    echo "部署报告"
    echo "生成时间: $(date)"
    echo "镜像名称: $IMAGE_NAME:$IMAGE_TAG"
    echo "Compose文件: $COMPOSE_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
} > "$REPORT_FILE"

# 步骤1: 部署前检查
echo -e "${YELLOW}步骤1: 部署前检查${NC}"
{
    echo ""
    echo "步骤1: 部署前检查"
} >> "$REPORT_FILE"

# 检查Docker环境
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker环境检查通过${NC}"

# 检查端口占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}警告: 8080端口已被占用${NC}"
    echo "如果这是旧容器，将自动停止"
else
    echo -e "${GREEN}✓ 端口8080可用${NC}"
fi

# 检查构建产物
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}警告: dist目录不存在，将执行构建${NC}"
    NEED_BUILD=true
else
    echo -e "${GREEN}✓ 构建产物目录存在${NC}"
    NEED_BUILD=false
fi

# 步骤2: 构建应用（如需要）
if [ "$NEED_BUILD" = true ]; then
    echo ""
    echo -e "${YELLOW}步骤2: 构建应用${NC}"
    {
        echo ""
        echo "步骤2: 构建应用"
    } >> "$REPORT_FILE"
    
    pnpm build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 应用构建成功${NC}"
        echo "构建成功" >> "$REPORT_FILE"
    else
        echo -e "${RED}错误: 应用构建失败${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}步骤2: 验证构建产物${NC}"
    {
        echo ""
        echo "步骤2: 验证构建产物"
    } >> "$REPORT_FILE"
    
    if [ -f "resources/scripts/verify-build.sh" ]; then
        if bash resources/scripts/verify-build.sh >> "$REPORT_FILE" 2>&1; then
            echo -e "${GREEN}✓ 构建产物验证通过${NC}"
        else
            echo -e "${YELLOW}警告: 构建产物验证有警告，继续部署...${NC}"
        fi
    else
        echo -e "${YELLOW}警告: 验证脚本不存在，跳过验证${NC}"
    fi
fi

# 步骤3: 构建Docker镜像
echo ""
echo -e "${YELLOW}步骤3: 构建Docker镜像${NC}"
{
    echo ""
    echo "步骤3: 构建Docker镜像"
} >> "$REPORT_FILE"

echo "构建镜像: $IMAGE_NAME:$IMAGE_TAG"
docker build -f resources/docker/nginx/Dockerfile -t "$IMAGE_NAME:$IMAGE_TAG" . >> "$REPORT_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker镜像构建成功${NC}"
    
    # 显示镜像信息
    IMAGE_SIZE=$(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "{{.Size}}")
    echo "镜像大小: $IMAGE_SIZE"
    echo "镜像大小: $IMAGE_SIZE" >> "$REPORT_FILE"
else
    echo -e "${RED}错误: Docker镜像构建失败${NC}"
    exit 1
fi

# 步骤4: 停止旧容器
echo ""
echo -e "${YELLOW}步骤4: 停止旧容器${NC}"
{
    echo ""
    echo "步骤4: 停止旧容器"
} >> "$REPORT_FILE"

# 检查使用docker-compose还是docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down >> "$REPORT_FILE" 2>&1 || true
echo -e "${GREEN}✓ 旧容器已停止${NC}"

# 步骤5: 启动新容器
echo ""
echo -e "${YELLOW}步骤5: 启动新容器${NC}"
{
    echo ""
    echo "步骤5: 启动新容器"
} >> "$REPORT_FILE"

$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d >> "$REPORT_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 容器启动成功${NC}"
else
    echo -e "${RED}错误: 容器启动失败${NC}"
    exit 1
fi

# 步骤6: 等待服务就绪
echo ""
echo -e "${YELLOW}步骤6: 等待服务就绪${NC}"
{
    echo ""
    echo "步骤6: 等待服务就绪"
} >> "$REPORT_FILE"

echo "等待服务启动..."
for i in {1..30}; do
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 服务已就绪${NC}"
        echo "服务就绪时间: ${i}秒" >> "$REPORT_FILE"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}错误: 服务启动超时${NC}"
        echo "查看容器日志:" >> "$REPORT_FILE"
        docker logs "$CONTAINER_NAME" >> "$REPORT_FILE" 2>&1
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# 步骤7: 健康检查
echo ""
echo -e "${YELLOW}步骤7: 健康检查${NC}"
{
    echo ""
    echo "步骤7: 健康检查"
} >> "$REPORT_FILE"

if [ -f "resources/scripts/health-check.sh" ]; then
    if bash resources/scripts/health-check.sh "$CONTAINER_NAME" "$HEALTH_URL" >> "$REPORT_FILE" 2>&1; then
        echo -e "${GREEN}✓ 健康检查通过${NC}"
    else
        echo -e "${RED}错误: 健康检查失败${NC}"
        exit 1
    fi
else
    # 简单健康检查
    if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ HTTP健康检查通过${NC}"
        echo "HTTP健康检查: 通过" >> "$REPORT_FILE"
    else
        echo -e "${RED}错误: HTTP健康检查失败${NC}"
        exit 1
    fi
fi

# 步骤8: 性能测试（可选）
if [ "$ENABLE_PERFORMANCE_TEST" = "true" ]; then
    echo ""
    echo -e "${YELLOW}步骤8: 性能测试${NC}"
    {
        echo ""
        echo "步骤8: 性能测试"
    } >> "$REPORT_FILE"
    
    if [ -f "resources/scripts/performance-test.sh" ]; then
        if bash resources/scripts/performance-test.sh "$APP_URL" >> "$REPORT_FILE" 2>&1; then
            echo -e "${GREEN}✓ 性能测试完成${NC}"
        else
            echo -e "${YELLOW}警告: 性能测试有警告${NC}"
        fi
    else
        echo -e "${YELLOW}警告: 性能测试脚本不存在，跳过${NC}"
    fi
fi

# 计算部署时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 生成部署总结
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}部署成功！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "访问地址: $APP_URL"
echo "健康检查: $HEALTH_URL"
echo "部署耗时: ${DURATION}秒"
echo "报告文件: $REPORT_FILE"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 写入报告
{
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "部署总结"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "状态: 成功"
    echo "访问地址: $APP_URL"
    echo "健康检查: $HEALTH_URL"
    echo "部署耗时: ${DURATION}秒"
    echo "完成时间: $(date)"
} >> "$REPORT_FILE"

echo ""
echo -e "${GREEN}部署流程完成！${NC}"

#!/bin/bash

# 任务执行脚本
# 功能：提供统一的任务执行入口，简化常用操作

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
CONTAINER_NAME="${CONTAINER_NAME:-aimeasurearchery-frontend}"
COMPOSE_FILE="${COMPOSE_FILE:-resources/docker/docker-compose.yml}"
APP_URL="${APP_URL:-http://localhost:8080}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/health}"

# 显示使用说明
show_usage() {
    echo -e "${BLUE}任务执行脚本${NC}"
    echo ""
    echo "用法: bash resources/scripts/tasks.sh <任务类型> [参数]"
    echo ""
    echo "可用任务类型:"
    echo "  ${GREEN}health${NC}              - 健康检查"
    echo "  ${GREEN}logs${NC}                - 查看容器日志"
    echo "  ${GREEN}logs-access${NC}         - 查看Nginx访问日志"
    echo "  ${GREEN}logs-error${NC}          - 查看Nginx错误日志"
    echo "  ${GREEN}status${NC}              - 查看容器状态"
    echo "  ${GREEN}stats${NC}               - 查看容器资源使用"
    echo "  ${GREEN}shell${NC}               - 进入容器Shell"
    echo "  ${GREEN}restart${NC}             - 重启容器"
    echo "  ${GREEN}stop${NC}                - 停止容器"
    echo "  ${GREEN}start${NC}               - 启动容器"
    echo "  ${GREEN}performance${NC}         - 性能测试"
    echo "  ${GREEN}build-analysis${NC}     - 查看构建分析报告"
    echo "  ${GREEN}build-monitor${NC}      - 构建产物大小监控"
    echo "  ${GREEN}verify-build${NC}        - 验证构建产物"
    echo "  ${GREEN}files${NC}               - 查看容器内文件"
    echo "  ${GREEN}help${NC}                - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  bash resources/scripts/tasks.sh health"
    echo "  bash resources/scripts/tasks.sh logs"
    echo "  bash resources/scripts/tasks.sh performance"
}

# 检查容器是否存在
check_container() {
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}错误: 容器 $CONTAINER_NAME 不存在${NC}"
        echo "请先执行部署: bash resources/scripts/deploy-full.sh"
        exit 1
    fi
}

# 检查容器是否运行
check_running() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${YELLOW}警告: 容器 $CONTAINER_NAME 未运行${NC}"
        echo "尝试启动容器..."
        docker start "$CONTAINER_NAME" || {
            echo -e "${RED}错误: 无法启动容器${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ 容器已启动${NC}"
        sleep 2
    fi
}

# 任务处理
TASK="${1:-help}"

case "$TASK" in
    health)
        echo -e "${BLUE}执行健康检查...${NC}"
        check_container
        check_running
        if [ -f "resources/scripts/health-check.sh" ]; then
            bash resources/scripts/health-check.sh "$CONTAINER_NAME" "$HEALTH_URL"
        else
            echo -e "${YELLOW}健康检查脚本不存在，使用简单检查${NC}"
            if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ HTTP健康检查通过${NC}"
            else
                echo -e "${RED}✗ HTTP健康检查失败${NC}"
                exit 1
            fi
        fi
        ;;
    
    logs)
        echo -e "${BLUE}查看容器日志...${NC}"
        check_container
        docker logs -f "$CONTAINER_NAME"
        ;;
    
    logs-access)
        echo -e "${BLUE}查看Nginx访问日志...${NC}"
        check_container
        check_running
        docker exec "$CONTAINER_NAME" tail -f /var/log/nginx/access.log
        ;;
    
    logs-error)
        echo -e "${BLUE}查看Nginx错误日志...${NC}"
        check_container
        check_running
        docker exec "$CONTAINER_NAME" tail -f /var/log/nginx/error.log
        ;;
    
    status)
        echo -e "${BLUE}查看容器状态...${NC}"
        check_container
        docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    
    stats)
        echo -e "${BLUE}查看容器资源使用...${NC}"
        check_container
        check_running
        docker stats --no-stream "$CONTAINER_NAME"
        ;;
    
    shell)
        echo -e "${BLUE}进入容器Shell...${NC}"
        check_container
        check_running
        docker exec -it "$CONTAINER_NAME" sh
        ;;
    
    restart)
        echo -e "${BLUE}重启容器...${NC}"
        check_container
        if command -v docker-compose &> /dev/null; then
            docker-compose -f "$COMPOSE_FILE" restart
        else
            docker compose -f "$COMPOSE_FILE" restart
        fi
        echo -e "${GREEN}✓ 容器已重启${NC}"
        ;;
    
    stop)
        echo -e "${BLUE}停止容器...${NC}"
        check_container
        if command -v docker-compose &> /dev/null; then
            docker-compose -f "$COMPOSE_FILE" stop
        else
            docker compose -f "$COMPOSE_FILE" stop
        fi
        echo -e "${GREEN}✓ 容器已停止${NC}"
        ;;
    
    start)
        echo -e "${BLUE}启动容器...${NC}"
        check_container
        if command -v docker-compose &> /dev/null; then
            docker-compose -f "$COMPOSE_FILE" start
        else
            docker compose -f "$COMPOSE_FILE" start
        fi
        echo -e "${GREEN}✓ 容器已启动${NC}"
        ;;
    
    performance)
        echo -e "${BLUE}执行性能测试...${NC}"
        check_container
        check_running
        if [ -f "resources/scripts/performance-test.sh" ]; then
            bash resources/scripts/performance-test.sh "$APP_URL"
        else
            echo -e "${RED}错误: 性能测试脚本不存在${NC}"
            exit 1
        fi
        ;;
    
    build-analysis)
        echo -e "${BLUE}打开构建分析报告...${NC}"
        if [ -f "dist/stats.html" ]; then
            if command -v xdg-open &> /dev/null; then
                xdg-open dist/stats.html
            elif command -v open &> /dev/null; then
                open dist/stats.html
            else
                echo "构建分析报告: dist/stats.html"
                echo "请手动在浏览器中打开此文件"
            fi
        else
            echo -e "${YELLOW}警告: 构建分析报告不存在${NC}"
            echo "请先执行构建: pnpm build:analyze"
        fi
        ;;
    
    build-monitor)
        echo -e "${BLUE}执行构建产物大小监控...${NC}"
        if [ -f "resources/scripts/build-monitor.sh" ]; then
            bash resources/scripts/build-monitor.sh
        else
            echo -e "${RED}错误: 构建监控脚本不存在${NC}"
            exit 1
        fi
        ;;
    
    verify-build)
        echo -e "${BLUE}验证构建产物...${NC}"
        if [ -f "resources/scripts/verify-build.sh" ]; then
            bash resources/scripts/verify-build.sh
        else
            echo -e "${RED}错误: 构建验证脚本不存在${NC}"
            exit 1
        fi
        ;;
    
    files)
        echo -e "${BLUE}查看容器内文件...${NC}"
        check_container
        check_running
        echo "容器内 /usr/share/nginx/html 目录内容:"
        docker exec "$CONTAINER_NAME" ls -lah /usr/share/nginx/html
        echo ""
        echo "容器内 /etc/nginx 目录内容:"
        docker exec "$CONTAINER_NAME" ls -lah /etc/nginx
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        echo -e "${RED}错误: 未知任务类型 '$TASK'${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac

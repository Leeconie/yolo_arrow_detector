#!/bin/bash

# 性能测试脚本
# 功能：使用Lighthouse进行性能测试，生成性能报告

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
URL="${1:-http://localhost:8080}"
REPORT_DIR="resources/scripts/performance-reports"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
REPORT_FILE="$REPORT_DIR/lighthouse-report-$TIMESTAMP.html"
JSON_REPORT="$REPORT_DIR/lighthouse-report-$TIMESTAMP.json"

# 创建报告目录
mkdir -p "$REPORT_DIR"

echo -e "${GREEN}开始性能测试...${NC}"
echo "测试URL: $URL"

# 检查Lighthouse是否安装
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}Lighthouse未安装，正在安装...${NC}"
    npm install -g lighthouse
fi

# 检查Chrome/Chromium是否可用
if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到Chrome/Chromium，Lighthouse可能无法运行${NC}"
    echo "请安装Chrome或Chromium，或使用--chrome-path参数指定Chrome路径"
fi

# 运行Lighthouse测试
echo -e "${YELLOW}运行Lighthouse测试...${NC}"
lighthouse "$URL" \
    --output html,json \
    --output-path "$REPORT_DIR/lighthouse-report-$TIMESTAMP" \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet || {
    echo -e "${RED}Lighthouse测试失败${NC}"
    exit 1
}

# 解析JSON报告获取分数
if [ -f "$JSON_REPORT" ]; then
    PERFORMANCE_SCORE=$(jq -r '.categories.performance.score * 100' "$JSON_REPORT" 2>/dev/null || echo "0")
    ACCESSIBILITY_SCORE=$(jq -r '.categories.accessibility.score * 100' "$JSON_REPORT" 2>/dev/null || echo "0")
    BEST_PRACTICES_SCORE=$(jq -r '.categories["best-practices"].score * 100' "$JSON_REPORT" 2>/dev/null || echo "0")
    SEO_SCORE=$(jq -r '.categories.seo.score * 100' "$JSON_REPORT" 2>/dev/null || echo "0")

    # 获取关键指标
    FCP=$(jq -r '.audits["first-contentful-paint"].numericValue' "$JSON_REPORT" 2>/dev/null || echo "0")
    LCP=$(jq -r '.audits["largest-contentful-paint"].numericValue' "$JSON_REPORT" 2>/dev/null || echo "0")
    TTI=$(jq -r '.audits["interactive"].numericValue' "$JSON_REPORT" 2>/dev/null || echo "0")
    TBT=$(jq -r '.audits["total-blocking-time"].numericValue' "$JSON_REPORT" 2>/dev/null || echo "0")
    CLS=$(jq -r '.audits["cumulative-layout-shift"].numericValue' "$JSON_REPORT" 2>/dev/null || echo "0")

    # 输出结果
    echo ""
    echo -e "${GREEN}性能测试完成${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "性能分数: ${GREEN}${PERFORMANCE_SCORE}${NC}"
    echo "可访问性分数: ${GREEN}${ACCESSIBILITY_SCORE}${NC}"
    echo "最佳实践分数: ${GREEN}${BEST_PRACTICES_SCORE}${NC}"
    echo "SEO分数: ${GREEN}${SEO_SCORE}${NC}"
    echo ""
    echo "关键指标:"
    echo "  FCP (First Contentful Paint): ${FCP} ms"
    echo "  LCP (Largest Contentful Paint): ${LCP} ms"
    echo "  TTI (Time to Interactive): ${TTI} ms"
    echo "  TBT (Total Blocking Time): ${TBT} ms"
    echo "  CLS (Cumulative Layout Shift): ${CLS}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "报告文件: $REPORT_FILE"

    # 检查性能分数
    MIN_SCORE=90
    if (( $(echo "$PERFORMANCE_SCORE < $MIN_SCORE" | bc -l) )); then
        echo -e "${YELLOW}警告: 性能分数 ${PERFORMANCE_SCORE} 低于目标分数 ${MIN_SCORE}${NC}"
    else
        echo -e "${GREEN}性能分数达到目标${NC}"
    fi
else
    echo -e "${YELLOW}未找到JSON报告，无法解析详细结果${NC}"
fi

echo ""
echo -e "${GREEN}性能测试完成${NC}"

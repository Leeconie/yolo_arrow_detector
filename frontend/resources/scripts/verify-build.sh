#!/bin/bash

# 构建验证脚本
# 功能：验证构建产物完整性，检查是否有CDN链接，确保所有资源都打包到构建产物中

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BUILD_DIR="dist"
REPORT_FILE="resources/scripts/build-reports/verify-report-$(date +%Y-%m-%d_%H-%M-%S).txt"

# 创建报告目录
mkdir -p "$(dirname "$REPORT_FILE")"

echo -e "${GREEN}开始验证构建产物...${NC}"

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}错误: 构建目录 $BUILD_DIR 不存在${NC}"
    echo "请先执行构建: pnpm build"
    exit 1
fi

ERRORS=0
WARNINGS=0

# 验证1: 检查index.html是否存在
echo "验证1: 检查index.html..."
if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo -e "${RED}错误: index.html不存在${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ index.html存在${NC}"
fi

# 验证2: 检查是否有JS文件
echo "验证2: 检查JS文件..."
JS_FILES=$(find "$BUILD_DIR" -name "*.js" -type f | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
    echo -e "${RED}错误: 未找到JS文件${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ 找到 $JS_FILES 个JS文件${NC}"
fi

# 验证3: 检查是否有CSS文件
echo "验证3: 检查CSS文件..."
CSS_FILES=$(find "$BUILD_DIR" -name "*.css" -type f | wc -l)
if [ "$CSS_FILES" -eq 0 ]; then
    echo -e "${YELLOW}警告: 未找到CSS文件（可能内联在JS中）${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ 找到 $CSS_FILES 个CSS文件${NC}"
fi

# 验证4: 检查index.html中是否有CDN链接
echo "验证4: 检查CDN链接..."
CDN_PATTERNS=(
    "cdn.jsdelivr.net"
    "cdnjs.cloudflare.com"
    "unpkg.com"
    "cdn.bootcdn.net"
    "staticfile.org"
)

CDN_FOUND=0
for pattern in "${CDN_PATTERNS[@]}"; do
    if grep -r "$pattern" "$BUILD_DIR" --include="*.html" --include="*.js" > /dev/null 2>&1; then
        echo -e "${YELLOW}警告: 发现CDN链接 ($pattern)${NC}"
        grep -r "$pattern" "$BUILD_DIR" --include="*.html" --include="*.js" | head -5
        ((CDN_FOUND++))
    fi
done

if [ "$CDN_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✓ 未发现CDN链接（符合预期）${NC}"
else
    echo -e "${YELLOW}警告: 发现 $CDN_FOUND 种CDN链接${NC}"
    echo "注意: 如果这是用户上传的外部资源链接，可以忽略此警告"
    ((WARNINGS++))
fi

# 验证5: 检查vendor chunk文件
echo "验证5: 检查vendor chunk文件..."
VENDOR_FILES=$(find "$BUILD_DIR" -name "*vendor*.js" -type f | wc -l)
if [ "$VENDOR_FILES" -eq 0 ]; then
    echo -e "${YELLOW}警告: 未找到vendor chunk文件（可能使用了不同的命名）${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓ 找到 $VENDOR_FILES 个vendor chunk文件${NC}"
fi

# 验证6: 检查静态资源目录
echo "验证6: 检查静态资源目录..."
STATIC_DIRS=("img" "fonts" "assets")
for dir in "${STATIC_DIRS[@]}"; do
    if [ -d "$BUILD_DIR/$dir" ]; then
        FILE_COUNT=$(find "$BUILD_DIR/$dir" -type f | wc -l)
        echo -e "${GREEN}✓ $dir 目录存在，包含 $FILE_COUNT 个文件${NC}"
    else
        echo -e "${YELLOW}信息: $dir 目录不存在（可能没有对应资源）${NC}"
    fi
done

# 验证7: 检查构建产物总大小
echo "验证7: 检查构建产物总大小..."
TOTAL_SIZE=$(du -sb "$BUILD_DIR" | cut -f1)
TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc)
echo "构建产物总大小: ${TOTAL_SIZE_MB} MB"

if (( $(echo "$TOTAL_SIZE_MB > 100" | bc -l) )); then
    echo -e "${YELLOW}警告: 构建产物较大 (${TOTAL_SIZE_MB} MB)，建议检查是否有不必要的资源${NC}"
    ((WARNINGS++))
fi

# 生成报告
{
    echo "构建验证报告"
    echo "生成时间: $(date)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "验证结果:"
    echo "  JS文件: $JS_FILES"
    echo "  CSS文件: $CSS_FILES"
    echo "  Vendor文件: $VENDOR_FILES"
    echo "  CDN链接: $CDN_FOUND"
    echo "  总大小: ${TOTAL_SIZE_MB} MB"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$ERRORS" -gt 0 ]; then
        echo "错误数: $ERRORS"
    fi
    if [ "$WARNINGS" -gt 0 ]; then
        echo "警告数: $WARNINGS"
    fi
} > "$REPORT_FILE"

# 输出总结
echo ""
echo -e "${GREEN}构建验证完成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✓ 所有验证通过${NC}"
    echo "报告文件: $REPORT_FILE"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠ 验证通过，但有 $WARNINGS 个警告${NC}"
    echo "报告文件: $REPORT_FILE"
    exit 0
else
    echo -e "${RED}✗ 验证失败，发现 $ERRORS 个错误，$WARNINGS 个警告${NC}"
    echo "报告文件: $REPORT_FILE"
    exit 1
fi

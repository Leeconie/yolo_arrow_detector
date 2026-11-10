#!/bin/bash

# 构建产物大小监控脚本
# 功能：监控构建产物大小，生成构建报告，记录历史数据

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BUILD_DIR="dist"
REPORT_DIR="resources/scripts/build-reports"
HISTORY_FILE="$REPORT_DIR/build-history.json"
THRESHOLD_WARNING=50000000  # 50MB警告阈值
THRESHOLD_ERROR=100000000   # 100MB错误阈值

# 创建报告目录
mkdir -p "$REPORT_DIR"

# 获取当前时间戳
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
REPORT_FILE="$REPORT_DIR/build-report-$TIMESTAMP.json"

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}错误: 构建目录 $BUILD_DIR 不存在${NC}"
    echo "请先执行构建: pnpm build"
    exit 1
fi

echo -e "${GREEN}开始分析构建产物...${NC}"

# 计算构建产物总大小
TOTAL_SIZE=$(du -sb "$BUILD_DIR" | cut -f1)
TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc)

# 分析各个文件大小
echo "分析文件大小..."
FILE_SIZES=$(find "$BUILD_DIR" -type f -exec du -b {} + | sort -rn | head -20)

# 生成报告
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "totalSize": $TOTAL_SIZE,
  "totalSizeMB": $TOTAL_SIZE_MB,
  "buildDir": "$BUILD_DIR",
  "files": [
EOF

# 添加文件信息
FIRST=true
while IFS= read -r line; do
    if [ -n "$line" ]; then
        SIZE=$(echo "$line" | awk '{print $1}')
        FILE=$(echo "$line" | awk '{print $2}')
        RELATIVE_FILE=${FILE#$BUILD_DIR/}
        
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "," >> "$REPORT_FILE"
        fi
        
        cat >> "$REPORT_FILE" <<EOF
    {
      "file": "$RELATIVE_FILE",
      "size": $SIZE,
      "sizeMB": $(echo "scale=2; $SIZE / 1024 / 1024" | bc)
    }
EOF
    fi
done <<< "$FILE_SIZES"

cat >> "$REPORT_FILE" <<EOF
  ]
}
EOF

# 读取历史数据
if [ -f "$HISTORY_FILE" ]; then
    PREVIOUS_SIZE=$(jq -r '.history[-1].totalSize // 0' "$HISTORY_FILE" 2>/dev/null || echo "0")
    PREVIOUS_SIZE_MB=$(echo "scale=2; $PREVIOUS_SIZE / 1024 / 1024" | bc)
else
    PREVIOUS_SIZE=0
    PREVIOUS_SIZE_MB=0
fi

# 计算变化
if [ "$PREVIOUS_SIZE" -gt 0 ]; then
    SIZE_DIFF=$((TOTAL_SIZE - PREVIOUS_SIZE))
    SIZE_DIFF_MB=$(echo "scale=2; $SIZE_DIFF / 1024 / 1024" | bc)
    SIZE_DIFF_PERCENT=$(echo "scale=2; ($SIZE_DIFF / $PREVIOUS_SIZE) * 100" | bc)
else
    SIZE_DIFF=0
    SIZE_DIFF_MB=0
    SIZE_DIFF_PERCENT=0
fi

# 更新历史文件
if [ -f "$HISTORY_FILE" ]; then
    jq --arg timestamp "$TIMESTAMP" \
       --argjson totalSize "$TOTAL_SIZE" \
       --argjson totalSizeMB "$TOTAL_SIZE_MB" \
       --arg reportFile "$(basename $REPORT_FILE)" \
       '.history += [{
         "timestamp": $timestamp,
         "totalSize": $totalSize,
         "totalSizeMB": $totalSizeMB,
         "reportFile": $reportFile
       }]' "$HISTORY_FILE" > "$HISTORY_FILE.tmp" && mv "$HISTORY_FILE.tmp" "$HISTORY_FILE"
else
    cat > "$HISTORY_FILE" <<EOF
{
  "history": [
    {
      "timestamp": "$TIMESTAMP",
      "totalSize": $TOTAL_SIZE,
      "totalSizeMB": $TOTAL_SIZE_MB,
      "reportFile": "$(basename $REPORT_FILE)"
    }
  ]
}
EOF
fi

# 输出结果
echo ""
echo -e "${GREEN}构建产物分析完成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总大小: ${GREEN}${TOTAL_SIZE_MB} MB${NC} ($(numfmt --to=iec-i --suffix=B $TOTAL_SIZE))"
if [ "$PREVIOUS_SIZE" -gt 0 ]; then
    if [ "$SIZE_DIFF" -gt 0 ]; then
        echo "变化: ${RED}+${SIZE_DIFF_MB} MB${NC} (+${SIZE_DIFF_PERCENT}%)"
    else
        echo "变化: ${GREEN}${SIZE_DIFF_MB} MB${NC} (${SIZE_DIFF_PERCENT}%)"
    fi
fi
echo "报告文件: $REPORT_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查阈值
if [ "$TOTAL_SIZE" -gt "$THRESHOLD_ERROR" ]; then
    echo -e "${RED}警告: 构建产物大小超过错误阈值 (${THRESHOLD_ERROR} bytes)${NC}"
    exit 1
elif [ "$TOTAL_SIZE" -gt "$THRESHOLD_WARNING" ]; then
    echo -e "${YELLOW}警告: 构建产物大小超过警告阈值 (${THRESHOLD_WARNING} bytes)${NC}"
    exit 0
else
    echo -e "${GREEN}构建产物大小在正常范围内${NC}"
    exit 0
fi

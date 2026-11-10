# 日期处理工具流程图

## 日期格式化流程

```mermaid
flowchart TD
    Start([输入日期]) --> ValidateInput{验证输入}
    ValidateInput -->|无效| ThrowError[抛出错误]
    ValidateInput -->|有效| CreateDate[创建Date对象]
    CreateDate --> ExtractParts[提取日期部分]
    ExtractParts --> FormatYear[格式化年份 YYYY]
    FormatYear --> FormatMonth[格式化月份 MM]
    FormatMonth --> FormatDay[格式化日期 DD]
    FormatDay --> FormatHours[格式化小时 HH]
    FormatHours --> FormatMinutes[格式化分钟 mm]
    FormatMinutes --> FormatSeconds[格式化秒数 ss]
    FormatSeconds --> ReplaceTemplate[替换模板占位符]
    ReplaceTemplate --> ReturnResult[返回格式化字符串]
    ThrowError --> End([结束])
    ReturnResult --> End
```

## 日期解析流程

```mermaid
flowchart TD
    Start([输入日期字符串]) --> ValidateString{验证字符串}
    ValidateString -->|为空| ThrowError[抛出错误]
    ValidateString -->|有效| ParseDate[解析日期]
    ParseDate --> CheckValid{日期是否有效}
    CheckValid -->|无效| ThrowError
    CheckValid -->|有效| ReturnDate[返回Date对象]
    ThrowError --> End([结束])
    ReturnDate --> End
```

## 日期计算流程

```mermaid
flowchart TD
    Start([输入基准日期和天数]) --> ValidateDate{验证日期}
    ValidateDate -->|无效| ThrowError[抛出错误]
    ValidateDate -->|有效| CloneDate[克隆日期对象]
    CloneDate --> GetCurrentDate[获取当前日期]
    GetCurrentDate --> AddDays[加上天数]
    AddDays --> CheckOverflow{检查溢出}
    CheckOverflow -->|溢出| AdjustMonth[调整月份]
    CheckOverflow -->|正常| ReturnDate[返回新日期]
    AdjustMonth --> CheckYearOverflow{检查年份溢出}
    CheckYearOverflow -->|溢出| AdjustYear[调整年份]
    CheckYearOverflow -->|正常| ReturnDate
    AdjustYear --> ReturnDate
    ThrowError --> End([结束])
    ReturnDate --> End
```text

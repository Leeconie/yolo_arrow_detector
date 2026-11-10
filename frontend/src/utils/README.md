# Utils 工具函数

工具函数模块提供通用的工具方法，包括日期处理、字符串处理、加密解密、数据校验、本地存储等。

## 目录结构

````plaintext
utils/
├── date.ts       # 日期处理工具
├── string.ts     # 字符串处理工具
├── encrypt.ts    # 加密解密工具
├── validate.ts   # 数据校验工具
├── storage.ts    # 本地存储工具
└── index.ts      # 工具函数导出
```

## 模块说明

### 日期处理 (date.ts)

提供日期格式化、解析、计算等功能。

### 字符串处理 (string.ts)

提供字符串加密、解密、格式化等功能。

### 加密解密 (encrypt.ts)

提供数据加密解密功能，使用AES等加密算法。

### 数据校验 (validate.ts)

提供邮箱、手机号、身份证等数据校验功能。

### 本地存储 (storage.ts)

提供localStorage和sessionStorage的封装，支持过期机制。

## 使用示例

```ts
// 导入工具函数
import { formatDate, validateEmail, setStorage } from '@/utils'

// 日期格式化
const formatted = formatDate(new Date(), 'YYYY-MM-DD')

// 邮箱校验
const isValid = validateEmail('user@example.com')

// 本地存储
setStorage('key', 'value', 3600) // 存储1小时
```

## 依赖关系

- 依赖 `@/types` - 类型定义
- 无其他依赖
- 被所有业务模块使用
````

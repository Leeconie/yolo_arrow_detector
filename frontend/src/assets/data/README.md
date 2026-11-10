# 数据文件目录

## 目录用途

存放静态数据文件，如配置文件、初始数据、模拟数据等。

## 支持的文件格式

- **JSON** - 最常用格式，易于解析
- **YAML** - 人类可读格式，适合配置文件

## 命名规范

- 使用 **kebab-case** 命名
- 文件名应描述数据内容（如：`config-data.json`、`mock-data.json`）

## 使用示例

### 导入 JSON 文件

````typescript
import configData from '@/assets/data/config-data.json'

export default {
  setup() {
    return {
      config: configData,
    }
  },
}
```

### 动态导入

```typescript
const loadData = async () => {
  const data = await import('@/assets/data/mock-data.json')
  return data.default
}
```

## 注意事项

1. **文件大小**：JSON 文件建议不超过 **1MB**
2. **数据结构**：保持数据结构清晰、易于维护
3. **类型安全**：为 JSON 数据定义 TypeScript 类型

## 类型定义示例

```typescript
// types/data.ts
export interface ConfigData {
  apiUrl: string
  timeout: number
  retryCount: number
}

// 使用
import configData from '@/assets/data/config-data.json'
const config: ConfigData = configData
```text
````

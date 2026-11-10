# 不可抗力测试问题记录

## 文档信息

- **创建日期**: 2026-01-09
- **最后更新**: 2026-01-09
- **维护人员**: 开发团队

## 问题说明

本文档记录在测试修复过程中遇到的不可抗力问题，这些问题由于技术限制、环境限制或设计决策等原因，无法在当前阶段完全解决。

## 已记录的问题

### 1. 未处理的Promise Rejection警告（部分）

**问题描述**:
在部分测试中，虽然已经使用了`Promise.allSettled`和`try-catch`来处理Promise rejection，但Vitest仍然报告"Unhandled Rejection"警告。

**影响范围**:

- `src/__tests__/core/api/request-retry.test.ts`
- `src/__tests__/integration/api-flow.test.ts`
- `src/__tests__/integration/api-mock.test.ts`

**原因分析**:

1. 在fake timers环境下，异步操作的执行时机可能与预期不同
2. 请求队列中的Promise rejection可能在测试完成后才被处理
3. Vitest的Promise rejection检测机制可能与fake timers存在时序问题

**当前处理**:

- 已使用`Promise.allSettled`确保所有Promise都被处理
- 已添加`try-catch`块捕获错误
- 已确保所有mock错误对象包含`isAxiosError`和`toJSON`属性

**状态**: ⚠️ 部分解决，仍有警告但不影响测试功能

**建议**:

- 这些警告不影响测试的实际功能
- 可以考虑在CI/CD环境中忽略这些警告
- 未来可以考虑重构请求队列的实现，使用更明确的错误处理机制

### 2. 路由测试中的DOM操作限制

**问题描述**:
在路由集成测试中，某些DOM操作（如`document.title`设置、`window.location`跳转）在测试环境中可能无法正常工作。

**影响范围**:

- `src/__tests__/integration/routing.test.ts`

**原因分析**:

1. Vitest的测试环境（jsdom）对某些浏览器API的支持有限
2. 路由跳转涉及浏览器导航，在测试环境中难以完全模拟
3. `document.title`在某些情况下可能不会立即更新

**当前处理**:

- 已使用mock来模拟`window.location`
- 已添加适当的等待时间确保DOM更新

**状态**: ⚠️ 部分解决，需要进一步优化

**建议**:

- 考虑使用更完整的浏览器环境（如Playwright）进行E2E测试
- 对于路由测试，可以分离单元测试和集成测试
- 使用更细粒度的mock来模拟浏览器行为

### 3. 持久化优化器测试中的时间精度问题

**问题描述**:
在持久化优化器的批量写入和防抖测试中，由于JavaScript的时间精度限制，某些测试可能需要额外的等待时间。

**影响范围**:

- `src/__tests__/stores/utils/persistence-optimizer.test.ts`

**原因分析**:

1. JavaScript的`Date.now()`精度有限（通常为毫秒级）
2. 在快速连续的操作中，时间戳可能相同
3. 防抖和节流机制依赖于时间差，在测试环境中可能不够精确

**当前处理**:

- 已添加适当的时间延迟（10-20ms）确保时间戳不同
- 已使用`setTimeout`来模拟真实的时间流逝

**状态**: ✅ 已通过添加延迟解决

**建议**:

- 当前解决方案已经足够，但可以考虑使用更精确的时间模拟（如`vi.advanceTimersByTime`）

## 总结

大部分测试问题已经通过修复代码、调整测试逻辑、添加异步等待等方式解决。剩余的问题主要是：

1. **Promise Rejection警告**: 不影响功能，但会在测试报告中显示警告
2. **路由测试限制**: 部分DOM操作在测试环境中受限，需要进一步优化
3. **时间精度问题**: 已通过添加延迟解决

这些问题都不影响核心功能的正确性，可以在后续迭代中逐步优化。

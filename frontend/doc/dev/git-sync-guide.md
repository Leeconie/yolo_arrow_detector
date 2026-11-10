# Git双远程仓库同步指南

> **文档版本**：v1.0.0  
> **最后更新**：2026-01-08  
> **维护人员**：开发团队

## 概述

本项目配置了两个远程仓库，需要保持代码同步：

- **origin（GitHub）**：<https://github.com/HeZaoCha/AIMeasureArchery.git>
- **cnb（CNB平台）**：<https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front>

本文档介绍如何在这两个远程仓库之间同步代码。

## 当前配置

### 远程仓库信息

```bash
# 查看远程仓库配置
git remote -v
```

输出示例：

```text
cnb     https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front (fetch)
cnb     https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front (push)
origin  https://github.com/HeZaoCha/AIMeasureArchery.git (fetch)
origin  https://github.com/HeZaoCha/AIMeasureArchery.git (push)
origin  https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery-Front (push)  # 多推送URL配置
```

### 分支跟踪情况

- `main` 分支：跟踪 `origin/main`
- `develop` 分支：跟踪 `origin/develop`
- `feature/core-infrastructure` 分支：跟踪 `cnb/feature/core-infrastructure`

## 同步方案

### 方案1：多推送URL配置（推荐，日常使用）

**配置说明**：已为 `origin` 配置了多个推送URL，执行 `git push origin <branch>` 时会自动推送到GitHub和CNB两个仓库。

#### 使用方法

```bash
# 推送当前分支到两个远程仓库
git push origin <branch-name>

# 示例：推送feature/core-infrastructure分支
git push origin feature/core-infrastructure
```

#### 优点

- ✅ 配置一次，永久生效
- ✅ 操作简单，只需执行一次推送命令
- ✅ 无需额外脚本或工具

#### 缺点

- ⚠️ 所有推送都会同时推送到两个仓库，无法选择性推送
- ⚠️ 如果某个仓库推送失败，需要手动处理

#### 验证配置

```bash
# 查看origin的推送URL配置
git remote get-url --push --all origin
```

应该看到两个URL：

1. GitHub URL
2. CNB URL

### 方案2：同步脚本（灵活可控）

**脚本位置**：`scripts/sync-remotes.sh`

#### 使用方法

```bash
# 同步当前分支到两个远程仓库
./scripts/sync-remotes.sh

# 同步指定分支
./scripts/sync-remotes.sh -b main

# 同步所有分支
./scripts/sync-remotes.sh -a

# 先拉取再推送
./scripts/sync-remotes.sh -f -b develop

# 只推送到origin（GitHub）
./scripts/sync-remotes.sh -o -b feature/test

# 只推送到cnb
./scripts/sync-remotes.sh -c -b feature/test

# 预览模式（不实际执行）
./scripts/sync-remotes.sh -d -b main
```

#### 脚本参数说明

| 参数 | 说明 |
|------|------|
| `-a, --all` | 同步所有本地分支 |
| `-b, --branch <分支>` | 同步指定分支（默认：当前分支） |
| `-f, --fetch` | 先从远程仓库拉取最新代码再推送 |
| `-o, --origin-only` | 只推送到origin（GitHub） |
| `-c, --cnb-only` | 只推送到cnb（CNB平台） |
| `-d, --dry-run` | 仅显示将要执行的操作，不实际执行 |
| `-h, --help` | 显示帮助信息 |

#### 优点

- ✅ 可以控制推送顺序和逻辑
- ✅ 可以选择性同步特定分支
- ✅ 提供详细的日志输出
- ✅ 支持错误处理和重试

#### 缺点

- ⚠️ 需要手动执行脚本
- ⚠️ 需要维护脚本代码

### 方案3：Git钩子（可选，日志记录）

**钩子位置**：`.git/hooks/pre-push`

#### 工作原理

`pre-push` 钩子在推送前记录推送信息，主要用于日志记录和调试。

**注意**：Git本身没有post-push钩子，无法在推送后自动同步。由于已配置多推送URL（方案1），推送时会自动同步到两个仓库，无需额外的钩子。

#### 启用详细日志

```bash
# 启用详细日志输出
export GIT_SYNC_VERBOSE=true
```

#### 优点

- ✅ 可以记录推送操作日志
- ✅ 不影响推送操作

#### 缺点

- ⚠️ Git没有post-push钩子，无法在推送后自动同步
- ⚠️ 如果已配置多推送URL（方案1），此钩子主要用于日志记录

#### 注意事项

- **重要**：由于已配置多推送URL（方案1），推送时会自动同步到两个仓库，无需额外的钩子
- 此钩子主要用于日志记录，不执行同步操作
- 如果需要自动同步，请使用方案1（多推送URL）或方案2（同步脚本）

### 方案4：手动分别推送（最灵活）

#### 使用方法

```bash
# 分别推送到两个远程仓库
git push origin <branch-name>
git push cnb <branch-name>

# 示例
git push origin feature/core-infrastructure
git push cnb feature/core-infrastructure
```

#### 优点

- ✅ 完全控制推送时机和目标
- ✅ 适合需要选择性同步的场景

#### 缺点

- ⚠️ 需要记住执行两次推送
- ⚠️ 容易遗漏同步

## 方案选择建议

### 推荐配置

**主方案**：方案1（多推送URL配置）+ 方案2（同步脚本作为备选）

**理由**：

1. 方案1满足日常开发需求，简单高效
2. 方案2作为备选，处理特殊场景（如只同步特定分支、错误恢复等）
3. 方案3（Git钩子）与方案1冲突，不建议同时使用

### 不推荐同时使用

- ❌ **方案1 + 方案3**：会导致重复推送
- ✅ **方案1 + 方案2**：推荐组合
- ✅ **方案2 + 方案3**：可以组合使用

## 使用场景推荐

### 日常开发推送

**推荐方案**：方案1（多推送URL配置）

```bash
git push origin feature/core-infrastructure
```

### 需要先拉取再推送

**推荐方案**：方案2（同步脚本）

```bash
./scripts/sync-remotes.sh -f -b feature/core-infrastructure
```

### 只同步到特定仓库

**推荐方案**：方案2（同步脚本）

```bash
# 只推送到GitHub
./scripts/sync-remotes.sh -o -b feature/test

# 只推送到CNB
./scripts/sync-remotes.sh -c -b feature/test
```

### 同步所有分支

**推荐方案**：方案2（同步脚本）

```bash
./scripts/sync-remotes.sh -a
```

## 常见问题

### Q1: 推送时某个仓库失败怎么办？

**A**: 使用同步脚本可以查看详细的错误信息，然后单独推送到失败的仓库：

```bash
# 查看错误信息
./scripts/sync-remotes.sh -b <branch-name>

# 单独推送到失败的仓库
git push <remote-name> <branch-name>
```

### Q2: 两个仓库有不同提交，如何同步？

**A**: 需要先合并再推送：

```bash
# 1. 从两个远程仓库拉取最新代码
git fetch origin
git fetch cnb

# 2. 合并远程分支的更改
git merge origin/<branch-name>
git merge cnb/<branch-name>

# 3. 解决冲突（如果有）
# ... 解决冲突 ...

# 4. 推送到两个仓库
git push origin <branch-name>
git push cnb <branch-name>
```

或者使用同步脚本的 `-f` 选项：

```bash
./scripts/sync-remotes.sh -f -b <branch-name>
```

### Q3: 如何临时禁用多推送URL配置？

**A**: 使用同步脚本的 `-o` 或 `-c` 选项只推送到特定仓库，或者直接使用 `git push <remote> <branch>` 指定远程仓库。

### Q4: 如何查看当前配置的推送URL？

**A**:

```bash
# 查看所有远程仓库的推送URL
git remote get-url --push --all origin
git remote get-url --push --all cnb

# 查看Git配置文件
cat .git/config | grep -A 10 "\[remote"
```

### Q5: 如何禁用Git钩子自动同步？

**A**: 设置环境变量：

```bash
# 临时禁用（当前会话）
export GIT_AUTO_SYNC=false

# 永久禁用（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export GIT_AUTO_SYNC=false' >> ~/.bashrc
```

或者删除钩子文件：

```bash
rm .git/hooks/post-push
```

### Q6: 如何移除多推送URL配置？

**A**:

```bash
# 移除origin的CNB推送URL
git remote set-url --delete --push origin https://cnb.cool/he.zaocha/Lnu/AIMeasureArchery

# 验证配置
git remote -v
```

## 最佳实践

1. **日常推送**：使用 `git push origin <branch>`，自动同步到两个仓库
2. **重要分支合并**：使用同步脚本的 `-f` 选项，先拉取再推送，确保代码最新
3. **测试推送**：使用同步脚本的 `-d` 选项预览操作，确认无误后再执行
4. **定期检查**：定期使用 `git fetch --all` 检查两个远程仓库的状态
5. **冲突处理**：遇到冲突时，优先从主仓库（origin）拉取，解决冲突后再同步

## 注意事项

1. **权限管理**：确保对两个远程仓库都有推送权限
2. **分支策略**：明确哪些分支需要同步，哪些不需要（如临时测试分支）
3. **安全性**：避免在公共仓库暴露敏感信息
4. **错误处理**：如果某个仓库推送失败，及时检查并处理
5. **备份**：重要更改推送前，建议先推送到主仓库（origin）作为备份

## 更新记录

- **v1.0.0** (2026-01-08)：初始版本，包含四种同步方案和使用指南

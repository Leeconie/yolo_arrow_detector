<template>
  <div class="dashboard">
    <!-- 简洁头部 -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="28">
            <Aim />
          </el-icon>
          <span class="logo-text">AI射箭测量系统</span>
        </div>
        <div class="nav-actions">
          <el-dropdown @command="handleUserCommand" trigger="click" class="user-dropdown">
            <div class="user-trigger">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                <el-icon>
                  <UserFilled />
                </el-icon>
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
              <el-icon class="dropdown-icon">
                <ArrowDown />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon>
                    <User />
                  </el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  账户设置
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-divider direction="vertical" style="margin: 0 16px; height: 24px" />

          <el-button type="text" @click="handleLogout" class="logout-btn" size="small">
            <el-icon style="margin-right: 4px">
              <SwitchButton />
            </el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="dashboard-main">
      <!-- 欢迎区域 -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">
            <span class="greeting">欢迎回来</span>
            <span class="subtitle">开始您的射箭技术分析之旅</span>
          </h1>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToVideoUpload">
              <el-icon>
                <VideoCamera />
              </el-icon>
              开始新分析
            </el-button>
            <el-button size="large" @click="goToAnalysisHistory">
              <el-icon>
                <DataAnalysis />
              </el-icon>
              查看历史
            </el-button>
          </div>
        </div>
      </section>

      <!-- 数据概览卡片 -->
      <section class="metrics-section">
        <div class="metrics-grid" v-if="stats">
          <div class="metric-card">
            <div class="metric-header">
              <el-icon size="20">
                <DataAnalysis />
              </el-icon>
              <span class="metric-title">分析次数</span>
            </div>
            <div class="metric-value">{{ stats.analysisCount || 0 }}</div>
            <div class="metric-trend">
              <el-icon size="16">
                <ArrowRight />
              </el-icon>
              <span>总计</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <el-icon size="20">
                <Aim />
              </el-icon>
              <span class="metric-title">平均精度</span>
            </div>
            <div class="metric-value">{{ stats.averageDeviation || '2.3' }}cm</div>
            <div class="metric-trend">
              <el-tag :type="getDeviationType(stats.averageDeviation || 0)" size="small">
                {{ getDeviationText(stats.averageDeviation || 0) }}
              </el-tag>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <el-icon size="20">
                <Star />
              </el-icon>
              <span class="metric-title">稳定性</span>
            </div>
            <div class="metric-value">{{ stats.stabilityScore || 85 }}</div>
            <div class="metric-trend">
              <el-tag :type="getStabilityType(stats.stabilityScore || 0)" size="small">
                {{ getStabilityText(stats.stabilityScore || 0) }}
              </el-tag>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <el-icon size="20">
                <Clock />
              </el-icon>
              <span class="metric-title">最近分析</span>
            </div>
            <div class="metric-value">{{ formatTime(stats.lastAnalysisTime || '', 'date') }}</div>
            <div class="metric-trend">
              <span class="time">{{ formatTime(stats.lastAnalysisTime || '', 'time') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 快速操作区 -->
      <section class="actions-section">
        <h2 class="section-title">快速操作</h2>
        <div class="actions-grid">
          <div class="action-item" @click="goToVideoUpload">
            <div class="action-icon">
              <el-icon size="32">
                <VideoCamera />
              </el-icon>
            </div>
            <div class="action-content">
              <h3>上传视频</h3>
              <p>上传您的射箭视频进行AI分析</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </div>

          <div class="action-item" @click="goToBatchUpload">
            <div class="action-icon">
              <el-icon size="32">
                <Files />
              </el-icon>
            </div>
            <div class="action-content">
              <h3>批量上传</h3>
              <p>一次上传多个视频文件进行批量分析</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </div>

          <div class="action-item" @click="goToAnalysisHistory">
            <div class="action-icon">
              <el-icon size="32">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="action-content">
              <h3>分析历史</h3>
              <p>查看历史分析结果和改进轨迹</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </div>

          <div class="action-item" @click="goToTechniqueGuide">
            <div class="action-icon">
              <el-icon size="32">
                <Help />
              </el-icon>
            </div>
            <div class="action-content">
              <h3>技术指导</h3>
              <p>学习专业的射箭技巧和训练方法</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </div>

          <div class="action-item" @click="goToHelp">
            <div class="action-icon">
              <el-icon size="32">
                <InfoFilled />
              </el-icon>
            </div>
            <div class="action-content">
              <h3>使用帮助</h3>
              <p>了解系统功能和使用指南</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 首页组件
 * @module views/home/HomeIndex
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 现代仪表板风格的首页，展示用户数据概览和快速操作入口
 * @dependencies vue, vue-router, element-plus, @/stores/modules/user, @/core/api/archery
 */

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  DataAnalysis,
  Aim,
  VideoCamera,
  ArrowRight,
  Help,
  Star,
  Clock,
  InfoFilled,
  SwitchButton,
  User,
  Setting,
  ArrowDown,
  Files,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { getArcheryStats } from '@/core/api/archery'
import type { ArcheryStats } from '@/types/archery'
import { logger } from '@/core/logger'

defineOptions({
  name: 'HomeIndexPage',
})

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const stats = ref<ArcheryStats | null>(null)

// 计算属性
// const analysisCount = computed(() => stats.value?.analysisCount || 0)

/**
 * 获取稳定性评分类型
 * @param score 稳定性评分
 * @returns Element Plus标签类型
 */
const getStabilityType = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

/**
 * 获取稳定性评分文本
 * @param score 稳定性评分
 * @returns 评分文本
 */
const getStabilityText = (score: number): string => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  return '需改进'
}

/**
 * 获取偏差类型
 * @param deviation 偏差值
 * @returns Element Plus标签类型
 */
const getDeviationType = (deviation: number): 'success' | 'warning' | 'danger' => {
  if (deviation <= 5) return 'success'
  if (deviation <= 15) return 'warning'
  return 'danger'
}

/**
 * 获取偏差文本
 * @param deviation 偏差值
 * @returns 偏差文本
 */
const getDeviationText = (deviation: number): string => {
  if (deviation <= 5) return '精准'
  if (deviation <= 15) return '一般'
  return '需调整'
}

/**
 * 格式化时间
 * @param time 时间字符串
 * @param format 格式类型
 * @returns 格式化后的时间字符串
 */
const formatTime = (time: string, format: 'full' | 'date' | 'time' = 'full'): string => {
  if (!time) return '暂无'
  try {
    const date = new Date(time)
    switch (format) {
      case 'date':
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      case 'time':
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      default:
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
    }
  } catch {
    return time
  }
}

/**
 * 加载射箭统计数据
 */
const loadStats = async () => {
  loading.value = true
  try {
    const data = await getArcheryStats()
    stats.value = data
  } catch (error: unknown) {
    logger.error('加载统计数据失败', {
      context: {
        module: 'views',
        function: 'loadStats',
        view: 'HomeIndex',
      },
      error: error instanceof Error ? error : new Error(String(error)),
    })
    // 使用用户友好的错误消息
    const { getUserFriendlyError } = await import('@/core/api/user-friendly-errors')
    const userFriendlyMessage = getUserFriendlyError(error, { operation: '加载统计数据' })
    ElMessage.error(userFriendlyMessage)
    stats.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到视频上传页
 */
const goToVideoUpload = () => {
  router.push('/video/upload')
}

/**
 * 跳转到批量上传页
 */
const goToBatchUpload = () => {
  router.push('/video/batch-upload')
}

/**
 * 跳转到分析历史页
 */
const goToAnalysisHistory = () => {
  router.push('/analysis/history')
}

/**
 * 跳转到技术指导页
 */
const goToTechniqueGuide = () => {
  router.push('/technique/guide')
}

/**
 * 跳转到帮助页面
 */
const goToHelp = () => {
  router.push('/help')
}

/**
 * 处理用户下拉菜单命令
 */
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/profile') // 暂时跳转到个人资料页面
      break
    case 'logout':
      await handleLogout()
      break
  }
}

/**
 * 退出登录
 */
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 清除用户信息
    userStore.logout()

    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch {
    // 用户取消
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* 全局样式 */
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 头部样式 */
.dashboard-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.logo .el-icon {
  color: #3b82f6;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.user-dropdown {
  display: flex;
  align-items: center;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.user-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.dropdown-icon {
  color: #9ca3af;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.logout-btn {
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.logout-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

/* 主要内容区域 */
.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  padding: 48px 32px;
  margin-bottom: 32px;
  color: white;
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  margin-bottom: 32px;
}

.greeting {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.subtitle {
  display: block;
  font-size: 1.125rem;
  opacity: 0.9;
  font-weight: 400;
}

.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  font-weight: 600;
}

/* 数据概览区域 */
.metrics-section {
  margin-bottom: 48px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.metric-header .el-icon {
  color: #6b7280;
}

.metric-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #6b7280;
}

.metric-trend .time {
  color: #9ca3af;
}

/* 快速操作区域 */
.actions-section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.action-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.action-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

.action-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.action-content p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.action-arrow {
  color: #9ca3af;
  margin-left: auto;
  transition: all 0.2s ease;
}

.action-item:hover .action-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* 系统状态区域 */
.status-section {
  margin-bottom: 32px;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.status-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.status-item .value {
  font-weight: 600;
  color: #1f2937;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-main {
    padding: 16px;
  }

  .header-content {
    padding: 0 16px;
    height: 56px;
    gap: 8px;
  }

  .logo {
    font-size: 1.1rem;
  }

  .nav-actions {
    gap: 8px;
  }

  .logout-btn {
    padding: 8px;
    font-size: 12px;
  }

  .logout-btn .el-icon {
    margin-right: 2px;
  }

  .welcome-section {
    padding: 32px 24px;
    margin-bottom: 24px;
  }

  .greeting {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .quick-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-actions .el-button {
    width: 100%;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .metric-card {
    padding: 20px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .action-item {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .action-icon {
    margin-bottom: 12px;
  }

  .action-arrow {
    display: none;
  }

  .status-info {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 24px 16px;
  }

  .greeting {
    font-size: 1.75rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .status-card {
    padding: 20px;
  }
}
</style>

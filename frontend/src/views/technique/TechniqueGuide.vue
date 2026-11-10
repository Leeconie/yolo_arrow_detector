<template>
  <div class="technique-guide">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><Help /></el-icon>
        技术指导
      </h1>
      <p class="page-description">学习射箭技巧和改进建议，提升您的射箭水平</p>
    </div>

    <div class="guide-content">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 基础技巧 -->
        <el-tab-pane label="基础技巧" name="basics">
          <div class="guide-section">
            <h2>射箭基础姿势</h2>
            <div class="technique-cards">
              <el-card class="technique-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <el-icon size="24"><User /></el-icon>
                    <span>站姿与平衡</span>
                  </div>
                </template>
                <div class="card-content">
                  <p>正确的站姿是射箭的基础。双脚与肩同宽，身体重心均匀分布，保持身体稳定。</p>
                  <el-alert title="关键要点" type="info" :closable="false" show-icon>
                    <ul>
                      <li>双脚平行，与肩同宽</li>
                      <li>膝盖微屈，保持身体平衡</li>
                      <li>躯干正直，不要倾斜</li>
                      <li>重心落在双脚之间</li>
                    </ul>
                  </el-alert>
                </div>
              </el-card>

              <el-card class="technique-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <el-icon size="24"><Aim /></el-icon>
                    <span>瞄准技巧</span>
                  </div>
                </template>
                <div class="card-content">
                  <p>瞄准是决定箭矢方向的关键。保持眼睛、准心和目标在同一条直线上。</p>
                  <el-alert title="瞄准步骤" type="success" :closable="false" show-icon>
                    <ol>
                      <li>闭上非瞄准眼</li>
                      <li>将准心对准目标中心</li>
                      <li>调整呼吸，保持稳定</li>
                      <li>确认瞄准后松开弓弦</li>
                    </ol>
                  </el-alert>
                </div>
              </el-card>

              <el-card class="technique-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <el-icon size="24"><VideoPlay /></el-icon>
                    <span>释放技巧</span>
                  </div>
                </template>
                <div class="card-content">
                  <p>正确的释放技巧能确保箭矢稳定飞行。使用后三指释放法，保持弓弦平稳。</p>
                  <el-alert title="释放要领" type="warning" :closable="false" show-icon>
                    <ul>
                      <li>食指、中指、无名指握弦</li>
                      <li>三指同时发力释放</li>
                      <li>避免手指单独滑动</li>
                      <li>弓弦释放要平稳，不要抖动</li>
                    </ul>
                  </el-alert>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 常见问题 -->
        <el-tab-pane label="常见问题" name="problems">
          <div class="guide-section">
            <h2>常见问题及解决方案</h2>
            <div class="problem-list">
              <el-card class="problem-card" shadow="hover">
                <template #header>
                  <div class="problem-header">
                    <span class="problem-title">箭矢偏左或偏右</span>
                    <el-tag type="danger" size="small">方向问题</el-tag>
                  </div>
                </template>
                <div class="problem-content">
                  <p><strong>可能原因：</strong>瞄准时头部位置不正，或弓臂不够稳定。</p>
                  <p><strong>解决方案：</strong></p>
                  <ul>
                    <li>检查头部是否正对目标</li>
                    <li>确保弓臂伸直并保持稳定</li>
                    <li>练习在不同距离的瞄准</li>
                  </ul>
                </div>
              </el-card>

              <el-card class="problem-card" shadow="hover">
                <template #header>
                  <div class="problem-header">
                    <span class="problem-title">箭矢飞行不稳</span>
                    <el-tag type="warning" size="small">稳定性问题</el-tag>
                  </div>
                </template>
                <div class="problem-content">
                  <p><strong>可能原因：</strong>释放弓弦时手指滑动，或弓弦力度不均匀。</p>
                  <p><strong>解决方案：</strong></p>
                  <ul>
                    <li>练习正确的释放技巧</li>
                    <li>确保三指同时发力</li>
                    <li>检查弓弦是否干净平整</li>
                  </ul>
                </div>
              </el-card>

              <el-card class="problem-card" shadow="hover">
                <template #header>
                  <div class="problem-header">
                    <span class="problem-title">准心不稳</span>
                    <el-tag type="info" size="small">瞄准问题</el-tag>
                  </div>
                </template>
                <div class="problem-content">
                  <p><strong>可能原因：</strong>呼吸不均匀，或肌肉紧张导致瞄准不稳。</p>
                  <p><strong>解决方案：</strong></p>
                  <ul>
                    <li>练习深呼吸技巧</li>
                    <li>在瞄准前放松肌肉</li>
                    <li>增加手臂力量训练</li>
                  </ul>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 进阶技巧 -->
        <el-tab-pane label="进阶技巧" name="advanced">
          <div class="guide-section">
            <h2>进阶射箭技巧</h2>
            <div class="advanced-content">
              <el-alert
                title="进阶训练建议"
                description="这些技巧需要建立在扎实的基础之上，通过反复练习来掌握。"
                type="info"
                :closable="false"
                show-icon
              />

              <div class="skill-sections">
                <div class="skill-section">
                  <h3>心理调节</h3>
                  <p>
                    射箭不仅是体力运动，更是心理素质的考验。学会控制情绪，保持专注，是提高成绩的关键。
                  </p>
                  <ul>
                    <li>比赛前进行放松训练</li>
                    <li>培养积极的心理暗示</li>
                    <li>学会处理比赛压力</li>
                  </ul>
                </div>

                <div class="skill-section">
                  <h3>技术细调</h3>
                  <p>通过AI分析结果，针对性地调整技术动作，不断优化射箭姿势。</p>
                  <ul>
                    <li>分析每次射箭的数据</li>
                    <li>找出技术上的薄弱环节</li>
                    <li>制定针对性的训练计划</li>
                  </ul>
                </div>

                <div class="skill-section">
                  <h3>体能训练</h3>
                  <p>射箭需要良好的身体素质，特别是核心力量和手臂力量。</p>
                  <ul>
                    <li>增强核心肌群训练</li>
                    <li>手臂力量专项训练</li>
                    <li>提高身体协调性</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 视频教程 -->
        <el-tab-pane label="视频教程" name="videos">
          <div class="guide-section">
            <h2>射箭教学视频</h2>
            <div class="video-tutorials">
              <el-card
                class="video-card"
                shadow="hover"
                v-for="video in tutorialVideos"
                :key="video.id"
              >
                <div class="video-content">
                  <div class="video-thumbnail">
                    <el-image
                      :src="video.thumbnail"
                      :alt="video.title"
                      fit="cover"
                      class="thumbnail-image"
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon size="48"><VideoPlay /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="play-overlay">
                      <el-icon size="48" class="play-icon"><VideoPlay /></el-icon>
                    </div>
                  </div>
                  <div class="video-info">
                    <h4>{{ video.title }}</h4>
                    <p>{{ video.description }}</p>
                    <div class="video-meta">
                      <span class="duration">
                        <el-icon><Clock /></el-icon>
                        {{ video.duration }}
                      </span>
                      <span class="level">
                        <el-icon><Star /></el-icon>
                        {{ video.level }}
                      </span>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 技术指导页面
 * @module views/technique/TechniqueGuide
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供射箭技术指导和学习资料
 * @dependencies vue, element-plus, @element-plus/icons-vue
 */

import { ref } from 'vue'
import { Help, User, Aim, VideoPlay, Clock, Star } from '@element-plus/icons-vue'

/**
 * 教程视频接口
 */
interface TutorialVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  level: string
}

// 响应式数据
const activeTab = ref('basics')

// 教程视频数据
const tutorialVideos = ref<TutorialVideo[]>([
  {
    id: '1',
    title: '射箭基础姿势详解',
    description: '从零开始学习正确的射箭姿势，掌握射箭的基本要领',
    thumbnail: '/api/placeholder/300/200',
    duration: '15:30',
    level: '初级',
  },
  {
    id: '2',
    title: '瞄准技巧训练',
    description: '提高瞄准精度，掌握专业的瞄准技巧和方法',
    thumbnail: '/api/placeholder/300/200',
    duration: '12:45',
    level: '中级',
  },
  {
    id: '3',
    title: '释放技巧精讲',
    description: '弓弦释放的正确方法，避免常见错误',
    thumbnail: '/api/placeholder/300/200',
    duration: '18:20',
    level: '中级',
  },
  {
    id: '4',
    title: '心理调节训练',
    description: '掌握比赛心理调节技巧，提高竞技水平',
    thumbnail: '/api/placeholder/300/200',
    duration: '22:10',
    level: '高级',
  },
])

/**
 * 处理标签页点击
 */
interface TabItem {
  name: string
  title: string
}

const handleTabClick = (tab: TabItem) => {
  console.log('Tab clicked:', tab.name)
}
</script>

<style scoped>
.technique-guide {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  color: #6b7280;
  font-size: 1.1rem;
}

.guide-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.guide-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.technique-cards,
.problem-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.technique-card,
.problem-card {
  transition: all 0.3s ease;
}

.technique-card:hover,
.problem-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-content {
  padding-top: 16px;
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.problem-title {
  font-weight: 600;
}

.problem-content {
  padding-top: 16px;
}

.problem-content ul,
.problem-content ol {
  margin: 12px 0;
  padding-left: 20px;
}

.problem-content li {
  margin-bottom: 8px;
}

.advanced-content {
  max-width: 800px;
}

.skill-sections {
  margin-top: 24px;
}

.skill-section {
  margin-bottom: 32px;
}

.skill-section h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.skill-section > p {
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.6;
}

.skill-section ul {
  padding-left: 20px;
}

.skill-section li {
  margin-bottom: 8px;
  color: #4b5563;
}

.video-tutorials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.video-card {
  overflow: hidden;
  transition: all 0.3s ease;
}

.video-card:hover {
  transform: translateY(-2px);
}

.video-content {
  display: flex;
  flex-direction: column;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 180px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #c0c4cc;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  color: white;
}

.video-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.4;
}

.video-info > p {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.video-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #9ca3af;
}

.video-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .technique-guide {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .guide-content {
    padding: 16px;
  }

  .technique-cards,
  .problem-list,
  .video-tutorials {
    grid-template-columns: 1fr;
  }

  .video-thumbnail {
    height: 150px;
  }
}
</style>

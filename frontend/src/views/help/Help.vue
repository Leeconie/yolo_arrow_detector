<template>
  <div class="help-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><InfoFilled /></el-icon>
        使用帮助
      </h1>
      <p class="page-description">了解如何使用AI射箭测量系统，解决常见问题</p>
    </div>

    <div class="help-content">
      <el-row :gutter="24">
        <el-col :span="18">
          <div class="main-content">
            <el-tabs v-model="activeTab">
              <!-- 快速开始 -->
              <el-tab-pane label="快速开始" name="quick-start">
                <div class="help-section">
                  <h2>快速开始使用</h2>
                  <div class="steps">
                    <el-steps :active="1" direction="vertical">
                      <el-step
                        title="上传视频"
                        description="同时上传箭靶视频和人体姿态视频，开始AI分析"
                      >
                        <div class="step-content">
                          <p>系统需要两个视频文件进行准确分析：</p>
                          <ul>
                            <li><strong>箭靶视频：</strong>拍摄箭着点和靶子的视频</li>
                            <li><strong>人体姿态视频：</strong>拍摄射箭动作的人体姿态视频</li>
                          </ul>
                          <el-button type="primary" size="small" @click="goToUpload">
                            立即上传
                          </el-button>
                        </div>
                      </el-step>
                      <el-steps title="等待分析" description="AI系统正在分析您的射箭动作和箭着点">
                        <div class="step-content">
                          <p>分析过程通常需要1-3分钟，具体时间取决于视频长度和复杂度。</p>
                        </div>
                      </el-steps>
                      <el-step title="查看结果" description="获取详细的技术分析报告和改进建议">
                        <div class="step-content">
                          <p>分析完成后，您可以查看：</p>
                          <ul>
                            <li>稳定性评分</li>
                            <li>偏差值分析</li>
                            <li>技术动作评估</li>
                            <li>个性化改进建议</li>
                          </ul>
                        </div>
                      </el-step>
                    </el-steps>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 常见问题 -->
              <el-tab-pane label="常见问题" name="faq">
                <div class="help-section">
                  <h2>常见问题解答</h2>
                  <el-collapse v-model="activeNames">
                    <el-collapse-item title="为什么需要同时上传两个视频？" name="1">
                      <div class="faq-content">
                        <p>AI射箭测量系统需要同时分析箭着点和人体姿态，才能提供准确的技术评估：</p>
                        <ul>
                          <li><strong>箭靶视频：</strong>用于确定箭矢的实际着点位置</li>
                          <li><strong>人体姿态视频：</strong>用于分析射箭动作的技术要领</li>
                          <li><strong>综合分析：</strong>将两者结合，提供完整的射箭技术评估</li>
                        </ul>
                      </div>
                    </el-collapse-item>

                    <el-collapse-item title="视频格式和质量有什么要求？" name="2">
                      <div class="faq-content">
                        <p>为了获得最佳分析效果，请注意以下要求：</p>
                        <ul>
                          <li><strong>支持格式：</strong>MP4, AVI, MOV, MKV等常见格式</li>
                          <li><strong>视频质量：</strong>建议720P以上分辨率</li>
                          <li><strong>拍摄角度：</strong>确保箭靶和人体姿态清晰可见</li>
                          <li><strong>光线条件：</strong>避免过度曝光或过暗的环境</li>
                        </ul>
                      </div>
                    </el-collapse-item>

                    <el-collapse-item title="分析结果如何解读？" name="3">
                      <div class="faq-content">
                        <p>分析结果包含多个维度的数据：</p>
                        <ul>
                          <li>
                            <strong>稳定性评分：</strong
                            >80分以上为优秀，60-79为良好，60分以下需要重点改进
                          </li>
                          <li><strong>偏差值：</strong>表示箭矢偏离目标中心的距离，越小越好</li>
                          <li><strong>技术评分：</strong>评估各个技术环节的完成度</li>
                          <li><strong>改进建议：</strong>针对性的训练建议和技巧指导</li>
                        </ul>
                      </div>
                    </el-collapse-item>

                    <el-collapse-item title="如何提高分析准确性？" name="4">
                      <div class="faq-content">
                        <p>以下方法可以提高分析结果的准确性：</p>
                        <ul>
                          <li>使用稳定的三脚架拍摄视频</li>
                          <li>确保箭靶和人体在视频中都清晰可见</li>
                          <li>避免快速移动或镜头抖动</li>
                          <li>在良好的光线条件下拍摄</li>
                          <li>保持合适的拍摄距离和角度</li>
                        </ul>
                      </div>
                    </el-collapse-item>

                    <el-collapse-item title="遇到上传失败怎么办？" name="5">
                      <div class="faq-content">
                        <p>如果遇到上传失败，请尝试以下解决方案：</p>
                        <ul>
                          <li>检查网络连接是否稳定</li>
                          <li>确认视频文件大小不超过限制（512MB）</li>
                          <li>尝试压缩视频文件或降低分辨率</li>
                          <li>刷新页面重新尝试上传</li>
                          <li>如果问题持续，请联系技术支持</li>
                        </ul>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </el-tab-pane>

              <!-- 技术支持 -->
              <el-tab-pane label="技术支持" name="support">
                <div class="help-section">
                  <h2>技术支持</h2>
                  <div class="support-content">
                    <el-alert
                      title="遇到问题？我们随时为您提供帮助"
                      type="info"
                      :closable="false"
                      show-icon
                    />

                    <div class="support-options">
                      <el-card class="support-card" shadow="hover">
                        <div class="support-icon">
                          <el-icon size="32"><ChatDotRound /></el-icon>
                        </div>
                        <div class="support-info">
                          <h4>在线客服</h4>
                          <p>工作日 9:00-18:00</p>
                          <el-button type="primary" size="small">联系客服</el-button>
                        </div>
                      </el-card>

                      <el-card class="support-card" shadow="hover">
                        <div class="support-icon">
                          <el-icon size="32"><Message /></el-icon>
                        </div>
                        <div class="support-info">
                          <h4>邮件支持</h4>
                          <p>support@archery-ai.com</p>
                          <el-button type="default" size="small">发送邮件</el-button>
                        </div>
                      </el-card>

                      <el-card class="support-card" shadow="hover">
                        <div class="support-icon">
                          <el-icon size="32"><Document /></el-icon>
                        </div>
                        <div class="support-info">
                          <h4>技术文档</h4>
                          <p>详细的使用指南和技术文档</p>
                          <el-button type="default" size="small">查看文档</el-button>
                        </div>
                      </el-card>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="sidebar">
            <el-card class="quick-links" shadow="never">
              <template #header>
                <div class="sidebar-title">
                  <el-icon><Lightning /></el-icon>
                  <span>快速链接</span>
                </div>
              </template>
              <div class="link-list">
                <el-button text @click="goToHome" class="link-item">
                  <el-icon><HomeFilled /></el-icon>
                  返回首页
                </el-button>
                <el-button text @click="goToUpload" class="link-item">
                  <el-icon><VideoCamera /></el-icon>
                  上传视频
                </el-button>
                <el-button text @click="goToHistory" class="link-item">
                  <el-icon><DataAnalysis /></el-icon>
                  分析历史
                </el-button>
                <el-button text @click="goToTechnique" class="link-item">
                  <el-icon><Help /></el-icon>
                  技术指导
                </el-button>
              </div>
            </el-card>

            <el-card class="tips-card" shadow="never">
              <template #header>
                <div class="sidebar-title">
                  <el-icon><Lightbulb /></el-icon>
                  <span>使用提示</span>
                </div>
              </template>
              <div class="tips-content">
                <el-alert
                  title="拍摄建议"
                  description="使用手机或相机垂直拍摄箭靶，确保箭靶完全在画面中。"
                  type="success"
                  :closable="false"
                  show-icon
                />
                <el-alert
                  title="分析时间"
                  description="视频分析通常需要1-3分钟，请耐心等待。"
                  type="info"
                  :closable="false"
                  show-icon
                />
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 帮助页面
 * @module views/help/Help
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供系统使用帮助和常见问题解答
 * @dependencies vue, vue-router, element-plus, @element-plus/icons-vue
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'HelpPage',
})
import {
  InfoFilled,
  ChatDotRound,
  Message,
  Document,
  Lightning,
  HomeFilled,
  VideoCamera,
  DataAnalysis,
  Help,
  InfoFilled as Lightbulb,
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const activeTab = ref('quick-start')
const activeNames = ref(['1'])

/**
 * 导航方法
 */
const goToHome = () => router.push('/home')
const goToUpload = () => router.push('/video/upload')
const goToHistory = () => router.push('/analysis/history')
const goToTechnique = () => router.push('/technique/guide')
</script>

<style scoped>
.help-page {
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

.help-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.main-content {
  min-height: 600px;
}

.help-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.steps {
  padding: 20px 0;
}

.step-content {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.step-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.step-content li {
  margin-bottom: 8px;
}

.faq-content {
  padding: 16px 0;
}

.faq-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.faq-content li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.support-content {
  max-width: 600px;
}

.support-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.support-card {
  text-align: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.support-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.support-icon {
  color: #667eea;
  margin-bottom: 12px;
}

.support-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.support-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.sidebar {
  position: sticky;
  top: 24px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  justify-content: flex-start;
  padding: 8px 0;
  color: #4b5563;
}

.link-item:hover {
  color: #667eea;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .help-page {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .help-content {
    padding: 16px;
  }

  .support-options {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    margin-top: 24px;
  }
}
</style>

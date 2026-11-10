<template>
  <div
    class="type-selector"
    :data-testid="$attrs['data-testid']"
    role="radiogroup"
    aria-label="选择视频类型"
  >
    <div
      v-for="option in typeOptions"
      :key="option.value"
      class="type-card"
      :class="{ 'type-card--selected': modelValue === option.value }"
      role="radio"
      :aria-checked="modelValue === option.value"
      tabindex="0"
      :aria-label="`选择${option.title}类型视频`"
      @click="handleSelect(option.value)"
      @keydown.enter.space.prevent="handleSelect(option.value)"
    >
      <div class="type-card__icon">
        <component :is="option.icon" size="32" />
      </div>
      <div class="type-card__content">
        <h3 class="type-card__title">{{ option.title }}</h3>
        <p class="type-card__description">{{ option.description }}</p>
      </div>
      <div v-if="option.recommended" class="type-card__badge">
        <el-tag type="primary" size="small">推荐</el-tag>
      </div>
      <div
        class="type-card__indicator"
        :class="{ 'type-card__indicator--active': modelValue === option.value }"
      >
        <el-icon size="16"><Check /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 视频类型选择组件
 * @module modules/video/upload/components/TypeSelector
 * @author HeZaoCha
 * @date 2026-01-11
 * @description 提供视频类型选择功能，支持运动人体视频和射箭视频两种类型，采用现代化卡片式设计
 * @dependencies vue, element-plus, @element-plus/icons-vue, ./types/uploadTypes
 */

import { VideoType } from '../types/uploadTypes'
import { User as HumanIcon, Aim as ArcheryIcon, Check } from '@element-plus/icons-vue'
import type { Component } from 'vue'

/**
 * 组件Props
 */
interface Props {
  /** 选中的视频类型 */
  modelValue: VideoType | null
}

/**
 * 组件Emits
 */
interface Emits {
  /** 类型变更事件 */
  (e: 'update:modelValue', value: VideoType): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 类型选项配置
 */
interface TypeOption {
  value: VideoType
  title: string
  description: string
  icon: Component
  recommended?: boolean
}

const typeOptions: TypeOption[] = [
  {
    value: VideoType.HUMAN,
    title: '运动人体视频',
    description: '用于分析人体姿态和动作',
    icon: HumanIcon,
    recommended: true, // 默认推荐人体分析
  },
  {
    value: VideoType.ARCHERY,
    title: '射箭视频',
    description: '用于分析射箭动作和箭着点',
    icon: ArcheryIcon,
  },
]

/**
 * 处理类型选择
 */
function handleSelect(value: VideoType): void {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.type-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-large);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.type-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--box-shadow-light);
  transform: translateY(-2px);
}

.type-card--selected {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  box-shadow: var(--box-shadow-light);
}

.type-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.type-card__icon {
  flex-shrink: 0;
  margin-right: 16px;
  color: var(--color-primary);
  transition: color 0.3s ease;
}

.type-card--selected .type-card__icon {
  color: var(--color-primary);
}

.type-card__content {
  flex: 1;
  min-width: 0;
}

.type-card__title {
  margin: 0 0 4px 0;
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: 1.4;
}

.type-card__description {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-regular);
  line-height: 1.5;
}

.type-card__badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.type-card__indicator {
  flex-shrink: 0;
  margin-left: 16px;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-circle);
  border: 2px solid var(--color-border-light);
  background: var(--color-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.type-card__indicator--active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .type-selector {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px 0;
  }

  .type-card {
    padding: 16px;
  }

  .type-card__icon {
    margin-right: 12px;
  }

  .type-card__title {
    font-size: var(--font-size-base);
  }

  .type-card__description {
    font-size: var(--font-size-small);
  }
}
</style>

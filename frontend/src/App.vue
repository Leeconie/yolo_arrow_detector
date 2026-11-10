<script setup lang="ts">
/**
 * @fileoverview 根组件
 * @module App
 * @author HeZaoCha
 * @date 2026-01-10
 * @description Vue应用的根组件，包含路由视图和错误边界
 */
import { RouterView } from 'vue-router'
import ErrorBoundary from '@/core/error/ErrorBoundary.vue'
</script>

<template>
  <div id="app">
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

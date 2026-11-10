<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="login-header">
          <el-icon size="20"><UserFilled /></el-icon>
          <span class="login-title">用户登录</span>
        </div>
      </template>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        label-width="0px"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-text class="test-tips">测试账号：zhangsan / 123456</el-text>
        <el-divider direction="horizontal" content-position="center" border-style="dashed" />
        <el-text type="primary" class="register-link" @click="goToRegister">
          <el-icon size="14"><CirclePlus /></el-icon>
          没有账号？立即注册
        </el-text>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 登录页组件
 * @module views/LoginPage
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 用户登录页面，支持测试账号和真实账号登录
 */

import { reactive, ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { UserFilled, CirclePlus } from '@element-plus/icons-vue'
import { userLogin } from '@/core/api/user'
import { useUserStore } from '@/stores/modules/user'
import type { LoginRequest, UserInfo } from '@/types/user'
import { logger } from '@/core/logger'

defineOptions({
  name: 'LoginPage',
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const loginFormRef = ref<FormInstance>()

// 登录表单数据
const loginForm = reactive<LoginRequest>({
  username: '',
  password: '',
})

// 表单校验规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
  ],
}

// 测试账号配置
const TEST_ACCOUNT = 'zhangsan'
const TEST_PASSWORD = '123456'
const TEST_USER_INFO: UserInfo = {
  id: 1,
  username: 'zhangsan',
  nickname: '测试用户',
  phone: '13888888888',
}

// 登录逻辑
const handleLogin = async () => {
  // 表单校验
  if (!loginFormRef.value) {
    return
  }

  try {
    await loginFormRef.value.validate()
  } catch {
    ElMessage.error('请完善登录信息！')
    return
  }

  loading.value = true

  try {
    const currentUsername = loginForm.username.trim()
    const currentPassword = loginForm.password.trim()

    // 测试账号：纯前端Mock，不调用后端接口
    if (currentUsername === TEST_ACCOUNT && currentPassword === TEST_PASSWORD) {
      // 设置测试token和用户信息
      userStore.setToken('test_token_1234567890abcdef')
      userStore.setUserInfo(TEST_USER_INFO)

      // 等待状态更新完成（状态更新优化器使用nextTick，需要等待）
      await nextTick()
      // 额外等待一小段时间，确保状态已完全更新
      await new Promise((resolve) => setTimeout(resolve, 50))

      ElMessage.success('登录成功！')
      loading.value = false

      // 跳转到原始路径或首页
      const redirect = (route.query.redirect as string) || '/home'
      router.push(redirect)
      return
    }

    // 普通账号：调用真实后端接口
    const response = await userLogin({
      username: currentUsername,
      password: currentPassword,
    })

    // 设置token和用户信息
    userStore.setToken(response.accessToken)
    userStore.setUserInfo(response.userInfo)

    // 等待状态更新完成（状态更新优化器使用nextTick，需要等待）
    await nextTick()
    // 额外等待一小段时间，确保状态已完全更新
    await new Promise((resolve) => setTimeout(resolve, 50))

    ElMessage.success('登录成功！')
    loading.value = false

    // 跳转到原始路径或首页
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } catch (error) {
    loading.value = false
    // 使用用户友好的错误消息
    const { getUserFriendlyError } = await import('@/core/api/user-friendly-errors')
    const userFriendlyMessage = getUserFriendlyError(error, { operation: '登录' })
    ElMessage.error(userFriendlyMessage)

    // 记录详细错误日志（仅开发者可见）
    const errorMessage = error instanceof Error ? error.message : '登录失败'
    logger.error('用户登录失败', {
      context: {
        module: 'views',
        function: 'handleLogin',
        view: 'Login',
      },
      error: error instanceof Error ? error : new Error(errorMessage),
      data: {
        username: loginForm.username,
        originalError: errorMessage,
      },
    })
  }
}

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
  padding: 20px;
}

.login-card {
  width: 420px;
  border-radius: 12px;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  gap: 8px;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
}

.login-footer {
  margin-top: 15px;
  text-align: center;
}

.test-tips {
  font-size: 12px;
  display: block;
  margin-bottom: 10px;
}

.register-link {
  cursor: pointer;
  font-size: 14px;
  display: inline-block;
  margin-top: 10px;
}

.register-link:hover {
  color: #2563eb;
}
</style>

<template>
  <div class="register-page">
    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="register-header">
          <el-icon size="20"><Plus /></el-icon>
          <span class="register-title">用户注册</span>
        </div>
      </template>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-width="0px"
      >
        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称（2-10位）"
            prefix-icon="UserFilled"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名（3-20位，登录用）"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPwd">
          <el-input
            v-model="registerForm.confirmPwd"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="success"
            size="large"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <el-divider direction="horizontal" content-position="center" border-style="dashed" />
        <el-text type="primary" class="login-link" @click="goToLogin">
          <el-icon size="14"><UserFilled /></el-icon>
          已有账号？立即登录
        </el-text>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 注册页组件
 * @module views/RegisterPage
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 用户注册页面，支持新用户注册
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { UserFilled, Plus } from '@element-plus/icons-vue'
import { userRegister } from '@/core/api/user'
import { useUserStore } from '@/stores/modules/user'
import type { RegisterRequest } from '@/types/user'
import { logger } from '@/core/logger'

defineOptions({
  name: 'RegisterPage',
})

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const registerFormRef = ref<FormInstance>()

// 注册表单数据
const registerForm = reactive<RegisterRequest & { confirmPwd: string }>({
  nickname: '',
  username: '',
  password: '',
  confirmPwd: '',
})

// 注册校验规则
const registerRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '昵称长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入用户名（登录用）', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
  ],
  confirmPwd: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致！'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 注册逻辑
const handleRegister = async () => {
  // 表单校验
  if (!registerFormRef.value) {
    return
  }

  try {
    await registerFormRef.value.validate()
  } catch {
    ElMessage.error('请完善注册信息！')
    return
  }

  loading.value = true

  try {
    const registerData: RegisterRequest = {
      nickname: registerForm.nickname,
      username: registerForm.username,
      password: registerForm.password,
    }

    const response = await userRegister(registerData)

    // 设置token和用户信息
    userStore.setToken(response.accessToken)
    userStore.setUserInfo(response.userInfo)

    ElMessage.success('注册成功！')
    loading.value = false

    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    loading.value = false
    // 使用用户友好的错误消息
    const { getUserFriendlyError } = await import('@/core/api/user-friendly-errors')
    const userFriendlyMessage = getUserFriendlyError(error, { operation: '注册' })
    ElMessage.error(userFriendlyMessage)

    // 记录详细错误日志（仅开发者可见）
    const errorMessage = error instanceof Error ? error.message : '注册失败'
    logger.error('用户注册失败', {
      context: {
        module: 'views',
        function: 'handleRegister',
        view: 'Register',
      },
      error: error instanceof Error ? error : new Error(errorMessage),
      data: {
        username: registerForm.username,
        nickname: registerForm.nickname,
        originalError: errorMessage,
      },
    })
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  padding: 20px;
}

.register-card {
  width: 420px;
  border-radius: 12px;
}

.register-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  gap: 8px;
}

.register-form {
  margin-top: 20px;
}

.register-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
}

.register-footer {
  margin-top: 15px;
  text-align: center;
}

.login-link {
  cursor: pointer;
  font-size: 14px;
  display: inline-block;
  margin-top: 10px;
}

.login-link:hover {
  color: #2563eb;
}
</style>

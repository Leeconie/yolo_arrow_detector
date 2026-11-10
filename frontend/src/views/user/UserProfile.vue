<template>
  <div class="profile-page">
    <el-card class="profile-card" shadow="hover">
      <!-- 卡片头部 -->
      <template #header>
        <div class="profile-header">
          <el-icon size="20"><User /></el-icon>
          <span class="profile-title">个人中心</span>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="4" animated />
      </div>

      <!-- 1. 用户信息展示区 -->
      <div v-else class="info-display">
        <el-descriptions title="用户基础信息" border :column="1" class="info-desc">
          <el-descriptions-item label="用户名">
            {{ userInfo.username }}
            <el-tag size="small" type="info">不可修改</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ userInfo.nickname || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ userInfo.gender || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ maskPhone(userInfo.phone) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="info-actions">
          <el-button type="primary" :icon="Edit" @click="openInfoDialog">修改基础信息</el-button>
          <el-button type="warning" :icon="Lock" @click="openPwdDialog">修改密码</el-button>
          <el-button type="success" :icon="House" @click="goBackHome">返回首页</el-button>
        </div>
      </div>

      <!-- 2. 基础信息编辑弹窗 -->
      <el-dialog
        v-model="infoDialogVisible"
        title="修改基础信息"
        width="500px"
        center
        destroy-on-close
      >
        <el-form ref="infoFormRef" :model="editInfoForm" :rules="infoRules" label-width="80px">
          <!-- 用户名（纯展示） -->
          <el-form-item label="用户名">
            <el-input v-model="editInfoForm.username" disabled />
          </el-form-item>
          <!-- 昵称（可编辑） -->
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="editInfoForm.nickname"
              placeholder="请输入昵称（2-10位）"
              :prefix-icon="UserFilled"
            />
          </el-form-item>
          <!-- 性别（可编辑） -->
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="editInfoForm.gender">
              <el-radio value="男">男</el-radio>
              <el-radio value="女">女</el-radio>
              <el-radio value="保密">保密</el-radio>
            </el-radio-group>
          </el-form-item>
          <!-- 手机号（可编辑） -->
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="editInfoForm.phone"
              placeholder="请输入11位手机号"
              :prefix-icon="Phone"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="infoDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveInfo" :loading="infoLoading">确认修改</el-button>
        </template>
      </el-dialog>

      <!-- 3. 密码修改弹窗 -->
      <el-dialog v-model="pwdDialogVisible" title="修改密码" width="450px" center destroy-on-close>
        <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
          <el-form-item label="原密码" prop="oldPwd">
            <el-input
              v-model="pwdForm.oldPwd"
              type="password"
              placeholder="请输入原密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPwd">
            <el-input
              v-model="pwdForm.newPwd"
              type="password"
              placeholder="请输入新密码（至少6位）"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmNewPwd">
            <el-input
              v-model="pwdForm.confirmNewPwd"
              type="password"
              placeholder="请确认新密码"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePwd" :loading="pwdLoading">确认修改</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 个人中心组件
 * @module views/user/UserProfile
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 用户个人信息展示、编辑和密码修改
 * @dependencies vue, vue-router, element-plus, @/stores/modules/user, @/core/api/user
 */

import { reactive, ref, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { User, Edit, Lock, House, UserFilled, Phone } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import { getUserInfo, updateUserInfo, updateUserPwd } from '@/core/api/user'
import type { UserInfo } from '@/types/user'
import { logger } from '@/core/logger'

// 更新用户信息请求类型
type UpdateUserInfoRequest = {
  nickname?: string
  gender?: string
  phone?: string
  avatar?: string
  userAge?: number
}

// 密码修改请求类型（与API参数匹配）
type UpdatePasswordRequest = {
  oldPwd: string
  newPwd: string
}

defineOptions({
  name: 'UserProfilePage',
})

const router = useRouter()
const userStore = useUserStore()

// ===== 基础变量 =====
const loading = ref(true)
const infoDialogVisible = ref(false)
const pwdDialogVisible = ref(false)
const infoLoading = ref(false)
const pwdLoading = ref(false)
const infoFormRef = ref<FormInstance>()
const pwdFormRef = ref<FormInstance>()

// 核心：定义测试账号标识（用于修改操作时判断）
const TEST_ACCOUNT = 'zhangsan'

// 用户信息（展示用）
const userInfo = reactive<Partial<UserInfo>>({
  username: '',
  nickname: '',
  gender: '',
  phone: '',
})

// 基础信息编辑表单
const editInfoForm = reactive<UpdateUserInfoRequest & { username: string }>({
  username: '',
  nickname: '',
  gender: '',
  phone: '',
})

// 监听用户信息变化
watch(
  () => userInfo,
  (newVal) => {
    editInfoForm.username = newVal.username || ''
    editInfoForm.nickname = newVal.nickname || ''
    editInfoForm.gender = newVal.gender || ''
    editInfoForm.phone = newVal.phone || ''
  },
  { deep: true },
)

// 密码修改表单
const pwdForm = reactive<UpdatePasswordRequest & { confirmNewPwd: string }>({
  oldPwd: '',
  newPwd: '',
  confirmNewPwd: '',
})

// 校验规则
const infoRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '昵称长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位手机号', trigger: 'blur' },
  ],
}

const pwdRules: FormRules = {
  oldPwd: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' },
  ],
  confirmNewPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPwd) {
          callback(new Error('两次输入的新密码不一致！'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/**
 * 手机号脱敏
 * @param phone 手机号
 * @returns 脱敏后的手机号
 */
const maskPhone = (phone?: string): string => {
  if (!phone) return '未设置'
  return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

/**
 * 初始化用户信息
 */
const initUserInfo = async () => {
  loading.value = true
  try {
    // 从store获取用户信息
    if (userStore.userInfo) {
      Object.assign(userInfo, {
        username: userStore.userInfo.username || '',
        nickname: userStore.userInfo.nickname || '',
        gender: userStore.userInfo?.gender || '',
        phone: userStore.userInfo.phone || '',
      })
      loading.value = false
      return
    }

    // 如果store中没有，尝试从API获取
    if (!userStore.userInfo) {
      ElMessage.warning('请先登录！')
      router.push('/login')
      return
    }

    // 调用API获取用户信息
    const data = await getUserInfo()
    Object.assign(userInfo, {
      username: data.username || '',
      nickname: data.nickname || '',
      gender: data.gender || '',
      phone: data.phone || '',
    })

    // 更新store
    userStore.setUserInfo(data)
  } catch (error: unknown) {
    logger.error('初始化用户信息失败', {
      context: {
        module: 'views',
        function: 'initUserInfo',
        view: 'UserProfile',
      },
      error: error instanceof Error ? error : new Error(String(error)),
    })
    // 如果API失败，使用store中的信息
    if (userStore.userInfo) {
      Object.assign(userInfo, {
        username: userStore.userInfo.username || '未知用户',
        nickname: userStore.userInfo.nickname || '',
        gender: userStore.userInfo?.gender || '',
        phone: userStore.userInfo.phone || '',
      })
    } else {
      ElMessage.error('加载信息失败，请稍后重试！')
    }
  } finally {
    loading.value = false
  }
}

/**
 * 打开基础信息编辑弹窗
 */
const openInfoDialog = () => {
  infoDialogVisible.value = true
  nextTick(() => {
    infoFormRef.value?.clearValidate()
  })
}

/**
 * 打开密码修改弹窗
 */
const openPwdDialog = () => {
  pwdDialogVisible.value = true
  pwdForm.oldPwd = ''
  pwdForm.newPwd = ''
  pwdForm.confirmNewPwd = ''
  nextTick(() => {
    pwdFormRef.value?.clearValidate()
  })
}

/**
 * 保存基础信息
 */
const saveInfo = async () => {
  try {
    await infoFormRef.value?.validate()
  } catch {
    return ElMessage.error('请完善信息后提交！')
  }

  infoLoading.value = true
  try {
    // 获取当前登录账号
    if (!userStore.userInfo || !userStore.userInfo.username) {
      ElMessage.error('用户信息不存在，请重新登录！')
      infoLoading.value = false
      return
    }
    const currentUsername = userStore.userInfo.username

    // 1. 测试账号：纯前端Mock，不调接口
    if (currentUsername === TEST_ACCOUNT) {
      // 仅更新本地存储和store
      const updatedInfo: UserInfo = {
        ...userStore.userInfo!,
        nickname: editInfoForm.nickname,
        phone: editInfoForm.phone,
        ...(editInfoForm.gender ? { gender: editInfoForm.gender } : {}),
      }
      userStore.setUserInfo(updatedInfo)
      Object.assign(userInfo, {
        nickname: editInfoForm.nickname,
        gender: editInfoForm.gender,
        phone: editInfoForm.phone,
      })
      ElMessage.success('基础信息修改成功！')
      infoLoading.value = false
      infoDialogVisible.value = false
      return
    }

    // 2. 普通账号：调真实接口
    await updateUserInfo({
      nickname: editInfoForm.nickname,
      gender: editInfoForm.gender,
      phone: editInfoForm.phone,
    })

    // 更新store和本地显示
    const updatedInfo: UserInfo & { gender?: string } = {
      ...userStore.userInfo!,
      nickname: editInfoForm.nickname,
      phone: editInfoForm.phone,
      ...(editInfoForm.gender ? { gender: editInfoForm.gender } : {}),
    }
    userStore.setUserInfo(updatedInfo)
    Object.assign(userInfo, {
      nickname: editInfoForm.nickname,
      gender: editInfoForm.gender,
      phone: editInfoForm.phone,
    })

    ElMessage.success('基础信息修改成功！')
  } catch (error: unknown) {
    // 使用用户友好的错误消息
    const { getUserFriendlyError } = await import('@/core/api/user-friendly-errors')
    const userFriendlyMessage = getUserFriendlyError(error, { operation: '修改用户信息' })
    ElMessage.error(userFriendlyMessage)

    // 记录详细错误日志（仅开发者可见）
    const errorMessage = error instanceof Error ? error.message : '修改失败'
    logger.error('修改用户信息失败', {
      context: {
        module: 'views',
        function: 'handleUpdateInfo',
        view: 'UserProfile',
      },
      error: error instanceof Error ? error : new Error(errorMessage),
      data: {
        updatedFields: Object.keys(editInfoForm),
        originalError: errorMessage,
      },
    })
  } finally {
    infoLoading.value = false
    infoDialogVisible.value = false
  }
}

/**
 * 保存密码
 */
const savePwd = async () => {
  try {
    await pwdFormRef.value?.validate()
  } catch {
    return ElMessage.error('请完善密码信息后提交！')
  }

  pwdLoading.value = true
  try {
    // 获取当前登录账号
    if (!userStore.userInfo || !userStore.userInfo.username) {
      ElMessage.error('用户信息不存在，请重新登录！')
      pwdLoading.value = false
      return
    }
    const currentUsername = userStore.userInfo.username

    // 1. 测试账号：纯前端Mock，不调接口
    if (currentUsername === TEST_ACCOUNT) {
      // 仅校验原密码（测试账号原密码固定为123456）
      if (pwdForm.oldPwd !== '123456') {
        ElMessage.error('原密码错误！测试账号原密码：123456')
        pwdLoading.value = false
        return
      }
      ElMessage.success(`密码修改成功！请使用新密码${pwdForm.newPwd}登录`)
      // 测试账号密码修改后，提示重新登录
      await ElMessageBox.confirm('密码修改成功，请重新登录！', '提示', {
        confirmButtonText: '确定',
        type: 'success',
      })
      userStore.logout()
      router.push('/login')
      pwdLoading.value = false
      pwdDialogVisible.value = false
      return
    }

    // 2. 普通账号：调真实接口
    await updateUserPwd({
      oldPassword: pwdForm.oldPwd,
      newPassword: pwdForm.newPwd,
    })

    ElMessage.success('密码修改成功！')
    await ElMessageBox.confirm('密码修改成功，请重新登录！', '提示', {
      confirmButtonText: '确定',
      type: 'success',
    })
    userStore.logout()
    router.push('/login')
  } catch (error: unknown) {
    // 使用用户友好的错误消息
    const { getUserFriendlyError } = await import('@/core/api/user-friendly-errors')
    const userFriendlyMessage = getUserFriendlyError(error, { operation: '修改密码' })
    ElMessage.error(userFriendlyMessage)

    // 记录详细错误日志（仅开发者可见）
    const errorMessage = error instanceof Error ? error.message : '修改密码失败'
    logger.error('修改用户密码失败', {
      context: {
        module: 'views',
        function: 'handleUpdatePwd',
        view: 'UserProfile',
      },
      error: error instanceof Error ? error : new Error(String(error)),
      data: {
        originalError: errorMessage,
      },
    })
  } finally {
    pwdLoading.value = false
    pwdDialogVisible.value = false
  }
}

/**
 * 返回首页
 */
const goBackHome = () => {
  router.push('/home')
  ElMessage.info('已返回首页！')
}

// 页面加载初始化
onMounted(() => {
  initUserInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
  padding: 40px 20px;
}
.profile-card {
  width: 700px;
  border-radius: 12px;
}
.profile-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  gap: 8px;
}
.loading-container {
  padding: 20px;
}
.info-display {
  margin-top: 20px;
}
.info-desc {
  margin-bottom: 20px;
}
.info-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
:deep(.el-descriptions__label) {
  font-weight: 600;
  width: 100px;
}
:deep(.el-dialog__header) {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}
:deep(.el-dialog__body) {
  padding-top: 20px;
}
</style>

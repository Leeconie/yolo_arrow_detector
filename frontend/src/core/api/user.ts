/**
 * @fileoverview 用户相关API接口
 * @module core/api/user
 * @description 提供用户相关的API接口，包括注册、登录、信息查询、信息更新等
 * @author HeZaoCha
 * @date 2026-01-11
 * @dependencies @/core/api/client, @/types/user
 */

import { apiClient } from './client'
import type {
  UserInfo,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/user'
import { logger } from '@/core/logger'

/**
 * 用户注册接口
 */
export async function userRegister(userData: RegisterRequest): Promise<RegisterResponse> {
  logger.info('用户注册', {
    context: { module: 'api', function: 'userRegister' },
    data: { username: userData.username, nickname: userData.nickname },
  })

  const response = await apiClient.post<RegisterResponse>('/user/register', userData)

  logger.info('用户注册成功', {
    context: { module: 'api', function: 'userRegister' },
    data: { userId: response.data.userInfo?.id, username: response.data.userInfo?.username },
  })

  return response.data
}

/**
 * 用户登录接口
 */
export async function userLogin(loginData: LoginRequest): Promise<LoginResponse> {
  logger.info('用户登录', {
    context: { module: 'api', function: 'userLogin' },
    data: { username: loginData.username },
  })

  const response = await apiClient.post<LoginResponse>('/user/login', loginData)

  logger.info('用户登录成功', {
    context: { module: 'api', function: 'userLogin' },
    data: { userId: response.data.userInfo?.id, username: response.data.userInfo?.username },
  })

  return response.data
}

/**
 * 获取用户信息接口
 */
export async function getUserInfo(): Promise<UserInfo> {
  logger.info('获取用户信息', {
    context: { module: 'api', function: 'getUserInfo' },
  })

  const response = await apiClient.get<UserInfo>('/user/info')
  return response.data
}

/**
 * 更新用户信息接口
 */
export async function updateUserInfo(userData: Partial<UserInfo>): Promise<UserInfo> {
  logger.info('更新用户信息', {
    context: { module: 'api', function: 'updateUserInfo' },
  })

  const response = await apiClient.put<UserInfo>('/user/info', userData)
  return response.data
}

/**
 * 用户登出接口
 */
export async function userLogout(): Promise<void> {
  logger.info('用户登出', {
    context: { module: 'api', function: 'userLogout' },
  })

  await apiClient.post('/user/logout')
}

/**
 * 更新用户密码接口
 */
export async function updateUserPassword(data: {
  oldPassword: string
  newPassword: string
}): Promise<void> {
  logger.info('更新用户密码', {
    context: { module: 'api', function: 'updateUserPassword' },
  })

  await apiClient.put('/user/password', data)
}

/**
 * 更新用户密码接口（别名，保持向后兼容）
 */
export const updateUserPwd = updateUserPassword

/**
 * 用户注册接口
 * @param userData 用户注册数据，包含nickname、username、password等字段
 * @returns 返回注册结果，包含用户信息和token
 * @description 新用户注册接口，创建新用户账号
 * @example
 * ```typescript
 * const result = await userRegister({
 *   nickname: '张三',
 *   username: 'zhangsan',
 *   password: 'password123'
 * })
 * console.log(result.userInfo) // 用户信息
 * ```
 */

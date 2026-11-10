/**
 * @fileoverview 用户类型定义
 * @module types/user
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义用户相关的类型，包括用户信息、角色、权限等
 */

/**
 * 用户信息接口
 */
export interface UserInfo {
  /** 用户ID */
  id: number
  /** 用户名 */
  username: string
  /** 昵称 */
  nickname?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像URL */
  avatar?: string
  /** 用户角色 */
  roles?: UserRole[]
  /** 用户权限 */
  permissions?: Permission[]
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
  /** 用户年龄（可选） */
  userAge?: number
  /** 性别（可选） */
  gender?: string
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  /** 管理员 */
  ADMIN = 'admin',
  /** 普通用户 */
  USER = 'user',
  /** 访客 */
  GUEST = 'guest',
}

/**
 * 权限类型
 */
export interface Permission {
  /** 权限ID */
  id: string
  /** 权限名称 */
  name: string
  /** 权限代码 */
  code: string
  /** 权限描述 */
  description?: string
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名或邮箱 */
  username: string
  /** 密码 */
  password: string
  /** 验证码（可选） */
  captcha?: string
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌（可选） */
  refreshToken?: string
  /** 令牌过期时间（秒） */
  expiresIn?: number
  /** 用户信息 */
  userInfo: UserInfo
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  /** 昵称 */
  nickname: string
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 邮箱（可选） */
  email?: string
  /** 手机号（可选） */
  phone?: string
}

/**
 * 注册响应数据
 */
export interface RegisterResponse {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌（可选） */
  refreshToken?: string
  /** 令牌过期时间（秒） */
  expiresIn?: number
  /** 用户信息 */
  userInfo: UserInfo
}

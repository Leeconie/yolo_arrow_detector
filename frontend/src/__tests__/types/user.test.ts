/**
 * @fileoverview 用户类型定义单元测试
 * @module types/user.test
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 测试用户类型定义的正确性和类型导出
 */

import { describe, it, expect } from 'vitest'
import type { UserInfo, Permission, LoginRequest, LoginResponse } from '@/types/user'
import { UserRole } from '@/types/user'

describe('用户类型定义', () => {
  describe('UserInfo接口', () => {
    it('应该正确定义UserInfo接口', () => {
      const userInfo: UserInfo = {
        id: 1,
        username: 'testuser',
      }
      expect(userInfo.id).toBe(1)
      expect(userInfo.username).toBe('testuser')
    })

    it('应该支持所有可选字段', () => {
      const fullUserInfo: UserInfo = {
        id: 1,
        username: 'testuser',
        nickname: 'Test User',
        email: 'test@example.com',
        phone: '13800138000',
        avatar: 'https://example.com/avatar.jpg',
        roles: [UserRole.USER],
        permissions: [{ id: '1', name: 'read', code: 'read' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }
      expect(fullUserInfo.nickname).toBe('Test User')
      expect(fullUserInfo.email).toBe('test@example.com')
      expect(fullUserInfo.roles).toHaveLength(1)
      expect(fullUserInfo.permissions).toHaveLength(1)
    })

    it('应该支持roles数组', () => {
      const userInfo: UserInfo = {
        id: 1,
        username: 'admin',
        roles: [UserRole.ADMIN, UserRole.USER],
      }
      expect(userInfo.roles).toContain(UserRole.ADMIN)
      expect(userInfo.roles).toContain(UserRole.USER)
    })

    it('应该支持permissions数组', () => {
      const userInfo: UserInfo = {
        id: 1,
        username: 'user',
        permissions: [
          { id: '1', name: 'read', code: 'read', description: 'Read permission' },
          { id: '2', name: 'write', code: 'write' },
        ],
      }
      expect(userInfo.permissions).toHaveLength(2)
      expect(userInfo.permissions?.[0].description).toBe('Read permission')
    })
  })

  describe('UserRole枚举', () => {
    it('应该定义所有用户角色', () => {
      expect(UserRole.ADMIN).toBe('admin')
      expect(UserRole.USER).toBe('user')
      expect(UserRole.GUEST).toBe('guest')
    })

    it('应该可以用于类型检查', () => {
      const role: UserRole = UserRole.ADMIN
      expect(role).toBe('admin')
    })

    it('应该支持数组使用', () => {
      const roles: UserRole[] = [UserRole.ADMIN, UserRole.USER]
      expect(roles).toHaveLength(2)
      expect(roles).toContain(UserRole.ADMIN)
    })
  })

  describe('Permission接口', () => {
    it('应该正确定义Permission接口', () => {
      const permission: Permission = {
        id: '1',
        name: 'read',
        code: 'read',
      }
      expect(permission.id).toBe('1')
      expect(permission.name).toBe('read')
      expect(permission.code).toBe('read')
    })

    it('应该支持可选description字段', () => {
      const permissionWithDesc: Permission = {
        id: '1',
        name: 'read',
        code: 'read',
        description: 'Read permission description',
      }
      expect(permissionWithDesc.description).toBe('Read permission description')

      const permissionWithoutDesc: Permission = {
        id: '2',
        name: 'write',
        code: 'write',
      }
      expect(permissionWithoutDesc.description).toBeUndefined()
    })
  })

  describe('LoginRequest接口', () => {
    it('应该正确定义LoginRequest接口', () => {
      const loginRequest: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }
      expect(loginRequest.username).toBe('testuser')
      expect(loginRequest.password).toBe('password123')
    })

    it('应该支持可选captcha字段', () => {
      const loginRequestWithCaptcha: LoginRequest = {
        username: 'testuser',
        password: 'password123',
        captcha: 'ABCD',
      }
      expect(loginRequestWithCaptcha.captcha).toBe('ABCD')

      const loginRequestWithoutCaptcha: LoginRequest = {
        username: 'testuser',
        password: 'password123',
      }
      expect(loginRequestWithoutCaptcha.captcha).toBeUndefined()
    })
  })

  describe('LoginResponse接口', () => {
    it('应该正确定义LoginResponse接口', () => {
      const loginResponse: LoginResponse = {
        accessToken: 'token123',
        userInfo: {
          id: 1,
          username: 'testuser',
        },
      }
      expect(loginResponse.accessToken).toBe('token123')
      expect(loginResponse.userInfo.id).toBe(1)
    })

    it('应该支持可选refreshToken字段', () => {
      const loginResponseWithRefresh: LoginResponse = {
        accessToken: 'token123',
        refreshToken: 'refresh123',
        userInfo: { id: 1, username: 'testuser' },
      }
      expect(loginResponseWithRefresh.refreshToken).toBe('refresh123')

      const loginResponseWithoutRefresh: LoginResponse = {
        accessToken: 'token123',
        userInfo: { id: 1, username: 'testuser' },
      }
      expect(loginResponseWithoutRefresh.refreshToken).toBeUndefined()
    })

    it('应该支持可选expiresIn字段', () => {
      const loginResponse: LoginResponse = {
        accessToken: 'token123',
        expiresIn: 3600,
        userInfo: { id: 1, username: 'testuser' },
      }
      expect(loginResponse.expiresIn).toBe(3600)
    })
  })

  describe('类型导出', () => {
    it('应该正确导出所有类型', () => {
      // 验证类型可以正常导入和使用
      const userInfo: UserInfo = { id: 1, username: 'test' }
      const role: UserRole = UserRole.USER
      const permission: Permission = { id: '1', name: 'read', code: 'read' }
      const loginRequest: LoginRequest = { username: 'test', password: 'pass' }
      const loginResponse: LoginResponse = {
        accessToken: 'token',
        userInfo: { id: 1, username: 'test' },
      }

      expect(userInfo).toBeDefined()
      expect(role).toBeDefined()
      expect(permission).toBeDefined()
      expect(loginRequest).toBeDefined()
      expect(loginResponse).toBeDefined()
    })
  })
})

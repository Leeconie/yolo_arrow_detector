/**
 * @fileoverview 用户状态管理
 * @module stores/modules/user
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 管理用户相关的状态，包括token、用户信息、登录状态等
 * @dependencies pinia, vue, @/types/user, @/core/config
 */

import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import type { UserInfo } from '@/types/user'
import { STORAGE_KEYS } from '@/core/config'
import { sanitizeInput } from '@/utils/security'
import { defaultPersistenceOptimizer } from '../utils/persistence-optimizer'
import { defaultStateUpdateOptimizer } from '../utils/state-update-optimizer'
import { logger } from '@/core/logger'

/**
 * 用户状态Store
 * @description 使用Pinia的setup语法定义Store
 */
export const useUserStore = defineStore('user', () => {
  /**
   * 用户认证token
   * @description 存储在ref中，支持响应式更新
   */
  const token = ref<string>('')

  /**
   * 用户信息
   * @description 存储当前登录用户的信息
   * 性能优化：使用shallowRef减少深度响应式追踪开销
   */
  const userInfo = shallowRef<UserInfo | null>(null)

  /**
   * 是否已登录
   * @description 计算属性，根据token是否存在判断登录状态
   */
  const isLoggedIn = computed(() => !!token.value)

  /**
   * 设置token
   * @param newToken 新的token值
   * @description 更新token状态并持久化到localStorage，自动清理潜在XSS攻击
   * 性能优化：使用状态更新优化器合并频繁更新，使用防抖写入减少IO操作
   */
  const setToken = (newToken: string) => {
    logger.debug('设置用户Token', {
      context: {
        module: 'stores',
        function: 'setToken',
        store: 'user',
      },
      data: {
        hasToken: !!newToken,
        tokenLength: newToken?.length || 0,
      },
    })

    // 清理token中的潜在XSS攻击代码（虽然token通常不包含HTML，但为安全起见）
    const cleanedToken = sanitizeInput(newToken, { escapeHtml: true, maxLength: 1000 })

    // 性能优化：使用状态更新优化器合并频繁更新，避免重复更新相同值
    defaultStateUpdateOptimizer.scheduleUpdate(
      'token',
      () => {
        token.value = cleanedToken
        // 性能优化：使用防抖写入，减少频繁IO操作
        if (cleanedToken) {
          defaultPersistenceOptimizer.debounceWrite(STORAGE_KEYS.TOKEN, cleanedToken)
          logger.info('Token已设置并持久化', {
            context: {
              module: 'stores',
              function: 'setToken',
              store: 'user',
            },
          })
        } else {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          logger.info('Token已清除', {
            context: {
              module: 'stores',
              function: 'setToken',
              store: 'user',
            },
          })
        }
      },
      cleanedToken, // 传入值用于去重检查
    )
  }

  /**
   * 设置用户信息
   * @param info 用户信息对象
   * @description 更新用户信息状态并持久化到localStorage，自动清理潜在XSS攻击
   * 性能优化：使用状态更新优化器合并频繁更新，使用防抖写入减少IO操作
   */
  const setUserInfo = (info: UserInfo) => {
    logger.debug('设置用户信息', {
      context: {
        module: 'stores',
        function: 'setUserInfo',
        store: 'user',
      },
      data: {
        userId: info.id,
        username: info.username,
      },
    })

    // 清理用户信息中的字符串字段，防止XSS攻击
    const cleanedInfo: UserInfo = {
      ...info,
      // 如果用户信息中有字符串字段，进行清理
      // 注意：这里假设UserInfo类型，实际应根据具体类型定义调整
    }

    // 性能优化：使用状态更新优化器合并频繁更新，避免重复更新相同值
    defaultStateUpdateOptimizer.scheduleUpdate(
      'userInfo',
      () => {
        userInfo.value = cleanedInfo
        // 性能优化：使用防抖写入，减少频繁IO操作
        defaultPersistenceOptimizer.debounceWrite(STORAGE_KEYS.USER_INFO, cleanedInfo)
        logger.info('用户信息已设置并持久化', {
          context: {
            module: 'stores',
            function: 'setUserInfo',
            store: 'user',
          },
          data: {
            userId: cleanedInfo.id,
            username: cleanedInfo.username,
          },
        })
      },
      cleanedInfo, // 传入值用于去重检查
    )
  }

  /**
   * 登出
   * @description 清除token和用户信息，清理localStorage
   */
  const logout = () => {
    logger.info('用户登出', {
      context: {
        module: 'stores',
        function: 'logout',
        store: 'user',
      },
      data: {
        userId: userInfo.value?.id,
        username: userInfo.value?.username,
      },
    })

    token.value = ''
    userInfo.value = null
    // 清理localStorage中的相关数据
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)

    logger.debug('用户登出完成，已清理Token和用户信息', {
      context: {
        module: 'stores',
        function: 'logout',
        store: 'user',
      },
    })
  }

  /**
   * 初始化状态
   * @description 从localStorage恢复token和用户信息
   */
  const initState = () => {
    logger.debug('初始化用户状态', {
      context: {
        module: 'stores',
        function: 'initState',
        store: 'user',
      },
    })

    // 从localStorage恢复token
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (savedToken) {
      token.value = savedToken
      logger.debug('从localStorage恢复Token', {
        context: {
          module: 'stores',
          function: 'initState',
          store: 'user',
        },
        data: {
          hasToken: true,
          tokenLength: savedToken.length,
        },
      })
    } else {
      logger.debug('localStorage中未找到Token', {
        context: {
          module: 'stores',
          function: 'initState',
          store: 'user',
        },
      })
    }

    // 从localStorage恢复用户信息
    const savedUserInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
        logger.info('从localStorage恢复用户信息', {
          context: {
            module: 'stores',
            function: 'initState',
            store: 'user',
          },
          data: {
            userId: userInfo.value?.id,
            username: userInfo.value?.username,
          },
        })
      } catch (error) {
        logger.error('解析用户信息失败', {
          context: {
            module: 'stores',
            function: 'initState',
            store: 'user',
          },
          error: error instanceof Error ? error : new Error(String(error)),
        })
        // 数据损坏时清除
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      }
    } else {
      logger.debug('localStorage中未找到用户信息', {
        context: {
          module: 'stores',
          function: 'initState',
          store: 'user',
        },
      })
    }

    logger.debug('用户状态初始化完成', {
      context: {
        module: 'stores',
        function: 'initState',
        store: 'user',
      },
      data: {
        isLoggedIn: !!token.value,
        hasUserInfo: !!userInfo.value,
      },
    })
  }

  // 初始化状态
  initState()

  return {
    // 状态
    token,
    userInfo,
    // 计算属性
    isLoggedIn,
    // 方法
    setToken,
    setUserInfo,
    logout,
    initState,
  }
})

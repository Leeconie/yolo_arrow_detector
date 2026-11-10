/**
 * @fileoverview 权限守卫
 * @module router/guards/auth
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 实现路由权限控制，包括登录校验、权限校验等
 * @dependencies vue-router, @/stores/modules/user, @/core/config
 */

import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ROUTE_CONSTANTS } from '@/core/config'
import { logger } from '@/core/logger'

/**
 * 设置路由守卫
 * @param router 路由实例
 * @description 配置路由前置守卫，实现权限控制
 */
export function setupAuthGuard(router: Router) {
  /**
   * 路由前置守卫
   * @description 在路由跳转前进行权限检查
   */
  router.beforeEach(
    (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const userStore = useUserStore()

      // 记录路由导航
      logger.debug('路由导航', {
        context: {
          module: 'router',
          function: 'beforeEach',
        },
        data: {
          from: from.path,
          to: to.path,
          requiresAuth: to.meta.requiresAuth !== false,
          isLoggedIn: userStore.isLoggedIn,
        },
      })

      // 检查路由是否需要认证
      const requiresAuth = to.meta.requiresAuth !== false

      // 如果需要认证但用户未登录，跳转到登录页
      if (requiresAuth && !userStore.isLoggedIn) {
        logger.info('路由权限检查：未登录，跳转登录页', {
          context: {
            module: 'router',
            function: 'beforeEach',
          },
          data: {
            from: from.path,
            to: to.path,
            redirect: to.fullPath,
          },
        })
        next({
          path: ROUTE_CONSTANTS.LOGIN_PATH,
          query: {
            redirect: to.fullPath, // 保存原始路径，登录后可以跳转回来
          },
        })
        return
      }

      // 如果已登录且访问登录页，跳转到首页
      if (to.path === ROUTE_CONSTANTS.LOGIN_PATH && userStore.isLoggedIn) {
        logger.info('已登录用户访问登录页，跳转首页', {
          context: {
            module: 'router',
            function: 'beforeEach',
          },
          data: {
            from: from.path,
            to: to.path,
          },
        })
        next(ROUTE_CONSTANTS.HOME_PATH)
        return
      }

      // 设置页面标题
      if (to.meta.title) {
        document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE || '应用'}`
        logger.debug('设置页面标题', {
          context: {
            module: 'router',
            function: 'beforeEach',
          },
          data: {
            title: document.title,
          },
        })
      }

      // 通过验证，继续路由跳转
      logger.debug('路由权限检查通过', {
        context: {
          module: 'router',
          function: 'beforeEach',
        },
        data: {
          from: from.path,
          to: to.path,
        },
      })
      next()
    },
  )
}

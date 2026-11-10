/**
 * @fileoverview 常量定义
 * @module core/config/constants
 * @author HeZaoCha
 * @date 2026-01-10
 * @description 定义系统常量，包括API相关常量、业务常量、UI常量等
 */

/**
 * 从环境变量读取数值配置
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 配置值
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 从环境变量读取字符串配置
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 配置值
 */
function getEnvString(key: string, defaultValue: string): string {
  const value = import.meta.env[key]
  return value !== undefined && value !== '' ? value : defaultValue
}

/**
 * 从环境变量读取布尔配置
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 配置值
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  return value === 'true' || value === '1'
}

/**
 * API相关常量
 * 所有配置项都可以通过环境变量覆盖，详见 .env.dev、.env.test、.env.prod 文件
 */
export const API_CONSTANTS = {
  /** 请求超时时间（毫秒），环境变量：VITE_API_TIMEOUT */
  TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
  /** 请求重试次数，环境变量：VITE_API_RETRY_COUNT */
  RETRY_COUNT: getEnvNumber('VITE_API_RETRY_COUNT', 3),
  /** 请求重试延迟（毫秒），环境变量：VITE_API_RETRY_DELAY */
  RETRY_DELAY: getEnvNumber('VITE_API_RETRY_DELAY', 1000),
  /** 请求重试延迟基数（用于指数退避），环境变量：VITE_API_RETRY_DELAY_BASE */
  RETRY_DELAY_BASE: getEnvNumber('VITE_API_RETRY_DELAY_BASE', 1000),
  /** 请求重试最大延迟（毫秒），环境变量：VITE_API_RETRY_MAX_DELAY */
  RETRY_MAX_DELAY: getEnvNumber('VITE_API_RETRY_MAX_DELAY', 10000),
  /** 请求缓存默认过期时间（毫秒），环境变量：VITE_API_CACHE_TTL */
  CACHE_DEFAULT_TTL: getEnvNumber('VITE_API_CACHE_TTL', 5 * 60 * 1000),
  /** 请求缓存最大数量，环境变量：VITE_API_CACHE_MAX_SIZE */
  CACHE_MAX_SIZE: getEnvNumber('VITE_API_CACHE_MAX_SIZE', 100),
  /** 请求最大并发数，环境变量：VITE_API_MAX_CONCURRENCY */
  MAX_CONCURRENCY: getEnvNumber('VITE_API_MAX_CONCURRENCY', 10),
  /** 请求去重时间窗口（毫秒），环境变量：VITE_API_DEDUPLICATION_WINDOW */
  DEDUPLICATION_WINDOW: getEnvNumber('VITE_API_DEDUPLICATION_WINDOW', 1000),
} as const

/**
 * Apifox Mock服务类型
 */
export type MockType = 'cloud' | 'local'

/**
 * API FOX Mock服务配置
 *
 * 根据 Apifox 文档：
 * - 本地Mock: http://127.0.0.1:4523/m1/{项目ID}-{版本编号}-{服务编号}/{接口路径}
 * - 云端Mock: https://mock.apifox.cn/m1/{项目ID}-{版本编号}-{服务编号}/{接口路径}
 *   或 https://m1.apifoxmock.com/m1/{项目ID}-{版本编号}-{服务编号}/{接口路径}
 *
 * 参考文档：
 * - https://docs.apifox.com/mock
 * - https://docs.apifox.com/cloud-mock
 */
export const APIFOX_CONFIG = {
  /**
   * 是否启用Mock服务
   * 只在开发环境和测试环境启用，生产环境强制禁用
   * 从环境变量读取，默认值：开发/测试环境为true，生产环境为false
   */
  ENABLE_MOCK: (() => {
    const mode = import.meta.env.MODE
    const isDevOrTest = mode === 'development' || mode === 'dev' || mode === 'test'
    const envEnable = import.meta.env.VITE_ENABLE_MOCK === 'true'
    // 生产环境强制禁用Mock
    if (mode === 'production' || mode === 'prod') {
      return false
    }
    // 开发/测试环境：如果环境变量明确设置为false，则禁用；否则默认启用
    return isDevOrTest && (import.meta.env.VITE_ENABLE_MOCK !== 'false' || envEnable)
  })(),

  /**
   * Mock服务类型：云端(cloud) 或 本地(local)
   * 从环境变量读取，默认值：cloud
   * 参考：https://docs.apifox.com/mock
   */
  MOCK_TYPE: (import.meta.env.VITE_APIFOX_MOCK_TYPE as MockType) || 'cloud',

  /**
   * 云端Mock服务基础URL
   * 格式：https://mock.apifox.cn/m1/{项目ID}-{版本编号}-{服务编号}
   * 或：https://m1.apifoxmock.com/m1/{项目ID}-{版本编号}-{服务编号}
   * 从环境变量读取，默认值：当前项目云端Mock地址
   * 参考：https://docs.apifox.com/cloud-mock
   */
  MOCK_CLOUD_URL:
    import.meta.env.VITE_APIFOX_MOCK_CLOUD_URL ||
    'https://m1.apifoxmock.com/m1/7676691-7418764-6917011',

  /**
   * 本地Mock服务基础URL
   * 格式：http://127.0.0.1:4523/m1/{项目ID}-{版本编号}-{服务编号}
   * 从环境变量读取，默认值：当前项目本地Mock地址
   * 注意：本地Mock需要Apifox客户端运行
   * 参考：https://docs.apifox.com/mock
   */
  MOCK_LOCAL_URL:
    import.meta.env.VITE_APIFOX_MOCK_LOCAL_URL ||
    'http://127.0.0.1:4523/m1/7676691-7418764-6917011',

  /**
   * 云端Mock服务Token（用于Token鉴权）
   * 从环境变量读取，仅在启用Token鉴权时需要
   * 参考：https://docs.apifox.com/cloud-mock
   */
  MOCK_TOKEN: import.meta.env.VITE_APIFOX_TOKEN || '',

  /**
   * 是否启用Mock服务Token鉴权
   * 从环境变量读取，默认false，关闭Token鉴权
   * 根据 Apifox 云端 Mock 文档：https://docs.apifox.com/cloud-mock
   * Token鉴权可以通过项目设置开启/关闭
   * 当关闭Token鉴权时，不需要在请求中添加 apifoxToken
   * 当开启Token鉴权时，需要在请求头中添加 apifoxToken
   */
  ENABLE_MOCK_TOKEN_AUTH: import.meta.env.VITE_ENABLE_MOCK_TOKEN_AUTH === 'true',

  /**
   * 获取当前使用的Mock服务基础URL
   * 根据MOCK_TYPE自动选择云端或本地URL
   */
  get MOCK_BASE_URL(): string {
    return this.MOCK_TYPE === 'cloud' ? this.MOCK_CLOUD_URL : this.MOCK_LOCAL_URL
  },
} as const

/**
 * 业务常量
 * 所有配置项都可以通过环境变量覆盖，详见 .env.dev、.env.test、.env.prod 文件
 */
export const BUSINESS_CONSTANTS = {
  /** 成功状态码，环境变量：VITE_BUSINESS_SUCCESS_CODE */
  SUCCESS_CODE: getEnvNumber('VITE_BUSINESS_SUCCESS_CODE', 200),
  /** 默认分页大小，环境变量：VITE_BUSINESS_DEFAULT_PAGE_SIZE */
  DEFAULT_PAGE_SIZE: getEnvNumber('VITE_BUSINESS_DEFAULT_PAGE_SIZE', 10),
  /** 最大分页大小，环境变量：VITE_BUSINESS_MAX_PAGE_SIZE */
  MAX_PAGE_SIZE: getEnvNumber('VITE_BUSINESS_MAX_PAGE_SIZE', 100),
} as const

/**
 * UI常量
 * 所有配置项都可以通过环境变量覆盖，详见 .env.dev、.env.test、.env.prod 文件
 */
export const UI_CONSTANTS = {
  /** 默认主题模式，环境变量：VITE_UI_DEFAULT_THEME_MODE */
  DEFAULT_THEME_MODE: getEnvString('VITE_UI_DEFAULT_THEME_MODE', 'light') as 'light' | 'dark',
  /** 默认主题色，环境变量：VITE_UI_DEFAULT_THEME_COLOR */
  DEFAULT_THEME_COLOR: getEnvString('VITE_UI_DEFAULT_THEME_COLOR', '#409EFF'),
  /** 消息提示持续时间（毫秒），环境变量：VITE_UI_MESSAGE_DURATION */
  MESSAGE_DURATION: getEnvNumber('VITE_UI_MESSAGE_DURATION', 3000),
  /** 加载提示延迟（毫秒），环境变量：VITE_UI_LOADING_DELAY */
  LOADING_DELAY: getEnvNumber('VITE_UI_LOADING_DELAY', 300),
} as const

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  /** Token存储键 */
  TOKEN: 'token',
  /** 用户信息存储键 */
  USER_INFO: 'userInfo',
  /** 主题模式存储键 */
  THEME_MODE: 'themeMode',
  /** 主题色存储键 */
  THEME_COLOR: 'themeColor',
} as const

/**
 * 路由常量
 * 所有配置项都可以通过环境变量覆盖，详见 .env.dev、.env.test、.env.prod 文件
 */
export const ROUTE_CONSTANTS = {
  /** 登录页路径，环境变量：VITE_ROUTE_LOGIN_PATH */
  LOGIN_PATH: getEnvString('VITE_ROUTE_LOGIN_PATH', '/login'),
  /** 首页路径，环境变量：VITE_ROUTE_HOME_PATH */
  HOME_PATH: getEnvString('VITE_ROUTE_HOME_PATH', '/'),
  /** 404页面路径，环境变量：VITE_ROUTE_NOT_FOUND_PATH */
  NOT_FOUND_PATH: getEnvString('VITE_ROUTE_NOT_FOUND_PATH', '/404'),
} as const

/**
 * 安全相关常量
 * 所有配置项都可以通过环境变量覆盖，详见 .env.dev、.env.test、.env.prod 文件
 */
export const SECURITY_CONSTANTS = {
  /** CSRF Token Header名称，环境变量：VITE_SECURITY_CSRF_TOKEN_HEADER */
  CSRF_TOKEN_HEADER: getEnvString('VITE_SECURITY_CSRF_TOKEN_HEADER', 'X-CSRF-Token'),
  /** CSRF Token请求头名称（备用），环境变量：VITE_SECURITY_CSRF_TOKEN_HEADER_ALT */
  CSRF_TOKEN_HEADER_ALT: getEnvString('VITE_SECURITY_CSRF_TOKEN_HEADER_ALT', 'X-XSRF-TOKEN'),
  /** 是否启用CSRF防护，环境变量：VITE_SECURITY_ENABLE_CSRF */
  ENABLE_CSRF: getEnvBoolean('VITE_SECURITY_ENABLE_CSRF', true),
} as const

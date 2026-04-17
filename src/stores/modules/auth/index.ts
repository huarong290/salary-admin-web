// src/stores/modules/auth/index.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, logoutApi, refreshTokenApi } from '@/api/auth';
import type { UserLoginReqDTO, TokenResDTO, LoginResultDTO } from '@/types/auth/auth';
import router from '@/router';
/**
 * 🔐 身份认证与令牌状态管理 (Setup Store 范式)
 * 职责：管理登录、登出、无感刷新 Token 的核心生命周期，负责安全地存储和清理鉴权凭证
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // ==================== 1. 状态 (State) ====================

    /** 访问令牌 (短效，用于请求接口的 Authorization 头) */
    const accessToken = ref<string>('');

    /** 刷新令牌 (长效，用于在 accessToken 过期时换取新令牌) */
    const refreshToken = ref<string>('');

    /** 令牌类型 (通常配合后端的 Oauth2/JWT 规范，默认为 'Bearer') */
    const tokenType = ref<string>('Bearer');

    /** 设备指纹/唯一标识 (用于后端限制多端登录、单点登录踢人或安全审计) */
    const deviceId = ref<string>('');

    /** 令牌过期时间戳/有效秒数 (用于前端倒计时预判，虽然有了无感刷新，但保留该字段便于扩展) */
    const expiresIn = ref<number>(0);

    // ==================== 2. 动作 (Actions) ====================
    /**
     * 独立出设置 Token 的动作，方便多场景(常规登录、MFA验证后)复用
     */
    /**
     * 放宽入参类型限制为 Partial<TokenResDTO>，兼容 LoginResultDTO
     * 增加 || '' 兜底，完美解决 TypeScript 类型不匹配报错
     */
    const setTokens = (res: Partial<TokenResDTO>) => {
      // 这里的 || '' 可以确保即使是 undefined，也会被安全转换为 string
      accessToken.value = res.accessToken ?? '';
      refreshToken.value = res.refreshToken ?? '';
      tokenType.value = res.tokenType ?? 'Bearer';
      deviceId.value = res.deviceId ?? '';
      expiresIn.value = res.expiresIn ?? 0;
    };
    /**
     *  用户登录 (第一阶段)
     *  调整：支持返回 MFA 状态，若无需 MFA 则直接设置 Token
     * @param loginForm 登录表单数据 (账号、密码、验证码等)
     * @returns 返回 LoginResultDTO (包含是否需要 MFA 的标志)
     */
    const login = async (loginForm: UserLoginReqDTO) => {
      const res: LoginResultDTO = await loginApi(loginForm);
      // 如果后端判定不需要 2FA 验证，直接视作登录成功并存储 Token
      if (!res.requireMfa && res.accessToken) {
        setTokens(res);
      }
      // 返回原始结果交由业务层 (login.vue) 判断并分流
      return res;
    };

    /**
     * 安全登出 (异步增强防御版)
     * 逻辑：先尝试通知后端销毁 Redis 中的 Token 黑名单，然后彻底清空前端所有鉴权相关的本地缓存，最后重定向。
     */
    const logout = async (isLocalOnly = false) => {
      try {
        // 仅在持有令牌时发起登出请求，避免无效的网络消耗或引发二次 401 报错如果是强制本地登出，直接跳过后端接口请求，打破死锁！
        if (accessToken.value && !isLocalOnly) {
          await logoutApi();
        }
      } catch (error) {
        // 即使后端接口报错（如 Token 本身已失效），前端也必须强制执行后续的清理流程
        console.error('服务端登出失败或令牌已失效:', error);
      } finally {
        // 1. 清空内存状态
        accessToken.value = '';
        refreshToken.value = '';
        deviceId.value = '';
        expiresIn.value = 0;

        // 2. 精准清理本地持久化数据 (绝对禁止使用 localStorage.clear() 破坏全局主题设定)
        localStorage.removeItem('auth-stores');
        localStorage.removeItem('user-store');
        sessionStorage.clear(); // Session 通常只存临时会话状态，清空是安全的

        // 3. 终极防御版重定向 (绕过 Vue Router 生命周期，杜绝白屏)
        const currentPath = router.currentRoute.value.fullPath;
        // 确保不在登录页才跳转
        if (window.location.pathname !== '/login') {
          // 如果当前路由不是首页 '/'，则带上 redirect 记忆参数
          const query =
            currentPath && currentPath !== '/'
              ? `?redirect=${encodeURIComponent(currentPath)}`
              : '';

          // 使用原生 window.location.href 强制刷新浏览器上下文，是最干净的退出方式
          window.location.href = `/login${query}`;
        }
      }
    };

    /**
     * 无感刷新令牌
     * 逻辑：当业务接口返回 401 时，由 request.ts 拦截器自动调用此方法，使用 refreshToken 换取新令牌。
     * @returns 返回新获取的 accessToken，供拦截器重发请求使用
     */
    const doRefreshToken = async () => {
      if (!refreshToken.value) return Promise.reject(new Error('无有效的刷新令牌'));

      try {
        // 调用后端刷新接口，需携带设备指纹进行安全校验
        const res: TokenResDTO = await refreshTokenApi({
          refreshToken: refreshToken.value,
          deviceId: deviceId.value,
        });

        // 更新内存中的令牌状态
        accessToken.value = res.accessToken;
        refreshToken.value = res.refreshToken;
        expiresIn.value = res.expiresIn || 0;

        return res.accessToken;
      } catch (error) {
        // 刷新失败 (意味着 refreshToken 也过期了，或在别处被踢下线)，必须强制彻底登出
        await logout();
        return Promise.reject(error);
      }
    };

    // ==================== 3. 暴露模块 API ====================
    return {
      accessToken,
      refreshToken,
      tokenType,
      deviceId,
      expiresIn,
      login,
      logout,
      doRefreshToken,
      setTokens,
    };
  },
  {
    // 开启持久化：刷新页面时，这些核心凭证会自动从 localStorage 中恢复，保持会话不断
    persist: { key: 'auth-stores' },
  }
);

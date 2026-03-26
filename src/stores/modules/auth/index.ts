// src/stores/modules/auth/index.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, logoutApi, refreshTokenApi } from '@/api/auth';
import type { UserLoginReqDTO, TokenResDTO } from '@/types/auth/auth';

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
     *  用户登录
     * @param loginForm 登录表单数据 (账号、密码、验证码等)
     * @returns 成功返回 true，失败由底层的 request.ts 拦截报错
     */
    const login = async (loginForm: UserLoginReqDTO) => {
      const res: TokenResDTO = await loginApi(loginForm);
      accessToken.value = res.accessToken;
      refreshToken.value = res.refreshToken;
      tokenType.value = res.tokenType || 'Bearer';
      deviceId.value = res.deviceId || '';
      expiresIn.value = res.expiresIn || 0;
      return true;
    };

    /**
     * 安全登出 (异步增强防御版)
     * 逻辑：先尝试通知后端销毁 Redis 中的 Token 黑名单，然后彻底清空前端所有鉴权相关的本地缓存，最后重定向。
     */
    const logout = async () => {
      try {
        // 仅在持有令牌时发起登出请求，避免无效的网络消耗或引发二次 401 报错
        if (accessToken.value) {
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

        // 3. 强制重定向到登录页 (跳出 SPA 路由，彻底清理 Vue 内存树，是最干净的做法)
        window.location.href = '/login';
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
    };
  },
  {
    // 开启持久化：刷新页面时，这些核心凭证会自动从 localStorage 中恢复，保持会话不断
    persist: { key: 'auth-stores' },
  }
);

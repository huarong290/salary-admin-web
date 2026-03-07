// src/stores/modules/auth/index.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { loginApi, logoutApi, refreshTokenApi } from '@/api/auth';
// 👇 同样从 independent type file 引入
import type { UserLoginReqDTO, TokenResDTO } from '@/types/auth/auth';

export const useAuthStore = defineStore(
  'auth',
  () => {
    // ==================== 1. 状态 (State) ====================
    const accessToken = ref<string>('');
    const refreshToken = ref<string>('');
    const tokenType = ref<string>('Bearer');
    const deviceId = ref<string>('');
    const expiresIn = ref<number>(0);

    // ==================== 2. 动作 (Actions) ====================
    const login = async (loginForm: UserLoginReqDTO) => {
      const res: TokenResDTO = await loginApi(loginForm);
      accessToken.value = res.accessToken;
      refreshToken.value = res.refreshToken;
      tokenType.value = res.tokenType || 'Bearer';
      deviceId.value = res.deviceId || '';
      expiresIn.value = res.expiresIn || 0;
      return true;
    };

    /** * 🌟 登出（异步增强版）
     * 逻辑：先通知后端废弃令牌，再清理前端状态
     */
    const logout = async () => {
      try {
        // 如果存在 accessToken 才调用后端登出，避免重复调用或未登录调用
        if (accessToken.value) {
          await logoutApi();
        }
      } catch (error) {
        // 即使后端接口报错（如 Token 已失效），前端也要继续走清理流程
        console.error('服务端登出失败:', error);
      } finally {
        // 彻底清理前端持久化数据
        accessToken.value = '';
        refreshToken.value = '';
        deviceId.value = '';
        expiresIn.value = 0;

        // 强制重定向到登录页，并清除所有可能的残留
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    };

    const doRefreshToken = async () => {
      if (!refreshToken.value) return Promise.reject(new Error('无有效的刷新令牌'));

      try {
        const res: TokenResDTO = await refreshTokenApi({
          refreshToken: refreshToken.value,
          deviceId: deviceId.value,
        });

        accessToken.value = res.accessToken;
        refreshToken.value = res.refreshToken;
        expiresIn.value = res.expiresIn || 0;

        return res.accessToken;
      } catch (error) {
        // 刷新失败视为身份过期，执行登出
        await logout();
        return Promise.reject(error);
      }
    };

    // ==================== 3. 暴露 ====================
    return { accessToken, refreshToken, tokenType, deviceId, login, logout, doRefreshToken };
  },
  {
    persist: { key: 'auth-stores' },
  }
);

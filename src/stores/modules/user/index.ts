// src/stores/modules/user/index.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfoDTO, SysUserVO } from '@/types/user/user';
import type { MenuTreeVO } from '@/types/menu/menu.ts';
import { getUserInfoApi } from '@/api/user';

export const useUserStore = defineStore(
  'user',
  () => {
    // ==================== 1. 状态 (State) ====================
    const userInfo = ref<SysUserVO | null>(null);
    const roles = ref<string[]>([]);
    const permissions = ref<string[]>([]);
    const menus = ref<MenuTreeVO[]>([]);
    const hasFetchedUserInfo = ref(false); // 🌟 新增标记，避免持久化导致跳过拉取
    // ==================== 2. 动作 (Actions) ====================

    /** 获取并存储用户信息 */
    const getUserInfo = async () => {
      console.log('getUserInfo');
      try {
        const res: UserInfoDTO = await getUserInfoApi();
        console.log('menus from backend:', res.menus);
        userInfo.value = res.user;
        roles.value = res.roles;
        permissions.value = res.permissions;
        menus.value = res.menus;
        hasFetchedUserInfo.value = true;
        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    /** 清理用户信息 (登出时调用) */
    const clearUserInfo = () => {
      userInfo.value = null;
      roles.value = [];
      permissions.value = [];
      menus.value = [];
      hasFetchedUserInfo.value = false; // 🌟 清空标记
    };

    return {
      userInfo,
      roles,
      permissions,
      menus,
      hasFetchedUserInfo,
      getUserInfo,
      clearUserInfo,
    };
  },
  {
    // 建议开启持久化，防止刷新页面导致用户信息闪烁
    persist: {
      key: 'user-store',
      pick: ['userInfo', 'roles', 'permissions', 'menus'],
    },
  }
);

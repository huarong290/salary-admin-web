// src/stores/modules/user/index.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfoDTO, SysUserVO } from '@/types/user/user';
import type { MenuTreeVO } from '@/types/menu/menu.ts';
import { getUserInfoApi } from '@/api/user';

/**
 * 👤 用户档案与 RBAC 权限状态管理 (Setup Store 范式)
 * 职责：维护当前登录用户的基本信息、角色标识、权限字以及左侧动态菜单树。
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // ==================== 1. 状态 (State) ====================

    /** 用户基本信息 (头像、昵称、手机号、部门组织等静态信息) */
    const userInfo = ref<SysUserVO | null>(null);

    /** 角色编码列表 (如: ['super_admin', 'hr_manager']，用于粗粒度页面拦截) */
    const roles = ref<string[]>([]);

    /** 细粒度权限标识列表 (如: ['sys:user:add', 'salary:period:view']，配合 v-hasPerm 指令使用) */
    const permissions = ref<string[]>([]);

    /** 动态路由与左侧菜单树 (由后端根据权限动态生成返回，供前端渲染侧边栏) */
    const menus = ref<MenuTreeVO[]>([]);

    /**  防御标记：记录当前会话是否已经拉取过完整的用户信息，避免在 router.beforeEach 中陷入死循环拉取 */
    const hasFetchedUserInfo = ref(false);

    // ==================== 2. 动作 (Actions) ====================

    /**
     * 获取并初始化用户全局上下文
     * 通常在登录成功后的路由守卫 (router.beforeEach) 中首次调用。
     */
    const getUserInfo = async () => {
      try {
        // 触发 API 获取大聚合接口 (一次性拿齐基础信息、角色、权限字、菜单树)
        const res: UserInfoDTO = await getUserInfoApi();

        // 灌入状态树
        userInfo.value = res.user;
        roles.value = res.roles;
        permissions.value = res.permissions;
        menus.value = res.menus;

        // 标记拉取成功，后续路由跳转看到 true 就不会重复拉取了
        hasFetchedUserInfo.value = true;

        return res;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    /**
     * 清空用户上下文
     * 通常在用户退出登录 (logout) 或 Token 彻底失效时被 authStore 调用。
     */
    const clearUserInfo = () => {
      userInfo.value = null;
      roles.value = [];
      permissions.value = [];
      menus.value = [];
      // 必须重置标记，否则下次同浏览器登录其他账号时，不会去拉取新数据
      hasFetchedUserInfo.value = false;
    };

    // ==================== 3. 暴露模块 API ====================
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
    persist: {
      key: 'user-store',
      //  核心安全与性能策略：按需精准持久化
      // 只把静态的 userInfo 存入 LocalStorage，用于页面瞬间刷新时快速回显右上角头像。
      // 绝对不持久化 roles、permissions 和 menus！保证每次 F5 刷新都会强制请求后端重新拉取最新权限，彻底杜绝“旧缓存导致的越权或 403 死锁”隐患！
      pick: ['userInfo'],
    },
  }
);

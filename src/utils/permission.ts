// src/utils/permission.ts
import { useUserStore } from '@/stores/modules/user';

/**
 * 验证用户是否具备某权限
 * @param value 权限字符串数组，如 ['sys:user:add', 'sys:user:edit']
 * @returns boolean 是否拥有权限
 */
export function checkPerm(value: string[]): boolean {
  if (value && value instanceof Array && value.length > 0) {
    const userStore = useUserStore();
    // 获取当前用户的所有权限标识
    const permissions = userStore.permissions || [];
    const requiredPerms = value;

    // 🌟 核心匹配逻辑：包含超级管理员通配符 *:*:*
    const hasPermission = permissions.some((perm) => {
      return perm === '*:*:*' || requiredPerms.includes(perm);
    });

    return hasPermission;
  } else {
    console.error(`传入的权限标识不正确，请按照数组格式传入，如 checkPerm(['sys:user:add'])`);
    return false;
  }
}

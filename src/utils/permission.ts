// src/utils/permission.ts
import { useUserStore } from '@/stores/modules/user';

/**
 * 验证用户是否具备某权限(Script 脚本层专用)
 * @param value 权限字符串或数组，如 'sys:user:add' 或 ['sys:user:add', 'sys:user:edit']
 * @returns boolean 是否拥有权限
 */
export function checkPermission(value: string | string[]): boolean {
  if (!value) {
    console.error(
      `传入的权限标识为空，请按照格式传入，如 checkPermission('sys:user:add') 或 checkPermission(['sys:user:add'])`
    );
    return false;
  }
  const userStore = useUserStore();
  // 获取当前用户的所有权限标识
  const permissions = userStore.permissions || [];
  // 统一转成数组,兼容单字符串和数组格式，彻底对齐指令层的 DX (开发者体验)
  const requiredPerms = Array.isArray(value) ? value : [value];
  if (requiredPerms.length > 0) {
    return permissions.some((perm) => {
      // 支持匹配超级管理员通配符 *:*:*，或具体权限
      return perm === '*:*:*' || requiredPerms.includes(perm);
    });
  }

  return false;
}

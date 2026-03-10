// src/directive/permission/hasPerm.ts
import type { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/stores/modules/user';

/**
 * 按钮级权限控制指令
 * 用法: v-hasPerm="['sys:user:add', 'sys:user:edit']"
 */
export const hasPerm: Directive = {
  // 在绑定元素的父组件及他自己的所有子节点都挂载完成后调用
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const userStore = useUserStore();

    // 假设你在 userStore 中存了当前用户的权限标识数组，如 ['sys:user:add', 'sys:user:list']
    // 如果没有，请在 userStore 中补充这个 state
    const permissions = userStore.permissions || [];

    // 判断指令绑定的值是否为数组且不为空
    if (value && value instanceof Array && value.length > 0) {
      const requiredPerms = value;

      // 核心鉴权逻辑：匹配当前按钮需要的权限
      const hasPermission = permissions.some((perm) => {
        // 支持超级管理员的万能通配符 '*:*:*'
        return perm === '*:*:*' || requiredPerms.includes(perm);
      });

      // 如果没有权限，直接从 DOM 树上强行拔除该节点！
      if (!hasPermission) {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    } else {
      throw new Error(`请设置操作权限标签值, 如 v-hasPerm="['sys:user:add']"`);
    }
  },
};

// src/directive/permission/hasPerm.ts
import type { Directive } from 'vue';
import { checkPermission } from '@/utils/permission.ts';

/**
 * 按钮级权限控制指令
 * 用法: v-hasPerm="'sys:user:add'" 或 v-hasPerm="['sys:user:add', 'sys:user:edit']"
 */
export const hasPerm: Directive = {
  mounted(el, binding) {
    if (!checkPermission(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
  updated(el, binding) {
    if (!checkPermission(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
};

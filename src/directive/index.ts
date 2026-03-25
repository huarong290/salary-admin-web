// src/directive/index.ts
import type { App } from 'vue';
import { hasPerm } from './permission/hasPerm';

/**
 * 全局自定义指令注册中心
 */
export function setupDirectives(app: App) {
  // 1. RBAC 细粒度权限控制指令  注册权限指令，命名为 'hasPerm'
  app.directive('hasPerm', hasPerm);

  // 2. [预留位] 自动获取焦点指令
  // app.directive('focus', focus);

  // 3. [预留位] 防抖指令
  // app.directive('debounce', debounce);
}

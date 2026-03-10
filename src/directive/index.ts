// src/directive/index.ts
import type { App } from 'vue';
import { hasPerm } from './permission/hasPerm';

export function setupDirectives(app: App) {
  // 注册权限指令，命名为 'hasPerm'
  app.directive('hasPerm', hasPerm);
}

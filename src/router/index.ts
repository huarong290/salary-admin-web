// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/404',
    component: () => import('@/views/error/NotFoundPage.vue'),
    meta: { hidden: true },
  },
  // 🌟 移除 Layout，仅保留重定向职责
  {
    path: '/',
    name: 'Root',
    redirect: '/dashboard',
    meta: { hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
});

export default router;

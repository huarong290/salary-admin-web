//src/router/index.ts

//  正确写法 (在 RouteRecordRaw 前面加上 type)
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import NProgress from 'nprogress';
// 引入进度条样式
import 'nprogress/nprogress.css';

// 配置 NProgress (去掉右上角的加载小圆圈，更清爽)
NProgress.configure({ showSpinner: false });

// 引入刚刚写好的 Layout 外壳
const Layout = () => import('@/components/layout/index.vue');
// 1. 静态路由表 (任何人都可以访问)
export const constantRoutes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true },
  },
  // 👇👇 测试路由区域开始 👇👇
  {
    path: '/',
    component: Layout, // 外壳
    redirect: '/dashboard', // 访问根路径时，重定向到控制台
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'), // 内部真实页面
        meta: { title: '控制台' },
      },
    ],
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理' },
    children: [
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/user/UserPage.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'role',
        name: 'role',
        component: () => import('@/views/system/role/RolePage.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'menu',
        name: 'menu',
        component: () => import('@/views/system/menu/MenuPage.vue'),
        meta: { title: '菜单管理' },
      },
    ],
  },
  // 👆👆 测试路由区域结束 👆👆
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundPage.vue'),
    meta: { hidden: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 }),
});

// 临时放行所有路由，方便测试 UI
router.beforeEach((to, from, next) => {
  NProgress.start();
  // 打印出来，既满足了 TS 的使用要求，又方便咱们观察路由流转
  console.log('即将前往:', to.path, '来自:', from.path);
  next(); // ⚠️ 测试阶段直接放行，把咱们之前写的 Token 拦截逻辑先注释掉
});
// 全局后置守卫
router.afterEach(() => {
  // 关闭进度条
  NProgress.done();
});

export default router;

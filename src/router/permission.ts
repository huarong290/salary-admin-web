// src/router/permission.ts
import router from '@/router';
import { useAuthStore } from '@/stores/modules/auth';
import { useUserStore } from '@/stores/modules/user';
import { filterDynamicRoutes } from '@/router/dynamic';
import type { MenuTreeVO } from '@/types/menu/menu';
import NProgress from 'nprogress';

/**
 * 🌟 核心修复：递归寻找第一个有效路由 (携带 parentPath 解决多级嵌套路径 Bug)
 */
const getFirstValidRoute = (menus: MenuTreeVO[], parentPath = ''): string => {
  if (!menus || menus.length === 0) return '';

  for (const menu of menus) {
    if (menu.menuType === 3) continue; // 跳过按钮

    // 计算绝对路径
    const currentPath = menu.menuPath.startsWith('/')
      ? menu.menuPath
      : `${parentPath}/${menu.menuPath}`.replace(/(?<!:)\/\/+/g, '/');

    // 命中第一个菜单页面
    if (menu.menuType === 2) {
      return currentPath;
    }

    // 递归子目录
    if (menu.children && menu.children.length > 0) {
      const childPath = getFirstValidRoute(menu.children, currentPath);
      if (childPath) return childPath;
    }
  }
  return '';
};

router.beforeEach(async (to, _from, next) => {
  NProgress.start();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  // 一、拦截未登录用户
  if (!authStore.accessToken) {
    return ['/login', '/404'].includes(to.path) ? next() : next('/login');
  }

  // 二、拦截已登录用户访问登录页
  if (to.path === '/login') {
    return next({ path: '/' });
  }

  // 三、核心数据初始化 (动态加载路由)
  if (!userStore.hasFetchedUserInfo) {
    try {
      const { menus } = await userStore.getUserInfo();
      const dynamicRoutes = filterDynamicRoutes(menus);

      dynamicRoutes.forEach((r) => router.addRoute(r));
      router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404', meta: { hidden: true } });

      //动态添加路由后，必须中断当前导航，触发重定向重新走一遍守卫！
      // 这样就能完美复用下方的所有逻辑，彻底消灭代码冗余！
      return next({ ...to, replace: true });
    } catch (err) {
      console.error('获取用户信息失败:', err);
      //  传入 true，强制走本地登出，防止再次触发 401 网络请求死锁
      await authStore.logout(true);
      return next('/login');
    }
  }

  // 四、统一的路由降级拦截策略 (此时路由保证已完全挂载)
  // 注意：常驻路由 / 已经自动 redirect 到了 /dashboard，所以 to.path 此时是 /dashboard
  if (to.path === '/dashboard' || to.path === '/') {
    const hasDashboard = router.getRoutes().some((r) => r.path === '/dashboard');

    // 如果用户没有权限访问工作台
    if (!hasDashboard) {
      const firstRoute = getFirstValidRoute(userStore.menus);
      return firstRoute
        ? next({ path: firstRoute, replace: true })
        : next({ path: '/404', replace: true }); // 彻底没菜单权限的账号
    }

    // 如果访问 /，强行导向 /dashboard
    if (to.path === '/') {
      return next({ path: '/dashboard', replace: true });
    }
  }

  // 五、普通放行
  next();
});

router.afterEach(() => NProgress.done());

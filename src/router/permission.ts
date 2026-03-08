// src/router/permission.ts
import router from '@/router';
import { useAuthStore } from '@/stores/modules/auth';
import { useUserStore } from '@/stores/modules/user/user';
import { filterDynamicRoutes } from '@/router/dynamic';
import NProgress from 'nprogress';

router.beforeEach(async (to, _from, next) => {
  NProgress.start();
  const authStore = useAuthStore();
  const userStore = useUserStore();

  // 🌟 增加这行全局日志
  console.log(
    `[Guard Check] Path: ${to.path}, Token: ${!!authStore.accessToken}, HasFetched: ${userStore.hasFetchedUserInfo}`
  );
  if (authStore.accessToken) {
    if (to.path === '/login') {
      return next({ path: '/' });
    } else {
      // 检查是否已拉取菜单
      if (!userStore.hasFetchedUserInfo) {
        // 🌟 改成用标记判断
        try {
          console.log('beforeEach: fetching user info...');
          const { menus } = await userStore.getUserInfo();
          console.log('menus loaded:', menus);
          const dynamicRoutes = filterDynamicRoutes(menus);

          // 不再作为 Root 的 children 挂载，而是作为顶级路由直接挂载
          // 因为你的 /system 本身已经带有 Layout 外壳了
          dynamicRoutes.forEach((r) => {
            router.addRoute(r);
          });

          // 最后挂载万能匹配 404
          router.addRoute({
            path: '/:pathMatch(.*)*',
            redirect: '/404',
            meta: { hidden: true },
          });
          return next({ ...to, replace: true });
        } catch (err) {
          console.error('getUserInfo error:', err);
          await authStore.logout();
          return next('/login');
        }
      } else {
        next();
      }
    }
  } else {
    return ['/login', '/404'].includes(to.path) ? next() : next('/login');
  }
});

router.afterEach(() => NProgress.done());

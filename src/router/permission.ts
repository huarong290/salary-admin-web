// src/router/permission.ts
import router from '@/router';
import { useAuthStore } from '@/stores/modules/auth';
import { useUserStore } from '@/stores/modules/user';
import { filterDynamicRoutes } from '@/router/dynamic';
import NProgress from 'nprogress';

/**
 *  辅助函数：深度优先搜索 (DFS)，寻找用户菜单树中的第一个有效页面路径
 * 作用：当用户没有工作台权限时，自动带他去他能看到的第一个页面，坚决消灭 404 撞墙尴尬。
 */
const getFirstValidRoute = (menus: any[]): string => {
  if (!menus || menus.length === 0) return '';
  for (const menu of menus) {
    // 命中条件：menuType === 2 代表具体的页面菜单 (根据你的字典：1目录, 2菜单, 3按钮)
    if (menu.menuType === 2 && menu.menuPath) {
      // 抹平数据差异：确保返回的是以 '/' 开头的绝对路径
      return menu.menuPath.startsWith('/') ? menu.menuPath : `/${menu.menuPath}`;
    }
    // 如果是目录 (menuType === 1)，则递归深度搜索它的子菜单
    if (menu.children && menu.children.length > 0) {
      const childPath = getFirstValidRoute(menu.children);
      if (childPath) return childPath;
    }
  }
  return '';
};

router.beforeEach(async (to, _from, next) => {
  NProgress.start();
  const authStore = useAuthStore();
  const userStore = useUserStore();
  // 一、判断用户是否已登录 (是否存在 Token)
  if (authStore.accessToken) {
    if (to.path === '/login') {
      // 已经登录还试图访问登录页，直接重定向到系统根路径
      return next({ path: '/' });
    } else {
      // 二、检查当前 Vuex/Pinia 内存中是否已经拉取过用户信息和动态菜单
      if (!userStore.hasFetchedUserInfo) {
        try {
          // 1. 发起请求，获取包含该用户权限的菜单树
          const { menus } = await userStore.getUserInfo();
          //console.log('menus loaded:', menus);
          // 2. 拍平并过滤动态路由
          const dynamicRoutes = filterDynamicRoutes(menus);
          // 3. 作为顶级路由直接挂载
          dynamicRoutes.forEach((r) => {
            router.addRoute(r);
          });
          // 4. 最后挂载万能匹配 404 (必须在动态路由之后挂载)
          router.addRoute({
            path: '/:pathMatch(.*)*',
            redirect: '/404',
            meta: { hidden: true },
          });
          //A：第一次拉取完菜单后，拦截针对 '/' 或 '/dashboard' 的访问
          if (to.path === '/' || to.path === '/dashboard') {
            const hasDashboard = router.getRoutes().some((r) => r.path === '/dashboard');
            if (!hasDashboard) {
              //  降级逻辑：没有工作台权限！去菜单树里找第一个有权限的页面
              const firstRoute = getFirstValidRoute(menus);
              return firstRoute
                ? next({ path: firstRoute, replace: true })
                : next({ path: '/404', replace: true }); // 彻底没权限的废号才给 404
            }
            // 有工作台权限的情况下，访问 '/' 默认导向 '/dashboard'
            if (to.path === '/') {
              return next({ path: '/dashboard', replace: true });
            }
          }
          // 如果不是首页跳转，则乖乖放行，...to 确保 addRoute 生效
          return next({ ...to, replace: true });
        } catch (err) {
          console.error('getUserInfo error:', err);
          await authStore.logout(); // 拉取信息失败(如Token过期)，强制登出
          return next('/login');
        }
      } else {
        //B：已经拉取过菜单 (如后续点击链接跳转时)，继续拦截 '/' 或 '/dashboard'
        if (to.path === '/' || to.path === '/dashboard') {
          const hasDashboard = router.getRoutes().some((r) => r.path === '/dashboard');
          if (!hasDashboard) {
            const firstRoute = getFirstValidRoute(userStore.menus);
            return firstRoute
              ? next({ path: firstRoute, replace: true })
              : next({ path: '/404', replace: true });
          }
          if (to.path === '/') {
            return next({ path: '/dashboard', replace: true });
          }
        }
        // 普通页面的跳转直接放行
        next();
      }
    }
  } else {
    // 三、没有 Token 的情况下，只允许访问白名单路由 (如登录页、404)
    return ['/login', '/404'].includes(to.path) ? next() : next('/login');
  }
});

router.afterEach(() => NProgress.done());

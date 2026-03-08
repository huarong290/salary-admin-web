// src/router/dynamic.ts
import type { RouteRecordRaw } from 'vue-router';
import type { MenuTreeVO } from '@/types/menu/menu';

const modules = import.meta.glob('../views/**/*.vue');
const Layout = () => import('@/components/layout/index.vue');
// 🌟 引入刚创建的透明穿透组件
const ParentView = () => import('@/components/layout/ParentView.vue');
export function filterDynamicRoutes(menus: MenuTreeVO[]): RouteRecordRaw[] {
  return menus.map((menu): RouteRecordRaw => {
    const route: RouteRecordRaw = {
      path: menu.menuPath,
      name: `Route-${menu.id}`,
      meta: menu.meta,
      children: [],
      component: null as any,
    };
    // 企业级核心映射逻辑
    if (menu.menuComponent === 'Layout') {
      // 如果是顶级节点 (ParentId === 0)，使用真正的 Layout 渲染整体框架
      if (menu.menuParentId === 0) {
        route.component = Layout;
      } else {
        // 如果是多级菜单的中间目录，使用透明穿透组件
        route.component = ParentView;
      }
    } else {
      // 具体业务页面
      const viewPath = `../views/${menu.menuComponent}.vue`;
      route.component = modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue'));
    }

    // 递归处理子菜单
    if (menu.children?.length) {
      route.children = filterDynamicRoutes(menu.children);
    }

    return route;
  });
}

// src/router/dynamic.ts
import type { RouteRecordRaw } from 'vue-router';
import type { MenuTreeVO } from '@/types/menu/menu';

const modules = import.meta.glob('../views/**/*.vue');
const Layout = () => import('@/components/layout/index.vue');
const ParentView = () => import('@/components/layout/ParentView.vue');

function generateRouteTree(menus: MenuTreeVO[], parentPath = ''): RouteRecordRaw[] {
  return menus
    .filter((menu) => menu.menuType !== 3)
    .map((menu): RouteRecordRaw => {
      // 智能拼接绝对路径 (防手抖处理)
      const currentPath = menu.menuPath.startsWith('/')
        ? menu.menuPath
        : `${parentPath}/${menu.menuPath}`.replace(/(?<!:)\/\/+/g, '/');

      const route: any = {
        path: currentPath,
        name: `Route-${menu.id}`,
        meta: menu.meta,
        component: null,
        redirect: menu.menuRedirect || undefined,
      };

      // 🌟 防御性优化：清洗组件路径首部的斜杠，防止 Vite 匹配失败
      const cleanComponentPath = menu.menuComponent?.replace(/^\/+/, '');
      const viewPath = `../views/${cleanComponentPath}.vue`;

      if (menu.menuParentId === 0 && menu.menuComponent && menu.menuComponent !== 'Layout') {
        route.component = Layout;
        route.children = [
          {
            path: '',
            name: menu.menuCode ? `${menu.menuCode}_Inner` : `RouteInner-${menu.id}`,
            meta: menu.meta,
            component: modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue')),
          },
        ];
      } else if (menu.menuComponent === 'Layout') {
        route.component = menu.menuParentId === 0 ? Layout : ParentView;
      } else {
        route.component = modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue'));
      }

      if (menu.children && menu.children.length > 0) {
        route.children = generateRouteTree(menu.children, currentPath);
      }
      return route;
    });
}

function extractAllChildren(children: RouteRecordRaw[]): RouteRecordRaw[] {
  let result: RouteRecordRaw[] = [];
  children.forEach((child) => {
    const flatChild = { ...child };
    delete flatChild.children;
    result.push(flatChild);

    if (child.children && child.children.length > 0) {
      result = result.concat(extractAllChildren(child.children));
    }
  });
  return result;
}

function flattenRouteTree(routeTree: RouteRecordRaw[]): RouteRecordRaw[] {
  const flatRoutes: RouteRecordRaw[] = [];
  routeTree.forEach((route) => {
    if (route.component === Layout) {
      const allFlatChildren = extractAllChildren(route.children || []);
      route.children = allFlatChildren;
      flatRoutes.push(route);
    } else {
      flatRoutes.push(route);
    }
  });
  return flatRoutes;
}

export function filterDynamicRoutes(menus: MenuTreeVO[]): RouteRecordRaw[] {
  const routeTree = generateRouteTree(menus, '');
  return flattenRouteTree(routeTree);
}

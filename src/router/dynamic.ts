// src/router/dynamic.ts
import type { RouteRecordRaw } from 'vue-router';
import type { MenuTreeVO } from '@/types/menu/menu';

const modules = import.meta.glob('../views/**/*.vue');
const Layout = () => import('@/components/layout/index.vue');
const ParentView = () => import('@/components/layout/ParentView.vue');

/**
 * 第一步：根据后端数据构建完整的路由树，并计算绝对路径
 */
function generateRouteTree(menus: MenuTreeVO[], parentPath = ''): RouteRecordRaw[] {
  return menus.map((menu): RouteRecordRaw => {
    // 智能拼接绝对路径
    const currentPath = menu.menuPath.startsWith('/')
      ? menu.menuPath
      : `${parentPath}/${menu.menuPath}`.replace(/(?<!:)\/\/+/g, '/');

    const route: any = {
      path: currentPath,
      name: `Route-${menu.id}`,
      meta: menu.meta,
      component: null,
    };

    if (menu.menuComponent === 'Layout') {
      route.component = menu.menuParentId === 0 ? Layout : ParentView;
    } else {
      const viewPath = `../views/${menu.menuComponent}.vue`;
      route.component = modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue'));
    }

    if (menu.children && menu.children.length > 0) {
      route.children = generateRouteTree(menu.children, currentPath);
    }
    return route;
  });
}

/**
 * 第二步：提取深层嵌套的所有的叶子节点
 */
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

/**
 * 第三步：对路由树进行拍平降维
 */
function flattenRouteTree(routeTree: RouteRecordRaw[]): RouteRecordRaw[] {
  const flatRoutes: RouteRecordRaw[] = [];
  routeTree.forEach((route) => {
    if (route.component === Layout) {
      // 如果当前是外壳，提取内部所有嵌套层级的叶子节点，拍平挂载
      const allFlatChildren = extractAllChildren(route.children || []);
      route.children = allFlatChildren;
      flatRoutes.push(route);
    } else {
      flatRoutes.push(route);
    }
  });
  return flatRoutes;
}

/**
 * 对外暴露的主入口
 */
export function filterDynamicRoutes(menus: MenuTreeVO[]): RouteRecordRaw[] {
  const routeTree = generateRouteTree(menus, '');
  return flattenRouteTree(routeTree);
}

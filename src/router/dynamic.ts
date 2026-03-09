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
  return (
    menus
      // 🌟 核心防御 1：绝对不要把“按钮 (menuType === 3)”生成为路由！
      .filter((menu) => menu.menuType !== 3)
      .map((menu): RouteRecordRaw => {
        // 智能拼接绝对路径
        const currentPath = menu.menuPath.startsWith('/')
          ? menu.menuPath
          : `${parentPath}/${menu.menuPath}`.replace(/(?<!:)\/\/+/g, '/');

        const route: any = {
          path: currentPath,
          name: `Route-${menu.id}`,
          meta: menu.meta,
          component: null,
          // 🌟 核心防御 2：绑定重定向属性
          redirect: menu.menuRedirect || undefined,
        };
        // 🌟 核心防御 3：顶级菜单自动包裹 Layout 骨架
        // 如果是顶级菜单（如工作台），且后端配置的不是 Layout，我们自动帮它套一层外壳！
        if (menu.menuParentId === 0 && menu.menuComponent && menu.menuComponent !== 'Layout') {
          route.component = Layout;
          const viewPath = `../views/${menu.menuComponent}.vue`;
          // 将真实的页面作为子路由挂载，path 设置为空字符串
          // 这样访问父级 /dashboard 时，会默认渲染这个子页面，并且带有左侧菜单栏
          route.children = [
            {
              path: '',
              name: menu.menuCode ? `${menu.menuCode}_Inner` : `RouteInner-${menu.id}`,
              meta: menu.meta,
              component: modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue')),
            },
          ];
        } else if (menu.menuComponent === 'Layout') {
          // 正常的 Layout 目录
          route.component = menu.menuParentId === 0 ? Layout : ParentView;
        } else {
          // 正常的内嵌子菜单
          const viewPath = `../views/${menu.menuComponent}.vue`;
          route.component = modules[viewPath] || (() => import('@/views/error/NotFoundPage.vue'));
        }

        // 递归处理子节点
        if (menu.children && menu.children.length > 0) {
          const childRoutes = generateRouteTree(menu.children, currentPath);
          if (route.children) {
            route.children.push(...childRoutes);
          } else {
            route.children = childRoutes;
          }
        }
        return route;
      })
  );
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

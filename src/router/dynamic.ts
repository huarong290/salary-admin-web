// src/router/dynamic.ts
import type { RouteRecordRaw } from 'vue-router';

// 核心魔法：使用 Vite 提供的 glob 导入，把 src/views 下所有的 .vue 文件统统扫描出来
// 这样就能根据后端返回的组件路径字符串，匹配到真正的 Vue 组件函数
const modules = import.meta.glob('../views/**/*.vue');

// 这个 Layout 组件就是我们整个后台管理系统的“外壳”（包含侧边栏、顶栏、主区域）
// 我们后面会去 src/layout/index.vue 里写它
const Layout = () => import('@/components/layout/index.vue');

/**
 * 核心递归算法：将后端的 MenuTreeVO 转换为 Vue Router 认识的路由数组
 * @param menus 后端返回的菜单树 JSON
 * @returns Vue 路由配置数组
 */
export function filterDynamicRoutes(menus: any[]): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = [];

  menus.forEach((menu) => {
    // 构造前端路由对象
    const route: any = {
      path: menu.menuPath,
      name: menu.menuName, // 必须唯一，用于 keep-alive 缓存
      meta: menu.meta, // 咱们后端 SysMenuConvert 生成的极其完美的 MetaVO 就在这里！
    };

    // 目录类型 (M) 或者是顶级节点，它的外壳应该是 Layout
    if (menu.menuType === 'M' || menu.menuParentId === 0) {
      route.component = Layout;
    }
    // 菜单类型 (C)，根据后端配的 component 路径去匹配真正的 .vue 文件
    else if (menu.menuType === 'C' && menu.menuComponent) {
      // 假设后端配的是 system/user/index，我们要拼接成 ../views/system/user/index.vue 去 modules 里找
      const viewPath = `../views/${menu.menuComponent}.vue`;
      if (modules[viewPath]) {
        route.component = modules[viewPath];
      } else {
        console.error(`路由解析错误：找不到组件 ${viewPath}，请检查数据库配置!`);
        // 容错处理：找不到组件时，给一个默认的 404 页面，防止整个前端崩溃
        route.component = () => import('@/views/error/NotFoundPage.vue');
      }
    }

    // 递归处理子节点
    if (menu.children && menu.children.length > 0) {
      route.children = filterDynamicRoutes(menu.children);
    }

    res.push(route);
  });

  return res;
}

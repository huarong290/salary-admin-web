<!--src/components/layout/navbar/Breadcrumb.vue-->
<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <span v-if="index === breadcrumbs.length - 1 || !item.redirectable" class="no-redirect">
          {{ item.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">{{ item.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/modules/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

interface BreadcrumbItem {
  title: string;
  path: string;
  redirectable: boolean;
}

const breadcrumbs = ref<BreadcrumbItem[]>([]);

/**
 * 🌟 核心算法：在树形菜单中执行 DFS，找出当前路径的层级链条
 */
const getBreadcrumbs = () => {
  const currentPath = route.path;

  // 1. 如果是在首页，直接固定显示
  if (currentPath === '/dashboard' || currentPath === '/') {
    breadcrumbs.value = [{ title: '工作台', path: '/dashboard', redirectable: false }];
    return;
  }

  let matchedChain: BreadcrumbItem[] = [];

  // 2. 深度优先遍历算法 (DFS)
  const traverse = (
    menus: any[],
    targetPath: string,
    parentPath = '',
    chain: BreadcrumbItem[] = []
  ): boolean => {
    for (const menu of menus) {
      // 还原拼接绝对路径 (必须与 dynamic.ts 和 SidebarItem 保持一致)
      const resolvedPath = menu.menuPath.startsWith('/')
        ? menu.menuPath
        : `${parentPath}/${menu.menuPath}`.replace(/(?<!:)\/\/+/g, '/');

      const node: BreadcrumbItem = {
        title: menu.meta?.title || menu.menuName,
        path: resolvedPath,
        // 如果是目录(没有具体页面组件)，则不可点击跳转
        redirectable: menu.menuComponent !== 'Layout' && menu.menuComponent !== 'ParentView',
      };

      const currentChain = [...chain, node];

      // 命中目标路径！保存完整链条并终止遍历
      if (resolvedPath === targetPath) {
        matchedChain = currentChain;
        return true;
      }

      // 递归搜索子节点
      if (menu.children && menu.children.length > 0) {
        if (traverse(menu.children, targetPath, resolvedPath, currentChain)) {
          return true;
        }
      }
    }
    return false;
  };

  traverse(userStore.menus, currentPath);

  // 3. 在所有链条头部插入一个“工作台”作为返回起点的锚点
  breadcrumbs.value = [
    { title: '工作台', path: '/dashboard', redirectable: true },
    ...matchedChain,
  ];
  // breadcrumbs.value = matchedChain;
};

// 监听路由变化，动态重新计算面包屑
watch(() => route.path, getBreadcrumbs, { immediate: true });

// 路由跳转
const handleLink = (item: BreadcrumbItem) => {
  router.push(item.path);
};
</script>

<style scoped lang="scss">
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px; /* 匹配 Navbar 高度 */
  margin-left: 8px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }

  a {
    color: #666;
    font-weight: normal;
    transition: color 0.2s;
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

/* 🌟 企业级过渡动画：丝滑切入切出 */
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.4s ease;
}
.breadcrumb-enter-from,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(20px);
}
.breadcrumb-leave-active {
  position: absolute;
}
</style>

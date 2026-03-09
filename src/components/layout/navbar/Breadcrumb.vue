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

  // 3. 组装初始链条：强制加入首页锚点 不再强行塞入“工作台”，直接使用真实匹配到的链条
  //   const rawChain = [
  //     { title: '工作台', path: '/dashboard', redirectable: true },
  //     ...matchedChain,
  //   ];
  const rawChain = [...matchedChain];
  // breadcrumbs.value = matchedChain;
  // 4. 🌟 核心去重与反套娃算法
  breadcrumbs.value = rawChain.filter((item, index, arr) => {
    if (index < arr.length - 1) {
      const currentTitle = item.title;
      // 🌟 核心修复：取出 nextNode，TypeScript 认为它可能是 undefined
      const nextNode = arr[index + 1];
      // ✅ 加上 ? 可选链，如果 nextNode 为空，nextTitle 就是 undefined，不会报错
      const nextTitle = nextNode?.title;

      // 规则 A：如果当前节点和下一个节点的 Path 完全一样，干掉当前的
      // ✅ 加上 nextNode 的存在性校验
      if (nextNode && item.path === nextNode.path) {
        return false;
      }

      // 规则 B：如果子级的名字包含了父级的名字，隐藏父级保留子级
      if (nextTitle && (nextTitle.includes(currentTitle) || currentTitle === nextTitle)) {
        return false;
      }
    }
    return true;
  });
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

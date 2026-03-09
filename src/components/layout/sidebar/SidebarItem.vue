<template>
  <template v-if="item.menuVisible === 1 && item.menuType !== 3">
    <el-menu-item
      v-if="theOnlyChild"
      :index="resolvePath(theOnlyChild.menuPath)"
      @click="handleLink(theOnlyChild)"
    >
      <el-icon>
        <component
          :is="formatIcon(theOnlyChild.menuIcon || item.menuIcon)"
          v-if="theOnlyChild.menuIcon || item.menuIcon"
        />
      </el-icon>
      <template #title>{{ theOnlyChild.meta?.title || theOnlyChild.menuName }}</template>
    </el-menu-item>

    <el-sub-menu v-else :index="resolvePath(item.menuPath)">
      <template #title>
        <el-icon>
          <component :is="formatIcon(item.menuIcon)" v-if="item.menuIcon" />
        </el-icon>
        <span>{{ item.meta?.title || item.menuName }}</span>
      </template>

      <sidebar-item
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :base-path="resolvePath(item.menuPath)"
      />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MenuTreeVO } from '@/types/menu/menu.ts';

const props = withDefaults(
  defineProps<{
    item: MenuTreeVO;
    basePath?: string;
  }>(),
  { basePath: '' }
);

// 1. 过滤出需要显示的有效子节点 (可见，且不是按钮)
const showingChildren = computed(() => {
  if (!props.item.children) return [];
  return props.item.children.filter((child) => {
    return child.menuVisible === 1 && child.menuType !== 3;
  });
});

// 2. 独子提权逻辑：判断是否把唯一的子节点提上来当成顶级菜单
const theOnlyChild = computed(() => {
  // 场景 A：如果有且只有 1 个需要显示的子节点 (如被外壳包裹着的工作台面板)
  // if (showingChildren.value.length === 1) {
  //   return showingChildren.value[0];
  // }
  // 场景 B：如果没有子节点，把自己作为唯一节点返回 (如没有任何子菜单的用户管理页面)
  if (showingChildren.value.length === 0) {
    return { ...props.item };
  }
  // 场景 C：有多个子节点 (如系统管理)，不提权，返回 null，让它去走 el-sub-menu
  return null;
});

const handleLink = (menu: MenuTreeVO) => {
  if (menu.meta?.link) {
    window.open(menu.meta.link, '_blank');
  }
};

// 3. 格式化图标名称 (增加 ? 满足 TypeScript 严格模式，提供空值兜底)
const formatIcon = (icon?: string) => {
  if (!icon) return '';
  return icon.charAt(0).toUpperCase() + icon.slice(1);
};

// 4. 智能拼接绝对路由 (增加 ? 满足 TypeScript 严格模式，提供空值兜底)
const resolvePath = (routePath?: string) => {
  const path = routePath || '';

  if (/^(https?:|mailto:|tel:)/.test(path)) {
    return path;
  }
  if (path.startsWith('/')) {
    return path;
  }

  // 优先使用父组件传进来的 basePath，如果没有，就用自己的 menuPath 当底座
  const base = props.basePath || props.item.menuPath || '';
  return `${base}/${path}`.replace(/(?<!:)\/\/+/g, '/');
};
</script>

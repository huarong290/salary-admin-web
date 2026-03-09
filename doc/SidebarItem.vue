<!-- src/components/layout/sidebar/SidebarItem.vue -->
<template>
  <template v-if="item.menuVisible === 1">
    <el-menu-item
      v-if="!item.children || item.children.length === 0"
      :index="resolvePath(item.menuPath)"
      @click="handleLink(item)"
    >
      <el-icon v-if="item.meta?.icon">
        <component :is="formatIcon(item.meta.icon)" />
      </el-icon>
      <template #title>{{ item.meta?.title || item.menuName }}</template>
    </el-menu-item>

    <el-sub-menu v-else :index="resolvePath(item.menuPath)">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="formatIcon(item.meta.icon)" />
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
import type { MenuTreeVO } from '@/types/menu/menu';

// 🌟 修正3：声明 basePath 属性接收父级传递的路径
const props = withDefaults(
  defineProps<{
    item: MenuTreeVO;
    basePath?: string;
  }>(),
  {
    basePath: '',
  }
);

const handleLink = (menu: MenuTreeVO) => {
  if (menu.meta?.link) {
    window.open(menu.meta.link, '_blank');
  }
};

const formatIcon = (icon: string) => {
  if (!icon) return '';
  return icon.charAt(0).toUpperCase() + icon.slice(1);
};

/**
 * 🌟 核心算法：智能解析并拼接绝对路径
 */
const resolvePath = (routePath: string) => {
  if (/^(https?:|mailto:|tel:)/.test(routePath)) {
    return routePath;
  }
  if (routePath.startsWith('/')) {
    return routePath;
  }
  const base = props.basePath ? props.basePath : '';
  return `${base}/${routePath}`.replace(/(?<!:)\/\/+/g, '/');
};
</script>

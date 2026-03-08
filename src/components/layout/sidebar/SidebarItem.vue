<!-- src/components/layout/sidebar/SidebarItem.vue -->
<template>
  <template v-if="item.menuVisible === 0">
    <!-- 普通菜单项 -->
    <el-menu-item
      v-if="!item.children || item.children.length === 0"
      :index="item.menuPath"
      @click="handleLink(item)"
    >
      <el-icon v-if="item.meta?.icon">
        <component :is="formatIcon(item.meta.icon)" />
      </el-icon>
      <template #title>{{ item.meta?.title }}</template>
    </el-menu-item>

    <!-- 子菜单 -->
    <el-sub-menu v-else :index="item.menuPath">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="formatIcon(item.meta.icon)" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>
      <sidebar-item v-for="child in item.children" :key="child.id" :item="child" />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
import type { MenuTreeVO } from '@/types/menu/menu';

const props = defineProps<{
  item: MenuTreeVO;
}>();

// 外链跳转处理
const handleLink = (menu: MenuTreeVO) => {
  if (menu.meta?.link) {
    window.open(menu.meta.link, '_blank');
  }
};
console.log('当前菜单:', props.item);

/** 🌟 图标格式化：将 setting 转为 Setting */
const formatIcon = (icon: string) => {
  if (!icon) return '';
  return icon.charAt(0).toUpperCase() + icon.slice(1);
};
</script>

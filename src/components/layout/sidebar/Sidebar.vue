<!--src/components/layout/sidebar/Sidebar.vue-->
<template>
  <div class="sidebar-container">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :router="true"
        :unique-opened="true"
      >
        <sidebar-item v-for="menu in menuList" :key="menu.id" :item="menu" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/modules/user'; // 确保你已定义该 Store
import SidebarItem from './SidebarItem.vue';
const route = useRoute();

const userStore = useUserStore();

// 💡 从 Pinia 获取后端下发的动态菜单树
const menuList = computed(() => userStore.menus);

const activeMenu = computed(() => {
  return route.path;
});
</script>
<style scoped lang="scss">
.sidebar-container {
  height: 100vh;
  background-color: var(--salary-sidebar-bg);
  .el-menu {
    border-right: none;
  }
}
</style>

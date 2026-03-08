<!--src/components/layout/index.vue-->
<template>
  <div class="app-wrapper">
    <Sidebar class="sidebar-container" />

    <div class="main-container">
      <Navbar />
      <AppMain />
    </div>
  </div>
</template>
<script setup lang="ts">
import Sidebar from '@/components/layout/sidebar/Sidebar.vue';
import Navbar from '@/components/layout/navbar/Navbar.vue';
import AppMain from '@/components/layout/main/AppMain.vue';
</script>

<style scoped lang="scss">
.app-wrapper {
  /* 启动 Flex 引擎 */
  display: flex;
  width: 100%;
  height: 100%;
}
.sidebar-container {
  width: 210px;
  /* flex-shrink: 0 保证即使屏幕变小，侧边栏宽度也绝对不被压缩 */
  flex-shrink: 0;
  height: 100%;
  background-color: var(--salary-sidebar-bg, #304156);
}
.main-container {
  /* 🌟flex: 1 告诉浏览器，把除去侧边栏 210px 外的所有宽度全部分给右侧 */
  flex: 1;
  display: flex;
  flex-direction: column;
  /* 保证右侧容器宽度 100% 占满自己被分配到的 flex 空间 */
  width: calc(100% - 210px);
  height: 100%;
  /* 隐藏溢出，内部滚动交给 AppMain */
  overflow: hidden;
}
</style>

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
  display: flex;
  width: 100%;
  height: 100%;
}
.sidebar-container {
  width: 210px;
  flex-shrink: 0;
}
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

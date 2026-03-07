<!--src/components/layout/main/AppMain.vue-->
<!--主内容区-->
<template>
  <section class="app-main">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </section>
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
.app-main {
  /* 50px 是 Navbar 的高度，留出空间 */
  min-height: calc(100vh - 50px);
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 20px;
  background-color: var(--salary-bg-page);
}
</style>

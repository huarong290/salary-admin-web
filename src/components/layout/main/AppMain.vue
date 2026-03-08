<!--src/components/layout/main/AppMain.vue-->
<!--主内容区-->
<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="tagsViewStore.cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>
<script setup lang="ts">
import { useTagsViewStore } from '@/stores/modules/tagsView';

const tagsViewStore = useTagsViewStore();
</script>
<style scoped lang="scss">
.app-main {
  /* 高度微调：减去 Navbar (50px) 和 TagsView (34px) 的高度 */
  min-height: calc(100vh - 84px);
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 20px;
  background-color: var(--salary-bg-page, #f0f2f5);
}
</style>

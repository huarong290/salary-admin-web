<!--src/App.vue-->
<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useTheme } from '@/hooks/useTheme';
import { onMounted } from 'vue';
const { initTheme } = useTheme();

onMounted(() => {
  // 补全所有 CSS 渐变色变量的注入
  initTheme();
});
</script>
<style>
/* 全局样式过滤，让切换时的颜色过渡更柔和 */
html.transition-theme * {
  transition:
    background-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    border-color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}
</style>

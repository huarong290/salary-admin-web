<!--src/views/salary/engine/EngineConfigPage.vue-->
<template>
  <div class="engine-config-container">
    <el-tabs v-model="activeTab" class="custom-tabs" type="border-card">
      <el-tab-pane label="📚 引擎计算规则库" name="rule">
        <CalcRulePage />
      </el-tab-pane>

      <el-tab-pane label="⚙️ 薪资管道编排" name="pipeline">
        <CalcPipelinePage />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块说明
 * 功能描述: 薪资计算引擎总控台 (聚合页)
 * 核心逻辑: 作为父级容器，通过 Tab 组合 [计算规则] 与 [管道编排] 两个独立页面
 * ====================================================================
 */
import { ref } from 'vue';
import CalcRulePage from '@/views/salary/calcrule/CalcRulePage.vue';
import CalcPipelinePage from '@/views/salary/calcpipeline/CalcPipelinePage.vue';
// 💡 引入刚刚优化好的两个独立页面当作子组件
// (注意：请根据你工程的实际相对路径或别名进行调整)
const activeTab = ref('rule');
</script>

<style scoped lang="scss">
.engine-config-container {
  padding: 20px;
}

.custom-tabs {
  min-height: calc(100vh - 84px);
  border: none;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  /* 🚀 架构师细节：穿透去除子组件原有的 app-container 内边距 */
  /* 因为子页面原本是作为独立页面设计的，带有 20px 的 padding，
     放进 Tab 里会产生“双重边距”发胖，用穿透样式将其干掉，做到完美嵌合 */
  :deep(.app-container) {
    padding: 0 !important;
  }

  /* 隐藏子页面的卡片阴影和边框，让它与 Tab 浑然一体 */
  :deep(.el-card) {
    border: none;
    box-shadow: none;
  }
}
</style>

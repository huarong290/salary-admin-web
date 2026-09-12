<template>
  <div class="item-config-select-wrap">
    <el-select
      :model-value="modelValue"
      filterable
      clearable
      placeholder="请选择薪资项目"
      style="flex: 1"
      @update:model-value="handleUpdate"
      @change="handleChange"
    >
      <el-option
        v-for="item in options"
        :key="item.id"
        :label="item.itemName"
        :value="item.itemCode"
      >
        <span style="float: left">{{ item.itemName }}</span>
        <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">
          {{ item.itemCode }}
        </span>
      </el-option>
    </el-select>

    <!-- 可选：刷新缓存按钮（清后端 Redis 选项缓存 + 重新拉取）。
         场景：直接用 SQL / 数据导入改了薪资项目配置后，下拉仍显示旧数据时使用 -->
    <el-tooltip
      v-if="showRefresh"
      placement="top"
      content="刷新缓存：重新拉取最新薪资项目（直接改数据库配置后使用）"
    >
      <el-button :icon="Refresh" circle plain :loading="refreshing" @click="handleRefresh" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import {
  listItemConfigOptionsApi,
  refreshItemConfigCacheApi,
} from '@/api/salary/itemconfig/itemConfig';

// showRefresh: 是否显示"刷新缓存"按钮（默认不显示，按需开启）
const props = defineProps(['modelValue', 'showRefresh']);
const emit = defineEmits(['update:modelValue', 'change']);

const options = ref<any[]>([]);
const refreshing = ref(false);

/** 拉取薪资项目下拉数据 */
const loadOptions = async () => {
  const res = await listItemConfigOptionsApi();
  options.value = res || [];
};

onMounted(loadOptions);

const handleUpdate = (val: any) => emit('update:modelValue', val);

const handleChange = (val: any) => {
  const selected = options.value.find((o) => o.itemCode === val);
  emit('change', selected); // 🌟 关键：把整个对象传出去，方便父组件自动填名和类型
};

/**
 * 刷新缓存：先清后端 Redis 选项缓存，再重新拉取下拉数据
 * 用于"直接改库（SQL/导入）后页面仍显示旧项目"的场景
 */
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await refreshItemConfigCacheApi();
    await loadOptions();
    ElMessage.success(`刷新成功，当前共 ${options.value.length} 个薪资项目`);
  } catch (error) {
    console.error('刷新薪资项目缓存失败:', error);
  } finally {
    refreshing.value = false;
  }
};
</script>

<style scoped>
.item-config-select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
</style>

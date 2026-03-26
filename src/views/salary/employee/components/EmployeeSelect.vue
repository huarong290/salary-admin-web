<!--src/views/salary/employee/components/EmployeeSelect.vue-->
<template>
  <el-select
    :model-value="modelValue"
    filterable
    remote
    clearable
    reserve-keyword
    :placeholder="placeholder"
    :remote-method="handleRemoteSearch"
    :loading="loading"
    :disabled="disabled"
    class="employee-select"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.employeeName" :value="item.id">
      <span style="float: left">{{ item.employeeName }}</span>
      <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
        {{ item.employeeCode }}
      </span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
/**
 * ====================================================================
 * 📌 业务组件：远程员工选择器
 * 功能：支持拼音/姓名/工号模糊搜索，支持 v-model 双向绑定，完美支持编辑回显
 * ====================================================================
 */
import { ref, watch } from 'vue';
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee';

// --- 1. 属性与事件定义 ---
const props = withDefaults(
  defineProps<{
    modelValue?: number | string;
    placeholder?: string;
    disabled?: boolean;
    // 用于外部传入初始选项（解决编辑回显只有 ID 没有名字的痛点）
    defaultOptions?: EmployeeOptionVO[];
  }>(),
  {
    placeholder: undefined,
    disabled: false,
    defaultOptions: () => [],
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val?: number | string): void;
  (e: 'change', val?: number | string): void;
}>();

// --- 2. 内部状态 ---
const loading = ref(false);
const options = ref<EmployeeOptionVO[]>([]);

// --- 3. 核心逻辑 ---
// 监听外部传入的默认选项，用于初始化回显
watch(
  () => props.defaultOptions,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      options.value = newVal;
    }
  },
  { immediate: true, deep: true }
);

// 防抖远程搜索
const handleRemoteSearch = async (query: string) => {
  if (!query) {
    // 搜索词清空时，保留回显的默认项，防止下拉框空掉
    options.value = props.defaultOptions.length > 0 ? props.defaultOptions : [];
    return;
  }

  loading.value = true;
  try {
    const res = await listEmployeeOptionsApi(query);
    options.value = (res || []) as EmployeeOptionVO[];
  } catch (error) {
    console.error('搜索员工异常:', error);
  } finally {
    loading.value = false;
  }
};

// 派发更新事件
const handleUpdate = (val?: number | string) => {
  emit('update:modelValue', val);
};

const handleChange = (val?: number | string) => {
  emit('change', val);
  // 清空选项时，不要直接 = []，而是恢复默认回显项
  if (!val) {
    options.value = props.defaultOptions.length > 0 ? [...props.defaultOptions] : [];
  }
};
</script>

<style scoped lang="scss">
.employee-select {
  width: 100%;
}
</style>

<template>
  <el-select
    :model-value="modelValue"
    :disabled="disabled || !employeeId"
    :placeholder="employeeId ? '请选择核算月份' : '请先选择员工'"
    clearable
    class="period-select"
    @update:model-value="handleUpdate"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="`${item.settlementMonth} (${item.startDate} ~ ${item.endDate})`"
      :value="item.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { listPeriodOptionsByEmployeeApi } from '@/api/salary/period/period';
import type { PeriodOptionVO, PeriodSelectQueryReqDTO } from '@/types/salary/period/period';

const props = defineProps<{
  modelValue?: number | string;
  employeeId?: number | string;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const options = ref<PeriodOptionVO[]>([]);

// 监听员工ID变化，自动刷新该员工的可用周期
watch(
  () => props.employeeId,
  async (newId) => {
    // 构造 DTO 参数
    const queryParams: PeriodSelectQueryReqDTO = {
      employeeId: newId || undefined,
    };
    try {
      const res = await listPeriodOptionsByEmployeeApi(queryParams);
      options.value = res || [];
    } catch (error) {
      console.error('获取员工周期失败:', error);
    }
  },
  { immediate: true }
);

const handleUpdate = (val: any) => {
  emit('update:modelValue', val);
  emit('change', val);
};
</script>

<template>
  <el-select
    :model-value="modelValue"
    filterable
    clearable
    placeholder="请选择薪资项目"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.itemName" :value="item.itemCode">
      <span style="float: left">{{ item.itemName }}</span>
      <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">
        {{ item.itemCode }}
      </span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listItemConfigOptionsApi } from '@/api/salary/itemconfig/itemConfig';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'change']);

const options = ref<any[]>([]);

onMounted(async () => {
  const res = await listItemConfigOptionsApi();
  options.value = res || [];
});

const handleUpdate = (val: any) => emit('update:modelValue', val);
const handleChange = (val: any) => {
  const selected = options.value.find((o) => o.itemCode === val);
  emit('change', selected); // 🌟 关键：把整个对象传出去，方便父组件自动填名和类型
};
</script>

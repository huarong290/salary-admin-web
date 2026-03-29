<!--src/views/salary/archive/components/SalaryArchiveItem.vue-->

<template>
  <div class="salary-item-editor">
    <el-table :data="localItems" border size="small" style="width: 100%; margin-bottom: 10px">
      <el-table-column label="薪资项目" min-width="180">
        <template #default="{ row, $index }">
          <el-select
            v-model="row.itemConfigId"
            placeholder="请选择薪资项"
            style="width: 100%"
            filterable
            @change="handleConfigChange($event, $index)"
          >
            <el-option
              v-for="config in configOptions"
              :key="config.id"
              :label="config.itemName"
              :value="config.id"
            >
              <span style="float: left">{{ config.itemName }}</span>
              <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                {{ config.envVarName }}
              </span>
            </el-option>
          </el-select>
        </template>
      </el-table-column>

      <el-table-column label="设定金额 (固定值)" width="160">
        <template #default="{ row }">
          <el-input-number
            v-model="row.amount"
            :precision="2"
            :controls="false"
            style="width: 100%"
            placeholder="0.00"
          />
        </template>
      </el-table-column>

      <el-table-column label="动态计算脚本 (选填)" min-width="200">
        <template #default="{ row }">
          <el-input v-model="row.ruleScript" placeholder="如不填写则使用默认金额" clearable />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link icon="Delete" @click="handleRemove($index)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-button type="primary" plain icon="Plus" size="small" @click="handleAdd">
      添加薪资明细项
    </el-button>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资构成明细的动态添加与编辑组件
 * 接收参数: modelValue (当前已选列表), configOptions (薪资配置备选项)
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
// [1] Vue 核心钩子与原生生态
import { ref, watch } from 'vue';
// [2] 第三方 UI 组件库与图标
import { ElMessage } from 'element-plus';

import type { ArchiveItemReqDTO } from '@/types/salary/archiveitem/archiveItem';

/**
 * --------------------------------------------------------------------
 * 📦 二、 Props 与 Emits 定义 (Component Interface)
 * --------------------------------------------------------------------
 */
const props = defineProps<{
  modelValue: ArchiveItemReqDTO[];
  configOptions: any[]; // 父组件传入的可选薪资项目列表
}>();

const emit = defineEmits(['update:modelValue']);

/**
 * --------------------------------------------------------------------
 * 🧠 三、 核心响应逻辑区 (Component Logic)
 * --------------------------------------------------------------------
 */
// 维护一份本地数据，避免直接修改 props 违背单向数据流原则
const localItems = ref<ArchiveItemReqDTO[]>([]);

// 监听父组件的数据变化，同步到子组件本地
watch(
  () => props.modelValue,
  (newVal) => {
    // 将新旧值转为字符串对比。如果一样，说明是子组件自己 emit 触发的父级更新，直接略过。
    const newStr = JSON.stringify(newVal || []);
    const oldStr = JSON.stringify(localItems.value);
    if (newStr !== oldStr) {
      localItems.value = JSON.parse(newStr);
    }
  },
  { immediate: true, deep: true }
);

// 监听本地数据的变化，通过 emit 同步给父组件
watch(
  () => localItems.value,
  (newVal) => {
    emit('update:modelValue', newVal);
  },
  { deep: true }
);

/**
 * --------------------------------------------------------------------
 * 🖱️ 四、 UI 交互事件区 (Interactions)
 * --------------------------------------------------------------------
 */

/** 新增一条空记录 */
const handleAdd = () => {
  localItems.value.push({
    itemConfigId: undefined as any,
    amount: 0,
    ruleScript: '',
  });
};

/** 移除指定索引的记录 */
const handleRemove = (index: number) => {
  localItems.value.splice(index, 1);
};
// 交互升级,监听薪资项的选择变化,做防重复处理
const handleConfigChange = (val: number, index: number) => {
  // 1. 防呆：检查是否重复添加了相同的薪资项目
  const isDuplicate = localItems.value.some((item, i) => item.itemConfigId === val && i !== index);
  if (isDuplicate) {
    ElMessage.warning('该薪资项目已存在，请勿重复添加');
    // 清空当前行错误选择的值
    const currentItem = localItems.value[index];
    if (currentItem) {
      currentItem.itemConfigId = undefined as any;
    }
    return;
  }

  // 2. 智能补全：(预留) 如果 configOptions 里有默认金额或公式，可以在这里自动帮 HR 填上
  /*
  const targetConfig = props.configOptions.find(c => c.id === val);
  if (targetConfig) {
     localItems.value[index].amount = targetConfig.defaultAmount || 0;
  }
  */
};
</script>

<style scoped lang="scss">
.salary-item-editor {
  width: 100%;
  border: 1px dashed var(--el-border-color);
  padding: 15px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
}
</style>

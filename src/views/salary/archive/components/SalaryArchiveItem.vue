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
            <!-- 收入类 (1) -->
            <el-option-group label="收入类 (可设计税)">
              <el-option
                v-for="config in incomeOptions"
                :key="config.id"
                :label="config.itemName"
                :value="config.id"
              >
                <span style="float: left">{{ config.itemName }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ config.envVarName }}
                </span>
              </el-option>
            </el-option-group>
            <!-- 扣款类 (2) -->
            <el-option-group label="扣款类">
              <el-option
                v-for="config in deductionOptions"
                :key="config.id"
                :label="config.itemName"
                :value="config.id"
              >
                <span style="float: left">{{ config.itemName }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                  {{ config.envVarName }}
                </span>
              </el-option>
            </el-option-group>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="计算模式" width="160">
        <template #default="{ row }">
          <el-select v-model="row.calcMode" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in dicts.salary_calc_mode ?? []"
              :key="item.dictItemValue"
              :label="item.dictItemLabel"
              :value="Number(item.dictItemValue)"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="设定金额 (基准标准)" width="170">
        <template #default="{ row }">
          <el-input-number
            v-if="!isSystemCalc(row)"
            v-model="row.amount"
            :precision="2"
            :controls="false"
            style="width: 100%"
            placeholder="0.00"
          >
            <template #append>
              {{ row.calcMode === 1 ? '元/月' : '元/天' }}
            </template>
          </el-input-number>
          <el-tooltip
            v-else
            content="该薪资项由系统自动计算（绩效/规则引擎），此处仅设置计税标识即可"
            placement="top"
          >
            <el-tag type="warning" size="small" effect="plain" style="width: 100%"
              >系统自动计算</el-tag
            >
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="计税" width="130" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.taxableFlag"
            placeholder="继承全局"
            style="width: 100%"
            clearable
            :disabled="row.itemType === 2"
          >
            <el-option label="计税" :value="1" />
            <el-option label="不计税" :value="0" />
          </el-select>
          <div
            v-if="row.taxableFlag === undefined || row.taxableFlag === null"
            class="text-secondary"
            style="font-size: 11px; line-height: 1"
          >
            默认继承全局配置
          </div>
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
import { ref, watch, computed } from 'vue';
// [2] 第三方 UI 组件库与图标
import { ElMessage } from 'element-plus';

import type { ArchiveItemReqDTO } from '@/types/salary/archiveitem/archiveItem';
// [3] 业务 API 请求接口
import { useDict } from '@/hooks/useDict';
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

// 下拉分组: 收入类(1) / 扣款类(2), 便于 HR 找到所有项目(含基本工资)并设置计税
const incomeOptions = computed(() =>
  (props.configOptions || []).filter((c) => Number(c.itemCategory) === 1)
);
const deductionOptions = computed(() =>
  (props.configOptions || []).filter((c) => Number(c.itemCategory) === 2)
);
/** 字典库数据源 */
const dicts = useDict('salary_calc_mode');
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
/** * 🌟 字典安全解析方法 (终极大厂增强版)
 * 解决 Vue3 Ref 传参解包失败导致文字变空 ("I"形标签) 的元凶
 */
// const getDictLabel = (dictListRaw: any, value: number | string | undefined | null) => {
//   if (value === undefined || value === null) return '';
//
//   // 1. 手动解包 Ref
//   const dictList = dictListRaw && dictListRaw.value ? dictListRaw.value : dictListRaw;
//
//   // 2. 拦截非数组情况
//   if (!Array.isArray(dictList) || dictList.length === 0) return String(value);
//
//   // 3. 兼容多命名规范，强转字符串匹配
//   const item = dictList.find((d: any) => {
//     const dVal = d.dictItemValue ?? d.dictValue ?? d.value;
//     return String(dVal).trim() === String(value).trim();
//   });
//
//   // 4. 返回中文 Label
//   if (item) {
//     return item.dictItemLabel ?? item.dictLabel ?? item.label;
//   }
//   return String(value);
// };
/**
 * --------------------------------------------------------------------
 * 🖱️ 四、 UI 交互事件区 (Interactions)
 * --------------------------------------------------------------------
 */

/** 新增一条空记录 */
const handleAdd = () => {
  localItems.value.push({
    itemConfigId: undefined as any,
    calcMode: 1, // 🌟 默认设为传统的“按月固定金额”
    amount: 0,
    ruleScript: '',
    taxableFlag: null, // null-继承全局计税配置
    itemCode: '',
  });
};

/** 移除指定索引的记录 */
const handleRemove = (index: number) => {
  localItems.value.splice(index, 1);
};
// 系统自动计算项: 金额由引擎/绩效/规则生成, 档案中金额字段无意义 (仅计税/继承控制有效)
const SYSTEM_CALC_CODES = [
  'KPI_BONUS',
  'OVERTIME_PAY_DAY',
  'OVERTIME_PAY_HOUR',
  'EVENT_EURO_CUP',
  'EVENT_WORLD_CUP',
  'SI_PENSION_IND',
  'SI_MED_IND',
  'SI_HOUSING_IND',
  'SI_REISSUE_IND',
  'ER_PENSION_COMP',
  'ER_VISA_COMP',
  'AUTO_TAX_CALC',
];

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

  // 2. 记录 itemCode 供模板判断"系统计算项"
  const targetConfig = props.configOptions.find((c) => c.id === val);
  if (targetConfig && localItems.value[index]) {
    localItems.value[index].itemCode = targetConfig.itemCode;
    if (SYSTEM_CALC_CODES.includes(targetConfig.itemCode)) {
      // 系统计算项: 金额自动生成, 置 0 并提示
      localItems.value[index].amount = 0;
    }
  }
};

// 判断是否为系统自动计算项 (金额无需手工填写)
const isSystemCalc = (row: any) => SYSTEM_CALC_CODES.includes(row?.itemCode);
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

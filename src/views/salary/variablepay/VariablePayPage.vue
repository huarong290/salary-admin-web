<!--src/views/salary/variablepay/VariablePayPage.vue-->
<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="额外收入明细 (绩效/提成)" name="income" />
      <el-tab-pane label="临时扣款明细 (考勤/罚款)" name="deduction" />
    </el-tabs>

    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYYMM"
            clearable
            style="width: 140px"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="employeeId">
          <el-select
            v-model="queryParams.employeeId"
            filterable
            remote
            clearable
            placeholder="输入姓名搜索"
            :remote-method="remoteSearchEmployees"
            :loading="searchLoading"
            style="width: 180px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in employeeOptions"
              :key="item.id"
              :label="item.employeeName"
              :value="item.id"
            >
              <span style="float: left">{{ item.employeeName }}</span>
              <span class="amount-font" style="float: right; color: #999; font-size: 12px"
                >#{{ item.employeeCode }}</span
              >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="activeTab === 'income' ? '收入项目' : '扣款项目'" prop="typeId">
          <el-select
            v-model="queryParams.typeId"
            placeholder="全部类型"
            clearable
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option
              v-for="dict in activeTab === 'income' ? incomeTypeOptions : deductionTypeOptions"
              :key="dict.id"
              :label="dict.typeName"
              :value="dict.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <div class="toolbar">
        <el-button
          v-hasPerm="['salary:variablepay:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
        >
          录入{{ activeTab === 'income' ? '收入' : '扣款' }}
        </el-button>
        <el-button
          v-hasPerm="['salary:variablepay:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" fixed="left" />
        <el-table-column label="姓名" align="center" width="120" fixed="left">
          <template #default="{ row }"
            ><span style="font-weight: 600">{{ row.employeeName }}</span></template
          >
        </el-table-column>
        <el-table-column label="结算月份" align="center" width="100">
          <template #default="{ row }"
            ><el-tag type="primary" effect="plain" class="amount-font status-tag">{{
              row.settlementMonth
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column
          :label="activeTab === 'income' ? '收入项目' : '扣款项目'"
          align="center"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag
              :type="activeTab === 'income' ? 'success' : 'danger'"
              size="small"
              class="status-tag"
            >
              {{ activeTab === 'income' ? row.incomeTypeName : row.deductionTypeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="决算金额" align="right" width="180">
          <template #default="{ row }">
            <div
              :style="{
                color:
                  activeTab === 'income' ? 'var(--el-color-success)' : 'var(--el-color-danger)',
              }"
            >
              <span class="amount-font" style="font-size: 15px; font-weight: bold">
                {{ activeTab === 'income' ? '+' : '-' }}{{ row.amount }}
              </span>
              <span class="amount-font" style="margin-left: 4px; font-size: 12px">{{
                row.settlementCurrency || 'CNY'
              }}</span>
            </div>
            <div v-if="row.currency !== row.settlementCurrency" class="currency-hint">
              (原币: {{ row.originalAmount }} {{ row.currency }})
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注说明" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="录入时间" align="center" width="160">
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{ row.createTime }}</span></template
          >
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:variablepay:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleEdit(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:variablepay:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      width="580px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ dialog.title }}</span>
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="section-title">关联对象与周期</div>
        <el-form-item label="选择员工" prop="employeeId">
          <el-select
            v-model="form.employeeId"
            filterable
            remote
            :remote-method="remoteSearchEmployeesForm"
            :loading="searchLoadingForm"
            style="width: 100%"
            :disabled="!!form.id"
            placeholder="请输入姓名检索"
            @change="handleEmployeeChange"
          >
            <el-option
              v-for="item in employeeOptionsForm"
              :key="item.id"
              :label="item.employeeName"
              :value="item.id"
            >
              <span style="float: left">{{ item.employeeName }}</span>
              <span class="amount-font" style="float: right; color: #999; font-size: 12px"
                >#{{ item.employeeCode }}</span
              >
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="薪资月份" prop="periodId">
          <el-select
            v-model="form.periodId"
            placeholder="请先选择上方员工"
            style="width: 100%"
            filterable
            :disabled="!form.employeeId"
          >
            <el-option
              v-for="item in formPeriodOptions"
              :key="item.id"
              :label="item.settlementMonth"
              :value="item.id"
            >
              <div class="flex-justify-between">
                <span class="amount-font" style="font-weight: bold">{{
                  item.settlementMonth
                }}</span>
                <span style="color: #999; font-size: 12px">{{
                  item.startDate ? `(${item.startDate} ~ ${item.endDate})` : ''
                }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item
          :label="activeTab === 'income' ? '收入类型' : '扣款类型'"
          :prop="activeTab === 'income' ? 'incomeTypeId' : 'deductionTypeId'"
        >
          <el-select
            v-model="form[activeTab === 'income' ? 'incomeTypeId' : 'deductionTypeId']"
            placeholder="选择具体业务项目"
            style="width: 100%"
            @change="handleTypeChange"
          >
            <el-option
              v-for="dict in activeTab === 'income' ? incomeTypeOptions : deductionTypeOptions"
              :key="dict.id"
              :label="dict.typeName"
              :value="dict.id"
            />
          </el-select>
        </el-form-item>

        <div class="section-title margin-top-20">多币种金额核算</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="变动币种" prop="currency">
              <el-select v-model="form.currency" style="width: 100%" @change="handleCurrencyChange">
                <el-option
                  v-for="item in currencyOptions"
                  :key="item.dictItemValue"
                  :label="item.dictItemLabel"
                  :value="item.dictItemValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实时汇率" prop="exchangeRate">
              <el-input-number
                v-model="form.exchangeRate"
                :min="0"
                :precision="6"
                :controls="false"
                style="width: 100%"
                :disabled="form.currency === form.settlementCurrency"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="原币金额" prop="originalAmount">
          <el-input-number
            v-model="form.originalAmount"
            :min="0"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
          <div
            class="calc-hint-box"
            :class="activeTab === 'income' ? 'income-hint' : 'deduction-hint'"
          >
            <el-icon><Money /></el-icon>
            {{ form.currency !== form.settlementCurrency ? '汇率折算结果' : '核算本位金额' }}：
            <span class="amount-font">{{ convertedAmount }}</span> {{ form.settlementCurrency }}
          </div>
        </el-form-item>

        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="补充核算依据或调整原因..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm"
            >确 定 保 存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 变动薪资流水管理 (处理奖金、提成、罚款、考勤扣款等)
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
// 1.1  Vue 与核心依赖
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
// 1.2 Element Plus 与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, Money } from '@element-plus/icons-vue';

// 1.3 API 与类型定义
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import { listPeriodOptionsByEmployeeApi } from '@/api/salary/period/period';
import { getIncomeTypeOptionsApi } from '@/api/salary/incometype/incomeType.ts';
import { getDeductionTypeOptionsApi } from '@/api/salary/deductiontype/deductionType.ts';
import {
  addIncomeDetailApi,
  updateIncomeDetailApi,
  getIncomeDetailPageApi,
  deleteIncomeDetailApi,
  batchDeleteIncomeDetailApi,
} from '@/api/salary/incomedetail/incomeDetail.ts';
import {
  addDeductionDetailApi,
  updateDeductionDetailApi,
  getDeductionDetailPageApi,
  deleteDeductionDetailApi,
  batchDeleteDeductionDetailApi,
} from '@/api/salary/deductiondetail/deductionDetail.ts';
import { getConfigValueApi } from '@/api/salary/config/config.ts';
import { getItemsByTypeApi } from '@/api/dictitem/dictItem.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
// [双轨制控制器]
const activeTab = ref<'income' | 'deduction'>('income');
// [UI 控制状态]
const loading = ref(false);
const submitLoading = ref(false);
const searchLoading = ref(false);
const isFullscreen = ref(false);

// [表格与分页状态]
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<(number | string)[]>([]);
const dataList = ref<any[]>([]);

// [全局数据字典]
const baseCurrency = ref('CNY');
const incomeTypeOptions = ref<any[]>([]);
const deductionTypeOptions = ref<any[]>([]);
const currencyOptions = ref<any[]>([]);
const employeeOptions = ref<any[]>([]);
// [表单专有级联字典]
const searchLoadingForm = ref(false);
const employeeOptionsForm = ref<any[]>([]);
const formPeriodOptions = ref<any[]>([]);
// [查询条件]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  employeeId: undefined,
  typeId: undefined,
  settlementMonth: '',
});

// [表单模型]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// 强校验规则
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '必须指定员工', trigger: 'change' }],
  periodId: [{ required: true, message: '必须指定结算周期', trigger: 'change' }],
  incomeTypeId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  deductionTypeId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  originalAmount: [{ required: true, message: '金额不能为空', trigger: 'blur' }],
  exchangeRate: [{ required: true, message: '汇率不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 切换 Tab 时精准清除 typeId，防止跨模块查询污染 */
const handleTabChange = () => {
  queryParams.typeId = undefined;
  queryParams.pageNum = 1;
  getList();
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.employeeId = undefined;
  handleQuery();
};

const cancel = () => {
  dialog.visible = false;
};

/** 🌟 精度校准：自动计算折算后的本位币金额 */
const convertedAmount = computed(() => {
  const original = Number(form.value.originalAmount) || 0;
  const rate = Number(form.value.exchangeRate) || 0;
  return (Math.round((original * rate + Number.EPSILON) * 100) / 100).toFixed(2);
});

// --- 级联响应 ---

const handleEmployeeChange = async (employeeId: number) => {
  form.value.periodId = undefined;
  formPeriodOptions.value = [];
  if (employeeId) {
    const res = await listPeriodOptionsByEmployeeApi(employeeId);
    formPeriodOptions.value = res || [];
  }
};

const handleTypeChange = (typeId: number) => {
  const options =
    activeTab.value === 'income' ? incomeTypeOptions.value : deductionTypeOptions.value;
  const selected = options.find((item: any) => item.id === typeId);
  if (selected?.defaultCurrency && form.value.currency !== selected.defaultCurrency) {
    form.value.currency = selected.defaultCurrency;
    handleCurrencyChange(selected.defaultCurrency);
  }
};

const handleCurrencyChange = (val: string) => {
  if (val === form.value.settlementCurrency) {
    form.value.exchangeRate = 1.0;
  } else {
    // 汇率快照建议从后端拉取实时数据，此处为系统演示逻辑
    const rateMap: Record<string, number> =
      form.value.settlementCurrency === 'USD'
        ? { CNY: 0.138, PHP: 0.017, USDT: 1.0 }
        : { USD: 7.23, PHP: 0.125, USDT: 7.25 };
    form.value.exchangeRate = rateMap[val] || 1.0;
  }
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

const getList = async () => {
  loading.value = true;
  try {
    const reqData = {
      ...queryParams,
    };
    // 动态映射真正的 API 查询字段
    if (activeTab.value === 'income' && reqData.typeId) reqData.incomeTypeId = reqData.typeId;
    if (activeTab.value === 'deduction' && reqData.typeId) reqData.deductionTypeId = reqData.typeId;
    const res =
      activeTab.value === 'income'
        ? await getIncomeDetailPageApi(reqData)
        : await getDeductionDetailPageApi(reqData);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  resetFormState();
  dialog.title = `录入${activeTab.value === 'income' ? '额外收入' : '临时扣款'}`;
  dialog.visible = true;
  isFullscreen.value = false;
  nextTick(() => formRef.value?.clearValidate());
};

const handleEdit = async (row: any) => {
  resetFormState();
  employeeOptionsForm.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: '' },
  ];
  await handleEmployeeChange(row.employeeId);

  form.value = {
    ...row,
    currency: row.currency || baseCurrency.value,
    settlementCurrency: row.settlementCurrency || baseCurrency.value,
    originalAmount: row.originalAmount || row.amount,
    exchangeRate: row.exchangeRate || 1.0,
  };
  dialog.title = `修改${activeTab.value === 'income' ? '收入' : '扣款'}记录`;
  dialog.visible = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const isEdit = !!form.value.id;
        const submitData = { ...form.value, amount: convertedAmount.value };

        if (activeTab.value === 'income') {
          if (isEdit) {
            await updateIncomeDetailApi(submitData);
          } else {
            await addIncomeDetailApi(submitData);
          }
        } else {
          if (isEdit) {
            await updateDeductionDetailApi(submitData);
          } else {
            await addDeductionDetailApi(submitData);
          }
        }
        ElMessage.success('数据已同步');
        dialog.visible = false;
        await getList();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该条记录吗?', '风险提示', { type: 'warning' })
    .then(async () => {
      if (activeTab.value === 'income') {
        await deleteIncomeDetailApi(row.id);
      } else {
        await deleteDeductionDetailApi(row.id);
      }
      ElMessage.success('已删除');
      await getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量销毁选中的 ${selectedIds.value.length} 条记录吗?`, '高危操作', {
    type: 'warning',
  })
    .then(async () => {
      if (activeTab.value === 'income') {
        await batchDeleteIncomeDetailApi(selectedIds.value);
      } else {
        await batchDeleteDeductionDetailApi(selectedIds.value);
      }
      ElMessage.success('批量处理成功');
      await getList();
    })
    .catch(() => {});
};

// --- 状态重置辅助 ---
const resetFormState = () => {
  form.value = {
    id: undefined,
    employeeId: undefined,
    periodId: undefined,
    originalAmount: 0,
    exchangeRate: 1.0,
    currency: baseCurrency.value,
    settlementCurrency: baseCurrency.value,
    remark: '',
  };
  employeeOptionsForm.value = [];
  formPeriodOptions.value = [];
};

const remoteSearchEmployees = async (q: string) => {
  if (q) employeeOptions.value = await listEmployeeOptionsApi(q);
};
const remoteSearchEmployeesForm = async (q: string) => {
  if (q) employeeOptionsForm.value = await listEmployeeOptionsApi(q);
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(async () => {
  loading.value = true;
  await Promise.all([
    getIncomeTypeOptionsApi().then((res) => (incomeTypeOptions.value = res)),
    getDeductionTypeOptionsApi().then((res) => (deductionTypeOptions.value = res)),
    getItemsByTypeApi('currency_type').then((res) => (currencyOptions.value = res)),
    getConfigValueApi('SETTLEMENT_CURRENCY').then((res) => (baseCurrency.value = res || 'CNY')),
  ]);
  await getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   ===================================================================== */

.currency-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 2px;
}

.custom-tabs {
  background: var(--el-bg-color);
  padding: 0 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}

.calc-hint-box {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 10px;
  font-weight: 600;

  &.income-hint {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &.deduction-hint {
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}
</style>

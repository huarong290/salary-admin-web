<!--src/views/salary/variablepay/VariablePayPage.vue-->
<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="额外收入明细 (绩效/提成等)" name="income" />
      <el-tab-pane label="临时扣款明细 (考勤/罚款等)" name="deduction" />
    </el-tabs>

    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择发薪月份"
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
            reserve-keyword
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
              <span style="float: right; color: #8492a6; font-size: 13px">{{
                item.employeeCode
              }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="activeTab === 'income' ? '收入类型' : '扣款类型'" prop="typeId">
          <el-select
            v-model="queryParams.typeId"
            placeholder="全部分类"
            clearable
            style="width: 150px"
            @change="handleQuery"
          >
            <template v-if="activeTab === 'income'">
              <el-option
                v-for="dict in incomeTypeOptions"
                :key="dict.id"
                :label="dict.typeName"
                :value="dict.id"
              />
            </template>
            <template v-else>
              <el-option
                v-for="dict in deductionTypeOptions"
                :key="dict.id"
                :label="dict.typeName"
                :value="dict.id"
              />
            </template>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button
          v-hasPerm="['salary:variablepay:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
        >
          {{ activeTab === 'income' ? '录入收入' : '录入扣款' }}
        </el-button>
        <el-button
          v-hasPerm="['salary:variablepay:import']"
          type="success"
          icon="Upload"
          plain
          @click="handleImport"
        >
          Excel 批量导入
        </el-button>
        <el-button
          v-hasPerm="['salary:variablepay:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" fixed="left" />
        <el-table-column
          label="员工姓名"
          align="center"
          prop="employeeName"
          width="120"
          fixed="left"
        >
          <template #default="{ row }">
            <span style="font-weight: bold">{{ row.employeeName || '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font">{{
              row.settlementMonth || '--'
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务分类" align="center" prop="categoryName" width="120">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.categoryName || '未分类' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="activeTab === 'income' ? '收入项目' : '扣款项目'"
          align="center"
          width="150"
        >
          <template #default="{ row }">
            <el-tag :type="activeTab === 'income' ? 'success' : 'danger'" effect="light">
              {{ activeTab === 'income' ? row.incomeTypeName : row.deductionTypeName }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="金额明细 (本币核算)" align="right" width="180">
          <template #default="{ row }">
            <div :class="activeTab === 'income' ? 'text-success' : 'text-danger'">
              <div class="amount-font" style="font-size: 15px">
                {{ activeTab === 'income' ? '+' : '-' }}{{ row.amount }} CNY
              </div>
              <div v-if="row.currency && row.currency !== 'CNY'" class="currency-hint">
                (原币: {{ row.originalAmount }} {{ row.currency }})
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="备注说明" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="录入时间" align="center" width="160">
          <template #default="scope"
            ><span class="amount-font">{{ scope.row.createTime }}</span></template
          >
        </el-table-column>

        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:variablepay:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleEdit(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:variablepay:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
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
          <el-button link @click="toggleFullscreen">
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
            reserve-keyword
            placeholder="输入姓名搜索并选择员工"
            :remote-method="remoteSearchEmployeesForm"
            :loading="searchLoadingForm"
            style="width: 100%"
            :disabled="!!form.id"
            @change="handleEmployeeChange"
          >
            <el-option
              v-for="item in employeeOptionsForm"
              :key="item.id"
              :label="item.employeeName"
              :value="item.id"
            >
              <span style="float: left">{{ item.employeeName }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{
                item.employeeCode
              }}</span>
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
                <span
                  style="font-weight: bold; color: var(--el-text-color-primary); font-size: 14px"
                  >{{ item.settlementMonth }}</span
                >
                <span style="color: var(--el-text-color-placeholder); font-size: 13px">{{
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
            placeholder="请选择业务类型"
            style="width: 100%"
          >
            <template v-if="activeTab === 'income'">
              <el-option
                v-for="dict in incomeTypeOptions"
                :key="dict.id"
                :label="dict.typeName"
                :value="dict.id"
              />
            </template>
            <template v-else>
              <el-option
                v-for="dict in deductionTypeOptions"
                :key="dict.id"
                :label="dict.typeName"
                :value="dict.id"
              />
            </template>
          </el-select>
        </el-form-item>

        <div class="section-title margin-top-20">多币种金额核算</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="变动币种" prop="currency">
              <el-select v-model="form.currency" style="width: 100%" @change="handleCurrencyChange">
                <el-option label="人民币 (CNY)" value="CNY" />
                <el-option label="菲律宾比索 (PHP)" value="PHP" />
                <el-option label="泰达币 (USDT)" value="USDT" />
                <el-option label="美元 (USD)" value="USD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前汇率" prop="exchangeRate">
              <el-input-number
                v-model="form.exchangeRate"
                :min="0"
                :precision="4"
                :step="0.01"
                style="width: 100%"
                :disabled="form.currency === 'CNY'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="原币金额" prop="originalAmount">
          <el-input-number
            v-model="form.originalAmount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="请输入原币金额"
          />
          <div class="calc-hint-box">
            <el-icon style="vertical-align: middle; margin-right: 4px"><Money /></el-icon>
            折合本币核算金额：<span class="amount-font" style="font-size: 14px">{{
              ((form.originalAmount || 0) * (form.exchangeRate || 1)).toFixed(2)
            }}</span>
            CNY
          </div>
        </el-form-item>

        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="如：3月份销售销冠奖励 / 3月15日迟到半小时"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm"
          >确 定 保 存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 变动薪资明细管理页 (双轨制：处理临时的额外收入与惩罚扣款)
 * 设计特性: 支持多币种动态折算，级联锁定员工周期
 * ====================================================================
 */

// 1. Vue 与核心依赖
import { ref, reactive, onMounted, nextTick } from 'vue';

// 2. Element Plus 与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, Money } from '@element-plus/icons-vue';

// 3. API 与类型定义
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

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
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
const employeeOptions = ref<any[]>([]);
const incomeTypeOptions = ref<any[]>([]);
const deductionTypeOptions = ref<any[]>([]);

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
});

// [表单模型]
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<FormInstance>();
const form = ref<any>({});

// 强校验规则
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请先选择员工', trigger: 'change' }],
  periodId: [{ required: true, message: '请选择薪资周期', trigger: 'change' }],
  incomeTypeId: [{ required: true, message: '请选择收入类型', trigger: 'change' }],
  deductionTypeId: [{ required: true, message: '请选择扣款类型', trigger: 'change' }],
  originalAmount: [{ required: true, message: '原币金额不能为空', trigger: 'blur' }],
  exchangeRate: [{ required: true, message: '汇率不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

// 切换收入/扣款 Tab 时，必须重置分页和类型条件
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
  handleQuery();
};

// 重置复杂的表单状态
const resetForm = () => {
  form.value = {
    id: undefined,
    employeeId: undefined,
    periodId: undefined,
    originalAmount: 0,
    exchangeRate: 1.0,
    currency: 'CNY',
    remark: '',
  };
  if (activeTab.value === 'income') form.value.incomeTypeId = undefined;
  else form.value.deductionTypeId = undefined;

  employeeOptionsForm.value = [];
  formPeriodOptions.value = [];
};

const cancel = () => {
  dialog.visible = false;
  resetForm();
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 初始化全局字典 */
const loadDicts = async () => {
  incomeTypeOptions.value = (await getIncomeTypeOptionsApi()) || [];
  deductionTypeOptions.value = (await getDeductionTypeOptionsApi()) || [];
};

/** 查询列表：底层动态路由 */
const getList = async () => {
  loading.value = true;
  try {
    const reqData = { ...queryParams };
    // 动态组装真正的查询键值
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

/** 远程搜索搜索栏员工 */
const remoteSearchEmployees = async (query: string) => {
  if (!query) return;
  searchLoading.value = true;
  try {
    employeeOptions.value = await listEmployeeOptionsApi(query);
  } finally {
    searchLoading.value = false;
  }
};

/** 远程搜索弹窗内员工 */
const remoteSearchEmployeesForm = async (query: string) => {
  if (!query) {
    employeeOptionsForm.value = [];
    return;
  }
  searchLoadingForm.value = true;
  try {
    employeeOptionsForm.value = await listEmployeeOptionsApi(query);
  } finally {
    searchLoadingForm.value = false;
  }
};

/** 🌟 核心防穿透逻辑：选择员工后，只展示该员工的有效周期，防止张三的钱发进李四的月份 */
const handleEmployeeChange = async (employeeId: number) => {
  form.value.periodId = undefined;
  formPeriodOptions.value = [];
  if (employeeId) {
    try {
      const res = await listPeriodOptionsByEmployeeApi(employeeId);
      formPeriodOptions.value = res || [];
    } catch (error) {
      console.error(error);
      ElMessage.error('获取该员工薪资周期失败');
    }
  }
};

/** 自动带出多币种汇率 */
const handleCurrencyChange = (val: string) => {
  const rateMap: Record<string, number> = { CNY: 1.0, PHP: 0.125, USDT: 7.25, USD: 7.23 };
  form.value.exchangeRate = rateMap[val] || 1.0;
};

const handleAdd = () => {
  resetForm();
  dialog.title = activeTab.value === 'income' ? '新增额外收入' : '新增临时扣款';
  dialog.visible = true;
  isFullscreen.value = false;
  nextTick(() => formRef.value?.clearValidate());
};

const handleEdit = async (row: any) => {
  resetForm();
  // 1. 回显对象与下拉池
  employeeOptionsForm.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: '' },
  ];
  await handleEmployeeChange(row.employeeId);

  // 2. 剥离并回显核心数据 (兼容老数据的单本位币)
  form.value = {
    id: row.id,
    periodId: row.periodId,
    employeeId: row.employeeId,
    currency: row.currency || 'CNY',
    originalAmount: row.originalAmount || row.amount,
    exchangeRate: row.exchangeRate || 1.0,
    amount: row.amount,
    remark: row.remark,
  };
  if (activeTab.value === 'income') form.value.incomeTypeId = row.incomeTypeId;
  else form.value.deductionTypeId = row.deductionTypeId;

  dialog.title = activeTab.value === 'income' ? '修改额外收入' : '修改临时扣款';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const isEdit = !!form.value.id;
        if (activeTab.value === 'income') {
          if (isEdit) {
            await updateIncomeDetailApi(form.value);
          } else {
            await addIncomeDetailApi(form.value);
          }
        } else {
          if (isEdit) {
            await updateDeductionDetailApi(form.value);
          } else {
            await addDeductionDetailApi(form.value);
          }
        }
        ElMessage.success(isEdit ? '修改成功' : '录入成功');
        dialog.visible = false;
        getList();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该条明细流水吗?', '高危操作警告', { type: 'warning' })
    .then(async () => {
      if (activeTab.value === 'income') {
        await deleteIncomeDetailApi(row.id);
      } else {
        await deleteDeductionDetailApi(row.id);
      }
      ElMessage.success('明细已销毁');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量删除选中的 ${selectedIds.value.length} 条记录吗?`, '高危操作警告', {
    type: 'warning',
  })
    .then(async () => {
      if (activeTab.value === 'income') {
        await batchDeleteIncomeDetailApi(selectedIds.value);
      } else {
        await batchDeleteDeductionDetailApi(selectedIds.value);
      }
      ElMessage.success('批量销毁成功');
      getList();
    })
    .catch(() => {});
};

const handleImport = () => {
  ElMessage.info('即将开放：Excel模板下载与批量导入向导');
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  loadDicts();
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  =====================================================================
*/

.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
}
.text-success {
  color: var(--el-color-success);
  font-weight: bold;
}
.text-danger {
  color: var(--el-color-danger);
  font-weight: bold;
}
.currency-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
  line-height: 1.2;
  margin-top: 4px;
}

/* 定制化顶部 Tabs (使其融入企业级系统质感) */
.custom-tabs {
  background: var(--el-bg-color);
  padding: 0 20px;
  border-radius: 4px;
  margin-bottom: 15px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.04); // 降低阴影饱和度
  border: 1px solid var(--el-border-color-light); // 适配黑暗模式

  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--el-border-color-lighter);
  }
}

/* 弹窗分块标题 */
.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 10px 0 20px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}
.margin-top-20 {
  margin-top: 20px;
}

/* 弹窗自定义头部 */
.dialog-custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 20px;
  .title {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}

/* 自动计算辅助提示框 */
.calc-hint-box {
  font-size: 13px;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  padding: 6px 12px;
  border-radius: 4px;
  margin-top: 8px;
  line-height: 1.2;
  font-weight: bold;
}

.flex-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>

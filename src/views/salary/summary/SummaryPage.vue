<!--src/views/salary/summary/SummaryPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYYMM"
            clearable
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索姓名或工号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['salary:period:add']" type="primary" icon="Plus" @click="handleAdd"
          >开启新周期</el-button
        >
        <el-button
          v-hasPerm="['salary:period:init']"
          type="warning"
          icon="MagicStick"
          @click="handleOpenBatchInit"
          >批量初始化</el-button
        >
        <el-button
          v-hasPerm="['salary:period:del']"
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
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column
          label="员工姓名"
          align="center"
          prop="employeeName"
          width="120"
          fixed="left"
        />
        <el-table-column label="结算月份" align="center" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font status-tag">{{
              row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在岗时长" align="center" width="100">
          <template #default="{ row }">
            <span
              class="amount-font"
              :style="{
                color: Number(row.workMonth) >= 12 ? 'var(--el-color-success)' : 'inherit',
              }"
            >
              {{ row.workMonth || 0 }} 个月
            </span>
          </template>
        </el-table-column>
        <el-table-column label="周期范围" align="center" width="220">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.startDate }} ~ {{ row.endDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="自然天数" align="right" width="90">
          <template #default="{ row }"
            ><span class="amount-font">{{ row.monthDays }}</span></template
          >
        </el-table-column>
        <el-table-column label="出勤天数" align="right" width="90">
          <template #default="{ row }">
            <span
              class="amount-font"
              :class="row.attendanceDays < row.monthDays ? 'text-danger' : ''"
              >{{ row.attendanceDays }}</span
            >
          </template>
        </el-table-column>
        <el-table-column label="满勤状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.fullAttendanceFlag === 1 ? 'success' : 'danger'"
              size="small"
              class="status-tag"
            >
              {{ row.fullAttendanceFlag === 1 ? '已满勤' : '非满勤' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{ row.createTime }}</span></template
          >
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:period:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:period:del']"
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
      width="650px"
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

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">周期基础信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                :disabled="!!form.id"
                style="width: 100%"
                placeholder="姓名搜索"
              >
                <el-option
                  v-for="item in employeeOptions"
                  :key="item.id"
                  :label="item.employeeName"
                  :value="item.id"
                >
                  <div class="flex-justify-between">
                    <span>{{ item.employeeName }}</span>
                    <span style="color: #999; font-size: 12px">{{ item.employeeCode }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算月份" prop="settlementMonth">
              <el-date-picker
                v-model="form.settlementMonth"
                type="month"
                value-format="YYYYMM"
                style="width: 100%"
                @change="handleMonthChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="在岗月份" prop="workMonth">
              <el-input-number
                v-model="form.workMonth"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleDateRangeChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">考勤与核算指标</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="自然天数" prop="monthDays">
              <el-input-number
                v-model="form.monthDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出勤天数" prop="attendanceDays">
              <el-input-number
                v-model="form.attendanceDays"
                :min="0"
                :max="form.monthDays"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="满勤状态" prop="fullAttendanceFlag">
          <el-radio-group v-model="form.fullAttendanceFlag">
            <el-radio :label="1">确认满勤 (发放全勤奖)</el-radio>
            <el-radio :label="0">非满勤 (扣减全勤奖)</el-radio>
          </el-radio-group>
          <div class="form-tips">
            <el-icon><WarningFilled /></el-icon> 系统将根据此开关决定是否触发档案中的
            FullAttendanceBonus 项。
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="batchInitDialog.visible" width="600px" append-to-body draggable>
      <template #header>
        <div class="dialog-custom-header"><span class="title">批量生成薪资周期</span></div>
      </template>
      <div class="form-tips" style="margin-bottom: 20px">
        系统将针对当前在职员工名单进行建账。初始出勤天数默认为当月全满。
      </div>

      <el-form
        ref="batchInitFormRef"
        :model="batchInitForm"
        :rules="batchInitRules"
        label-width="90px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结算月份" prop="settlementMonth">
              <el-date-picker
                v-model="batchInitForm.settlementMonth"
                type="month"
                value-format="YYYYMM"
                style="width: 100%"
                @change="handleBatchMonthChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期范围">
              <el-date-picker
                v-model="batchDateRange"
                type="daterange"
                range-separator="-"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleBatchDateRangeChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="自然天数" prop="monthDays">
              <el-input-number
                v-model="batchInitForm.monthDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认出勤" prop="attendanceDays">
              <el-input-number
                v-model="batchInitForm.attendanceDays"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="满勤状态" prop="fullAttendanceFlag">
          <el-radio-group v-model="batchInitForm.fullAttendanceFlag">
            <el-radio :label="1">默认全员满勤</el-radio>
            <el-radio :label="0">默认非满勤</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="batchInitForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填，如：3月定期建账"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchInitDialog.visible = false">取 消</el-button>
          <el-button
            type="warning"
            icon="MagicStick"
            :loading="batchInitLoading"
            @click="submitBatchInit"
            >一键生成数据</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资周期管理 (维护员工月度出勤、在岗时长及全勤资格)
 * 业务逻辑:
 * 1. 智能推算：选择月份自动填充月度起止日期与自然天数。
 * 2. 批量建账：快速为全员初始化周期，避免手动录入。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted } from 'vue';
import dayjs from 'dayjs';

// [2] 第三方 UI 组件库与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { WarningFilled, FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  addPeriodApi,
  batchDeletePeriodApi,
  batchInitPeriodApi,
  deletePeriodApi,
  editPeriodApi,
  getPeriodPageApi,
} from '@/api/salary/period/period.ts';
import { listEmployeeOptionsApi } from '@/api/salary/employee';

// [4] TS 强类型定义约束
import type {
  PeriodBatchInitReqDTO,
  PeriodQueryReqDTO,
  PeriodVO,
} from '@/types/salary/period/period.ts';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);
const searchLoading = ref(false);
const batchInitLoading = ref(false);

// [表格与分页数据]
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<PeriodVO[]>([]);

// [查询与表单状态]
const queryParams = reactive<PeriodQueryReqDTO>({ pageNum: 1, pageSize: 10 });
const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const dateRange = ref<[string, string] | []>([]);
const employeeOptions = ref<EmployeeOptionVO[]>([]);

// [批量建账表单状态]
const batchInitDialog = reactive({ visible: false });
const batchInitFormRef = ref<FormInstance>();
const batchDateRange = ref<[string, string] | []>([]);
const batchInitForm = reactive<PeriodBatchInitReqDTO>({
  settlementMonth: '',
  startDate: '',
  endDate: '',
  monthDays: 0,
  attendanceDays: 0,
  fullAttendanceFlag: 1,
  remark: '',
});

// [表单校验规则]
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  settlementMonth: [{ required: true, message: '请选择结算月份', trigger: 'change' }],
});

const batchInitRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '必须选择结算月份', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换全屏 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

/** 表格勾选 */
const handleSelectionChange = (selection: PeriodVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 搜索与重置 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
  dateRange.value = [];
};

/** 🌟 核心UI染色：将非满勤行标记为危险色 */
// const tableRowClassName = ({ row }: { row: PeriodVO }) =>
//   row.fullAttendanceFlag === 0 ? 'row-theme-danger' : '';

// --- 联动计算工具方法 ---
const calcDaysAndSync = (range: [string, string] | null, target: any) => {
  if (range && range.length === 2) {
    target.startDate = range[0];
    target.endDate = range[1];
    const days = dayjs(range[1]).diff(dayjs(range[0]), 'day') + 1;
    target.monthDays = days > 0 ? days : 0;
    target.attendanceDays = target.monthDays;
  } else {
    target.startDate = target.endDate = undefined;
    target.monthDays = target.attendanceDays = 0;
  }
};

const handleMonthChange = (val: string) => {
  if (!val) return calcDaysAndSync(null, form.value);
  const m = dayjs(val.substring(0, 4) + '-' + val.substring(4, 6));
  const range: [string, string] = [
    m.startOf('month').format('YYYY-MM-DD'),
    m.endOf('month').format('YYYY-MM-DD'),
  ];
  dateRange.value = range;
  calcDaysAndSync(range, form.value);
};

const handleDateRangeChange = (val: [string, string] | null) => calcDaysAndSync(val, form.value);

// --- 批量建账交互 ---
const handleBatchMonthChange = (val: string) => {
  if (!val) return calcDaysAndSync(null, batchInitForm);
  const m = dayjs(val.substring(0, 4) + '-' + val.substring(4, 6));
  const range: [string, string] = [
    m.startOf('month').format('YYYY-MM-DD'),
    m.endOf('month').format('YYYY-MM-DD'),
  ];
  batchDateRange.value = range;
  calcDaysAndSync(range, batchInitForm);
};

const handleBatchDateRangeChange = (val: [string, string] | null) =>
  calcDaysAndSync(val, batchInitForm);

const handleOpenBatchInit = () => {
  batchInitForm.remark = '';
  if (queryParams.settlementMonth) {
    batchInitForm.settlementMonth = queryParams.settlementMonth;
    handleBatchMonthChange(queryParams.settlementMonth);
  }
  batchInitDialog.visible = true;
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPeriodPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const remoteSearchEmployees = async (query: string) => {
  if (!query) {
    employeeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  try {
    employeeOptions.value = await listEmployeeOptionsApi(query);
  } finally {
    searchLoading.value = false;
  }
};

const handleAdd = () => {
  form.value = {
    settlementMonth: '',
    workMonth: 0,
    monthDays: 0,
    attendanceDays: 0,
    fullAttendanceFlag: 0,
  };
  dateRange.value = [];
  employeeOptions.value = [];
  dialog.title = '新增薪资周期项';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: PeriodVO) => {
  form.value = { ...row };
  employeeOptions.value = [
    {
      id: row.employeeId,
      employeeName: row.employeeName,
      employeeCode: row.employeeCode || '',
    } as EmployeeOptionVO,
  ];
  dateRange.value = row.startDate && row.endDate ? [row.startDate, row.endDate] : [];
  dialog.title = '修改薪资周期指标';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const p = { ...form.value, workMonth: String(form.value.workMonth) }; // DTO 对齐
      if (p.id) {
        await editPeriodApi(p);
      } else {
        await addPeriodApi(p);
      }
      ElMessage.success('周期数据已更新');
      dialog.visible = false;
      await getList();
    }
  });
};

const submitBatchInit = async () => {
  if (!batchInitFormRef.value) return;
  await batchInitFormRef.value.validate(async (valid) => {
    if (valid) {
      batchInitLoading.value = true;
      try {
        const res = await batchInitPeriodApi(batchInitForm);
        const { totalCount, successCount, skipCount, settlementMonth } = res;
        batchInitDialog.visible = false;
        await ElMessageBox.alert(
          `结算月份：<b>${settlementMonth}</b><br/>处理：${totalCount}人 | 成功：${successCount} | 跳过：${skipCount}`,
          '建账执行结果',
          {
            dangerouslyUseHTMLString: true,
            type: 'success',
          }
        );
        queryParams.settlementMonth = batchInitForm.settlementMonth;
        handleQuery();
      } finally {
        batchInitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row: PeriodVO) => {
  ElMessageBox.confirm(`确认删除员工 "${row.employeeName}" 的该周期记录吗?`, '高危操作', {
    type: 'warning',
  })
    .then(async () => {
      await deletePeriodApi(row.id);
      ElMessage.success('已移除');
      await getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认销毁选中的 ${selectedIds.value.length} 条周期数据?`, '高危操作', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeletePeriodApi(selectedIds.value);
      ElMessage.success('批量清理完成');
      await getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处仅保留周期页特有的表单提示风格。
   ===================================================================== */

.form-tips {
  font-size: 12px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.5;
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  .el-icon {
    margin-top: 2px;
  }
}
</style>

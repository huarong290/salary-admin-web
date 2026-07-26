<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="员工姓名" prop="employeeId">
          <EmployeeSelect
            v-model="queryParams.employeeId"
            style="width: 240px"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYYMM"
            clearable
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
        <el-table-column label="编号(ID)" align="center" prop="id" width="90">
          <template #default="{ row }">
            <span class="text-secondary">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="员工姓名" align="center" prop="employeeName" width="120" />
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
        <el-table-column label="结算周期范围" align="center" width="240">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.startDate }} ~ {{ row.endDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="自然天数" align="right" prop="monthDays" width="90">
          <template #default="scope"
            ><span class="amount-font">{{ scope.row.monthDays }}</span></template
          >
        </el-table-column>
        <el-table-column label="制度月休" align="right" prop="standardRestDays" width="90">
          <template #default="scope">
            <span class="amount-font text-success">{{ scope.row.standardRestDays || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出勤天数" align="right" prop="attendanceDays" width="90">
          <template #default="scope">
            <span
              class="amount-font"
              :class="
                scope.row.attendanceDays < scope.row.monthDays - (scope.row.standardRestDays || 0)
                  ? 'text-danger'
                  : ''
              "
            >
              {{ scope.row.attendanceDays }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="现场办公" align="right" prop="officeDays" width="90">
          <template #default="scope">
            <span class="amount-font text-primary">{{ scope.row.officeDays || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="居家办公" align="right" prop="wfhDays" width="90">
          <template #default="scope">
            <span class="amount-font text-warning">{{ scope.row.wfhDays || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="带薪假" align="right" prop="paidLeaveDays" width="90">
          <template #default="scope">
            <span class="amount-font" :class="scope.row.paidLeaveDays > 0 ? 'text-success' : ''">
              {{ scope.row.paidLeaveDays || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="非带薪假" align="right" prop="unpaidLeaveDays" width="90">
          <template #default="scope">
            <span class="amount-font" :class="scope.row.unpaidLeaveDays > 0 ? 'text-warning' : ''">
              {{ scope.row.unpaidLeaveDays || 0 }}
            </span>
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
              <EmployeeSelect
                v-model="form.employeeId"
                :disabled="!!form.id"
                :default-options="echoEmployeeOptions"
              />
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
          <el-col :span="24">
            <el-form-item label="周期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleDateRangeChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">考勤与核算指标</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="在岗月份" prop="workMonth">
              <el-input-number
                v-model="form.workMonth"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="自然天数" prop="monthDays">
              <el-input-number
                v-model="form.monthDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制度月休" prop="standardRestDays">
              <el-input-number
                v-model="form.standardRestDays"
                :min="0"
                :max="form.monthDays"
                :precision="1"
                :step="1"
                controls-position="right"
                style="width: 100%"
                @change="handleRestDaysChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="现场办公" prop="officeDays">
              <el-input-number
                v-model="form.officeDays"
                :min="0"
                :max="form.monthDays"
                :precision="1"
                :step="0.5"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="居家办公" prop="wfhDays">
              <el-input-number
                v-model="form.wfhDays"
                :min="0"
                :max="form.monthDays"
                :precision="1"
                :step="0.5"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总出勤" prop="attendanceDays">
              <el-input-number
                v-model="form.attendanceDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="带薪假" prop="paidLeaveDays">
              <el-input-number
                v-model="form.paidLeaveDays"
                :min="0"
                :max="form.monthDays"
                :precision="1"
                :step="0.5"
                controls-position="right"
                style="width: 100%"
                placeholder="如: 年假"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="非带薪假" prop="unpaidLeaveDays">
              <el-input-number
                v-model="form.unpaidLeaveDays"
                :min="0"
                :max="form.monthDays"
                :precision="1"
                :step="0.5"
                controls-position="right"
                style="width: 100%"
                placeholder="如: 事假"
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
            <el-icon><WarningFilled /></el-icon> 系统将根据此状态决定是否触发档案中的全勤奖项。
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
        <div class="dialog-custom-header"><span class="title">批量开启薪资周期</span></div>
      </template>
      <div class="form-tips" style="margin-bottom: 20px">
        系统将针对当前在职员工名单进行建账。初始出勤天数默认为当月全满（自动扣减默认月休）。
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
            <el-form-item label="自然天数" prop="monthDays">
              <el-input-number
                v-model="batchInitForm.monthDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="周期范围">
              <el-date-picker
                v-model="batchDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleBatchDateRangeChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="默认现场" prop="officeDays">
              <el-input-number
                v-model="batchInitForm.officeDays"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认居家" prop="wfhDays">
              <el-input-number
                v-model="batchInitForm.wfhDays"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总出勤" prop="attendanceDays">
              <el-input-number
                v-model="batchInitForm.attendanceDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认月休" prop="standardRestDays">
              <el-input-number
                v-model="batchInitForm.standardRestDays"
                :min="0"
                :max="batchInitForm.monthDays"
                :precision="1"
                :step="1"
                controls-position="right"
                style="width: 100%"
                @change="handleBatchRestDaysChange"
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
        <el-form-item label="任务备注" prop="remark">
          <el-input
            v-model="batchInitForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填，用于任务溯源"
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
import { ref, reactive, onMounted, watch } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { WarningFilled, FullScreen, Minus } from '@element-plus/icons-vue';
import { PeriodBatchInitReqDTO, PeriodQueryReqDTO, PeriodVO } from '@/types/salary/period/period';
import { EmployeeOptionVO } from '@/types/salary/employee/employee';
import dayjs from 'dayjs';
import {
  addPeriodApi,
  batchDeletePeriodApi,
  batchInitPeriodApi,
  deletePeriodApi,
  editPeriodApi,
  getPeriodPageApi,
} from '@/api/salary/period/period';

/** --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
const loading = ref(false);
const isFullscreen = ref(false);
const batchInitLoading = ref(false);

const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<PeriodVO[]>([]);

const queryParams = reactive<PeriodQueryReqDTO>({ pageNum: 1, pageSize: 10 });
const queryFormRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const dateRange = ref<[string, string] | []>([]);
const echoEmployeeOptions = ref<EmployeeOptionVO[]>([]);

const batchInitDialog = reactive({ visible: false });
const batchInitFormRef = ref<FormInstance>();
const batchDateRange = ref<[string, string] | []>([]);

// 🌟 扩展 DTO 确保 TS 不对前端扩展属性 standardRestDays 报错
const batchInitForm = reactive<PeriodBatchInitReqDTO & { standardRestDays: number }>({
  settlementMonth: '',
  startDate: '',
  endDate: '',
  monthDays: 0,
  standardRestDays: 4.0, // 默认提供行业最通用的月休 4 天
  attendanceDays: 0,
  unpaidLeaveDays: 0,
  paidLeaveDays: 0,
  fullAttendanceFlag: 1,
  remark: '',
});

const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  settlementMonth: [{ required: true, message: '结算月份不能为空', trigger: 'change' }],
  workMonth: [{ required: true, message: '在岗月份不能为空', trigger: 'blur' }],
  standardRestDays: [{ required: true, message: '制度月休不能为空', trigger: 'blur' }],
});

const batchInitRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '必须选择结算月份', trigger: 'change' }],
});

/** --------------------------------------------------------------------
 * 🖱️ 三、UI 交互与智能推算引擎
 * --------------------------------------------------------------------
 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleSelectionChange = (selection: PeriodVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

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

/** 智能联动计算：根据选择的日期区间自动推算自然天数与全勤应出勤天数 */
const calcDaysByRange = (val: [string, string] | null, target: any) => {
  if (val && val.length === 2) {
    target.startDate = val[0];
    target.endDate = val[1];
    const days = dayjs(val[1]).diff(dayjs(val[0]), 'day') + 1;
    target.monthDays = days > 0 ? days : 0;

    // 智能扣减核心：全勤出勤天数 = 月自然天数 - 制度月休天数
    const rest = Number(target.standardRestDays) || 0;
    target.officeDays = target.monthDays > rest ? target.monthDays - rest : 0;
    target.wfhDays = 0;
  } else {
    target.startDate = target.endDate = undefined;
    target.monthDays = target.attendanceDays = 0;
  }
};

const handleMonthChange = (val: string) => {
  if (!val) return calcDaysByRange(null, form.value);
  const m = dayjs(val.substring(0, 4) + '-' + val.substring(4, 6));
  const range: [string, string] = [
    m.startOf('month').format('YYYY-MM-DD'),
    m.endOf('month').format('YYYY-MM-DD'),
  ];
  dateRange.value = range;
  calcDaysByRange(range, form.value);
};

const handleDateRangeChange = (val: [string, string] | null) => calcDaysByRange(val, form.value);

// 当手动调整月休天数时，自动重新编排现场应出勤指标
const handleRestDaysChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    calcDaysByRange(dateRange.value as [string, string], form.value);
  }
};

const handleBatchRestDaysChange = () => {
  if (batchDateRange.value && batchDateRange.value.length === 2) {
    calcDaysByRange(batchDateRange.value as [string, string], batchInitForm);
  }
};

const handleBatchMonthChange = (val: string) => {
  if (!val) return calcDaysByRange(null, batchInitForm);
  const m = dayjs(val.substring(0, 4) + '-' + val.substring(4, 6));
  const range: [string, string] = [
    m.startOf('month').format('YYYY-MM-DD'),
    m.endOf('month').format('YYYY-MM-DD'),
  ];
  batchDateRange.value = range;
  calcDaysByRange(range, batchInitForm);
};

const handleBatchDateRangeChange = (val: [string, string] | null) =>
  calcDaysByRange(val, batchInitForm);

const handleOpenBatchInit = () => {
  batchInitForm.remark = '';
  batchInitForm.standardRestDays = 4.0; // 初始化默认值
  if (queryParams.settlementMonth) {
    batchInitForm.settlementMonth = queryParams.settlementMonth;
    handleBatchMonthChange(queryParams.settlementMonth);
  }
  batchInitDialog.visible = true;
};

/** --------------------------------------------------------------------
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

const handleAdd = () => {
  form.value = {
    employeeId: undefined,
    settlementMonth: '',
    workMonth: 0,
    monthDays: 0,
    standardRestDays: 4.0,
    attendanceDays: 0,
    unpaidLeaveDays: 0,
    paidLeaveDays: 0,
    fullAttendanceFlag: 0,
  };
  dateRange.value = [];
  echoEmployeeOptions.value = [];
  dialog.title = '新增新薪资周期';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: PeriodVO) => {
  form.value = { ...row };
  echoEmployeeOptions.value = [
    {
      id: row.employeeId,
      employeeName: row.employeeName,
      employeeCode: row.employeeCode || '',
    } as EmployeeOptionVO,
  ];
  dateRange.value = row.startDate && row.endDate ? [row.startDate, row.endDate] : [];
  dialog.title = '编辑薪资结算周期';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const payload: any = {
        id: form.value.id,
        employeeId: form.value.employeeId,
        settlementMonth: form.value.settlementMonth,
        workMonth: form.value.workMonth !== undefined ? Number(form.value.workMonth) : 0,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        monthDays: form.value.monthDays,
        // 🌟 修复：安全注入单人记录的 standardRestDays
        standardRestDays:
          form.value.standardRestDays !== undefined ? Number(form.value.standardRestDays) : 0,
        attendanceDays: form.value.attendanceDays,
        officeDays: form.value.officeDays !== undefined ? Number(form.value.officeDays) : 0,
        wfhDays: form.value.wfhDays !== undefined ? Number(form.value.wfhDays) : 0,
        unpaidLeaveDays:
          form.value.unpaidLeaveDays !== undefined ? Number(form.value.unpaidLeaveDays) : 0,
        paidLeaveDays:
          form.value.paidLeaveDays !== undefined ? Number(form.value.paidLeaveDays) : 0,
        fullAttendanceFlag: form.value.fullAttendanceFlag,
      };
      if (payload.id) {
        await editPeriodApi(payload);
      } else {
        await addPeriodApi(payload);
      }
      ElMessage.success(payload.id ? '修改成功' : '新增成功');
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
        const res: any = await batchInitPeriodApi(batchInitForm);
        const { totalCount, successCount, skipCount, settlementMonth } = res.data || res;
        batchInitDialog.visible = false;
        ElMessageBox.alert(
          `<div style="line-height: 1.8;">
            结算月份：<b>${settlementMonth}</b><br/>
            总处理人数：${totalCount}<br/>
            成功生成：<span class="text-success">${successCount}</span><br/>
            跳过重复：<span class="text-warning">${skipCount}</span></div>`,
          '建账任务执行完毕',
          { dangerouslyUseHTMLString: true, type: 'success', confirmButtonText: '我知道了' }
        );
        queryParams.settlementMonth = batchInitForm.settlementMonth;
        handleQuery();
      } catch (error) {
        console.error('批量建账失败:', error);
      } finally {
        batchInitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row: PeriodVO) => {
  ElMessageBox.confirm(
    `确认移除员工 "${row.employeeName}" 的该月核算周期吗?若已有核算数据将产生关联影响。`,
    '危险操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await deletePeriodApi(row.id);
      ElMessage.success('已移除');
      await getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认销毁选中的 ${selectedIds.value.length} 条周期数据?`, '危险操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeletePeriodApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      await getList();
    })
    .catch(() => {});
};

/** --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期与智能监听器
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
});

watch([() => form.value.officeDays, () => form.value.wfhDays], ([office, wfh]) => {
  if (office !== undefined || wfh !== undefined) {
    form.value.attendanceDays = (Number(office) || 0) + (Number(wfh) || 0);
  }
});

watch([() => batchInitForm.officeDays, () => batchInitForm.wfhDays], ([office, wfh]) => {
  batchInitForm.attendanceDays = (Number(office) || 0) + (Number(wfh) || 0);
});
</script>

<style scoped lang="scss">
.form-tips {
  font-size: 12px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  .el-icon {
    margin-top: 2px;
  }
}
</style>

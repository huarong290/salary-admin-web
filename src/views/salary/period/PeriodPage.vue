<!--src/views/salary/period/PeriodPage.vue-->

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
        <el-table-column label="出勤天数" align="right" prop="attendanceDays" width="90">
          <template #default="scope">
            <span
              class="amount-font"
              :class="scope.row.attendanceDays < scope.row.monthDays ? 'text-danger' : ''"
            >
              {{ scope.row.attendanceDays }}
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
            <el-form-item label="自然天数" prop="monthDays">
              <el-input-number
                v-model="form.monthDays"
                disabled
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资周期管理 (维护员工月度结算上下文、出勤指标及全勤资格)
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
} from '@/api/salary/period/period';

// [4] TS 强类型定义约束
import type {
  PeriodBatchInitReqDTO,
  PeriodQueryReqDTO,
  PeriodVO,
} from '@/types/salary/period/period.ts';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee.ts';
import EmployeeSelect from '@/views/salary/employee/components/EmployeeSelect.vue';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);
const batchInitLoading = ref(false);

// [表格与分页状态]
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
// 只需要维护一个回显数组
const echoEmployeeOptions = ref<EmployeeOptionVO[]>([]);
// [批量建账状态]
const batchInitDialog = reactive({ visible: false });
const batchInitFormRef = ref<FormInstance>();
// 批量弹窗专属的日期范围
const batchDateRange = ref<[string, string] | []>([]);
const batchInitForm = reactive<PeriodBatchInitReqDTO>({
  settlementMonth: '',
  startDate: '',
  endDate: '',
  monthDays: 0,
  attendanceDays: 0,
  unpaidLeaveDays: 0,
  fullAttendanceFlag: 1, // 批量建账通常建议默认全员满勤，特殊情况HR再去单条修改
  remark: '',
});

// [表单校验规则]
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  settlementMonth: [{ required: true, message: '结算月份不能为空', trigger: 'change' }],
  workMonth: [{ required: true, message: '在岗月份不能为空', trigger: 'blur' }],
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

/** 表格勾选联动 */
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
// --- 智能推算引擎辅助 ---
/**  智能联动计算：根据选择的日期区间自动推算自然天数与出勤天数 */
const calcDaysByRange = (val: [string, string] | null, target: any) => {
  if (val && val.length === 2) {
    target.startDate = val[0];
    target.endDate = val[1];
    // 顺便连自然天数、出勤天数都自动算好了！ 包含首尾天数所以 + 1
    const days = dayjs(val[1]).diff(dayjs(val[0]), 'day') + 1;
    target.monthDays = days > 0 ? days : 0;
    // 默认出勤天数拉满，HR 视情况往下扣减
    target.attendanceDays = target.monthDays;
  } else {
    target.startDate = target.endDate = undefined;
    target.monthDays = target.attendanceDays = 0;
  }
};
/** 智能联动计算：选择月份后，自动推断当月的起止日期区间 */
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

// --- 批量建账联动 ---

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

/** 核心：获取列表数据 */
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

/** 业务：新增周期初始化 贯彻“零信任”原则，默认设定 fullAttendanceFlag = 0 */
const handleAdd = () => {
  form.value = {
    employeeId: undefined,
    settlementMonth: '',
    workMonth: 0,
    monthDays: 0,
    attendanceDays: 0,
    unpaidLeaveDays: 0,
    fullAttendanceFlag: 0,
  };
  dateRange.value = [];
  echoEmployeeOptions.value = [];
  dialog.title = '新增新薪资周期';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 业务：发起修改数据回显 */
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

/** 核心：提交表单（抹平 DTO 差异） */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 抹平前后端差异：确保 workMonth 以字符串形式提交防后端反序列化报错
      const payload: any = {
        id: form.value.id,
        employeeId: form.value.employeeId,
        settlementMonth: form.value.settlementMonth,

        workMonth: form.value.workMonth !== undefined ? Number(form.value.workMonth) : 0,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        monthDays: form.value.monthDays,
        attendanceDays: form.value.attendanceDays,
        unpaidLeaveDays:
          form.value.unpaidLeaveDays !== undefined ? Number(form.value.unpaidLeaveDays) : 0,
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

/** 核心：执行批量建账任务 */
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
        // 自动将查询条件切换到刚初始化的月份，方便 HR 直接查看结果
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
/** 物理/逻辑删除单条 */
const handleDelete = (row: PeriodVO) => {
  ElMessageBox.confirm(
    `确认移除员工 "${row.employeeName}" 的该月核算周期吗?若已有核算数据将产生关联影响。`,
    '危险操作提示',
    {
      type: 'warning',
    }
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
   ===================================================================== */

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

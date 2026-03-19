<!--src/views/salary/period/PeriodPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份 (如: 202603)"
            value-format="YYYYMM"
            clearable
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索员工姓名或工号"
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

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['salary:period:add']" type="primary" icon="Plus" @click="handleAdd"
          >开启新周期</el-button
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
        :row-class-name="tableRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column label="员工姓名" align="center" prop="employeeName" width="120" />

        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="120">
          <template #default="scope">
            <el-tag type="primary" effect="plain" class="amount-font">{{
              scope.row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="在岗月份" align="center" prop="workMonth" width="120">
          <template #default="scope">
            <span
              class="amount-font"
              :style="{ color: Number(scope.row.workMonth) >= 12 ? '#67c23a' : '#909399' }"
            >
              {{ scope.row.workMonth || 0 }} 个月
            </span>
          </template>
        </el-table-column>

        <el-table-column label="开始日期" align="center" prop="startDate" width="120">
          <template #default="scope"
            ><span class="amount-font text-secondary">{{ scope.row.startDate }}</span></template
          >
        </el-table-column>
        <el-table-column label="结束日期" align="center" prop="endDate" width="120">
          <template #default="scope"
            ><span class="amount-font text-secondary">{{ scope.row.endDate }}</span></template
          >
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

        <el-table-column label="满勤状态" align="center" prop="fullAttendanceFlag" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.fullAttendanceFlag === 1 ? 'success' : 'danger'"
              effect="dark"
              size="small"
            >
              {{ scope.row.fullAttendanceFlag === 1 ? '✔ 满勤' : '✖ 非满勤' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" align="center" width="170">
          <template #default="scope"
            ><span class="amount-font">{{ scope.row.createTime }}</span></template
          >
        </el-table-column>

        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:period:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:period:del']"
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
      width="650px"
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

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">周期基础信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                reserve-keyword
                placeholder="请输入姓名检索"
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                :disabled="!!form.id"
                style="width: 100%"
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
                placeholder="如: 202603"
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
              <div class="flex-align-center">
                <el-input-number
                  v-model="form.workMonth"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  style="flex: 1"
                />
                <span style="margin-left: 8px; color: var(--el-text-color-secondary)">个月</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="周期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
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
                :min="0"
                :max="31"
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
                :max="31"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="满勤状态" prop="fullAttendanceFlag">
              <el-radio-group v-model="form.fullAttendanceFlag">
                <el-radio :label="1">✔ 确认满勤 (系统将发放全勤奖)</el-radio>
                <el-radio :label="0">✖ 非满勤 (扣除全勤奖)</el-radio>
              </el-radio-group>
              <div class="tips-box">
                <el-icon><WarningFilled /></el-icon> 远程/弹性打卡员工建议默认选择“非满勤”，由 HR
                月末核实后再开启。
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资周期管理页 (控制员工结算月份、出勤天数及满勤状态)
 * ====================================================================
 */

// 1. Vue 内置与核心依赖库
import { ref, reactive, onMounted } from 'vue';
import dayjs from 'dayjs';

// 2. 第三方 UI 组件库及图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { WarningFilled, FullScreen, Minus } from '@element-plus/icons-vue';

// 3. 业务 API 接口
import {
  addPeriodApi,
  batchDeletePeriodApi,
  deletePeriodApi,
  editPeriodApi,
  getPeriodPageApi,
} from '@/api/salary/period/period.ts';
import { listEmployeeOptionsApi } from '@/api/salary/employee';

// 4. TS 类型定义 (DTO/VO)
import type { PeriodQueryReqDTO, PeriodVO } from '@/types/salary/period/period.ts';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);
const searchLoading = ref(false);

// [表格与分页状态]
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<PeriodVO[]>([]);

// [查询条件状态]
const queryParams = reactive<PeriodQueryReqDTO>({ pageNum: 1, pageSize: 10 });
const queryFormRef = ref<FormInstance>();

// [业务表单状态]
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const formRef = ref<FormInstance>();
const dateRange = ref<[string, string] | []>([]); // 承接日期范围选择器的双向绑定
const employeeOptions = ref<EmployeeOptionVO[]>([]);

// 表单前端校验规则
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工姓名不能为空', trigger: 'change' }],
  settlementMonth: [{ required: true, message: '结算月份不能为空', trigger: 'change' }],
  workMonth: [{ required: true, message: '在岗月份不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
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

/** 🌟 核心UI控制：利用全局 CSS 变量对“非满勤”的异常数据行进行染色警示 */
const tableRowClassName = ({ row }: { row: PeriodVO }) => {
  return row.fullAttendanceFlag === 0 ? 'row-theme-danger' : '';
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 获取分页列表 */
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

/** 🌟 智能联动计算：根据选择的日期区间自动推算自然天数与出勤天数 */
const handleDateRangeChange = (val: [string, string] | null) => {
  if (val && val.length === 2) {
    form.value.startDate = val[0];
    form.value.endDate = val[1];
    // 包含首尾天数所以 + 1
    const days = dayjs(val[1]).diff(dayjs(val[0]), 'day') + 1;
    form.value.monthDays = days > 0 ? days : 0;
    // 默认出勤天数拉满，HR 视情况往下扣减
    if (form.value.monthDays > 0) form.value.attendanceDays = form.value.monthDays;
  } else {
    form.value.startDate = form.value.endDate = undefined;
    form.value.monthDays = form.value.attendanceDays = 0;
  }
};

/** 🌟 智能联动计算：选择月份后，自动推断当月的起止日期区间 */
const handleMonthChange = (val: string) => {
  if (!val) return handleDateRangeChange(null);
  const monthDate = dayjs(val.substring(0, 4) + '-' + val.substring(4, 6));
  const range: [string, string] = [
    monthDate.startOf('month').format('YYYY-MM-DD'),
    monthDate.endOf('month').format('YYYY-MM-DD'),
  ];
  dateRange.value = range;
  handleDateRangeChange(range);
};

/** 远程搜索员工字典库 */
const remoteSearchEmployees = async (query: string) => {
  if (!query) {
    employeeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  try {
    employeeOptions.value = (await listEmployeeOptionsApi(query)) as any;
  } finally {
    searchLoading.value = false;
  }
};

/** 发起新增：贯彻“零信任”原则，默认设定 fullAttendanceFlag = 0 */
const handleAdd = () => {
  form.value = {
    employeeId: undefined,
    settlementMonth: '',
    workMonth: 0,
    monthDays: 0,
    attendanceDays: 0,
    fullAttendanceFlag: 0,
  };
  dateRange.value = [];
  employeeOptions.value = [];
  dialog.title = '开启薪资周期';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 发起修改：数据回显 */
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
  dialog.title = '修改薪资周期';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 提交表单保存 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 抹平前后端差异：确保 workMonth 以字符串形式提交防后端反序列化报错
      const params: any = {
        id: form.value.id,
        employeeId: form.value.employeeId,
        settlementMonth: form.value.settlementMonth,
        workMonth: form.value.workMonth !== undefined ? String(form.value.workMonth) : '0',
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        monthDays: form.value.monthDays,
        attendanceDays: form.value.attendanceDays,
        fullAttendanceFlag: form.value.fullAttendanceFlag,
      };
      try {
        if (params.id) {
          await editPeriodApi(params);
        } else {
          await addPeriodApi(params);
        }
        ElMessage.success(params.id ? '修改成功' : '新增成功');
        dialog.visible = false;
        await getList();
      } catch (error) {
        /* 错误已在拦截器处理 */
        console.error('提交周期数据失败:', error);
      }
    }
  });
};

/** 物理/逻辑删除单条 */
const handleDelete = (row: PeriodVO) => {
  ElMessageBox.confirm(
    `确认销毁该薪资周期的记录吗? 若已有核算数据将产生关联影响。`,
    '系统高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await deletePeriodApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

/** 批量删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 条数据?`,
    '系统高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await batchDeletePeriodApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  全局动态行染色已由 src/styles/_element.scss (.row-theme-danger) 接管
  =====================================================================
*/

/* 金融级等宽数字字体 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 500;
}
.text-secondary {
  color: var(--el-text-color-secondary);
}
.text-danger {
  color: var(--el-color-danger);
  font-weight: bold;
}

/* 表单分块标题 */
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

/* 提示框美化 */
.tips-box {
  font-size: 12px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  padding: 6px 10px;
  border-radius: 4px;
  line-height: 1.4;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 常用辅助 Flex 布局 */
.flex-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.flex-align-center {
  display: flex;
  align-items: center;
}
</style>

<!--src/views/salary/period/PeriodPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
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
            placeholder="搜索员工姓名"
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
        <el-button v-hasPerm="['salary:period:add']" type="primary" icon="Plus" @click="handleAdd">
          开启新周期
        </el-button>
        <el-button
          v-hasPerm="['salary:period:del']"
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="员工姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="120">
          <template #default="scope">
            <el-tag type="success">{{ scope.row.settlementMonth }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在岗月份" align="center" prop="workMonth" width="120">
          <template #default="scope">
            <el-tag :type="Number(scope.row.workMonth) >= 12 ? 'success' : 'info'" effect="plain">
              {{ scope.row.workMonth || 0 }} 个月
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始日期" align="center" prop="startDate" width="120" />
        <el-table-column label="结束日期" align="center" prop="endDate" width="120" />
        <el-table-column label="自然天数" align="center" prop="monthDays" width="90" />
        <el-table-column label="出勤天数" align="center" prop="attendanceDays" width="90" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:period:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button
              v-hasPerm="['salary:period:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      append-to-body
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                reserve-keyword
                placeholder="请输入姓名或工号搜索"
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
        <el-row>
          <el-col :span="12">
            <el-form-item label="在岗月份" prop="workMonth">
              <el-input-number
                v-model="form.workMonth"
                :min="0"
                :precision="0"
                placeholder="在岗月份"
                controls-position="right"
                style="width: calc(100% - 30px)"
              />
              <span style="margin-left: 5px; color: #909399">个月</span>
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
        <el-row>
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';

import type { PeriodQueryReqDTO, PeriodVO } from '@/types/salary/period/period.ts';
import {
  addPeriodApi,
  batchDeletePeriodApi,
  deletePeriodApi,
  editPeriodApi,
  getPeriodPageApi,
} from '@/api/salary/period/period.ts';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee.ts';
import { listEmployeeOptionsApi } from '@/api/salary/employee';

const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dateRange = ref<[string, string] | []>([]);

const queryParams = reactive<PeriodQueryReqDTO>({ pageNum: 1, pageSize: 10 });
const dataList = ref<PeriodVO[]>([]);

const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const searchLoading = ref(false);
const employeeOptions = ref<EmployeeOptionVO[]>([]);

const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工姓名不能为空', trigger: 'change' }],
  settlementMonth: [{ required: true, message: '结算月份不能为空', trigger: 'change' }],
  workMonth: [{ required: true, message: '在岗月份不能为空', trigger: 'blur' }],
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPeriodPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: PeriodVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

// --- 核心计算逻辑 ---

const handleDateRangeChange = (val: [string, string] | null) => {
  if (val && val.length === 2) {
    const [startStr, endStr] = val;
    const start = dayjs(startStr);
    const end = dayjs(endStr);

    form.value.startDate = startStr;
    form.value.endDate = endStr;

    const days = end.diff(start, 'day') + 1;
    form.value.monthDays = days > 0 ? days : 0;

    if (form.value.monthDays > 0) {
      form.value.attendanceDays = form.value.monthDays;
    }
  } else {
    form.value.startDate = undefined;
    form.value.endDate = undefined;
    form.value.monthDays = 0;
    form.value.attendanceDays = 0;
  }
};

const handleMonthChange = (val: string) => {
  if (!val) {
    dateRange.value = [];
    handleDateRangeChange(null);
    return;
  }
  const monthStr = val.substring(0, 4) + '-' + val.substring(4, 6);
  const monthDate = dayjs(monthStr);

  const range: [string, string] = [
    monthDate.startOf('month').format('YYYY-MM-DD'),
    monthDate.endOf('month').format('YYYY-MM-DD'),
  ];

  dateRange.value = range;
  handleDateRangeChange(range);
};

// --- 弹窗与提交 ---

const handleAdd = () => {
  form.value = {
    employeeId: undefined,
    settlementMonth: '',
    workMonth: 0,
    monthDays: 0,
    attendanceDays: 0,
  };
  dateRange.value = [];
  employeeOptions.value = [];
  dialog.title = '开启薪资周期';
  dialog.visible = true;
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
  if (row.startDate && row.endDate) {
    dateRange.value = [row.startDate, row.endDate];
  } else {
    dateRange.value = [];
  }
  dialog.title = '修改薪资周期';
  dialog.visible = true;
};

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
  dateRange.value = [];
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 提取核心字段防止后端反序列化报错
      const params: any = {
        id: form.value.id,
        employeeId: form.value.employeeId,
        settlementMonth: form.value.settlementMonth,
        workMonth: form.value.workMonth !== undefined ? String(form.value.workMonth) : '0',
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        monthDays: form.value.monthDays,
        attendanceDays: form.value.attendanceDays,
      };

      try {
        if (params.id) {
          await editPeriodApi(params);
          ElMessage.success('修改成功');
        } else {
          await addPeriodApi(params);
          ElMessage.success('新增成功');
        }
        dialog.visible = false;
        await getList();
      } catch (error) {
        console.error('提交失败：', error);
      }
    }
  });
};

const handleDelete = (row: PeriodVO) => {
  ElMessageBox.confirm(`确认删除该周期的档案吗?`, '危险操作', { type: 'warning' })
    .then(async () => {
      await deletePeriodApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的数据?`, '危险操作', { type: 'warning' })
    .then(async () => {
      await batchDeletePeriodApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      getList();
    })
    .catch(() => {});
};

const remoteSearchEmployees = async (query: string) => {
  if (query) {
    searchLoading.value = true;
    try {
      const res = await listEmployeeOptionsApi(query);
      employeeOptions.value = res as unknown as EmployeeOptionVO[];
    } catch (error) {
      employeeOptions.value = [];
      console.error('搜索员工失败:', error);
    } finally {
      searchLoading.value = false;
    }
  } else {
    employeeOptions.value = [];
  }
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* 布局样式已由全局接管 */

.flex-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

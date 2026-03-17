<!--src/views/salary/summary/SummaryPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-select
            v-model="queryParams.settlementMonth"
            placeholder="请选择月份"
            clearable
            style="width: 160px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in periodOptions"
              :key="item.id"
              :label="item.settlementMonth"
              :value="item.settlementMonth"
            >
              <span style="float: left; font-weight: bold">{{ item.settlementMonth }}</span>
              <span style="float: right; color: #999; font-size: 12px; margin-left: 20px"
                >{{ item.startDate ? `(${item.startDate} ~ ${item.endDate})` : '' }}
              </span>
            </el-option>
          </el-select>
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
            style="width: 200px"
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

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button
          v-hasPerm="['salary:summary:calc']"
          type="success"
          icon="DataBoard"
          @click="handleOpenCalc"
          >一键核算发薪
        </el-button>
        <el-button
          v-hasPerm="['salary:summary:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          >批量删除
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
          <template #default="scope">
            <el-link type="primary" underline="never" @click="handleQuickFilter(scope.row)">
              {{ scope.row.employeeName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100" />
        <el-table-column label="应发总计(本币)" align="center" prop="salarySubtotal" width="130">
          <template #default="{ row }">
            <span class="text-success">
              {{ Number(row.salarySubtotal) === 0 ? '0' : '+' + row.salarySubtotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="应扣总计(本币)"
          align="center"
          prop="salaryDeductionTotal"
          width="130"
        >
          <template #default="{ row }">
            <span class="text-danger">
              {{ Number(row.salaryDeductionTotal) === 0 ? '0' : '-' + row.salaryDeductionTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="本币实发金额" align="center" prop="salaryTotal" width="130">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: bold">{{ row.salaryTotal }}</span>
          </template>
        </el-table-column>

        <el-table-column label="支付状态" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-tag :type="getPayStatus(row.paymentStatus).type">
              {{ getPayStatus(row.paymentStatus).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="结算币种" align="center" prop="currency" width="90" />
        <el-table-column label="折合人民币" align="center" prop="salaryRmb" width="120" />
        <el-table-column label="折合 USDT" align="center" prop="salaryUsdt" width="120" />
        <el-table-column
          label="发放钱包/账号"
          align="center"
          prop="targetAccount"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="支付状态" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-tag :type="getPayStatusType(scope.row.paymentStatus)">
              {{ getPayStatusLabel(scope.row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:summary:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
              >作废
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

    <el-dialog v-model="calcDialog.visible" title="触发薪资引擎核算" width="480px" append-to-body>
      <el-form ref="calcFormRef" :model="calcForm" :rules="calcRules" label-width="100px">
        <el-alert
          title="注意：这将汇总选定月份所有员工数据，若数据已存在将被覆盖。"
          type="warning"
          show-icon
          style="margin-bottom: 20px"
        />

        <el-form-item label="核算月份" prop="settlementMonth">
          <el-select
            v-model="calcForm.settlementMonth"
            placeholder="选择要核算的月份"
            style="width: 100%"
          >
            <el-option
              v-for="item in periodOptions"
              :key="item.id"
              :label="item.settlementMonth"
              :value="item.settlementMonth"
            >
              <span style="float: left; font-weight: bold">{{ item.settlementMonth }}</span>
              <span style="float: right; color: #999; font-size: 12px; margin-left: 20px"
                >{{ item.startDate ? `(${item.startDate} ~ ${item.endDate})` : '' }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="审批备注" prop="remark">
          <el-input
            v-model="calcForm.remark"
            type="textarea"
            placeholder="如: 2026年3月工资核算确认"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="success" :loading="calculating" @click="submitCalculate"
            >开 始 核 算</el-button
          >
          <el-button @click="calcDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

// API & Types
import type {
  SummaryCalcReqDTO,
  SummaryQueryReqDTO,
  SummaryVO,
} from '@/types/salary/summary/summary.ts';
import {
  batchDeleteSummaryApi,
  calculateSummaryApi,
  deleteSummaryApi,
  getSummaryPageApi,
} from '@/api/salary/summary/summary.ts';
import { getPeriodOptionsApi } from '@/api/salary/period/period';
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import type { PeriodOptionVO } from '@/types/salary/period/period';

// 基础状态
const loading = ref(false);
const calculating = ref(false);
const searchLoading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// 查询参数 (扩展了 employeeId 和 settlementMonth)
const queryParams = reactive<SummaryQueryReqDTO & { employeeId?: any; settlementMonth?: string }>({
  pageNum: 1,
  pageSize: 10,
  employeeId: undefined,
  settlementMonth: undefined,
});

const dataList = ref<SummaryVO[]>([]);
const periodOptions = ref<PeriodOptionVO[]>([]); // 结算月份选项
const employeeOptions = ref<any[]>([]); // 员工下拉选项

const queryFormRef = ref<FormInstance>();

// 核算弹窗状态
const calcDialog = reactive({ visible: false });
const calcForm = ref<any>({ settlementMonth: '', remark: '' });
const calcFormRef = ref<FormInstance>();

const calcRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '请选择要核算的结算月份', trigger: 'change' }],
});
// ================== 状态字典与防雷转换 ==================

// 1. 统一支付状态字典配置
const PAY_STATUS: Record<number, { text: string; type: string }> = {
  0: { text: '未支付', type: 'info' },
  1: { text: '已支付', type: 'success' },
  2: { text: '支付失败', type: 'danger' },
  3: { text: '账户锁定', type: 'warning' },
};

// 2. 封装 Getter 函数供 template 安全调用
const getPayStatus = (status: any) => {
  return PAY_STATUS[Number(status)] || { text: '未知状态', type: 'info' };
};
// ================== 数据加载 ==================

const getList = async () => {
  loading.value = true;
  try {
    const res = await getSummaryPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const loadPeriodOptions = async () => {
  const res = await getPeriodOptionsApi();
  periodOptions.value = res || [];
};

const remoteSearchEmployees = async (query: string) => {
  if (query) {
    searchLoading.value = true;
    try {
      const res = await listEmployeeOptionsApi(query);
      employeeOptions.value = res;
    } finally {
      searchLoading.value = false;
    }
  } else {
    employeeOptions.value = [];
  }
};

// ================== 交互操作 ==================

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.employeeId = undefined;
  queryParams.settlementMonth = undefined;
  employeeOptions.value = [];
  handleQuery();
};

const handleQuickFilter = (row: SummaryVO) => {
  queryParams.employeeId = row.employeeId;
  // 必须把当前行的数据塞进下拉框选项，否则下拉框会显示 ID
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];
  handleQuery();
};

const handleSelectionChange = (selection: SummaryVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

// ================== 核算逻辑 ==================

const handleOpenCalc = () => {
  calcForm.value = { settlementMonth: '', remark: '' };
  calcDialog.visible = true;
};

const submitCalculate = async () => {
  if (!calcFormRef.value) return;
  await calcFormRef.value.validate(async (valid) => {
    if (valid) {
      calculating.value = true;
      try {
        // 构造符合 SummaryCalcReqDTO 结构的参数
        const params: SummaryCalcReqDTO = {
          // 如果弹窗里选的是月份，则传 settlementMonth
          settlementMonth: calcForm.value.settlementMonth,
          // 如果是针对单个周期核算，可以传 periodId（根据业务逻辑二选一或组合）
          periodId: calcForm.value.periodId || undefined,
          remark: calcForm.value.remark,
        };
        await calculateSummaryApi(params);
        ElMessage.success('核算成功！报表已更新。');
        calcDialog.visible = false;
        handleQuery();
      } catch (error) {
        console.error('核算失败', error);
      } finally {
        calculating.value = false;
      }
    }
  });
};

// ================== 删除逻辑 ==================

const handleDelete = (row: SummaryVO) => {
  ElMessageBox.confirm(`确认作废该结算单吗? 此操作影响财务对账!`, '危险操作', { type: 'warning' })
    .then(async () => {
      await deleteSummaryApi(row.id);
      ElMessage.success('作废成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认作废选中的 ${selectedIds.value.length} 条结算单?`, '危险操作', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteSummaryApi(selectedIds.value);
      ElMessage.success('批量作废成功');
      getList();
    })
    .catch(() => {});
};

// ================== 状态渲染 ==================

const getPayStatusType = (status: any) => {
  const map: any = { 1: 'success', 2: 'danger', 3: 'warning' };
  return map[status] || 'info';
};
const getPayStatusLabel = (status: any) => {
  const map: any = { 1: '已支付', 2: '支付失败', 3: '账户锁定' };
  return map[status] || '未支付';
};

onMounted(() => {
  loadPeriodOptions();
  getList();
});
</script>

<style scoped lang="scss">
/* 布局样式已由 src/styles/_layout.scss 全局接管 */
/* 保留你原有的文字颜色类 */
.text-success {
  color: #67c23a;
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
</style>

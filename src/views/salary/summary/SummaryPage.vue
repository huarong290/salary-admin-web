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
              <span
                style="
                  float: right;
                  color: var(--el-text-color-secondary);
                  font-size: 12px;
                  margin-left: 20px;
                "
              >
                {{ item.startDate ? `(${item.startDate} ~ ${item.endDate})` : '' }}
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
              <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{
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
        >
          执行全员核算发薪
        </el-button>
        <el-button
          v-hasPerm="['salary:summary:del']"
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
        >
          批量作废
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
            <el-link
              type="primary"
              :underline="false"
              class="drill-link"
              @click="handleQuickFilter(scope.row)"
            >
              {{ scope.row.employeeName }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100">
          <template #default="scope"
            ><span class="amount-font">{{ scope.row.settlementMonth }}</span></template
          >
        </el-table-column>

        <el-table-column label="应发总计(本币)" align="right" prop="salarySubtotal" width="130">
          <template #default="{ row }">
            <span class="amount-font text-success">
              {{ Number(row.salarySubtotal) === 0 ? '0.00' : '+' + row.salarySubtotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="应扣总计(本币)"
          align="right"
          prop="salaryDeductionTotal"
          width="130"
        >
          <template #default="{ row }">
            <span class="amount-font text-danger">
              {{ Number(row.salaryDeductionTotal) === 0 ? '0.00' : '-' + row.salaryDeductionTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="本币实发金额" align="right" prop="salaryTotal" width="140">
          <template #default="{ row }">
            <span class="amount-font real-pay-amount">{{ row.salaryTotal }}</span>
          </template>
        </el-table-column>

        <el-table-column label="结算币种" align="center" prop="currency" width="90" />

        <el-table-column label="折合人民币(CNY)" align="right" prop="salaryRmb" width="140">
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{ row.salaryRmb }}</span></template
          >
        </el-table-column>

        <el-table-column label="折合泰达币(USDT)" align="right" prop="salaryUsdt" width="140">
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{ row.salaryUsdt }}</span></template
          >
        </el-table-column>

        <el-table-column
          label="发放钱包/账号"
          align="center"
          prop="targetAccount"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{
              row.targetAccount || '未配置'
            }}</span></template
          >
        </el-table-column>

        <el-table-column label="支付状态" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-tag
              :type="getPayStatus(scope.row.paymentStatus).type"
              :effect="scope.row.paymentStatus === 1 ? 'dark' : 'plain'"
              size="small"
            >
              {{ getPayStatus(scope.row.paymentStatus).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:summary:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
              >作废</el-button
            >
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

    <el-dialog v-model="calcDialog.visible" title="系统核算控制台" width="480px" append-to-body>
      <el-form ref="calcFormRef" :model="calcForm" :rules="calcRules" label-width="100px">
        <el-alert
          title="将汇总选定月份所有员工的考勤、档案及变动明细。若该月已有核算数据将被重新覆盖。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 25px"
        />

        <el-form-item label="核算月份" prop="settlementMonth">
          <el-select
            v-model="calcForm.settlementMonth"
            placeholder="请指定要进行全员核算的月份"
            style="width: 100%"
          >
            <el-option
              v-for="item in periodOptions"
              :key="item.id"
              :label="item.settlementMonth"
              :value="item.settlementMonth"
            >
              <span style="float: left; font-weight: bold">{{ item.settlementMonth }}</span>
              <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">
                {{ item.startDate ? `(${item.startDate} ~ ${item.endDate})` : '' }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="核算备注" prop="remark">
          <el-input
            v-model="calcForm.remark"
            type="textarea"
            placeholder="选填，如: 2026年3月全局第一次核算"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="calcDialog.visible = false">放弃操作</el-button>
        <el-button type="success" :loading="calculating" @click="submitCalculate">
          {{ calculating ? '引 擎 运 算 中...' : '确 认 并 执 行 核 算' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资结算汇总大盘 (调用核心算薪引擎，生成员工最终的工资条)
 * 设计特性: 支持数据钻取、高危覆写阻断、大盘对账排版
 * ====================================================================
 */

// 1. Vue 与核心依赖
import { ref, reactive, onMounted } from 'vue';

// 2. Element Plus 与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

// 3. API 与类型定义
import { getPeriodOptionsApi } from '@/api/salary/period/period';
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import {
  getSummaryPageApi,
  calculateSummaryApi,
  deleteSummaryApi,
  batchDeleteSummaryApi,
} from '@/api/salary/summary/summary.ts';
import type { PeriodOptionVO } from '@/types/salary/period/period';
import type {
  SummaryCalcReqDTO,
  SummaryQueryReqDTO,
  SummaryVO,
} from '@/types/salary/summary/summary.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const calculating = ref(false); // 独立控制核算按钮的 loading，防止误触双击
const searchLoading = ref(false);

// [表格与分页状态]
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<SummaryVO[]>([]);

// [全局数据字典]
const periodOptions = ref<PeriodOptionVO[]>([]);
const employeeOptions = ref<any[]>([]);

// [查询条件]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<SummaryQueryReqDTO & { employeeId?: any; settlementMonth?: string }>({
  pageNum: 1,
  pageSize: 10,
  employeeId: undefined,
  settlementMonth: undefined,
});

// [核心核算控制台表单]
const calcDialog = reactive({ visible: false });
const calcFormRef = ref<FormInstance>();
const calcForm = ref<any>({ settlementMonth: '', remark: '' });

// 强校验规则
const calcRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '必须指定要执行核算的结算月份', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互与视图工具区 (UI Interactions & Utils)
 * --------------------------------------------------------------------
 */

// 统一支付状态字典映射
const PAY_STATUS: Record<number, { text: string; type: string }> = {
  0: { text: '待支付', type: 'info' },
  1: { text: '已支付', type: 'success' },
  2: { text: '支付失败', type: 'danger' },
  3: { text: '账号锁定', type: 'warning' },
};

const getPayStatus = (status: any) => {
  return PAY_STATUS[Number(status)] || { text: '未知状态', type: 'info' };
};

const handleSelectionChange = (selection: SummaryVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.employeeId = undefined;
  queryParams.settlementMonth = undefined;
  employeeOptions.value = []; // 清空员工级联缓存
  handleQuery();
};

/** 🌟 核心交互：数据钻取 (Drill-down)。点击姓名，直接过滤看该员工的所有历史单据 */
const handleQuickFilter = (row: SummaryVO) => {
  queryParams.employeeId = row.employeeId;
  // 手动回填员工选项池，避免选择框展示枯燥的 ID
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];
  handleQuery();
};

/** 打开核算控制台面板 */
const handleOpenCalc = () => {
  calcForm.value = { settlementMonth: '', remark: '' };
  calcDialog.visible = true;
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 页面初始化加载底层关联数据 (可选月份列表) */
const loadPeriodOptions = async () => {
  const res = await getPeriodOptionsApi();
  periodOptions.value = res || [];
};

/** 远程搜索搜索栏员工 */
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

/** 查询结算大盘列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getSummaryPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** 🌟 核心引擎驱动：向后端发起全员核算指令 */
const submitCalculate = async () => {
  if (!calcFormRef.value) return;
  await calcFormRef.value.validate(async (valid) => {
    if (valid) {
      calculating.value = true;
      try {
        const params: SummaryCalcReqDTO = {
          settlementMonth: calcForm.value.settlementMonth,
          remark: calcForm.value.remark,
        };
        await calculateSummaryApi(params);
        ElMessage.success('核算引擎执行完毕！全员账单已生成。');
        calcDialog.visible = false;
        handleQuery();
      } catch (error) {
        // 错误通常已被底层的 request.ts 拦截并抛出提示
        console.error('薪资引擎运算触发失败:', error);
      } finally {
        calculating.value = false;
      }
    }
  });
};

/** 危险操作：物理/逻辑销毁结算单 (通常用于局部核算错误后的冲正) */
const handleDelete = (row: SummaryVO) => {
  ElMessageBox.confirm(
    `确认作废 "${row.employeeName}" 该月的结算单吗? 这将直接影响财务最终打款对账!`,
    '系统高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await deleteSummaryApi(row.id);
      ElMessage.success('单据作废成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量作废选中的 ${selectedIds.value.length} 张结算单?`, '系统高危操作', {
    type: 'error',
  })
    .then(async () => {
      await batchDeleteSummaryApi(selectedIds.value);
      ElMessage.success('批量作废成功');
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
  loadPeriodOptions();
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  =====================================================================
*/

/* 财务级数据对齐核心：等宽数字字体 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
}

/* 核心结算数值的加重展示 */
.real-pay-amount {
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: bold;
}

.text-success {
  color: var(--el-color-success);
  font-weight: bold;
}
.text-danger {
  color: var(--el-color-danger);
  font-weight: bold;
}
.text-secondary {
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

/* 数据钻取专属链接样式：强化点击暗示 */
.drill-link {
  font-weight: bold;
  font-size: 14px;
  &:hover {
    text-decoration: underline;
  }
}
</style>

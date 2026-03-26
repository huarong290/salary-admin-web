<!--src/views/salary/summary/SummaryPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="员工姓名" prop="employeeId">
          <EmployeeSelect
            v-model="queryParams.employeeId"
            style="width: 200px"
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
            style="width: 160px"
            @change="handleQuery"
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
        <el-button
          v-hasPerm="['salary:summary:init']"
          type="primary"
          icon="MagicStick"
          @click="handleOpenInit"
        >
          初始化本月账套
        </el-button>
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
          <template #default="scope">
            <span class="amount-font">{{ scope.row.settlementMonth }}</span>
          </template>
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
            <span
              v-if="Number(row.salaryTotal) === 0"
              class="text-secondary"
              style="font-size: 12px"
            >
              (待核算)
            </span>
            <span v-else class="amount-font real-pay-amount">{{ row.salaryTotal }}</span>
          </template>
        </el-table-column>

        <el-table-column label="结算币种" align="center" prop="currency" width="90" />

        <el-table-column label="折合人民币(CNY)" align="right" prop="salaryRmb" width="140">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.salaryRmb }}</span>
          </template>
        </el-table-column>

        <el-table-column label="折合泰达币(USDT)" align="right" prop="salaryUsdt" width="140">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.salaryUsdt }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="发放钱包/账号"
          align="center"
          prop="targetAccount"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.targetAccount || '未配置' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="支付状态" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-tag
              :type="getPayStatus(scope.row.paymentStatus).type"
              :effect="scope.row.paymentStatus === 1 ? 'dark' : 'plain'"
              class="status-tag"
            >
              {{ getPayStatus(scope.row.paymentStatus).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="260" fixed="right">
          <template #default="scope">
            <el-button link type="success" icon="Refresh" @click="handleSingleCalc(scope.row)">
              重新核算
            </el-button>
            <el-button link type="primary" icon="Document" @click="handleGoToRecord(scope.row)">
              对账明细
            </el-button>
            <el-button
              v-hasPerm="['salary:summary:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
            >
              作废
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

    <el-dialog v-model="calcDialog.visible" width="480px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">系统核算控制台</span>
        </div>
      </template>

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
        <div class="dialog-footer">
          <el-button @click="calcDialog.visible = false">放弃操作</el-button>
          <el-button type="success" :loading="calculating" @click="submitCalculate">
            {{ calculating ? '引 擎 运 算 中...' : '确 认 并 执 行 核 算' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="previewDialog.visible" width="550px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">算薪引擎：单人核算预览</span>
        </div>
      </template>

      <div v-loading="previewDialog.loading">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="员工姓名">
            {{ previewDialog.data.employeeName }}
          </el-descriptions-item>
          <el-descriptions-item label="核算月份">
            {{ previewDialog.data.settlementMonth }}
          </el-descriptions-item>
          <el-descriptions-item label="计薪基准 (实发)">
            <span class="amount-font">{{ previewDialog.data.salarySubtotal }}</span>
            {{ previewDialog.data.currency }}
          </el-descriptions-item>
          <el-descriptions-item label="应扣合计 (实扣)">
            <span class="amount-font text-danger">
              -{{ previewDialog.data.salaryDeductionTotal }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="预计实发净额">
            <b class="amount-font real-pay-amount" style="font-size: 20px">
              {{ previewDialog.data.salaryTotal }}
            </b>
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          title="预览数据基于当前档案及考勤实时计算。点击'确认存盘'将覆写该员工本月已存在的结算单。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 15px"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialog.visible = false">取 消</el-button>
          <el-button type="success" :loading="previewDialog.submitting" @click="confirmSingleCalc">
            确认存盘并更新账单
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="initDialog.visible" width="400px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">初始化月份账套</span>
        </div>
      </template>

      <el-form ref="initFormRef" :model="initForm" :rules="initRules" label-width="80px">
        <el-alert
          title="此操作将为所有【在职员工】创建该月的薪资周期及汇总单预览。已存在的记录将自动跳过。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form-item label="目标月份" prop="settlementMonth">
          <el-date-picker
            v-model="initForm.settlementMonth"
            type="month"
            value-format="YYYYMM"
            placeholder="选择月份"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="initDialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="initializing" @click="submitInit">
            立即生成账套
          </el-button>
        </div>
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

/**
 * --------------------------------------------------------------------
 * 📥 一、依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

import { getPeriodOptionsApi } from '@/api/salary/period/period';
import {
  getSummaryPageApi,
  calculateSummaryApi,
  deleteSummaryApi,
  batchDeleteSummaryApi,
  calculateSummaryByPeriodsApi,
  previewSummaryCalculateApi,
  initSummaryBatchApi,
} from '@/api/salary/summary/summary.ts';

import type { PeriodOptionVO } from '@/types/salary/period/period';
import type {
  SummaryCalcByPeriodReqDTO,
  SummaryCalcReqDTO,
  SummaryQueryReqDTO,
  SummaryVO,
} from '@/types/salary/summary/summary.ts';
import EmployeeSelect from '@/views/salary/employee/components/EmployeeSelect.vue';

const router = useRouter();

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const calculating = ref(false); // 独立控制核算按钮的 loading，防止误触双击

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
const calcRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '必须指定要执行核算的结算月份', trigger: 'change' }],
});

// [单人核算预览对话框]
const previewDialog = reactive({
  visible: false,
  loading: false,
  submitting: false,
  data: {} as any,
});

// [初始化账套控制台]
const initDialog = reactive({ visible: false });
const initFormRef = ref<FormInstance>();
const initForm = ref({ settlementMonth: '' });
const initializing = ref(false);
const initRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '请选择要初始化的月份', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

// 统一支付状态字典映射
const PAY_STATUS: Record<number, { text: string; type: any }> = {
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
  employeeOptions.value = [];
  handleQuery();
};

/** 🌟 核心交互：数据钻取 (Drill-down) */
const handleQuickFilter = (row: SummaryVO) => {
  queryParams.employeeId = row.employeeId;
  // 手动回填员工选项池，避免选择框展示枯燥的 ID
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];
  handleQuery();
};

/** 🌟 核心打通：跳转到明细页对账 */
const handleGoToRecord = (row: SummaryVO) => {
  router.push({
    path: '/salary/paymentrecord',
    query: { summaryId: row.id }, // 携带当前批次ID进行下钻
  });
};

const handleOpenCalc = () => {
  calcForm.value = { settlementMonth: '', remark: '' };
  calcDialog.visible = true;
};

const handleOpenInit = () => {
  initForm.value = { settlementMonth: '' };
  initDialog.visible = true;
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 页面初始化加载底层关联数据 */
const loadPeriodOptions = async () => {
  const res = await getPeriodOptionsApi();
  periodOptions.value = res || [];
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
        console.error('薪资引擎运算触发失败:', error);
      } finally {
        calculating.value = false;
      }
    }
  });
};

/** 执行初始化逻辑 */
const submitInit = async () => {
  if (!initFormRef.value) return;
  await initFormRef.value.validate(async (valid) => {
    if (valid) {
      initializing.value = true;
      try {
        const targetMonth = initForm.value.settlementMonth;
        await initSummaryBatchApi(targetMonth);

        ElMessage.success(`${targetMonth} 月份账套初始化成功`);
        initDialog.visible = false;

        // 💡 体验优化：初始化后自动跳转到该月份查看结果
        queryParams.settlementMonth = targetMonth;
        handleQuery();
      } finally {
        initializing.value = false;
      }
    }
  });
};

/** 🌟 触发单人即时核算预览 */
const handleSingleCalc = async (row: SummaryVO) => {
  previewDialog.visible = true;
  previewDialog.loading = true;
  // 占位
  previewDialog.data = { ...row, currency: row.currency || 'CNY' };

  try {
    const res = await previewSummaryCalculateApi(row.periodId);
    // 合并最新精确数据
    previewDialog.data = {
      ...previewDialog.data,
      salarySubtotal: res.salarySubtotal,
      salaryDeductionTotal: res.salaryDeductionTotal,
      salaryTotal: res.salaryTotal,
      currency: res.currency || previewDialog.data.currency,
    };
  } catch (error) {
    console.error('引擎预览计算异常:', error);
    ElMessage.error('引擎预览失败，请检查员工档案配置');
    previewDialog.visible = false;
  } finally {
    previewDialog.loading = false;
  }
};

/** 🌟 确认单人预览结果，正式存盘 */
const confirmSingleCalc = async () => {
  previewDialog.submitting = true;
  try {
    const params: SummaryCalcByPeriodReqDTO = {
      periodIds: [previewDialog.data.periodId],
      remark: `单人重新核算: ${previewDialog.data.employeeName}`,
    };
    await calculateSummaryByPeriodsApi(params);

    ElMessage.success(`${previewDialog.data.employeeName} 的薪资记录已成功更新`);
    previewDialog.visible = false;
    handleQuery();
  } catch (error) {
    console.error('单人核算存盘失败:', error);
  } finally {
    previewDialog.submitting = false;
  }
};

/** 高危操作：作废结算单 */
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
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
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
  全局的基础字体 (如 .amount-font, .text-secondary) 已交给 _layout.scss。
  此处仅保留强调色系和私有交互样式。
  =====================================================================
*/

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

/* 数据钻取专属链接样式：强化点击暗示 */
.drill-link {
  font-weight: bold;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}
</style>

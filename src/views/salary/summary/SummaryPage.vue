<!--src/views/salary/summary/SummaryPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="员工姓名/工号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
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
          />
        </el-form-item>
        <el-form-item label="计算状态" prop="calcStatus">
          <el-select
            v-model="queryParams.calcStatus"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未计算" :value="0" />
            <el-option label="计算成功" :value="1" />
            <el-option label="计算失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发放状态" prop="paymentStatus">
          <el-select
            v-model="queryParams.paymentStatus"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="支付失败" :value="2" />
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

        <el-divider direction="vertical" style="height: 2em; margin: 0 15px" />

        <el-button
          v-hasPerm="['salary:summary:lock']"
          type="warning"
          icon="Lock"
          :disabled="multiple"
          @click="handleBatchLock(1)"
        >
          批量锁定 (准备发薪)
        </el-button>
        <el-button
          v-hasPerm="['salary:summary:lock']"
          type="danger"
          plain
          icon="Unlock"
          :disabled="multiple"
          @click="handleBatchLock(0)"
        >
          批量解锁 (允许重算)
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column label="员工信息" min-width="140" show-overflow-tooltip fixed="left">
          <template #default="{ row }">
            <el-link
              type="primary"
              :underline="false"
              class="drill-link"
              @click="handleQuickFilter(row)"
            >
              <div style="font-weight: 600">
                {{ row.employeeName }}
              </div>
            </el-link>
            <div class="text-secondary amount-font" style="font-size: 12px">
              [{{ row.employeeCode }}]
            </div>
          </template>
        </el-table-column>

        <el-table-column label="结算月份" align="center" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font">{{
              row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="应发工资 (Gross)" align="right" min-width="130">
          <template #default="{ row }">
            <span class="amount-font text-success">{{ row.grossSalary?.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="扣除与税费" align="right" min-width="130">
          <template #default="{ row }">
            <span v-if="row.deductionTotal || row.taxTotal" class="amount-font text-danger">
              -{{ ((row.deductionTotal || 0) + (row.taxTotal || 0)).toFixed(2) }}
            </span>
            <span v-else class="text-secondary">0.00</span>
          </template>
        </el-table-column>

        <el-table-column label="实发工资 (Net)" align="right" min-width="130" fixed="right">
          <template #default="{ row }">
            <span v-if="row.calcStatus === 0" class="text-secondary" style="font-size: 12px">
              (待核算)
            </span>
            <span
              v-else
              class="amount-font text-primary"
              style="font-weight: bold; font-size: 15px"
            >
              {{ row.netSalary?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="计算状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.calcStatus === 1 ? 'success' : row.calcStatus === 2 ? 'danger' : 'info'"
              size="small"
            >
              {{ row.calcStatus === 1 ? '成功' : row.calcStatus === 2 ? '失败' : '未计算' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态控制" align="center" width="100">
          <template #default="{ row }">
            <el-tooltip
              :content="row.lockFlag === 1 ? '已锁定：禁止重算' : '未锁定：允许重算'"
              placement="top"
            >
              <el-tag
                :type="row.lockFlag === 1 ? 'danger' : 'success'"
                effect="dark"
                size="small"
                style="cursor: pointer"
                @click="handleToggleLock(row)"
              >
                <el-icon style="vertical-align: middle; margin-right: 2px">
                  <Lock v-if="row.lockFlag === 1" />
                  <Unlock v-else />
                </el-icon>
                {{ row.lockFlag === 1 ? '已锁定' : '未锁定' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" icon="Refresh" @click="handleSingleCalc(row)">
              重算
            </el-button>
            <el-button
              v-hasPerm="['salary:summary:detail']"
              link
              type="info"
              icon="Document"
              @click="handleDetail(row)"
              >工资条</el-button
            >
            <el-button link type="primary" icon="Money" @click="handleGoToRecord(row)">
              流水
            </el-button>
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

    <el-dialog v-model="initDialog.visible" width="400px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">初始化月份账套</span>
        </div>
      </template>

      <el-form ref="initFormRef" :model="initForm" :rules="initRules" label-width="80px">
        <el-alert
          title="此操作将为所有【在职员工】创建该月的薪资周期及汇总单。已存在的记录将自动跳过。"
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

    <el-dialog v-model="calcDialog.visible" width="480px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">系统核算控制台</span>
        </div>
      </template>

      <el-form ref="calcFormRef" :model="calcForm" :rules="calcRules" label-width="100px">
        <el-alert
          title="即将对所选单据执行引擎跑批！未锁定的单据数据将被重新覆盖。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 25px"
        />

        <el-form-item label="核算范围">
          <span
            >共选中
            <b>{{ selectedIds.length > 0 ? selectedIds.length : '当前列表未锁定' }}</b> 条单据</span
          >
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
        <el-descriptions :column="1" border size="small" class="preview-descriptions">
          <el-descriptions-item label="员工姓名">
            {{ previewDialog.data?.employeeName }}
          </el-descriptions-item>
          <el-descriptions-item label="核算月份">
            {{ previewDialog.data?.settlementMonth }}
          </el-descriptions-item>

          <el-descriptions-item label="核算依据档案">
            <div
              v-if="
                previewDialog.data?.usedArchives && previewDialog.data.usedArchives.length === 1
              "
            >
              <el-tag size="small" type="success" effect="plain">
                版本 V{{ previewDialog.data.usedArchives[0]?.version }}
              </el-tag>
              <span class="archive-date-hint">
                (生效区间: {{ previewDialog.data.usedArchives[0]?.effectiveDate }} ~
                {{ formatExpiry(previewDialog.data.usedArchives[0]?.expiryDate) }})
              </span>
            </div>

            <div
              v-else-if="
                previewDialog.data?.usedArchives && previewDialog.data.usedArchives.length > 1
              "
            >
              <el-tooltip placement="top" effect="light">
                <template #content>
                  <div class="tooltip-content">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #e6a23c">
                      <el-icon><Warning /></el-icon> 检测到月中调薪，已开启分段计薪
                    </div>
                    <div
                      v-for="arch in previewDialog.data.usedArchives"
                      :key="arch.archiveId"
                      class="archive-slice"
                    >
                      • <b>版本 V{{ arch.version }}</b
                      >：适用 {{ arch.effectiveDate }} 至 {{ formatExpiry(arch.expiryDate) }}
                    </div>
                  </div>
                </template>
                <el-tag size="small" type="warning" effect="dark" style="cursor: help">
                  <el-icon><Warning /></el-icon> 跨版本分段计薪 (包含
                  {{ previewDialog.data.usedArchives.length }} 份档案)
                </el-tag>
              </el-tooltip>
            </div>

            <div v-else>
              <el-tag size="small" type="danger">未匹配到生效档案</el-tag>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="计薪基准 (Gross)">
            <span class="amount-font text-success"
              >+{{ previewDialog.data?.grossSalary?.toFixed(2) }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="应扣合计 (实扣)">
            <span class="amount-font text-danger">
              -{{
                (
                  (previewDialog.data?.deductionTotal || 0) + (previewDialog.data?.taxTotal || 0)
                ).toFixed(2)
              }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="预计实发净额">
            <b class="amount-font text-primary" style="font-size: 20px">
              {{ previewDialog.data?.netSalary?.toFixed(2) }}
            </b>
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 15px; line-height: 1.5"
        >
          <template #title>
            预览数据基于当前周期的考勤快照与 <b>上述标明的生效档案</b> 实时试算。<br />
            点击“确认存盘”后，系统将固化当前核算上下文并覆写该员工结算单。
          </template>
        </el-alert>
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

    <el-dialog
      v-model="detailDialog.visible"
      width="850px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title"
            >薪资核算单明细 - {{ currentDetail?.employeeName }} ({{
              currentDetail?.settlementMonth
            }})</span
          >
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <div
        v-if="currentDetail && currentDetail.details"
        v-loading="detailLoading"
        class="payslip-container"
      >
        <el-descriptions :column="2" border class="margin-bottom-20">
          <el-descriptions-item label="出勤天数">
            <span class="amount-font"
              >{{ currentDetail.details.attendanceDays }} /
              {{ currentDetail.details.monthDays }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="核算币种">
            <el-tag size="small" type="info">{{
              currentDetail.details.settlementCurrency || 'CNY'
            }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="核算依据档案" :span="2">
            <div v-if="currentDetail?.usedArchives && currentDetail.usedArchives.length === 1">
              <el-tag size="small" type="success" effect="plain">
                版本 V{{ currentDetail.usedArchives[0]?.version }}
              </el-tag>
              <span class="archive-date-hint">
                (生效区间: {{ currentDetail.usedArchives[0]?.effectiveDate }} ~
                {{ formatExpiry(currentDetail.usedArchives[0]?.expiryDate) }})
              </span>
            </div>
            <div v-else-if="currentDetail?.usedArchives && currentDetail.usedArchives.length > 1">
              <el-tag size="small" type="warning" effect="dark" style="margin-right: 8px">
                <el-icon><Warning /></el-icon> 跨版本分段计薪 (包含
                {{ currentDetail.usedArchives.length }} 份档案)
              </el-tag>
              <span
                v-for="arch in currentDetail.usedArchives"
                :key="arch.archiveId"
                class="archive-date-hint"
              >
                [V{{ arch.version }}: {{ arch.effectiveDate }}起]
              </span>
            </div>
            <div v-else>
              <span class="text-secondary" style="font-size: 12px"
                >无档案溯源信息 (可能是老版本数据)</span
              >
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="section-title text-success">应发收入明细</div>
            <el-table :data="currentDetail.details.income" size="small" border>
              <el-table-column label="项目名称" prop="itemName" />
              <el-table-column label="金额" align="right" width="100">
                <template #default="{ row }"
                  ><span class="amount-font">{{ row.settlementAmount?.toFixed(2) }}</span></template
                >
              </el-table-column>
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div style="padding: 10px; color: #666; font-size: 12px">
                    计算公式: {{ row.calcLog || '固定值录入' }}
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div class="subtotal amount-font text-success">
              应发合计: {{ currentDetail?.grossSalary?.toFixed(2) }}
            </div>
          </el-col>

          <el-col :span="12">
            <div class="section-title text-danger">应扣与税费明细</div>
            <el-table
              :data="[
                ...(currentDetail.details.deduction || []),
                ...(currentDetail.details.tax || []),
              ]"
              size="small"
              border
            >
              <el-table-column label="项目名称" prop="itemName" />
              <el-table-column label="扣减金额" align="right" width="100">
                <template #default="{ row }"
                  ><span class="amount-font text-danger"
                    >-{{ row.settlementAmount?.toFixed(2) }}</span
                  ></template
                >
              </el-table-column>
            </el-table>
            <div class="subtotal amount-font text-danger">
              应扣合计: -{{
                ((currentDetail?.deductionTotal || 0) + (currentDetail?.taxTotal || 0)).toFixed(2)
              }}
            </div>
          </el-col>
        </el-row>

        <div class="final-net-box">
          实发薪资 (Net Salary):
          <span class="amount-font final-amount">{{ currentDetail?.netSalary?.toFixed(2) }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无详细核算快照" />

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资汇总与发薪台 (展示计算引擎结果、工资单详情、发薪锁定控制)
 * 依赖关联: 数据由 Salary Rule Engine 生成，此处仅提供只读展示与状态流转。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted } from 'vue';

// 引入 useRouter
import { useRouter } from 'vue-router';

// [2] 第三方 UI 组件库与图标 (🌟 增加 Warning 图标)
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, Lock, Unlock, Warning } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  getSummaryPageApi,
  getSummaryDetailApi,
  updateSummaryLockStatusApi,
} from '@/api/salary/summary/summary.ts';

import {
  initSummaryAccountApi,
  calculateBatchSalaryApi,
  calculateSingleSalaryApi,
  previewSingleSalaryApi,
} from '@/api/salary/engine/engine.ts';

// [4] TS 强类型定义约束
import type { SummaryQueryReqDTO, SalarySummaryVO } from '@/types/salary/summary/summary.ts';
import type {
  SalaryCalcSingleReqDTO,
  SalaryCalcBatchReqDTO,
} from '@/types/salary/engine/engine.ts';

const router = useRouter();

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const detailLoading = ref(false);
const isFullscreen = ref(false);

// [表格与分页状态]
const total = ref(0);
const dataList = ref<SalarySummaryVO[]>([]);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<SummaryQueryReqDTO & { employeeId?: any }>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  settlementMonth: undefined,
  calcStatus: undefined,
  paymentStatus: undefined,
  employeeId: undefined,
});

// [详情弹窗状态]
const detailDialog = reactive({ visible: false });
const currentDetail = ref<SalarySummaryVO>();

// [初始化账套控制台状态]
const initDialog = reactive({ visible: false });
const initFormRef = ref<FormInstance>();
const initForm = ref({ settlementMonth: '' });
const initializing = ref(false);
const initRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '请选择要初始化的月份', trigger: 'change' }],
});

// [核心核算控制台表单状态]
const calcDialog = reactive({ visible: false });
const calcFormRef = ref<FormInstance>();
const calcForm = ref<any>({ settlementMonth: '', remark: '' });
const calculating = ref(false);
const calcRules = reactive<FormRules>({});

// [单人核算预览对话框状态]
const previewDialog = reactive({
  visible: false,
  loading: false,
  submitting: false,
  data: {} as any,
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 🌟 新增：格式化无限远的失效日期 */
const formatExpiry = (dateStr?: string) => {
  if (!dateStr) return '至今';
  return dateStr === '9999-12-31' ? '至今' : dateStr;
};

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: SalarySummaryVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 触发带条件搜索 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.employeeId = undefined; // 🌟 重置时清空钻取条件
  handleQuery();
};

/** 快捷过滤钻取 */
const handleQuickFilter = (row: SalarySummaryVO) => {
  queryParams.employeeId = row.employeeId;
  queryParams.keyword = row.employeeName; // 顺便回填搜索框直观展示
  handleQuery();
};

/** ：跳转打款记录 */
const handleGoToRecord = (row: SalarySummaryVO) => {
  router.push({
    path: '/salary/paymentrecord',
    query: { summaryId: row.id },
  });
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getSummaryPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载汇总数据失败', error);
  } finally {
    loading.value = false;
  }
};

/** 1：初始化账套 */
const handleOpenInit = () => {
  initForm.value = { settlementMonth: '' };
  initDialog.visible = true;
};

/** 执行账套初始化 (绑定到 initDialog 的确定按钮) */
const submitInit = async () => {
  if (!initFormRef.value) return;
  await initFormRef.value.validate(async (valid) => {
    if (valid) {
      initializing.value = true;
      try {
        const targetMonth = initForm.value.settlementMonth;
        await initSummaryAccountApi({ settlementMonth: targetMonth });

        ElMessage.success(`成功初始化 ${targetMonth} 月份账套！`);
        initDialog.visible = false;
        queryParams.settlementMonth = targetMonth;
        getList();
      } catch (error) {
        console.error('初始化账套失败:', error);
      } finally {
        initializing.value = false;
      }
    }
  });
};

/** 2：全员/批量跑批 */
const handleOpenCalc = () => {
  const targetIds =
    selectedIds.value.length > 0
      ? selectedIds.value
      : dataList.value
          .filter((item) => item.calcStatus === 0 || item.calcStatus === 2)
          .map((item) => item.id);

  if (targetIds.length === 0) {
    ElMessage.warning('当前列表无待核算数据，请先【初始化账套】或确认是否已全部锁定！');
    return;
  }

  calcForm.value = { settlementMonth: queryParams.settlementMonth || '', remark: '' };
  calcDialog.visible = true;
};

/** 引擎驱动：批量核算指令 (绑定到 calcDialog 的确定按钮) */
const submitCalculate = async () => {
  if (!calcFormRef.value) return;
  await calcFormRef.value.validate(async (valid) => {
    if (valid) {
      calculating.value = true;
      try {
        const targetIds =
          selectedIds.value.length > 0
            ? selectedIds.value
            : dataList.value
                .filter((item) => item.calcStatus === 0 || item.calcStatus === 2)
                .map((item) => item.id);

        const params: SalaryCalcBatchReqDTO = {
          summaryIds: targetIds,
          pipelineCode: 'OFFICIAL_STAFF_2026', // 默认管道
          pipelineVersion: 1,
        };
        await calculateBatchSalaryApi(params);

        ElMessage.success('核算引擎执行完毕！账单已生成。');
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

/** 3：单人引擎预览 */
const handleSingleCalc = async (row: SalarySummaryVO) => {
  if (row.lockFlag === 1) {
    ElMessage.warning('该单据已被锁定，禁止重算！');
    return;
  }
  previewDialog.visible = true;
  previewDialog.loading = true;
  previewDialog.data = { ...row };

  try {
    const res = await previewSingleSalaryApi({ summaryId: row.id } as SalaryCalcSingleReqDTO);
    previewDialog.data = { ...previewDialog.data, ...res };
  } catch (error) {
    ElMessage.error('引擎预览失败，请检查员工档案与公式配置');
    previewDialog.visible = false;
  } finally {
    previewDialog.loading = false;
  }
};

/** 4：确认单人预览落盘 */
const confirmSingleCalc = async () => {
  previewDialog.submitting = true;
  try {
    await calculateSingleSalaryApi({ summaryId: previewDialog.data.id } as SalaryCalcSingleReqDTO);
    ElMessage.success(`${previewDialog.data.employeeName} 的薪资记录已成功更新`);
    previewDialog.visible = false;
    handleQuery();
  } catch (error) {
    console.error('单人核算存盘失败:', error);
  } finally {
    previewDialog.submitting = false;
  }
};

// =========================================================================

/** * 核心：查看工资条详情快照 */
const handleDetail = async (row: SalarySummaryVO) => {
  detailLoading.value = true;
  detailDialog.visible = true;
  isFullscreen.value = false;

  try {
    // 重新请求详情接口，获取完整的 details 快照数据
    const res = await getSummaryDetailApi(row.id);
    currentDetail.value = res;
  } catch (error) {
    console.error('加载工资条快照失败', error);
    detailDialog.visible = false;
  } finally {
    detailLoading.value = false;
  }
};

/** * 执行：单条快速锁定/解锁 */
const handleToggleLock = (row: SalarySummaryVO) => {
  if (row.paymentStatus === 1) {
    ElMessage.warning('已支付的工资单禁止变更锁定状态！');
    return;
  }

  const targetStatus = row.lockFlag === 1 ? 0 : 1;
  const actionText = targetStatus === 1 ? '锁定' : '解锁';

  ElMessageBox.confirm(
    `确认要【${actionText}】员工 ${row.employeeName} 的本月工资单吗?`,
    '状态流转提示',
    {
      type: targetStatus === 1 ? 'warning' : 'info',
    }
  )
    .then(async () => {
      await updateSummaryLockStatusApi({ ids: [row.id], lockFlag: targetStatus });
      ElMessage.success(`已${actionText}`);
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量锁定/解锁记录 */
const handleBatchLock = (lockFlag: number) => {
  const actionText = lockFlag === 1 ? '锁定并准备发薪' : '解锁并允许重算';

  ElMessageBox.confirm(
    `确认要对选中的 ${selectedIds.value.length} 条数据执行【${actionText}】操作吗?`,
    '批量操作提示',
    {
      type: lockFlag === 1 ? 'warning' : 'error',
    }
  )
    .then(async () => {
      await updateSummaryLockStatusApi({ ids: selectedIds.value, lockFlag });
      ElMessage.success('批量流转处理成功');
      await getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   ===================================================================== */
.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid currentColor;
}

.subtotal {
  text-align: right;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
}

.final-net-box {
  margin-top: 20px;
  padding: 15px 20px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);

  .final-amount {
    color: var(--el-color-primary);
    font-size: 24px;
    margin-left: 10px;
  }
}

.text-success {
  color: var(--el-color-success);
}
.text-danger {
  color: var(--el-color-danger);
}
.real-pay-amount {
  color: var(--el-color-primary);
}
.drill-link {
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}

/* 溯源档案相关样式 */
.preview-descriptions {
  margin-top: 10px;
}
.archive-date-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
.tooltip-content {
  font-size: 13px;
  line-height: 1.6;
}
.archive-slice {
  margin-top: 4px;
  padding-left: 5px;
}
</style>

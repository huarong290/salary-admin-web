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
            <div style="font-weight: 600; color: var(--el-text-color-primary)">
              {{ row.employeeName }}
            </div>
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
            <span class="amount-font">{{ row.grossSalary?.toFixed(2) }}</span>
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
            <span class="amount-font text-primary" style="font-weight: bold; font-size: 15px">
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

        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:summary:detail']"
              link
              type="primary"
              icon="Document"
              @click="handleDetail(row)"
              >工资条</el-button
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

      <div v-if="currentDetail?.details" v-loading="detailLoading" class="payslip-container">
        <el-descriptions :column="3" border class="margin-bottom-20">
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
          <el-descriptions-item label="档案底薪">
            <span class="amount-font">{{ currentDetail.details.baseSalary?.toFixed(2) }}</span>
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
              应发合计: {{ currentDetail.details.grossSalary?.toFixed(2) }}
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
                (
                  (currentDetail.details.deductionTotal || 0) +
                  (currentDetail.details.taxTotal || 0)
                ).toFixed(2)
              }}
            </div>
          </el-col>
        </el-row>

        <div class="final-net-box">
          实发薪资 (Net Salary):
          <span class="amount-font final-amount">{{
            currentDetail.details.netSalary?.toFixed(2)
          }}</span>
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

// [2] 第三方 UI 组件库与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { FullScreen, Minus, Lock, Unlock } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  getSummaryPageApi,
  getSummaryDetailApi,
  updateSummaryLockStatusApi,
} from '@/api/salary/summary/summary.ts';

// [4] TS 强类型定义约束
import type { SummaryQueryReqDTO, SalarySummaryVO } from '@/types/salary/summary/summary.ts';

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
const queryParams = reactive<SummaryQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  settlementMonth: undefined,
  calcStatus: undefined,
  paymentStatus: undefined,
});

// [详情弹窗状态]
const detailDialog = reactive({ visible: false });
const currentDetail = ref<SalarySummaryVO>();

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

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
  handleQuery();
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

/** * 核心：查看工资条详情快照 */
const handleDetail = async (row: SalarySummaryVO) => {
  detailLoading.value = true;
  detailDialog.visible = true;
  isFullscreen.value = false;

  try {
    // 重新请求详情接口，获取完整的 detailJson 快照数据
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
</style>

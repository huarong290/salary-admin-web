<!--src/views/salary/paymentrecord/PaymentRecordPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="90px">
        <el-form-item label="汇总批次ID" prop="summaryId">
          <el-input
            v-model="queryParams.summaryId"
            placeholder="输入全局批次ID追溯"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="员工姓名" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="输入姓名精准搜索"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择发薪月份"
            value-format="YYYYMM"
            clearable
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">精准追溯</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="recordList" border height="100%">
        <el-table-column
          label="员工姓名"
          align="center"
          prop="employeeName"
          width="120"
          fixed="left"
        >
          <template #default="{ row }">
            <span style="font-weight: bold">{{ row.employeeName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font">{{
              row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="档案底薪(本币)" align="right" prop="baseSalary" width="130">
          <template #default="{ row }"
            ><span class="amount-font text-secondary">{{ row.baseSalary }}</span></template
          >
        </el-table-column>

        <el-table-column label="应发合计" align="right" prop="incomeTotal" width="120">
          <template #default="scope">
            <span class="amount-font text-success">
              {{ Number(scope.row.incomeTotal) === 0 ? '0.00' : '+' + scope.row.incomeTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="应扣合计" align="right" prop="deductionTotal" width="120">
          <template #default="scope">
            <span class="amount-font text-danger">
              {{ Number(scope.row.deductionTotal) === 0 ? '0.00' : '-' + scope.row.deductionTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="实发金额(本币)" align="right" prop="finalSalary" width="140">
          <template #default="scope">
            <span class="amount-font real-pay-amount">{{ scope.row.finalSalary }}</span>
          </template>
        </el-table-column>

        <el-table-column label="核算类型" align="center" width="110">
          <template #default="scope">
            <el-tag
              :type="scope.row.isManual === 1 ? 'warning' : 'info'"
              :effect="scope.row.isManual === 1 ? 'dark' : 'plain'"
              size="small"
            >
              {{ scope.row.isManual === 1 ? '✋ 人工干预' : '💻 系统引擎' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleViewSnapshot(scope.row)"
              >凭证快照</el-button
            >
            <el-button
              v-hasPerm="['salary:record:edit']"
              link
              type="warning"
              icon="Edit"
              @click="handleAdjust(scope.row)"
              >强制平账</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="snapshotDialog.visible"
      width="900px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title"
            >核算溯源凭证 - {{ currentRecord.employeeName }} ({{
              currentRecord.settlementMonth || '当期'
            }})</span
          >
          <el-button link @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="drawer-content">
        <div class="section-title">计算引擎上下文参数</div>
        <el-descriptions border :column="3" size="small" class="margin-bottom-20">
          <el-descriptions-item label="汇总批次溯源">
            <span class="amount-font text-secondary">{{ currentRecord.summaryId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="档案标准底薪">
            <span class="amount-font" style="font-weight: bold; color: var(--el-color-primary)">
              {{ snapshotData.baseSalary || '0.00' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="结算币种">
            {{ snapshotData.currency || 'CNY' }}
          </el-descriptions-item>
          <el-descriptions-item label="当月计薪天数">
            <span class="amount-font">{{ snapshotData.monthDays || '0' }}</span> 天
          </el-descriptions-item>
          <el-descriptions-item label="实际出勤天数">
            <span
              class="amount-font"
              :class="
                Number(snapshotData.attendanceDays) < Number(snapshotData.monthDays)
                  ? 'text-danger'
                  : 'text-success'
              "
            >
              {{ snapshotData.attendanceDays || '0' }}
            </span>
            天
          </el-descriptions-item>
          <el-descriptions-item label="全勤奖资格">
            <el-tag :type="snapshotData.fullAttendanceFlag === 1 ? 'success' : 'info'" size="small">
              {{ snapshotData.fullAttendanceFlag === 1 ? '已触发' : '未触发/不满足' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">收支计算瀑布流 (流水账)</div>
        <el-table :data="snapshotItems" border stripe max-height="400" class="snapshot-table">
          <el-table-column prop="itemName" label="明细项目" width="150" show-overflow-tooltip>
            <template #default="{ row }"
              ><span style="font-weight: bold">{{ row.itemName }}</span></template
            >
          </el-table-column>
          <el-table-column prop="category" label="项目分类" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.category || '未分类' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="收支属性" width="80" align="center">
            <template #default="{ row }">
              <span :class="row.itemType === 1 ? 'text-success' : 'text-danger'">
                {{ row.itemType === 1 ? '↑ 收入' : '↓ 扣款' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="决算金额" width="120" align="right">
            <template #default="{ row }">
              <span
                class="amount-font"
                :class="row.itemType === 1 ? 'text-success' : 'text-danger'"
              >
                {{
                  Number(row.amount) === 0 ? '0.00' : (row.itemType === 1 ? '+' : '-') + row.amount
                }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="formula"
            label="引擎计算公式追踪 (审计依据)"
            min-width="260"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <code class="formula-block">{{ row.formula || '固定值录入' }}</code>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="snapshotDialog.visible = false">关闭阅览</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="adjustDialog.visible"
      title="特殊情况：人工强制平账"
      width="450px"
      append-to-body
    >
      <el-form :model="adjustForm" label-width="110px">
        <el-alert
          title="系统警告：强制修改单人实发金额会破坏引擎计算的连贯性，该记录将被永久打上'人工干预'标签，请务必在线下保留相关纸质凭证！"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form-item label="操作对象">
          <b>{{ adjustForm.employeeName }}</b> ({{ adjustForm.settlementMonth }})
        </el-form-item>
        <el-form-item label="最终实发金额">
          <div class="flex-align-center" style="width: 100%">
            <el-input-number
              v-model="adjustForm.finalSalary"
              :precision="2"
              :step="100"
              :controls="false"
              style="flex: 1"
            />
            <span style="margin-left: 10px; color: var(--el-text-color-secondary)">本币核算</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialog.visible = false">取消干预</el-button>
        <el-button type="danger" @click="submitAdjust">确认覆盖金额</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资个人明细流水底稿 (Salary Record)
 * 业务价值: 展示每一次引擎运算后生成的不可篡改的 JSON 快照，用于溯源与审计
 * ====================================================================
 */

// 1. Vue 与核心依赖
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

// 2. Element Plus 与图标
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 3. API 与类型定义
import {
  getPaymentRecordPageApi,
  updatePaymentRecordApi,
} from '@/api/salary/paymentrecord/paymentrecord.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
const route = useRoute();

// [UI 状态控制]
const loading = ref(false);
const isFullscreen = ref(false); // 凭证快照的全屏控制器

// [表格与分页数据]
const total = ref(0);
const recordList = ref<any[]>([]);

// [检索条件]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  // 🌟 智能联动：如果从 Summary 汇总单点击某个批次跳转过来，自动带入参数
  summaryId: route.query.summaryId || '',
  keyword: '',
  settlementMonth: '',
});

// [凭证快照弹窗状态]
const snapshotDialog = reactive({ visible: false });
const currentRecord = ref<any>({}); // 当前查看的记录摘要
const snapshotData = ref<any>({}); // 快照解析出的基础参数 (底薪/天数)
const snapshotItems = ref<any[]>([]); // 快照解析出的算薪瀑布流明细

// [人工强制调账弹窗状态]
const adjustDialog = reactive({ visible: false });
const adjustForm = ref<any>({});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.summaryId = ''; // 清除可能从路由带过来的隐式条件
  handleQuery();
};

/** 🌟 [新增：路由参数实时监听]
 * 当 HR 从汇总页面点击不同的批次跳转过来时，确保页面能感知到 summaryId 的变化并自动刷新列表
 */
watch(
  () => route.query.summaryId,
  (newSummaryId) => {
    // 只有当路径中确实带有 summaryId 时才触发强制同步
    if (newSummaryId !== undefined) {
      queryParams.summaryId = newSummaryId;
      handleQuery(); // 立即触发后端查询
    }
  }
);
/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPaymentRecordPageApi(queryParams);
    recordList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** 🌟 核心资产解密：打开并解析引擎固化的 JSON 快照 */
const handleViewSnapshot = (row: any) => {
  currentRecord.value = row;

  // 防御性编程：兼容后端直返 Object 或是源生 JSON String
  if (row.parsedSnapshot) {
    snapshotData.value = row.parsedSnapshot;
    snapshotItems.value = row.parsedSnapshot.items || [];
  } else if (row.detailJson) {
    try {
      const parsedJson =
        typeof row.detailJson === 'string' ? JSON.parse(row.detailJson) : row.detailJson;
      snapshotData.value = parsedJson || {};
      snapshotItems.value = parsedJson.items || [];
    } catch (error) {
      console.error('【薪资快照解析异常】底层溯源数据结构被破坏, rowId:', row.id, error);
      snapshotData.value = {};
      snapshotItems.value = [];
      ElMessage.warning('底层凭证数据解析存在异常，部分快照信息可能丢失');
    }
  } else {
    snapshotData.value = {};
    snapshotItems.value = [];
  }

  snapshotDialog.visible = true;
  isFullscreen.value = false; // 每次打开默认非全屏
};

/** 发起人工干预 */
const handleAdjust = (row: any) => {
  adjustForm.value = { ...row };
  adjustDialog.visible = true;
};

/** 提交人工强制干预结果 (通常伴随后端重新汇总级联更新总账) */
const submitAdjust = async () => {
  await updatePaymentRecordApi(adjustForm.value);
  ElMessage.success('人工平账执行成功！此记录已被锁定干预标记。');
  adjustDialog.visible = false;
  getList();
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
  规范：通用结构样式已由 src/styles/_layout.scss 及 _element.scss 接管
  =====================================================================
*/

/* 金融等宽数字字体，对齐查账利器 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
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
}

/* 最终实发金额强调 */
.real-pay-amount {
  color: var(--el-color-primary);
  font-size: 15px;
}

/* 弹窗分块标题 */
.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 10px 0 15px;
  color: var(--el-text-color-primary);
  font-size: 15px;
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

/* 快照公式溯源的代码块样式，增加研发严谨感 */
.formula-block {
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: inline-block;
  border: 1px solid var(--el-border-color-lighter);
}

.margin-bottom-20 {
  margin-bottom: 20px;
}
.flex-align-center {
  display: flex;
  align-items: center;
}
</style>

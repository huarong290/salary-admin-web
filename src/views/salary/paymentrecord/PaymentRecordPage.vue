<!--src/views/salary/paymentrecord/PaymentRecordPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="90px">
        <el-form-item label="汇总批次ID" prop="summaryId">
          <el-input
            v-model="queryParams.summaryId"
            placeholder="输入汇总单ID追溯"
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

    <el-card shadow="hover" class="table-card">
      <el-table v-loading="loading" :data="recordList" border height="100%">
        <el-table-column label="员工姓名" align="center" width="120" fixed="left">
          <template #default="{ row }">
            <span style="font-weight: 600">{{ row.employeeName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结算月份" align="center" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font status-tag">{{
              row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="底薪(本币)" align="right" width="130">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.baseSalary }}</span>
          </template>
        </el-table-column>
        <el-table-column label="应发合计" align="right" width="120">
          <template #default="{ row }">
            <span class="amount-font" style="color: var(--el-color-success)">
              {{ Number(row.incomeTotal) === 0 ? '0.00' : '+' + row.incomeTotal }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="应扣合计" align="right" width="120">
          <template #default="{ row }">
            <span class="amount-font" style="color: var(--el-color-danger)">
              {{ Number(row.deductionTotal) === 0 ? '0.00' : '-' + row.deductionTotal }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="实发金额" align="right" width="140">
          <template #default="{ row }">
            <span
              class="amount-font"
              style="color: var(--el-color-primary); font-size: 15px; font-weight: bold"
              >{{ row.finalSalary }}</span
            >
          </template>
        </el-table-column>
        <el-table-column label="核算方式" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.isManual === 1 ? 'warning' : 'info'" class="status-tag" size="small">
              {{ row.isManual === 1 ? '人工干预' : '系统计算' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="View" @click="handleViewSnapshot(row)"
              >凭证快照</el-button
            >
            <el-button
              v-hasPerm="['salary:record:edit']"
              link
              type="warning"
              icon="Edit"
              @click="handleAdjust(row)"
              >强制平账</el-button
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
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
              currentRecord.settlementMonth
            }})</span
          >
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="snapshot-content">
        <div class="section-title">计算引擎上下文参数</div>
        <el-descriptions border :column="3" size="small" class="margin-bottom-20">
          <el-descriptions-item label="汇总批次溯源"
            ><span class="amount-font text-secondary">{{
              currentRecord.summaryId
            }}</span></el-descriptions-item
          >
          <el-descriptions-item label="档案标准底薪"
            ><span class="amount-font" style="font-weight: bold; color: var(--el-color-primary)">{{
              snapshotData.baseSalary || '0.00'
            }}</span></el-descriptions-item
          >
          <el-descriptions-item label="结算币种">{{
            snapshotData.currency || 'CNY'
          }}</el-descriptions-item>
          <el-descriptions-item label="当月计薪天数"
            ><span class="amount-font">{{ snapshotData.monthDays || '0' }}</span>
            天</el-descriptions-item
          >
          <el-descriptions-item label="实际出勤天数">
            <span
              class="amount-font"
              :style="{
                color:
                  Number(snapshotData.attendanceDays) < Number(snapshotData.monthDays)
                    ? 'var(--el-color-danger)'
                    : 'var(--el-color-success)',
              }"
            >
              {{ snapshotData.attendanceDays || '0' }}
            </span>
            天
          </el-descriptions-item>
          <el-descriptions-item label="全勤奖资格">
            <el-tag
              :type="snapshotData.fullAttendanceFlag === 1 ? 'success' : 'info'"
              size="small"
              class="status-tag"
            >
              {{ snapshotData.fullAttendanceFlag === 1 ? '已触发' : '未满足' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-title">收支计算瀑布流 (算薪流水账)</div>
        <el-table :data="snapshotItems" border stripe max-height="400">
          <el-table-column prop="itemName" label="明细项目" width="150" />
          <el-table-column prop="category" label="分类" width="100" align="center">
            <template #default="{ row }"
              ><el-tag size="small" type="info" class="status-tag">{{
                row.category || '通用'
              }}</el-tag></template
            >
          </el-table-column>
          <el-table-column label="收支属性" width="90" align="center">
            <template #default="{ row }">
              <span
                :style="{
                  color: row.itemType === 1 ? 'var(--el-color-success)' : 'var(--el-color-danger)',
                }"
              >
                {{ row.itemType === 1 ? '↑ 收入' : '↓ 扣款' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="决算金额" width="120" align="right">
            <template #default="{ row }">
              <span
                class="amount-font"
                :style="{
                  color: row.itemType === 1 ? 'var(--el-color-success)' : 'var(--el-color-danger)',
                }"
              >
                {{
                  Number(row.amount) === 0 ? '0.00' : (row.itemType === 1 ? '+' : '-') + row.amount
                }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="formula" label="计算公式追踪 (审计依据)" min-width="260">
            <template #default="{ row }"
              ><code class="formula-code">{{ row.formula || '固定值录入' }}</code></template
            >
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="snapshotDialog.visible = false">关闭阅览</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialog.visible" width="450px" append-to-body draggable>
      <template #header>
        <div class="dialog-custom-header"><span class="title">特殊干预：强制平账</span></div>
      </template>
      <el-form :model="adjustForm" label-width="110px">
        <el-alert
          title="警告：此操作将永久覆盖引擎计算结果！"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form-item label="操作对象"
          ><b>{{ adjustForm.employeeName }}</b> ({{ adjustForm.settlementMonth }})</el-form-item
        >
        <el-form-item label="最终实发金额">
          <el-input-number
            v-model="adjustForm.finalSalary"
            :precision="2"
            :controls="false"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="adjustDialog.visible = false">取消干预</el-button>
          <el-button type="danger" @click="submitAdjust">确认覆盖金额</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资个人明细流水底稿 (Salary Payment Record)
 * 业务价值: 提供不可篡改的 JSON 凭证解析，支持汇总穿透追溯。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

import {
  getPaymentRecordPageApi,
  updatePaymentRecordApi,
} from '@/api/salary/paymentrecord/paymentrecord.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
const route = useRoute();

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);

// [表格与分页状态]
const total = ref(0);
const recordList = ref<any[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  summaryId: route.query.summaryId || '', // 🌟 核心：承接外部跳转
  keyword: '',
  settlementMonth: '',
});

// [弹窗状态控制]
const snapshotDialog = reactive({ visible: false });
const currentRecord = ref<any>({});
const snapshotData = ref<any>({});
const snapshotItems = ref<any[]>([]);
const adjustDialog = reactive({ visible: false });
const adjustForm = ref<any>({});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

/** 触发带条件搜索 (必须重置页码为 1) */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.summaryId = '';
  handleQuery();
};

/** 分页大小切换 */
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val;
  getList();
};

/** 当前页码切换 */
const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val;
  getList();
};

/** 🌟 路由穿透监听 */
watch(
  () => route.query.summaryId,
  (newVal) => {
    if (newVal !== undefined) {
      queryParams.summaryId = newVal;
      handleQuery();
    }
  }
);

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 获取分页流水数据 */
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

/** 查看快照详情 */
const handleViewSnapshot = (row: any) => {
  currentRecord.value = row;
  if (row.parsedSnapshot) {
    snapshotData.value = row.parsedSnapshot;
    snapshotItems.value = row.parsedSnapshot.items || [];
  } else if (row.detailJson) {
    try {
      const parsed =
        typeof row.detailJson === 'string' ? JSON.parse(row.detailJson) : row.detailJson;
      snapshotData.value = parsed || {};
      snapshotItems.value = parsed.items || [];
    } catch {
      ElMessage.error('底层快照数据解析失败');
    }
  }
  snapshotDialog.visible = true;
  isFullscreen.value = false;
};

/** 发起人工强制干预 */
const handleAdjust = (row: any) => {
  adjustForm.value = { ...row };
  adjustDialog.visible = true;
};

/** 提交调账结果 */
const submitAdjust = async () => {
  await updatePaymentRecordApi(adjustForm.value);
  ElMessage.success('操作成功，实发金额已覆盖');
  adjustDialog.visible = false;
  getList();
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

.formula-code {
  font-family: 'Consolas', 'Monaco', monospace;
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
}

.margin-bottom-20 {
  margin-bottom: 20px;
}
</style>

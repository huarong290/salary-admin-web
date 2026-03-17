<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="汇总批次ID">
          <el-input
            v-model="queryParams.summaryId"
            placeholder="输入批次ID"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="员工姓名">
          <el-input
            v-model="queryParams.employeeName"
            placeholder="输入姓名搜索"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="结算月份">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            clearable
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
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
        />
        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100" />
        <el-table-column label="底薪" align="center" prop="baseSalary" width="120" />

        <el-table-column label="应发合计" align="center" prop="incomeTotal" width="110">
          <template #default="scope">
            <span class="text-success">
              {{ Number(scope.row.incomeTotal) === 0 ? '0' : '+' + scope.row.incomeTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="应扣合计" align="center" prop="deductionTotal" width="110">
          <template #default="scope">
            <span class="text-danger">
              {{ Number(scope.row.deductionTotal) === 0 ? '0' : '-' + scope.row.deductionTotal }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="实发金额" align="center" prop="finalSalary" width="130">
          <template #default="scope">
            <b style="color: #409eff">{{ scope.row.finalSalary }}</b>
          </template>
        </el-table-column>
        <el-table-column label="核算类型" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isManual === 1 ? 'warning' : 'info'">
              {{ scope.row.isManual === 1 ? '人工修正' : '系统自动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleViewSnapshot(scope.row)"
              >明细快照</el-button
            >
            <el-button
              v-hasPerm="['salary:record:edit']"
              link
              type="warning"
              icon="Edit"
              @click="handleAdjust(scope.row)"
              >微调</el-button
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
      :title="`薪资核算凭证快照 - ${currentRecord.employeeName}`"
      width="850px"
    >
      <el-descriptions border :column="3" size="small" style="margin-bottom: 15px">
        <el-descriptions-item label="员工姓名">
          <b style="color: #303133">{{ currentRecord.employeeName }}</b>
        </el-descriptions-item>
        <el-descriptions-item label="结算月份">
          <el-tag size="small" type="primary" effect="light">
            {{ currentRecord.settlementMonth || '当期' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="汇总批次ID">
          <span style="color: #909399">{{ currentRecord.summaryId }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="档案标准底薪">
          <span style="font-weight: bold; color: #409eff">{{
            snapshotData.baseSalary || '0.00'
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="当月计薪天数">
          {{ snapshotData.monthDays || '0' }} 天
        </el-descriptions-item>
        <el-descriptions-item label="实际出勤天数">
          <span
            :style="{
              color:
                Number(snapshotData.attendanceDays) < Number(snapshotData.monthDays)
                  ? '#f56c6c'
                  : '#67c23a',
              fontWeight: 'bold',
            }"
          >
            {{ snapshotData.attendanceDays || '0' }} 天
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <el-table :data="snapshotItems" border stripe max-height="450">
        <el-table-column prop="itemName" label="明细项目" width="140" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.category || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收支" width="70" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.itemType === 1 ? 'success' : 'danger'"
              effect="dark"
              size="small"
            >
              {{ scope.row.itemType === 1 ? '收入' : '扣款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="核算金额" width="110" align="right">
          <template #default="scope">
            <span :class="scope.row.itemType === 1 ? 'text-success' : 'text-danger'">
              {{
                Number(scope.row.amount) === 0
                  ? '0'
                  : (scope.row.itemType === 1 ? '+' : '-') + scope.row.amount
              }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="formula"
          label="计算依据 (公式 / 来源说明)"
          min-width="260"
          show-overflow-tooltip
        >
          <template #default="scope">
            <span style="color: #606266; font-family: monospace; font-size: 13px">
              {{ scope.row.formula }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="adjustDialog.visible" title="手动调整金额" width="400px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="员工"
          ><b>{{ adjustForm.employeeName }}</b></el-form-item
        >
        <el-form-item label="实发金额">
          <el-input-number v-model="adjustForm.finalSalary" :precision="2" :step="100" />
        </el-form-item>
        <el-alert
          title="注意：手动修改后，该记录将标记为'人工修正'，且会自动重新计算汇总单总额。"
          type="info"
          :closable="false"
        />
      </el-form>
      <template #footer>
        <el-button @click="adjustDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  getPaymentRecordPageApi,
  updatePaymentRecordApi,
} from '@/api/salary/paymentrecord/paymentrecord.ts';

const route = useRoute();
const loading = ref(false);
const total = ref(0);
const recordList = ref<any[]>([]);
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  summaryId: route.query.summaryId || '', // 支持从汇总页面跳转过来自动带入 ID
});

// 快照弹窗控制
const snapshotDialog = reactive({ visible: false });
const snapshotData = ref<any>({}); // 🌟 新增：存放顶部的出勤与底薪对象
const snapshotItems = ref<any[]>([]); // 存放明细数组
const currentRecord = ref<any>({});

// 调整弹窗控制
const adjustDialog = reactive({ visible: false });
const adjustForm = ref<any>({});

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPaymentRecordPageApi(queryParams);
    recordList.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  getList();
};
const resetQuery = () => {
  queryParams.summaryId = '';
  getList();
};

const handleViewSnapshot = (row: any) => {
  currentRecord.value = row;

  // 🌟 后端已经帮我们解析好了，直接用 parsedSnapshot！
  if (row.parsedSnapshot) {
    snapshotData.value = row.parsedSnapshot;
    snapshotItems.value = row.parsedSnapshot.items || [];
  }
  // 兼容逻辑：如果后端因为某种原因没传 parsedSnapshot，前端自己 parse 一下 detailJson
  else if (row.detailJson) {
    try {
      const parsedJson =
        typeof row.detailJson === 'string' ? JSON.parse(row.detailJson) : row.detailJson;
      snapshotData.value = parsedJson || {};
      snapshotItems.value = parsedJson.items || [];
    } catch (error) {
      // 1. 本地开发调试兜底
      console.error('【薪资快照解析异常】汇总单数据结构损坏, rowId:', row.id, error);

      // 2. 企业级扩展：如果是生产环境，这里通常会调用全局监控上报工具
      // 比如：Sentry.captureException(error, { extra: { rowId: row.id, json: row.detailJson } });
      // 或者：appMonitor.error('SalarySnapshotParseError', error);

      // 3. 优雅降级：保证页面不崩溃，给出安全默认值
      snapshotData.value = {};
      snapshotItems.value = [];

      // 4. (可选) 给用户一个友好的轻提示，防止财务对着空白发呆
      ElMessage.warning('该条明细历史快照数据格式存在异常，部分信息可能无法展示');
    }
  } else {
    snapshotData.value = {};
    snapshotItems.value = [];
  }

  snapshotDialog.visible = true;
};

const handleAdjust = (row: any) => {
  adjustForm.value = { ...row };
  adjustDialog.visible = true;
};

const submitAdjust = async () => {
  await updatePaymentRecordApi(adjustForm.value);
  ElMessage.success('调整成功');
  adjustDialog.visible = false;
  getList();
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* 布局样式已由全局接管 */
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

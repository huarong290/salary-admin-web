<!--src/views/salary/paymentrecord/PaymentRecordPage.vue-->
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
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="recordList" border height="100%">
        <el-table-column label="员工姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="底薪" align="center" prop="baseSalary" width="120" />
        <el-table-column label="应发合计" align="center" prop="incomeTotal" width="110">
          <template #default="scope">
            <span class="text-success">+{{ scope.row.incomeTotal }}</span>
          </template>
        </el-table-column>
        <el-table-column label="应扣合计" align="center" prop="deductionTotal" width="110">
          <template #default="scope">
            <span class="text-danger">-{{ scope.row.deductionTotal }}</span>
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

    <el-dialog v-model="snapshotDialog.visible" title="核算详情快照 (不可篡改依据)" width="550px">
      <el-descriptions border :column="1">
        <el-descriptions-item label="底薪金额">{{ currentRecord.baseSalary }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="snapshotItems" border style="margin-top: 15px">
        <el-table-column prop="itemName" label="项目名称" />
        <el-table-column label="类型" width="80">
          <template #default="scope">
            {{ scope.row.itemType === 1 ? '收入' : '扣款' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            <span :class="scope.row.itemType === 1 ? 'text-success' : 'text-danger'">
              {{ scope.row.itemType === 1 ? '+' : '-' }}{{ scope.row.amount }}
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
const snapshotItems = ref([]);
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
  if (row.detailJson) {
    snapshotItems.value = JSON.parse(row.detailJson);
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

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="如: 202603"
            value-format="YYYYMM"
            clearable
          />
        </el-form-item>
        <el-form-item label="周期ID" prop="periodId">
          <el-input
            v-model="queryParams.periodId"
            placeholder="精确匹配周期ID"
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
        <el-button
          v-hasPerm="['salary:summary:calc']"
          type="success"
          icon="DataBoard"
          @click="handleOpenCalc"
          >一键核算发薪</el-button
        >
        <el-button
          v-hasPerm="['salary:summary:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" fixed="left" />
        <el-table-column
          label="员工姓名"
          align="center"
          prop="employeeName"
          width="120"
          fixed="left"
        />
        <el-table-column label="结算月份" align="center" prop="settlementMonth" width="100" />
        <el-table-column label="应发总计(本币)" align="center" prop="salarySubtotal" width="130">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: bold">{{ scope.row.salarySubtotal }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="应扣总计(本币)"
          align="center"
          prop="salaryDeductionTotal"
          width="130"
        >
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold">{{
              scope.row.salaryDeductionTotal
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本币实发金额" align="center" prop="salaryTotal" width="130">
          <template #default="scope">
            <span style="color: #409eff; font-weight: bold">{{ scope.row.salaryTotal }}</span>
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

        <el-table-column label="操作" align="center" width="120" fixed="right">
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

    <el-dialog v-model="calcDialog.visible" title="触发薪资引擎核算" width="450px" append-to-body>
      <el-form ref="calcFormRef" :model="calcForm" :rules="calcRules" label-width="100px">
        <el-alert
          title="注意：这将汇总该周期内所有明细数据，若数据已存在将被覆盖。"
          type="warning"
          show-icon
          style="margin-bottom: 20px"
        />
        <el-form-item label="周期ID" prop="periodId">
          <el-input v-model="calcForm.periodId" placeholder="请输入目标周期ID" />
        </el-form-item>
        <el-form-item label="审批备注" prop="remark">
          <el-input v-model="calcForm.remark" type="textarea" placeholder="如: 财务张三复核通过" />
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
import type { SummaryQueryReqDTO, SummaryVO } from '@/types/salary/summary/summary.ts';
import {
  batchDeleteSummaryApi,
  calculateSummaryApi,
  deleteSummaryApi,
  getSummaryPageApi,
} from '@/api/salary/summary/summary.ts';

const loading = ref(false);
const calculating = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

const queryParams = reactive<SummaryQueryReqDTO>({ pageNum: 1, pageSize: 10 });
const dataList = ref<SummaryVO[]>([]);
// 声明顶部查询表单的 Ref，用于实现一键重置 (resetFields) 功能
const queryFormRef = ref<FormInstance>();
// 核算弹窗状态
const calcDialog = reactive({ visible: false });
const calcForm = ref<any>({});
const calcFormRef = ref<FormInstance>();

const calcRules = reactive<FormRules>({
  periodId: [{ required: true, message: '必须指定薪资周期ID', trigger: 'blur' }],
});

// 状态字典解析
const getPayStatusType = (status: any) => {
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  if (status === 3) return 'warning';
  return 'info';
};
const getPayStatusLabel = (status: any) => {
  if (status === 1) return '已支付';
  if (status === 2) return '支付失败';
  if (status === 3) return '账户锁定';
  return '未支付';
};

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

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: SummaryVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

// 🌟 打开核算弹窗
const handleOpenCalc = () => {
  calcForm.value = {};
  calcDialog.visible = true;
};

// 🌟 提交核算请求
const submitCalculate = async () => {
  if (!calcFormRef.value) return;
  await calcFormRef.value.validate(async (valid) => {
    if (valid) {
      calculating.value = true;
      try {
        await calculateSummaryApi({
          periodId: calcForm.value.periodId,
          remark: calcForm.value.remark,
        });
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

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.app-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.search-card {
  .el-form-item {
    margin-bottom: 0;
  }
}
.table-card {
  flex: 1;
  .toolbar {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
  }
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

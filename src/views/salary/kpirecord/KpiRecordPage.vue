<!--src/views/salary/kpirecord/KpiRecordPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="模糊搜索" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="输入员工姓名/工号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择考核月份"
            value-format="YYYYMM"
            clearable
          />
        </el-form-item>
        <el-form-item label="单据状态" prop="auditStatus">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="打分中/草稿" :value="0" />
            <el-option label="已定稿/可算薪" :value="1" />
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
          v-hasPerm="['salary:kpi_record:init']"
          type="primary"
          icon="DocumentAdd"
          @click="handleOpenInit"
          >派发本月绩效单</el-button
        >
        <el-button
          v-hasPerm="['salary:kpi_record:confirm']"
          type="success"
          icon="CircleCheck"
          :disabled="multiple"
          @click="handleBatchConfirm"
          >批量审核定稿</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" :selectable="canSelect" />
        <el-table-column label="结算月份" align="center" width="100" fixed="left">
          <template #default="{ row }">
            <el-tag effect="plain" class="amount-font status-tag">{{ row.settlementMonth }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="员工姓名"
          align="center"
          prop="employeeName"
          width="120"
          fixed="left"
        />
        <el-table-column
          label="所属部门"
          align="center"
          prop="departmentName"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column label="绩效评级" align="center" width="120">
          <template #default="{ row }">
            <el-tag
              v-if="row.kpiGrade !== 'WAITING'"
              :type="getGradeTagType(row.kpiGrade)"
              effect="dark"
              style="font-weight: bold"
            >
              {{ row.kpiGrade }} 级
            </el-tag>
            <span v-else class="text-secondary">- 待评估 -</span>
          </template>
        </el-table-column>
        <el-table-column label="考核得分" align="right" prop="kpiScore" width="100">
          <template #default="{ row }">
            <span class="amount-font">{{ row.kpiScore || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效系数" align="center" width="110">
          <template #default="{ row }">
            <span
              class="amount-font"
              :class="
                row.kpiCoefficient > 1
                  ? 'text-success'
                  : row.kpiCoefficient < 1
                    ? 'text-danger'
                    : ''
              "
            >
              x {{ Number(row.kpiCoefficient).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" align="center" width="120">
          <template #default="{ row }">
            <el-tag :type="row.auditStatus === 1 ? 'success' : 'primary'" size="small">
              {{ row.auditStatus === 1 ? '已定稿(可算薪)' : '打分中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="评语/说明"
          align="left"
          prop="evaluateRemark"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="操作" align="center" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:kpi_record:evaluate']"
              link
              :type="row.auditStatus === 1 ? 'info' : 'primary'"
              :icon="row.auditStatus === 1 ? 'View' : 'Edit'"
              @click="handleEvaluate(row)"
            >
              {{ row.auditStatus === 1 ? '查看' : '评估绩效' }}
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

    <el-dialog v-model="initDialog.visible" width="500px" append-to-body draggable>
      <template #header>
        <div class="dialog-custom-header"><span class="title">派发本月绩效单</span></div>
      </template>
      <div class="form-tips" style="margin-bottom: 20px">
        系统将读取指定月份的【考勤周期表】，为所有在岗员工生成一张空白的绩效草稿单供主管打分。
      </div>
      <el-form ref="initFormRef" :model="initForm" :rules="initRules" label-width="90px">
        <el-form-item label="目标月份" prop="settlementMonth">
          <el-date-picker
            v-model="initForm.settlementMonth"
            type="month"
            value-format="YYYYMM"
            placeholder="请选择结算月份"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="initDialog.visible = false">取 消</el-button>
          <el-button type="primary" icon="DocumentAdd" :loading="submitLoading" @click="submitInit"
            >一键生成</el-button
          >
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="evaluateDialog.visible"
      width="600px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="closeEvaluate"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">员工绩效评估</span>
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <div v-if="evaluateForm.auditStatus === 1" class="form-tips" style="margin-bottom: 20px">
        <el-icon><WarningFilled /></el-icon>
        该考核单已审核定稿，当前仅供只读查看。如需修改，请先撤销审核。
      </div>

      <el-form
        ref="evaluateFormRef"
        :model="evaluateForm"
        :rules="evaluateRules"
        label-width="100px"
        :disabled="evaluateForm.auditStatus === 1"
      >
        <div class="section-title">员工信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名">
              <el-input :value="evaluateForm.employeeName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算月份">
              <el-input :value="evaluateForm.settlementMonth" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">考核结果</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最终评级" prop="kpiGrade">
              <el-select
                v-model="evaluateForm.kpiGrade"
                placeholder="请选择等级"
                style="width: 100%"
              >
                <el-option label="S 级 (卓越)" value="S" />
                <el-option label="A 级 (优秀)" value="A" />
                <el-option label="B 级 (达标)" value="B" />
                <el-option label="C 级 (需改进)" value="C" />
                <el-option label="D 级 (不合格)" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="具体打分" prop="kpiScore">
              <el-input-number
                v-model="evaluateForm.kpiScore"
                :min="0"
                :max="100"
                :precision="2"
                controls-position="right"
                style="width: 100%"
                placeholder="选填"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="考核评语" prop="evaluateRemark">
          <el-input
            v-model="evaluateForm.evaluateRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入评价说明 (C级及以下建议必填)"
          />
        </el-form-item>
      </el-form>

      <template v-if="evaluateForm.auditStatus === 0" #footer>
        <div class="dialog-footer">
          <el-button @click="closeEvaluate">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitEvaluate"
            >提 交 评 估</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工月度绩效考核大盘 (派发、主管打分、自动核算系数、定稿算薪)
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区
 * --------------------------------------------------------------------
 */
// 1.1  Vue 与核心依赖
import { ref, reactive, onMounted } from 'vue';
// 1.2 Element Plus 与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { WarningFilled, FullScreen, Minus } from '@element-plus/icons-vue';

// 1.3 API 与类型定义
import type {
  KpiBatchInitReqDTO,
  KpiEvaluateReqDTO,
  KpiRecordQueryReqDTO,
  SalaryKpiRecordVO,
} from '@/types/salary/kpirecord/kpiRecord.ts';

import {
  confirmKpiApi,
  evaluateKpiApi,
  getKpiRecordPageApi,
  initMonthlyKpiApi,
} from '@/api/salary/kpirecord/kpiRecord.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区
 * --------------------------------------------------------------------
 */
// UI 状态
const loading = ref(false);
const submitLoading = ref(false);
const isFullscreen = ref(false);

// 表格与分页
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<SalaryKpiRecordVO[]>([]);

// 查询表单
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<KpiRecordQueryReqDTO>({ pageNum: 1, pageSize: 10 });

// 初始化弹窗
const initDialog = reactive({ visible: false });
const initFormRef = ref<FormInstance>();
const initForm = reactive<KpiBatchInitReqDTO>({ settlementMonth: '' });
const initRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '请选择需要生成的结算月份', trigger: 'change' }],
});

// 评估打分弹窗
const evaluateDialog = reactive({ visible: false });
const evaluateFormRef = ref<FormInstance>();
const evaluateForm = ref<any>({});
const evaluateRules = reactive<FormRules>({
  kpiGrade: [{ required: true, message: '必须选择考核评级', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区
 * --------------------------------------------------------------------
 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

/** 只有未确认状态的才能被勾选用于批量定稿 */
const canSelect = (row: SalaryKpiRecordVO) => row.auditStatus === 0;

const handleSelectionChange = (selection: SalaryKpiRecordVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 动态计算等级标签颜色 */
const getGradeTagType = (grade: string) => {
  switch (grade) {
    case 'S':
      return 'danger';
    case 'A':
      return 'success';
    case 'B':
      return 'primary';
    case 'C':
      return 'warning';
    case 'D':
      return 'info';
    default:
      return 'info';
  }
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区
 * --------------------------------------------------------------------
 */
/** 1. 加载大盘列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getKpiRecordPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** 2. 打开初始化派发弹窗 */
const handleOpenInit = () => {
  initForm.settlementMonth = queryParams.settlementMonth || '';
  initDialog.visible = true;
};

const submitInit = async () => {
  if (!initFormRef.value) return;
  await initFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        await initMonthlyKpiApi(initForm);
        ElMessage.success('批量生成绩效草稿单成功！');
        initDialog.visible = false;
        // 自动查询刚才初始化的月份
        queryParams.settlementMonth = initForm.settlementMonth;
        handleQuery();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

/** 3. 打开评估打分弹窗 */
const handleEvaluate = (row: SalaryKpiRecordVO) => {
  evaluateForm.value = {
    id: row.id,
    employeeName: row.employeeName,
    settlementMonth: row.settlementMonth,
    kpiGrade: row.kpiGrade === 'WAITING' ? '' : row.kpiGrade,
    kpiScore: row.kpiScore,
    evaluateRemark: row.evaluateRemark,
    auditStatus: row.auditStatus, // 透传状态用于控制只读
  };
  evaluateDialog.visible = true;
  isFullscreen.value = false;
};

const closeEvaluate = () => {
  evaluateDialog.visible = false;
  evaluateFormRef.value?.resetFields();
};

const submitEvaluate = async () => {
  if (!evaluateFormRef.value) return;
  await evaluateFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const payload: KpiEvaluateReqDTO = {
          id: evaluateForm.value.id,
          kpiGrade: evaluateForm.value.kpiGrade,
          kpiScore: evaluateForm.value.kpiScore,
          evaluateRemark: evaluateForm.value.evaluateRemark,
        };
        await evaluateKpiApi(payload);
        ElMessage.success('评估打分提交成功！系数已自动核算');
        closeEvaluate();
        getList();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

/** 4. 批量审核定稿 */
const handleBatchConfirm = () => {
  ElMessageBox.confirm(
    `确认将选中的 ${selectedIds.value.length} 条绩效单定稿吗？<br/><br/><span style="color:red">注：定稿后不可再修改打分，且该系数将被允许发薪引擎直接抓取！</span>`,
    '定稿确认',
    {
      dangerouslyUseHTMLString: true,
      type: 'warning',
      confirmButtonText: '确认定稿锁定',
    }
  )
    .then(async () => {
      loading.value = true;
      try {
        await confirmKpiApi(selectedIds.value);
        ElMessage.success('批量定稿成功！发薪引擎已可抓取该批次系数');
        getList();
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区
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
.form-tips {
  font-size: 12px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  .el-icon {
    margin-top: 2px;
  }
}
</style>

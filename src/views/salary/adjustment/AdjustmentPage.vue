<!--src/views/salary/adjustment/AdjustmentPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="员工" prop="employeeId">
          <employee-select
            v-model="queryParams.employeeId"
            style="width: 200px"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item label="核算月份" prop="periodId">
          <period-select
            v-model="queryParams.periodId"
            :employee-id="queryParams.employeeId"
            style="width: 200px"
            @change="handleQuery"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="草稿" :value="0" />
            <el-option label="已生效" :value="1" />
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
          v-hasPerm="['salary:adjustment:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
        >
          新增手工账
        </el-button>
        <el-button
          v-hasPerm="['salary:adjustment:audit']"
          type="success"
          icon="Check"
          :disabled="multiple"
          @click="handleBatchAudit(1)"
        >
          批量生效
        </el-button>
        <el-button
          v-hasPerm="['salary:adjustment:audit']"
          type="warning"
          icon="Close"
          :disabled="multiple"
          @click="handleBatchAudit(0)"
        >
          批量撤回
        </el-button>
        <el-button
          v-hasPerm="['salary:adjustment:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
        >
          批量删除
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
        <el-table-column label="编号" align="center" width="80">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="核算月份" align="center" prop="settlementMonth" width="100">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.settlementMonth || '未关联' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="员工信息" align="center" min-width="120">
          <template #default="{ row }">
            <div style="font-weight: bold">{{ row.employeeName }}</div>
            <div class="text-secondary" style="font-size: 12px">ID: {{ row.employeeId }}</div>
          </template>
        </el-table-column>
        <el-table-column label="项目名称" align="center" prop="itemName" min-width="140">
          <template #default="{ row }">
            <span>{{ row.itemName }}</span>
            <div class="text-secondary" style="font-size: 12px">[{{ row.itemCode }}]</div>
          </template>
        </el-table-column>

        <el-table-column label="原币金额" align="center" width="130">
          <template #default="{ row }">
            <span class="amount-font">{{ row.originalAmount }} {{ row.currency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="核算汇率" align="center" prop="exchangeRate" width="100" />
        <el-table-column label="折算本币 (¥)" align="center" width="130">
          <template #default="{ row }">
            <span
              class="amount-font"
              :class="row.adjustType === 1 ? 'text-success' : 'text-danger'"
            >
              {{ row.adjustType === 1 ? '+' : '-' }}{{ row.settlementAmount }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-tag">
              {{ row.status === 1 ? '已生效' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="info" icon="Document" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
              v-hasPerm="['salary:adjustment:edit']"
              link
              type="primary"
              icon="Edit"
              :disabled="row.status === 1"
              @click="handleUpdate(row)"
            >
              修改
            </el-button>
            <el-button
              v-hasPerm="['salary:adjustment:del']"
              link
              type="danger"
              icon="Delete"
              :disabled="row.status === 1"
              @click="handleDelete(row)"
            >
              删除
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

    <el-dialog
      v-model="dialog.visible"
      width="680px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ dialog.title }}</span>
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <div class="section-title">基础人员信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择员工" prop="employeeId">
              <employee-select
                v-model="form.employeeId"
                :disabled="!!form.id"
                @change="form.periodId = undefined"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核算月份" prop="periodId">
              <period-select
                v-model="form.periodId"
                :employee-id="form.employeeId"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="薪资项目" prop="itemCode">
              <item-config-select v-model="form.itemCode" @change="handleItemChange" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目名称">
              <el-input v-model="form.itemName" disabled placeholder="选择项目后自动填充" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="调账类型" prop="adjustType">
              <el-radio-group v-model="form.adjustType">
                <el-radio :label="1">补发收入 (+)</el-radio>
                <el-radio :label="2">扣减款项 (-)</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">财务金额配置</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="原币种" prop="currency">
              <el-select v-model="form.currency" placeholder="币种" class="w-full">
                <el-option label="CNY" value="CNY" />
                <el-option label="USD" value="USD" />
                <el-option label="HKD" value="HKD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原币金额" prop="originalAmount">
              <el-input-number
                v-model="form.originalAmount"
                :precision="2"
                :step="100"
                :controls="false"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前汇率" prop="exchangeRate">
              <el-input-number
                v-model="form.exchangeRate"
                :precision="6"
                :step="0.1"
                :controls="false"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="本币预览">
              <div class="preview-amount">
                <span v-if="form.originalAmount && form.exchangeRate">
                  ¥ {{ (form.originalAmount * form.exchangeRate).toFixed(4) }}
                </span>
                <span v-else class="text-secondary">请输入金额和汇率系统自动试算</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注说明" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                placeholder="请输入调账原因，以备财务审计..."
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 手工账变动项详情-->
    <el-dialog v-model="detailVisible" title="手工账变动项详情" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单据编号" :span="2">
          <span class="amount-font">{{ detailData.id }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="员工信息">
          {{ detailData.employeeName || 'ID: ' + detailData.employeeId }}
        </el-descriptions-item>
        <el-descriptions-item label="核算周期">
          {{ detailData.periodId }}
        </el-descriptions-item>

        <el-descriptions-item label="项目名称">
          {{ detailData.itemName }}
        </el-descriptions-item>
        <el-descriptions-item label="项目编码">
          <el-tag size="small">{{ detailData.itemCode }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="调账类型">
          <el-tag :type="detailData.adjustType === 1 ? 'success' : 'danger'">
            {{ detailData.adjustType === 1 ? '补发收入' : '扣减款项' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'info'" effect="dark">
            {{ detailData.status === 1 ? '已生效' : '草稿' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="原币金额">
          <span class="amount-font">{{ detailData.originalAmount }} {{ detailData.currency }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="核算汇率">
          <span class="amount-font">{{ detailData.exchangeRate }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="结算本币金额" :span="2">
          <div style="display: flex; align-items: center; gap: 10px">
            <b
              class="amount-font"
              :class="detailData.adjustType === 1 ? 'text-success' : 'text-danger'"
              style="font-size: 18px"
            >
              ¥ {{ detailData.settlementAmount }}
            </b>
            <el-tag v-if="detailData.adjustType === 2" type="danger" size="small"
              >将从应发工资中扣除</el-tag
            >
            <el-tag v-else type="success" size="small">将计入应发工资</el-tag>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="备注说明" :span="2">
          {{ detailData.remark || '无' }}
        </el-descriptions-item>

        <el-descriptions-item label="创建信息" :span="2">
          <div class="text-secondary" style="font-size: 12px">
            {{ detailData.createBy }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ detailData.createTime }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 【薪资专项调整】管理企业非固定项薪资（如迟到罚款、节日福利）。
 * 依赖关联: 依赖薪资引擎周期(periodId)，数据生效后将参与 Aviator 引擎核算。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted, watch } from 'vue';

// [2] 第三方 UI 组件库与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  getAdjustmentPageApi,
  addAdjustmentApi,
  editAdjustmentApi,
  deleteAdjustmentsApi,
  auditAdjustmentsApi,
  getAdjustmentDetailApi,
} from '@/api/salary/adjustment/adjustment';

// [4] TS 强类型定义约束
import type {
  AdjustmentQueryReqDTO,
  SalaryAdjustmentVO,
} from '@/types/salary/adjustment/adjustment';
import EmployeeSelect from '@/views/salary/employee/components/EmployeeSelect.vue';
import PeriodSelect from '@/views/salary/period/components/PeriodSelect.vue';
import ItemConfigSelect from '@/views/salary/itemconfig/components/ItemConfigSelect.vue';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);

// [表格与分页状态]
const total = ref(0);
const dataList = ref<SalaryAdjustmentVO[]>([]);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<AdjustmentQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  periodId: undefined,
  employeeId: undefined,
  status: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  periodId: [{ required: true, message: '核算周期不能为空', trigger: 'blur' }],
  employeeId: [{ required: true, message: '员工ID不能为空', trigger: 'blur' }],
  itemCode: [{ required: true, message: '项目编码不能为空', trigger: 'blur' }],
  itemName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
  adjustType: [{ required: true, message: '请选择调账类型', trigger: 'change' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
  originalAmount: [{ required: true, message: '原币金额不能为空', trigger: 'blur' }],
  exchangeRate: [{ required: true, message: '汇率不能为空', trigger: 'blur' }],
});
// [详情弹窗状态]
const detailVisible = ref(false);
const detailData = ref<any>({});
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
const handleSelectionChange = (selection: SalaryAdjustmentVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 触发带条件搜索 (重置页码) */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏并刷新列表 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 关闭并清理操作弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};
/** 选择项目后的自动填充逻辑 */
const handleItemChange = (item: any) => {
  if (item) {
    form.value.itemName = item.itemName;
    // 假设后端 OptionVO 包含 itemCategory (1-收入, 2-扣减)
    // 自动切换调账类型单选框，防止用户选错
    if (item.itemCategory) {
      form.value.adjustType = item.itemCategory;
    }
  } else {
    form.value.itemName = '';
  }
};

/** 发起：查看详情 */
const handleDetail = async (row: SalaryAdjustmentVO) => {
  try {
    loading.value = true; // 开启全局加载
    // 🌟 调用新增加的 API 接口
    const res = await getAdjustmentDetailApi(row.id);
    detailData.value = res;
    detailVisible.value = true;
  } catch (error) {
    // 异常由拦截器处理
  } finally {
    loading.value = false;
  }
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
    const res = await getAdjustmentPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载数据失败', error);
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增数据 */
const handleAdd = () => {
  form.value = {
    adjustType: 1,
    currency: 'CNY',
    originalAmount: 0,
    exchangeRate: 1.0,
  };
  dialog.title = '新增手工账变动项';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 发起：修改数据 */
const handleUpdate = async (row: SalaryAdjustmentVO) => {
  // 1. 先查最新的详情，防止编辑旧数据
  try {
    loading.value = true;
    const res = await getAdjustmentDetailApi(row.id);

    // 2. 赋值表单
    form.value = { ...res };
    dialog.title = '修改财务数据';
    dialog.visible = true;
    isFullscreen.value = false;
  } finally {
    loading.value = false;
  }
};

/** * 核心：校验并提交表单 (融合新增与修改) */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.value.id) {
          await editAdjustmentApi(form.value);
          ElMessage.success('信息修改成功');
        } else {
          await addAdjustmentApi(form.value);
          ElMessage.success('新增数据成功');
        }
        dialog.visible = false;
        await getList();
      } catch (error) {
        // 请求层的异常由 axios 拦截器统一提示
      }
    }
  });
};

/** * 执行：物理/逻辑删除单条记录 */
const handleDelete = (row: SalaryAdjustmentVO) => {
  ElMessageBox.confirm(`确认永久删除薪资项 [${row.itemName}] 吗?`, '高危操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteAdjustmentsApi([row.id]);
      ElMessage.success('删除成功');
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认永久删除选中的 ${selectedIds.value.length} 条数据?`, '高危操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteAdjustmentsApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量生效/撤回 (状态机管理) */
const handleBatchAudit = (status: number) => {
  const actionText = status === 1 ? '生效锁定' : '撤回为草稿';
  ElMessageBox.confirm(`确认将选中的数据执行 [${actionText}] 操作吗?`, '审核操作', { type: 'info' })
    .then(async () => {
      await auditAdjustmentsApi(selectedIds.value, status);
      ElMessage.success(`批量${actionText}成功`);
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

/** 监听币种变化，自动给默认汇率 */
watch(
  () => form.value.currency,
  (newVal) => {
    if (newVal === 'CNY') {
      form.value.exchangeRate = 1.0;
    } else if (newVal === 'USD') {
      form.value.exchangeRate = 7.2345; // 实际开发建议调 API 获取实时汇率
    }
  }
);
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
.w-full {
  width: 100%;
}
.text-success {
  color: var(--el-color-success);
}
.text-danger {
  color: var(--el-color-danger);
}
.preview-amount {
  background-color: var(--el-fill-color-light);
  padding: 0 15px;
  border-radius: 4px;
  color: var(--el-color-warning);
  font-weight: 600;
  font-size: 16px;
  min-width: 200px;
}
</style>

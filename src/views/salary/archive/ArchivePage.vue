<!--src/views/salary/archive/ArchivePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索姓名或工号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="版本状态" prop="isLatest">
          <el-select
            v-model="queryParams.isLatest"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="当前最新" :value="1" />
            <el-option label="历史版本" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['salary:archive:add']" type="primary" icon="Plus" @click="handleAdd">
          新员工定薪
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="工号" align="center" prop="employeeCode" width="120" />
        <el-table-column label="姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="版本号" align="center" width="90">
          <template #default="scope">
            <el-tag type="info" size="small">V{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="月薪标准" align="right" width="160">
          <template #default="scope">
            <span class="amount-font text-danger">{{ scope.row.baseSalary }}</span>
            <span class="currency-label">{{ scope.row.currency || 'CNY' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getArchiveStatus(row.auditStatus).tagType" size="small">
              {{ getArchiveStatus(row.auditStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本控制" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isLatest === 1 ? 'success' : 'info'" effect="dark" size="small">
              {{ row.isLatest === 1 ? '最新' : '历史' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调薪原因" prop="changeReason" show-overflow-tooltip />

        <el-table-column label="操作" align="center" width="240" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.auditStatus === 0"
              link
              type="warning"
              icon="Stamp"
              @click="handleAudit(scope.row)"
              >审核</el-button
            >
            <el-button
              v-if="scope.row.isLatest === 1"
              link
              type="primary"
              icon="Edit"
              @click="handleAdjust(scope.row)"
              >调薪</el-button
            >
            <el-button link type="info" icon="View" @click="handleDetail(scope.row)"
              >详情</el-button
            >
            <el-button
              v-if="scope.row.isLatest === 1 && scope.row.auditStatus === 0"
              link
              type="danger"
              icon="RefreshLeft"
              @click="handleRevoke(scope.row)"
              >撤销</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      width="880px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ dialog.title }}</span>
          <el-button link @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="section-title">核心档案配置</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择员工" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                placeholder="输入姓名搜索"
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                :disabled="isAdjusting"
                style="width: 100%"
              >
                <el-option
                  v-for="item in employeeOptions"
                  :key="item.id"
                  :label="item.employeeName"
                  :value="item.id"
                >
                  <span>{{ item.employeeName }}</span>
                  <small style="margin-left: 8px; color: #999">{{ item.employeeCode }}</small>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="月薪底薪" prop="baseSalary">
              <div class="flex-align-center">
                <el-input-number
                  v-model="form.baseSalary"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="flex: 1"
                />
                <el-select
                  v-model="form.currency"
                  style="width: 90px; margin-left: 5px"
                  @change="handleCurrencyChange"
                >
                  <el-option label="CNY" value="CNY" />
                  <el-option label="USDT" value="USDT" />
                  <el-option label="USD" value="USD" />
                </el-select>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="全勤奖标准" prop="fullAttendanceBonus">
              <div class="flex-align-center">
                <el-input-number
                  v-model="form.fullAttendanceBonus"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="flex: 1"
                />
                <span class="currency-unit">{{ form.currency }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title flex-justify-between">
          <span>固定补贴/扣款项 (FIXED)</span>
          <div class="item-actions">
            <el-button type="success" plain size="small" icon="Plus" @click="addItem(1)"
              >收入项</el-button
            >
            <el-button type="danger" plain size="small" icon="Minus" @click="addItem(2)"
              >扣款项</el-button
            >
          </div>
        </div>

        <el-table :data="form.items" border size="small" class="form-item-table">
          <el-table-column label="类型" width="90" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.itemType === 1 ? 'success' : 'danger'" size="small">
                {{ scope.row.itemType === 1 ? '收入' : '扣款' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目名称">
            <template #default="scope">
              <el-select
                v-model="scope.row.typeId"
                placeholder="选择项目"
                size="small"
                style="width: 100%"
              >
                <el-option
                  v-for="d in scope.row.itemType === 1 ? incomeOptions : deductionOptions"
                  :key="d.id"
                  :label="d.typeName"
                  :value="d.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="计算逻辑" width="140">
            <template #default="scope">
              <el-select v-model="scope.row.calcType" size="small">
                <el-option label="固定额度" :value="1" />
                <el-option label="比例(基数)" :value="2" />
                <el-option label="出勤折算" :value="3" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="值 (金额/比例)">
            <template #default="scope">
              <el-input-number
                v-if="scope.row.calcType !== 2"
                v-model="scope.row.amount"
                :precision="2"
                :controls="false"
                size="small"
                style="width: 80%"
              />
              <el-input-number
                v-else
                v-model="scope.row.ratio"
                :min="0"
                :max="1"
                :step="0.01"
                :controls="false"
                size="small"
                style="width: 80%"
              />
              <span class="unit-text" style="margin-left: 5px">{{
                scope.row.calcType === 2 ? '%' : form.currency
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="scope">
              <el-button link type="danger" icon="Delete" @click="removeItem(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">提 交 审 核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialog.visible" title="薪资档案审核" width="500px" append-to-body>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="1">通过 (生效)</el-radio>
            <el-radio :label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="审核备注"
          :prop="auditForm.auditStatus === 2 ? 'remark' : ''"
          :rules="
            auditForm.auditStatus === 2
              ? { required: true, message: '驳回时必须填写原因', trigger: 'blur' }
              : []
          "
        >
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            placeholder="请输入审核意见或驳回原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitAudit">确 定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawer.visible" title="薪资档案详情" size="720px" destroy-on-close>
      <div v-loading="detailDrawer.loading" class="drawer-content">
        <div class="overview-header">
          <el-row :gutter="20">
            <el-col :span="16">
              <h2 class="emp-name">
                {{ detailDrawer.data.employeeName }}
                <small>#{{ detailDrawer.data.employeeCode }}</small>
              </h2>
              <div class="version-badges">
                <el-tag size="small" effect="dark" type="info"
                  >V{{ detailDrawer.data.version }}</el-tag
                >
                <el-tag v-if="detailDrawer.data.isLatest === 1" size="small" type="success"
                  >当前生效</el-tag
                >
                <el-tag :type="getArchiveStatus(detailDrawer.data.auditStatus).tagType" plain>{{
                  getArchiveStatus(detailDrawer.data.auditStatus).text
                }}</el-tag>
              </div>
            </el-col>
            <el-col :span="8" class="text-right">
              <div class="main-salary-label">月薪标准 ({{ detailDrawer.data.currency }})</div>
              <div class="main-salary-value amount-font">{{ detailDrawer.data.baseSalary }}</div>
            </el-col>
          </el-row>
        </div>

        <el-descriptions :column="2" border class="margin-top-20">
          <el-descriptions-item label="生效起始日"
            ><el-icon><Calendar /></el-icon>
            {{ detailDrawer.data.effectiveDate }}</el-descriptions-item
          >
          <el-descriptions-item label="全勤奖标准">
            <span class="text-success amount-font" style="font-weight: bold">{{
              detailDrawer.data.fullAttendanceBonus || 0
            }}</span>
            <el-tag size="small" type="warning" effect="plain" style="margin-left: 5px">
              {{ detailDrawer.data.currency }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="section-container">
          <div class="section-title">薪资结构明细</div>
          <el-table :data="detailDrawer.data.items" border stripe size="small">
            <el-table-column label="项目" prop="typeName" width="150" />
            <el-table-column label="核算逻辑" min-width="200">
              <template #default="{ row }">
                <code class="formula-block">
                  <span v-if="row.calcType === 1">固定额度: {{ row.amount }}</span>
                  <span v-else-if="row.calcType === 2"
                    >基数 × {{ (row.ratio * 100).toFixed(2) }}%</span
                  >
                  <span v-else-if="row.calcType === 3">标准 {{ row.amount }} × (出勤 / 计薪)</span>
                </code>
              </template>
            </el-table-column>
            <el-table-column label="全额预估" align="right" width="120">
              <template #default="{ row }">
                <span
                  class="amount-font"
                  :class="row.itemType === 1 ? 'text-success' : 'text-danger'"
                >
                  {{ row.itemType === 1 ? '+' : '-' }} {{ formatEstimatedAmount(row) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="audit-timeline">
          <div class="audit-card">
            <div class="audit-row">
              <span class="label">变动原因：</span
              >{{ detailDrawer.data.changeReason || '系统初始化' }}
            </div>
            <div class="audit-row">
              <span class="label">档案备注：</span>{{ detailDrawer.data.remark || '无' }}
            </div>
            <div class="audit-footer">最后更新于: {{ detailDrawer.data.updateTime || '--' }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDrawer.visible = false">关闭预览</el-button>
        <el-button
          v-if="detailDrawer.data.auditStatus === 0"
          v-hasPerm="['salary:archive:audit']"
          type="primary"
          icon="Stamp"
          @click="handleAudit(detailDrawer.data)"
          >进入审核</el-button
        >
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工薪资档案管理页 (管理员工的底薪、定薪版本及固定收支项)
 * 依赖关联: 该模块生成的数据是薪资核算引擎 (Core Engine) 计算的基础来源
 * ====================================================================
 */

// 1. Vue 与核心功能依赖
import { ref, reactive, onMounted } from 'vue';

// 2. Element Plus 与图标库
import { ElMessage, ElMessageBox } from 'element-plus';
import { Calendar, FullScreen, Minus } from '@element-plus/icons-vue';

// 3. 业务 API 接口与类型
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import {
  getArchivePageApi,
  getCurrentArchiveApi,
  revokeLatestVersionApi,
  saveOrAdjustArchiveApi,
  auditArchiveApi,
  getArchiveDetailApi,
} from '@/api/salary/archive/archive.ts';
import { getIncomeTypeOptionsApi } from '@/api/salary/incometype/incomeType.ts';
import { getDeductionTypeOptionsApi } from '@/api/salary/deductiontype/deductionType.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);
const searchLoading = ref(false);

// [表格与分页状态]
const total = ref(0);
const dataList = ref<any[]>([]);

// [查询条件状态]
const queryFormRef = ref<any>();
const queryParams = reactive<any>({ pageNum: 1, pageSize: 10, isLatest: 1, keyword: '' });

// [配置弹窗状态]
const dialog = reactive({ visible: false, title: '' });
const isAdjusting = ref(false); // 控制调薪时锁定员工不可篡改
const formRef = ref<any>();
const form = ref<any>({
  employeeId: '',
  baseSalary: 0,
  fullAttendanceBonus: 0,
  currency: 'CNY',
  effectiveDate: '',
  changeReason: '',
  items: [],
});

// [审核与详情抽屉状态]
const auditDialog = reactive({ visible: false });
const auditForm = reactive<any>({ id: 0, auditStatus: 1, remark: '' });
const detailDrawer = reactive({ visible: false, loading: false, data: {} as any });

// [数据字典资源]
const incomeOptions = ref<any[]>([]);
const deductionOptions = ref<any[]>([]);
const employeeOptions = ref<any[]>([]);

// 校验规则
const rules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '生效日期不能为空', trigger: 'change' }],
  baseSalary: [{ required: true, message: '底薪不能为空', trigger: 'blur' }],
};

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
  handleQuery();
};

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

const addItem = (itemType: number) => {
  form.value.items.push({ itemType, typeId: '', calcType: 1, amount: 0, ratio: 0 });
};

const removeItem = (i: number) => {
  form.value.items.splice(i, 1);
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

const getList = async () => {
  loading.value = true;
  try {
    const res = await getArchivePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** 发起定薪：初始化状态 */
const handleAdd = () => {
  isAdjusting.value = false;
  form.value = {
    employeeId: '',
    baseSalary: 0,
    fullAttendanceBonus: 0,
    currency: 'CNY',
    effectiveDate: '',
    changeReason: '入职定薪',
    items: [],
  };
  dialog.title = '新员工定薪';
  dialog.visible = true;
  isFullscreen.value = false;
};
/** * 处理币种变更：若在调薪期间变更币种，需进行高能风险提示
 */
const handleCurrencyChange = (val: string) => {
  if (isAdjusting.value) {
    ElMessageBox.confirm(
      `检测到您正在变更该员工的结算基准币种为 [${val}]。
      注意：系统不会自动按汇率折算底薪数值，请务必手动将“月薪底薪”修改为 [${val}] 对应的金额（如：7000 CNY -> 1000 USD），否则将导致严重的算薪错误。`,
      '币种变更关键提醒',
      {
        confirmButtonText: '已知晓，确认变更',
        cancelButtonText: '点错了',
        type: 'warning',
      }
    ).catch(() => {
      // 若取消，则还原为旧版本中的原始币种，防止误操作
      form.value.currency = detailDrawer.data.currency || 'CNY';
    });
  }
};
/** 🌟 核心引擎数据对接：发起调薪，彻底清洗旧版本数据防污染 */
const handleAdjust = async (row: any) => {
  isAdjusting.value = true;
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];

  try {
    const currentData = await getCurrentArchiveApi(row.employeeId);
    if (!currentData) throw new Error('未找到生效的档案版本');

    form.value = {
      employeeId: currentData.employeeId,
      baseSalary: currentData.baseSalary,
      fullAttendanceBonus: currentData.fullAttendanceBonus || 0,
      currency: currentData.currency || 'CNY',
      effectiveDate: '', // 强制重新录入生效期
      changeReason: '年度调薪',
      // 清洗：去除 ID 映射等脏数据
      items: (currentData.items || []).map((item: any) => ({
        itemType: item.itemType,
        typeId: item.typeId,
        calcType: item.calcType,
        amount: item.amount,
        ratio: item.ratio,
      })),
    };
    dialog.title = '发起调薪流程';
    dialog.visible = true;
    isFullscreen.value = false;
  } catch (error) {
    console.error('获取档案失败详情:', error);
    ElMessage.error('获取基础档案失败');
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      await saveOrAdjustArchiveApi(form.value);
      ElMessage.success('提交成功，已进入待审核队列');
      dialog.visible = false;
      getList();
    }
  });
};

const handleAudit = (row: any) => {
  auditForm.id = row.id;
  auditForm.auditStatus = 1;
  auditForm.remark = '';
  auditDialog.visible = true;
};

const submitAudit = async () => {
  if (auditForm.auditStatus === 2 && !auditForm.remark) {
    ElMessage.warning('驳回时请填写原因，以备溯源');
    return;
  }
  await auditArchiveApi(auditForm);
  ElMessage.success('审核归档成功');
  auditDialog.visible = false;
  if (detailDrawer.visible) detailDrawer.visible = false;
  getList();
};

const handleDetail = async (row: any) => {
  detailDrawer.visible = true;
  detailDrawer.loading = true;
  detailDrawer.data = await getArchiveDetailApi(row.id);
  detailDrawer.loading = false;
};

const handleRevoke = (row: any) => {
  ElMessageBox.confirm(`撤销后该草稿将被永久销毁，确定执行?`, '操作保护', { type: 'warning' }).then(
    async () => {
      await revokeLatestVersionApi(row.employeeId);
      ElMessage.success('撤销成功，版本已回退');
      getList();
    }
  );
};

const remoteSearchEmployees = async (q: string) => {
  if (!q) {
    employeeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  employeeOptions.value = await listEmployeeOptionsApi(q);
  searchLoading.value = false;
};

/** 辅助推算展示：直观反映配置的实发额度 */
const formatEstimatedAmount = (row: any) => {
  if (row.calcType === 1 || row.calcType === 3) return row.amount.toFixed(2);
  const base = detailDrawer.data.baseSalary || 0;
  return (base * (row.ratio || 0)).toFixed(2);
};

const getArchiveStatus = (s: number) => {
  const map: any = {
    0: { text: '待审定', tagType: 'warning' },
    1: { text: '已生效', tagType: 'success' },
    2: { text: '已驳回', tagType: 'danger' },
  };
  return map[s] || { text: '未知', tagType: 'info' };
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
  // 预加载收支字典配置项
  getIncomeTypeOptionsApi().then((res) => (incomeOptions.value = res));
  getDeductionTypeOptionsApi().then((res) => (deductionOptions.value = res));
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  =====================================================================
*/

.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
}
.text-danger {
  color: var(--el-color-danger);
}
.text-success {
  color: var(--el-color-success);
}
.text-right {
  text-align: right;
}

.currency-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}
.currency-unit {
  margin-left: 8px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  width: 40px;
}

.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 20px 0 15px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}
.margin-top-20 {
  margin-top: 20px;
}

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

/* 抽屉样式增强 */
.drawer-content {
  padding: 0 10px 20px;
}

.overview-header {
  padding: 20px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, #fff 100%);
  border-radius: 8px;
  border-left: 5px solid var(--el-color-primary);
  margin-bottom: 20px;

  .emp-name {
    margin: 0 0 10px;
    font-size: 20px;
    small {
      color: var(--el-text-color-secondary);
      font-weight: normal;
      font-size: 14px;
    }
  }
  .version-badges {
    display: flex;
    gap: 8px;
  }
  .main-salary-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .main-salary-value {
    font-size: 28px;
    color: var(--el-color-danger);
    line-height: 1.2;
  }
}

.formula-block {
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: inline-block;
}

.audit-card {
  background: var(--el-fill-color-lighter);
  padding: 15px;
  border-radius: 8px;
  border: 1px dashed var(--el-border-color);
  margin-top: 30px;
  .audit-row {
    margin-bottom: 6px;
    font-size: 13px;
    .label {
      color: var(--el-text-color-secondary);
      width: 70px;
      display: inline-block;
    }
  }
  .audit-footer {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--el-border-color-lighter);
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.flex-align-center {
  display: flex;
  align-items: center;
}
.flex-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

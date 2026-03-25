<!--src/views/salary/archive/ArchivePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
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
            style="width: 120px"
          >
            <el-option label="当前最新" :value="1" />
            <el-option label="历史版本" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核流程" prop="auditStatus">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待审核" :value="0" />
            <el-option label="已生效" :value="1" />
            <el-option label="已驳回" :value="2" />
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
        <el-button v-hasPerm="['salary:archive:add']" type="primary" icon="Plus" @click="handleAdd"
          >新员工定薪</el-button
        >
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="工号" align="center" prop="employeeCode" width="120" />
        <el-table-column label="姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="版本" align="center" width="80">
          <template #default="{ row }">
            <el-tag type="info" size="small" class="status-tag amount-font"
              >V{{ row.version }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column label="月薪标准" align="right" width="160">
          <template #default="{ row }">
            <span class="amount-font" style="color: var(--el-color-danger); font-weight: bold">{{
              row.baseSalary
            }}</span>
            <span class="currency-label amount-font">{{ row.currency || 'CNY' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
        <el-table-column label="审核状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getArchiveStatus(row.auditStatus).tagType"
              size="small"
              class="status-tag"
            >
              {{ getArchiveStatus(row.auditStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="版本效力" align="center" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.isLatest === 1 && row.auditStatus === 1"
              type="success"
              effect="dark"
              size="small"
              class="status-tag"
              >最新生效</el-tag
            >
            <el-tag
              v-else-if="row.auditStatus === 0"
              type="warning"
              effect="plain"
              size="small"
              class="status-tag"
              >待定草案</el-tag
            >
            <el-tag v-else type="info" effect="dark" size="small" class="status-tag"
              >历史档案</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          label="变更原因"
          prop="changeReason"
          show-overflow-tooltip
          min-width="150"
        />
        <el-table-column label="操作" align="center" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 0"
              link
              type="warning"
              icon="Stamp"
              @click="handleAudit(row)"
              >审核</el-button
            >
            <el-button
              v-if="row.isLatest === 1 && row.auditStatus === 1"
              link
              type="primary"
              icon="Edit"
              @click="handleAdjust(row)"
              >调薪</el-button
            >
            <el-button link type="info" icon="View" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.isLatest === 1 && row.auditStatus === 1 && row.version > 1"
              link
              type="danger"
              icon="RefreshLeft"
              @click="handleRevoke(row)"
              >撤销</el-button
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
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
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
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                :disabled="isAdjusting"
                style="width: 100%"
                placeholder="输入姓名搜索员工"
              >
                <el-option
                  v-for="item in employeeOptions"
                  :key="item.id"
                  :label="item.employeeName"
                  :value="item.id"
                >
                  <span>{{ item.employeeName }}</span>
                  <small class="amount-font" style="margin-left: 8px; color: #999"
                    >#{{ item.employeeCode }}</small
                  >
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
            <el-form-item label="月度底薪" prop="baseSalary">
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
                  <el-option label="CNY" value="CNY" /><el-option
                    label="USDT"
                    value="USDT"
                  /><el-option label="USD" value="USD" />
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
                <span class="currency-unit amount-font">{{ form.currency }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">税务与合规配置</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计税方案" prop="taxScheme">
              <el-select v-model="form.taxScheme" style="width: 100%">
                <el-option label="不计税 (外包/免税)" :value="0" />
                <el-option label="居民个人所得税" :value="1" />
                <el-option label="劳务报酬税" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="档案备注" prop="remark">
              <el-input v-model="form.remark" placeholder="调薪补充说明或协议编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20 flex-justify-between">
          <span>固定补贴/扣款结构 (FIXED)</span>
          <div class="item-actions">
            <el-button type="success" plain size="small" icon="Plus" @click="addItem(1)"
              >新增收入</el-button
            >
            <el-button type="danger" plain size="small" icon="Minus" @click="addItem(2)"
              >新增扣款</el-button
            >
          </div>
        </div>

        <el-table :data="form.items" border size="small" class="form-item-table">
          <el-table-column label="项目属性" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.itemType === 1 ? 'success' : 'danger'"
                size="small"
                class="status-tag"
                >{{ row.itemType === 1 ? '收入' : '扣款' }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="费用项目">
            <template #default="{ row }">
              <el-select v-model="row.typeId" placeholder="请选择" size="small" style="width: 100%">
                <el-option
                  v-for="d in row.itemType === 1 ? incomeOptions : deductionOptions"
                  :key="d.id"
                  :label="d.typeName"
                  :value="d.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="计算逻辑" width="140">
            <template #default="{ row }">
              <el-select v-model="row.calcType" size="small">
                <el-option label="固定额度" :value="1" /><el-option
                  label="比例(基数)"
                  :value="2"
                /><el-option label="出勤折算" :value="3" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数值设定">
            <template #default="{ row }">
              <el-input-number
                v-if="row.calcType !== 2"
                v-model="row.amount"
                :precision="2"
                :controls="false"
                size="small"
                style="width: 70%"
              />
              <el-input-number
                v-else
                v-model="row.ratio"
                :min="0"
                :max="1"
                :step="0.01"
                :controls="false"
                size="small"
                style="width: 70%"
              />
              <span class="unit-text amount-font" style="margin-left: 5px">{{
                row.calcType === 2 ? '%' : form.currency
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
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">提 交 审 核</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialog.visible" width="500px" append-to-body draggable>
      <template #header>
        <div class="dialog-custom-header"><span class="title">薪资档案综合审核</span></div>
      </template>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="1">通过并生效</el-radio>
            <el-radio :label="2">驳回修改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="审核备注"
          :prop="auditForm.auditStatus === 2 ? 'remark' : ''"
          :rules="
            auditForm.auditStatus === 2
              ? { required: true, message: '驳回必须说明原因', trigger: 'blur' }
              : []
          "
        >
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            placeholder="请输入审核意见..."
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitAudit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawer.visible"
      title="薪资档案全量视图"
      size="720px"
      destroy-on-close
    >
      <div v-loading="detailDrawer.loading" class="drawer-content">
        <div class="overview-header">
          <el-row :gutter="20" align="middle">
            <el-col :span="16">
              <h2 class="emp-name">
                {{ detailDrawer.data.employeeName }}
                <small class="amount-font">#{{ detailDrawer.data.employeeCode }}</small>
              </h2>
              <div class="version-badges">
                <el-tag size="small" type="info" class="status-tag amount-font"
                  >Ver. {{ detailDrawer.data.version }}</el-tag
                >
                <el-tag
                  v-if="detailDrawer.data.isLatest === 1 && detailDrawer.data.auditStatus === 1"
                  size="small"
                  type="success"
                  class="status-tag"
                  >当前有效版本</el-tag
                >
                <el-tag
                  :type="getArchiveStatus(detailDrawer.data.auditStatus).tagType"
                  plain
                  class="status-tag"
                  >{{ getArchiveStatus(detailDrawer.data.auditStatus).text }}</el-tag
                >
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
            <span class="currency-label amount-font">{{ detailDrawer.data.currency }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="计税方案">
            <el-tag
              :type="detailDrawer.data.taxScheme === 0 ? 'info' : 'primary'"
              size="small"
              class="status-tag"
            >
              {{
                detailDrawer.data.taxScheme === 0
                  ? '不计税'
                  : detailDrawer.data.taxScheme === 2
                    ? '劳务报酬'
                    : '个人所得税'
              }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后更新时间"
            ><span class="amount-font text-secondary">{{
              detailDrawer.data.updateTime || '--'
            }}</span></el-descriptions-item
          >
        </el-descriptions>

        <div class="section-container">
          <div class="section-title">固化薪资结构明细</div>
          <el-table :data="detailDrawer.data.items" border stripe size="small">
            <el-table-column label="收支项" prop="typeName" width="150" />
            <el-table-column label="核算算法" min-width="200">
              <template #default="{ row }">
                <code class="formula-block amount-font">
                  <span v-if="row.calcType === 1">FIXED: {{ row.amount }}</span>
                  <span v-else-if="row.calcType === 2"
                    >BASE × {{ (row.ratio * 100).toFixed(2) }}%</span
                  >
                  <span v-else-if="row.calcType === 3">STD {{ row.amount }} × (ATT / WORK)</span>
                </code>
              </template>
            </el-table-column>
            <el-table-column label="估算金额" align="right" width="120">
              <template #default="{ row }">
                <span
                  class="amount-font"
                  :style="{
                    color:
                      row.itemType === 1 ? 'var(--el-color-success)' : 'var(--el-color-danger)',
                  }"
                >
                  {{ row.itemType === 1 ? '+' : '-' }} {{ formatEstimatedAmount(row) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="audit-timeline-card">
          <div class="audit-row">
            <span class="label">定薪原因：</span
            >{{ detailDrawer.data.changeReason || '系统初始化' }}
          </div>
          <div class="audit-row">
            <span class="label">档案备注：</span>{{ detailDrawer.data.remark || '无' }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDrawer.visible = false">关闭预览</el-button>
          <el-button
            v-if="detailDrawer.data.auditStatus === 0"
            v-hasPerm="['salary:archive:audit']"
            type="primary"
            icon="Stamp"
            @click="handleAudit(detailDrawer.data)"
            >立即审核</el-button
          >
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工薪资档案管理 (定薪、调薪及薪资结构维护)
 * 业务价值: 构建员工薪资计算的元数据模型，通过版本控制确保历史可追溯
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
import { Calendar, FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
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
 * 📦 二、响应式状态区 (State Management)
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
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  isLatest: 1,
  auditStatus: undefined,
  keyword: '',
});

// [业务表单状态]
const dialog = reactive({ visible: false, title: '' });
const isAdjusting = ref(false); // 调薪锁
const formRef = ref<any>();
const form = ref<any>({
  employeeId: '',
  baseSalary: 0,
  fullAttendanceBonus: 0,
  currency: 'CNY',
  effectiveDate: '',
  changeReason: '',
  taxScheme: 1,
  items: [],
  remark: '',
});

// [审核与详情状态]
const auditDialog = reactive({ visible: false });
const auditForm = reactive<any>({ id: 0, auditStatus: 1, remark: '' });
const detailDrawer = reactive({ visible: false, loading: false, data: {} as any });

// [资源字典数据]
const incomeOptions = ref<any[]>([]);
const deductionOptions = ref<any[]>([]);
const employeeOptions = ref<any[]>([]);

// [表单前端合法性校验规则]
const rules = {
  employeeId: [{ required: true, message: '请选择定薪员工', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '生效日期不能为空', trigger: 'change' }],
  baseSalary: [{ required: true, message: '薪资标准不能为空', trigger: 'blur' }],
};

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换全屏 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 取消弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

/** 薪资明细操作 */
const addItem = (itemType: number) => {
  form.value.items.push({ itemType, typeId: '', calcType: 1, amount: 0, ratio: 0 });
};
const removeItem = (i: number) => {
  form.value.items.splice(i, 1);
};

/** 🌟 业务逻辑：币种变更风险拦截 */
const handleCurrencyChange = (val: string) => {
  if (isAdjusting.value) {
    ElMessageBox.confirm(
      `警告：您正在变更结算币种为 [${val}]。系统不会自动换算金额数值，请务必手动修改底薪标准，否则将导致严重核算事故！`,
      '风险提示',
      { confirmButtonText: '确认变更', cancelButtonText: '取消', type: 'warning' }
    ).catch(() => {
      form.value.currency = detailDrawer.data.currency || 'CNY';
    });
  }
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 核心：获取分页列表 */
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

/** 业务：发起定薪 */
const handleAdd = () => {
  isAdjusting.value = false;
  form.value = {
    employeeId: '',
    baseSalary: 0,
    fullAttendanceBonus: 0,
    currency: 'CNY',
    effectiveDate: '',
    changeReason: '入职定薪',
    taxScheme: 1,
    items: [],
  };
  dialog.title = '新员工入职定薪';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 业务：发起调薪 (清洗旧版本 DTO) */
const handleAdjust = async (row: any) => {
  isAdjusting.value = true;
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];

  try {
    const currentData = await getCurrentArchiveApi(row.employeeId);
    if (!currentData) throw new Error('档案数据丢失');

    form.value = {
      employeeId: currentData.employeeId,
      baseSalary: currentData.baseSalary,
      fullAttendanceBonus: currentData.fullAttendanceBonus || 0,
      currency: currentData.currency || 'CNY',
      effectiveDate: '',
      taxScheme: currentData.taxScheme ?? 1,
      changeReason: '调岗调薪',
      items: (currentData.items || []).map((item: any) => ({
        itemType: item.itemType,
        typeId: item.typeId,
        calcType: item.calcType,
        amount: item.amount,
        ratio: item.ratio,
      })),
    };
    dialog.title = '发起薪资变动申请';
    dialog.visible = true;
    isFullscreen.value = false;
  } catch {
    ElMessage.error('基础档案加载失败');
  }
};

/** 核心：提交审核申请 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      await saveOrAdjustArchiveApi(form.value);
      ElMessage.success('申请提交成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 业务：审核处理 */
const handleAudit = (row: any) => {
  auditForm.id = row.id;
  auditForm.auditStatus = 1;
  auditForm.remark = '';
  auditDialog.visible = true;
};

const submitAudit = async () => {
  if (auditForm.auditStatus === 2 && !auditForm.remark) {
    ElMessage.warning('请填写驳回原因');
    return;
  }
  await auditArchiveApi(auditForm);
  ElMessage.success('审核操作成功');
  auditDialog.visible = false;
  if (detailDrawer.visible) detailDrawer.visible = false;
  await getList();
};

/** 业务：查看详情 */
const handleDetail = async (row: any) => {
  detailDrawer.visible = true;
  detailDrawer.loading = true;
  detailDrawer.data = await getArchiveDetailApi(row.id);
  detailDrawer.loading = false;
};

/** 业务：版本撤销 */
const handleRevoke = (row: any) => {
  ElMessageBox.confirm(`撤销后该定薪版本将永久失效，是否继续?`, '版本安全控制', {
    type: 'warning',
  }).then(async () => {
    await revokeLatestVersionApi(row.employeeId);
    ElMessage.success('版本回退成功');
    await getList();
  });
};

/** 业务：远程搜索 */
const remoteSearchEmployees = async (q: string) => {
  if (!q) {
    employeeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  employeeOptions.value = await listEmployeeOptionsApi(q);
  searchLoading.value = false;
};

/** 辅助函数 */
const formatEstimatedAmount = (row: any) => {
  if (row.calcType === 1 || row.calcType === 3) return row.amount.toFixed(2);
  return ((detailDrawer.data.baseSalary || 0) * (row.ratio || 0)).toFixed(2);
};

const getArchiveStatus = (s: number) => {
  const map: any = {
    0: { text: '待定', tagType: 'warning' },
    1: { text: '有效', tagType: 'success' },
    2: { text: '驳回', tagType: 'danger' },
  };
  return map[s] || { text: '未知', tagType: 'info' };
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
  getIncomeTypeOptionsApi().then((res) => (incomeOptions.value = res));
  getDeductionTypeOptionsApi().then((res) => (deductionOptions.value = res));
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   ===================================================================== */

.currency-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}
.currency-unit {
  margin-left: 8px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* 抽屉内视效增强 */
.drawer-content {
  padding: 0 16px 24px;
}

.overview-header {
  padding: 24px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
  border-radius: 12px;
  border-left: 6px solid var(--el-color-primary);
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);

  .emp-name {
    margin: 0 0 12px;
    font-size: 22px;
    color: var(--el-text-color-primary);
    small {
      color: var(--el-text-color-secondary);
      font-weight: 400;
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
    font-size: 32px;
    color: var(--el-color-danger);
    letter-spacing: -1px;
  }
}

.formula-block {
  background: var(--el-fill-color-light);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-color-primary);
  display: inline-block;
  border: 1px solid var(--el-border-color-lighter);
}

.audit-timeline-card {
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed var(--el-border-color);
  margin-top: 32px;
  .audit-row {
    margin-bottom: 8px;
    font-size: 13px;
    .label {
      color: var(--el-text-color-secondary);
      font-weight: 500;
      width: 70px;
      display: inline-block;
    }
  }
}
</style>

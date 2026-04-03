<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="员工姓名/编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-input
            v-model="queryParams.department"
            placeholder="输入部门名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="审批状态" prop="auditStatus">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in dicts.salary_audit_status ?? []"
              :key="item.dictItemValue"
              :label="item.dictItemLabel"
              :value="Number(item.dictItemValue)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本过滤" prop="latestFlag">
          <el-select v-model="queryParams.latestFlag" placeholder="请选择版本" style="width: 120px">
            <el-option label="仅看最新版" :value="1" />
            <el-option label="查看历史版" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card flex-1">
      <div class="toolbar">
        <el-button
          v-hasPerm="['salary:archive:init']"
          type="success"
          icon="Plus"
          @click="handleInit"
        >
          新员工定薪
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="员工信息" min-width="160" show-overflow-tooltip fixed="left">
          <template #default="{ row }">
            <div style="display: flex; flex-direction: column; line-height: 1.4">
              <span style="font-weight: 600; color: var(--el-text-color-primary)">
                {{ row.employeeName }}
              </span>
              <span class="text-secondary amount-font">[{{ row.employeeCode }}]</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="版本号" width="90" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" type="info" class="amount-font">V{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="基本工资" prop="baseSalary" min-width="120" align="right">
          <template #default="{ row }">
            <span class="amount-font text-primary">{{ row.baseSalary?.toFixed(2) }}</span>
            <span style="margin-left: 4px; font-size: 12px; color: #999">
              {{ getDictLabel(dicts.settlement_currency, row.currency) || row.currency }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" prop="effectiveDate" width="120" align="center" />
        <el-table-column
          label="调薪原因"
          prop="changeReason"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column label="审批状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)" class="status-tag">
              {{ getDictLabel(dicts.salary_audit_status, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.latestFlag === 1 && scope.row.auditStatus === 1"
              v-hasPerm="['salary:archive:adjust']"
              link
              type="primary"
              icon="EditPen"
              @click="handleAdjust(scope.row)"
            >
              调薪
            </el-button>
            <el-button
              v-if="scope.row.auditStatus === 0"
              v-hasPerm="['salary:archive:audit']"
              link
              type="warning"
              icon="Stamp"
              @click="handleOpenAudit(scope.row)"
            >
              审批
            </el-button>
            <el-button link type="info" icon="Document" @click="handleDetail(scope.row)">
              详情
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
      width="800px"
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
        <el-alert
          v-if="dialog.mode === 'adjust'"
          title="调薪申请将生成新的草稿版本，待审批通过后覆盖旧版本生效。"
          type="info"
          show-icon
          style="margin-bottom: 20px"
        />

        <div class="section-title">基础金额配置</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <EmployeeSelect
                v-model="form.employeeId"
                :disabled="dialog.mode === 'adjust'"
                :default-options="echoEmployeeOptions"
                placeholder="输入姓名或工号搜索"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基本工资" prop="baseSalary">
              <el-input-number
                v-model="form.baseSalary"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
                placeholder="如：15000.00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="试用期底薪" prop="probationBaseSalary">
              <el-input-number
                v-model="form.probationBaseSalary"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
                placeholder="无试用期可留空"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算币种" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in dicts.settlement_currency ?? []"
                  :key="item.dictItemValue"
                  :label="item.dictItemLabel"
                  :value="item.dictItemValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">流转控制</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="个税规则" prop="taxRuleCode">
              <el-select
                v-model="form.taxRuleCode"
                placeholder="请选择个税核算规则"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="item in dicts.salary_tax_rule ?? []"
                  :key="item.dictItemValue"
                  :label="item.dictItemLabel"
                  :value="item.dictItemValue"
                >
                  <span style="float: left">{{ item.dictItemLabel }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{
                    item.dictItemValue
                  }}</span>
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
                placeholder="选择生效起始日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">薪资构成明细</div>
        <el-form-item label-width="0">
          <SalaryArchiveItem v-model="form.archiveItems" :config-options="itemConfigOptions" />
        </el-form-item>

        <el-form-item label="变动原因" prop="changeReason">
          <el-input
            v-model="form.changeReason"
            type="textarea"
            :rows="2"
            placeholder="强管控必填：请填写定薪/调薪原因（如：年度普调、晋升），用于审计"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定 提 交</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialog.visible" title="调薪审批" width="500px" append-to-body>
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="80px">
        <el-form-item label="审批结论" prop="auditStatus">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="1" border class="text-success">同意并生效新薪资</el-radio>
            <el-radio :label="2" border class="text-danger">驳回作废草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="remark">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见 (驳回时必填)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitAudit">确 定 审 批</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialog.visible"
      title="薪资档案详情"
      width="850px"
      append-to-body
      draggable
    >
      <div v-loading="detailDialog.loading">
        <el-descriptions title="基础档案信息" :column="2" border>
          <el-descriptions-item label="员工姓名">
            <span style="font-weight: 600">{{ detailData.employeeName }}</span>
            <span class="text-secondary"> ({{ detailData.employeeCode }})</span>
          </el-descriptions-item>
          <el-descriptions-item label="档案版本">
            <el-tag type="info" effect="dark" class="amount-font">V{{ detailData.version }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="基本工资">
            <span class="amount-font text-primary" style="font-size: 16px; font-weight: 600">
              {{ detailData.baseSalary?.toFixed(2) }}
            </span>
            <span class="text-secondary" style="margin-left: 5px">{{
              getDictLabel(dicts.settlement_currency, detailData.currency)
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="试用期底薪">
            <span v-if="detailData.probationBaseSalary" class="amount-font text-warning">{{
              detailData.probationBaseSalary?.toFixed(2)
            }}</span>
            <span v-else class="text-secondary">无试用期/已转正</span>
          </el-descriptions-item>
          <el-descriptions-item label="生效日期">{{
            detailData.effectiveDate
          }}</el-descriptions-item>
          <el-descriptions-item label="个税规则">{{
            getDictLabel(dicts.salary_tax_rule, detailData.taxRuleCode)
          }}</el-descriptions-item>
          <el-descriptions-item label="变动原因" :span="2">{{
            detailData.changeReason || '-'
          }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="审批流转状态" :column="2" border style="margin-top: 25px">
          <el-descriptions-item label="审批状态">
            <el-tag :type="getAuditStatusType(detailData.auditStatus)" class="status-tag">
              {{ getDictLabel(dicts.salary_audit_status, detailData.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批意见">{{
            detailData.auditRemark || '无'
          }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title" style="margin-top: 25px">薪资明细构成项</div>
        <el-table :data="detailData.archiveItems" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="薪资项目名称" min-width="150">
            <template #default="{ row }">
              <span style="font-weight: 500">{{ getItemConfigName(row.itemConfigId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="设定金额 (基数)" align="right" min-width="150">
            <template #default="{ row }">
              <span class="amount-font" style="color: var(--el-text-color-regular)">{{
                row.amount?.toFixed(2)
              }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" plain @click="detailDialog.visible = false"
            >关 闭 详 情</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工薪资档案主页面 (包含查询、入职定薪、调薪申请、草稿审批)
 * 依赖关联: 强依赖 Dictionary (字典)、Employee (员工库)、ArchiveItem (明细配置)
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
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';
// [3] 业务 API 请求接口
import { useDict } from '@/hooks/useDict';

import {
  initEmployeeArchiveApi,
  adjustSalaryApi,
  auditArchiveApi,
  getArchivePageApi,
  getLatestEffectiveArchiveApi,
  getArchiveDetailApi,
} from '@/api/salary/archive/archive.ts';
// [4] TS 强类型定义约束
import type {
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
  ArchiveInitReqDTO,
  ArchiveAdjustReqDTO,
  ArchiveAuditReqDTO,
} from '@/types/salary/archive/archive.ts';
import SalaryArchiveItem from '@/views/salary/archive/components/SalaryArchiveItem.vue';
import EmployeeSelect from '@/views/salary/employee/components/EmployeeSelect.vue';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee.ts';
import { listItemConfigOptionsApi } from '@/api/salary/itemconfig/itemConfig.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、 响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
/** 全局 Loading 与全屏控制 */
const loading = ref(false);
const isFullscreen = ref(false);

/** 表格与分页数据源 */
const total = ref(0);
const dataList = ref<SalaryArchiveVO[]>([]);
const itemConfigOptions = ref<any[]>([]);
// 个税规则选项下拉数据源

/** 字典库数据源 */
const dicts = useDict(
  'salary_audit_status',
  'salary_item_category',
  'settlement_currency',
  'salary_tax_rule'
);

/** 列表查询参数表单 */
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<ArchiveQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  department: undefined,
  latestFlag: 1,
  auditStatus: undefined,
});

/** 业务(定薪/调薪)参数表单 */
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '', mode: 'init' });
const form = ref<any>({});
// 增加员工选择组件的回显数据源
const echoEmployeeOptions = ref<EmployeeOptionVO[]>([]);
/** 审批参数表单 */
const auditDialog = reactive({ visible: false });
const auditFormRef = ref<FormInstance>();
const auditForm = ref<ArchiveAuditReqDTO>({ id: 0, auditStatus: 1, remark: '' });

/** 业务表单校验规则 */
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工必填', trigger: 'blur' }],
  baseSalary: [{ required: true, message: '基本工资必填', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '生效日期必填', trigger: 'change' }],
  taxRuleCode: [{ required: true, message: '个税规则必选', trigger: 'change' }],
  changeReason: [{ required: true, message: '变动原因(强管控必填)', trigger: 'blur' }],
  currency: [{ required: true, message: '结算币种必选', trigger: 'change' }],
});

/** 审批表单校验规则 */
const auditRules = reactive<FormRules>({
  auditStatus: [{ required: true, message: '必须选择审批结论', trigger: 'change' }],
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (auditForm.value.auditStatus === 2 && !value) {
          callback(new Error('驳回时必须填写审批意见'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});
const detailDialog = reactive({ visible: false, loading: false });
const detailData = ref<any>({});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、 UI 交互事件区 (Interactions)
 * --------------------------------------------------------------------
 */
/** 🌟 映射薪资项目ID到名称 */
const getItemConfigName = (itemConfigId: number) => {
  if (!itemConfigOptions.value || itemConfigOptions.value.length === 0)
    return `项目ID:${itemConfigId}`;
  const target = itemConfigOptions.value.find((item: any) => item.id === itemConfigId);
  return target ? target.itemName : `项目ID:${itemConfigId}`;
};
/** 切换弹窗全屏状态 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 触发搜索查询 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 关闭并清理业务弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

/** 解析审批状态对应的 Tag 颜色 (增强宽容度，兼容字符和数字) */
const getAuditStatusType = (status: number | string) => {
  const map: Record<string, string> = {
    '0': 'warning', // 待审批 (黄色)
    '1': 'success', // 已生效 (绿色)
    '2': 'danger', // 已驳回 (红色)
  };
  return map[String(status)] || 'info';
};

/** * 🌟 字典安全解析方法 (终极大厂增强版)
 * 解决 Vue3 Ref 传参解包失败导致文字变空 ("I"形标签) 的元凶
 */
const getDictLabel = (dictListRaw: any, value: number | string | undefined | null) => {
  if (value === undefined || value === null) return '';

  // 1. 手动解包 Ref
  const dictList = dictListRaw && dictListRaw.value ? dictListRaw.value : dictListRaw;

  // 2. 拦截非数组情况
  if (!Array.isArray(dictList) || dictList.length === 0) return String(value);

  // 3. 兼容多命名规范，强转字符串匹配
  const item = dictList.find((d: any) => {
    const dVal = d.dictItemValue ?? d.dictValue ?? d.value;
    return String(dVal).trim() === String(value).trim();
  });

  // 4. 返回中文 Label
  if (item) {
    return item.dictItemLabel ?? item.dictLabel ?? item.label;
  }
  return String(value);
};
/**
 * --------------------------------------------------------------------
 * 🧠 四、 核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 拉取分页列表接口 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getArchivePageApi(queryParams);
    dataList.value = res.records;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

/** 唤起新员工定薪弹窗 */
const handleInit = () => {
  form.value = {
    employeeId: undefined,
    baseSalary: 0,
    probationBaseSalary: undefined,
    currency: 'CNY',
    taxRuleCode: 'TAX_RESIDENT_CN',
    effectiveDate: '',
    changeReason: '',
    archiveItems: [],
  };
  echoEmployeeOptions.value = [];
  dialog.mode = 'init';
  dialog.title = '新员工入职定薪';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 唤起调薪申请弹窗并回显老数据 */
const handleAdjust = async (row: SalaryArchiveVO) => {
  loading.value = true;
  try {
    const latestArchive = await getLatestEffectiveArchiveApi(row.employeeId);

    form.value = {
      id: latestArchive.id,
      employeeId: latestArchive.employeeId,
      baseSalary: latestArchive.baseSalary,
      probationBaseSalary: latestArchive.probationBaseSalary,
      currency: latestArchive.currency,
      taxRuleCode: latestArchive.taxRuleCode,
      changeReason: '',
      effectiveDate: '',
      archiveItems:
        latestArchive.archiveItems?.map((item) => ({
          itemConfigId: item.itemConfigId,
          amount: item.amount,
          ruleScript: item.ruleScript,
        })) || [],
    };
    //构造回显选项，让处于 disabled 状态的 EmployeeSelect 能显示中文姓名
    echoEmployeeOptions.value = [
      {
        id: latestArchive.employeeId,
        employeeName: latestArchive.employeeName || row.employeeName,
        employeeCode: latestArchive.employeeCode || row.employeeCode || '',
      } as EmployeeOptionVO,
    ];
    dialog.mode = 'adjust';
    dialog.title = `发起调薪申请 - ${latestArchive.employeeName}`;
    dialog.visible = true;
  } finally {
    loading.value = false;
  }
};

/** 唤起审批草稿弹窗 */
const handleOpenAudit = (row: SalaryArchiveVO) => {
  auditForm.value = { id: row.id, auditStatus: 1, remark: '' };
  auditDialog.visible = true;
};

/** 唤起详情视图 */

// 真正的详情展示逻辑
const handleDetail = async (row: SalaryArchiveVO) => {
  detailDialog.visible = true;
  detailDialog.loading = true;
  try {
    // 假设你有专门根据 ID 查详情（包含明细子项）的 API
    // 为什么不复用 getLatestEffectiveArchiveApi？因为用户点开的可能是"历史旧版本"详情，只能按 ID 查
    const res = await getArchiveDetailApi(row.id);
    detailData.value = res;
  } catch (error) {
    // 容错兜底：如果后端接口没写好，先直接拿列表数据展示，保证页面不挂
    detailData.value = { ...row, archiveItems: [] };
  } finally {
    detailDialog.loading = false;
  }
};
/** 提交业务表单 (定薪/调薪) */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (dialog.mode === 'init') {
        await initEmployeeArchiveApi(form.value as ArchiveInitReqDTO);
        ElMessage.success('员工定薪成功');
      } else {
        await adjustSalaryApi(form.value as ArchiveAdjustReqDTO);
        ElMessage.success('调薪申请已提交入库，等待审批流转');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** 提交审批结论 */
const submitAudit = async () => {
  if (!auditFormRef.value) return;
  await auditFormRef.value.validate(async (valid) => {
    if (valid) {
      await auditArchiveApi(auditForm.value as ArchiveAuditReqDTO);
      ElMessage.success(
        auditForm.value.auditStatus === 1 ? '审批已生效，系统基数已更新' : '已驳回作废草稿'
      );
      auditDialog.visible = false;
      await getList();
    }
  });
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
// 新增获取真实薪资配置项的方法
const loadItemConfigOptions = async () => {
  try {
    const res = await listItemConfigOptionsApi();
    // 拿到真实数据后赋值给下拉框数据源
    itemConfigOptions.value = res || [];
  } catch (error) {
    console.error('拉取薪资项目配置失败:', error);
  }
};
onMounted(() => {
  getList();

  loadItemConfigOptions();
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   ===================================================================== */
.amount-font {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.status-tag {
  min-width: 60px;
  text-align: center;
}
.section-title {
  font-size: 14px;
  font-weight: bold;
  margin: 15px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
}

/*  补充一些 Descriptions 的样式覆盖，使其更清爽 */
:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  padding: 12px 16px;
}
:deep(.el-descriptions__label) {
  width: 130px;
  background-color: var(--el-fill-color-light) !important;
  color: var(--el-text-color-secondary);
}
</style>

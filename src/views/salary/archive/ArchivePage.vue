<!--src/views/salary/archive/ArchivePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="员工姓名/工号"
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
            <el-option label="待审核" :value="0" />
            <el-option label="已生效" :value="1" />
            <el-option label="被驳回" :value="2" />
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
              <span style="font-weight: 600; color: var(--el-text-color-primary)">{{
                row.employeeName
              }}</span>
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
            <span style="margin-left: 4px; font-size: 12px; color: #999">{{ row.currency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" prop="effectiveDate" width="120" align="center" />
        <el-table-column
          label="变动原因"
          prop="changeReason"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column label="审批状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)" class="status-tag">
              {{ getAuditStatusLabel(row.auditStatus) }}
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
      width="750px"
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
            <el-form-item label="员工ID" prop="employeeId">
              <el-input-number
                v-model="form.employeeId"
                :disabled="dialog.mode === 'adjust'"
                placeholder="员工ID"
                style="width: 100%"
                :controls="false"
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
            <el-form-item label="全勤奖标准" prop="fullAttendanceBonus">
              <el-input-number
                v-model="form.fullAttendanceBonus"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试用期底薪" prop="probationBaseSalary">
              <el-input-number
                v-model="form.probationBaseSalary"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">流转控制</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结算币种" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择" style="width: 100%">
                <el-option label="人民币 (CNY)" value="CNY" />
                <el-option label="菲律宾比索 (PHP)" value="PHP" />
                <el-option label="美元 (USD)" value="USD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="个税规则" prop="taxRuleCode">
              <el-select v-model="form.taxRuleCode" placeholder="请选择" style="width: 100%">
                <el-option label="中国居民综合所得税" value="TAX_RESIDENT_CN" />
                <el-option label="菲律宾本地税率" value="TAX_PH_LOCAL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择生效日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="变动原因" prop="changeReason">
          <el-input
            v-model="form.changeReason"
            type="textarea"
            :rows="2"
            placeholder="请填写定薪/调薪原因（如：年度普调、晋升），用于审计"
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
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工薪资档案管理 (包含入职定薪、调薪申请、草稿审批)
 * 依赖关联: 强依赖 Employee (员工库) 与 ItemConfig (薪资项配置库)
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态 (Vue Core)
import { ref, reactive, onMounted } from 'vue';

// [2] 第三方 UI 组件库与图标 (Element Plus & Icons)
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import {
  initEmployeeArchiveApi,
  adjustSalaryApi,
  auditArchiveApi,
  getArchivePageApi,
  getLatestEffectiveArchiveApi,
} from '@/api/salary/archive/archive.ts';

// [4] TS 强类型定义约束 (DTO / VO / Interfaces)
import type {
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
  ArchiveInitReqDTO,
  ArchiveAdjustReqDTO,
  ArchiveAuditReqDTO,
} from '@/types/salary/archive/archive.ts';

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
const dataList = ref<SalaryArchiveVO[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<ArchiveQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  latestFlag: 1, // 默认仅看最新版
  auditStatus: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '', mode: 'init' });
const form = ref<any>({});

// [审批表单状态]
const auditDialog = reactive({ visible: false });
const auditFormRef = ref<FormInstance>();
const auditForm = ref<ArchiveAuditReqDTO>({ id: 0, auditStatus: 1, remark: '' });

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工必填', trigger: 'blur' }],
  baseSalary: [{ required: true, message: '基本工资必填', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '生效日期必填', trigger: 'change' }],
  taxRuleCode: [{ required: true, message: '个税规则必选', trigger: 'change' }],
  changeReason: [{ required: true, message: '变动原因必填', trigger: 'blur' }],
  currency: [{ required: true, message: '结算币种必选', trigger: 'change' }],
});

const auditRules = reactive<FormRules>({
  auditStatus: [{ required: true, message: '必须选择审批结论', trigger: 'change' }],
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (!auditForm.value.auditStatus && !value) callback(new Error('驳回时必须填写审批意见'));
        else callback();
      },
      trigger: 'blur',
    },
  ],
});
const itemConfigOptions = ref([]); // 存储所有可选的薪资项配置
/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
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

/** 关闭并清理主表单操作弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

/** 状态映射工具函数 */
const getAuditStatusType = (status: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' };
  return map[status] || 'info';
};
const getAuditStatusLabel = (status: number) => {
  const map: Record<number, string> = { 0: '审批中', 1: '已生效', 2: '被驳回' };
  return map[status] || '未知';
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 获取分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getArchivePageApi(queryParams);
    dataList.value = res.records;
    total.value = res.total;
  } catch (error) {
    // 错误已由 request.ts 的拦截器统一处理，此处可按需补充
  } finally {
    loading.value = false;
  }
};

/** * 发起：新员工定薪 */
const handleInit = () => {
  form.value = {
    currency: 'CNY',
    taxRuleCode: 'TAX_RESIDENT_CN',
    archiveItems: [],
    baseSalary: 0,
  };
  dialog.mode = 'init';
  dialog.title = '新员工定薪配置';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** 老员工调薪申请 (需回显最新生效数据) */
const handleAdjust = async (row: SalaryArchiveVO) => {
  loading.value = true;
  try {
    // 调薪前必须拉取最新的完整档案（包含明细项）
    const latestArchive = await getLatestEffectiveArchiveApi(row.employeeId);

    form.value = {
      employeeId: latestArchive.employeeId,
      baseSalary: latestArchive.baseSalary,
      fullAttendanceBonus: latestArchive.fullAttendanceBonus,
      probationBaseSalary: latestArchive.probationBaseSalary,
      currency: latestArchive.currency,
      taxRuleCode: latestArchive.taxRuleCode,
      changeReason: '', // 清空原因，强制填写
      effectiveDate: '', // 清空生效日期，强制选择未来日期
      // 深度拷贝明细项，用于前端编辑
      archiveItems:
        latestArchive.archiveItems?.map((item) => ({
          itemConfigId: item.itemConfigId,
          amount: item.amount,
        })) || [],
    };
    dialog.mode = 'adjust';
    dialog.title = `调薪申请 - ${latestArchive.employeeName}`;
    dialog.visible = true;
  } finally {
    loading.value = false;
  }
};

/** * 发起：打开审批弹窗 */
const handleOpenAudit = (row: SalaryArchiveVO) => {
  auditForm.value = { id: row.id, auditStatus: 1, remark: '' };
  auditDialog.visible = true;
};

/** * 发起：查看详情 */
const handleDetail = (_row: SalaryArchiveVO) => {
  ElMessage.info('详细数据报表开发中...');
};

/** * 核心：校验并提交表单 (融合定薪与调薪) */
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

/** * 核心：提交 审批 结果 */
const submitAudit = async () => {
  if (!auditFormRef.value) return;
  await auditFormRef.value.validate(async (valid) => {
    if (valid) {
      await auditArchiveApi(auditForm.value);
      ElMessage.success(
        auditForm.value.auditStatus ? '审批已生效，系统基数已更新' : '已驳回作废草稿'
      );
      auditDialog.visible = false;
      await getList();
    }
  });
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
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
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

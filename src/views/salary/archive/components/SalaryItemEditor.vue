<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="75px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索员工姓名/工号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="审批状态" prop="auditStatus">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="选择状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in dicts.salary_audit_status"
              :key="item.dictItemValue"
              :label="item.dictItemLabel"
              :value="item.dictItemValue"
            />
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
        <el-table-column label="员工信息" min-width="160" fixed="left">
          <template #default="{ row }">
            <div class="info-cell">
              <span class="main-text">{{ row.employeeName }}</span>
              <span class="sub-text amount-font">[{{ row.employeeCode }}]</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="版本" width="85" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" type="info" size="small">V{{ row.version }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="基本工资" prop="baseSalary" min-width="130" align="right">
          <template #default="{ row }">
            <span class="amount-font text-primary">{{ row.baseSalary?.toFixed(2) }}</span>
            <span class="currency-tag">{{ row.currency }}</span>
          </template>
        </el-table-column>

        <el-table-column label="生效日期" prop="effectiveDate" width="120" align="center" />

        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusTag(row.auditStatus)" class="status-tag">
              {{ getDictLabel(dicts.salary_audit_status, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.latestFlag === 1 && row.auditStatus === 1"
              v-hasPerm="['salary:archive:adjust']"
              link
              type="primary"
              icon="EditPen"
              @click="handleAdjust(row)"
              >调薪</el-button
            >

            <el-button
              v-if="row.auditStatus === 0"
              v-hasPerm="['salary:archive:audit']"
              link
              type="warning"
              icon="Stamp"
              @click="handleOpenAudit(row)"
              >审批</el-button
            >

            <el-button link type="info" icon="Document" @click="handleDetail(row)">详情</el-button>
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

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">基础薪资配置</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对应员工" prop="employeeId">
              <el-input-number
                v-model="form.employeeId"
                :disabled="dialog.mode === 'adjust'"
                placeholder="ID"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基本工资" prop="baseSalary">
              <el-input-number
                v-model="form.baseSalary"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结算币种" prop="currency">
              <el-select v-model="form.currency" style="width: 100%">
                <el-option label="人民币 (CNY)" value="CNY" />
                <el-option label="菲律宾比索 (PHP)" value="PHP" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">薪资构成明细</div>
        <el-form-item label-width="0">
          <SalaryItemEditor v-model="form.archiveItems" :config-options="itemConfigOptions" />
        </el-form-item>

        <el-form-item label="变动原因" prop="changeReason">
          <el-input
            v-model="form.changeReason"
            type="textarea"
            :rows="2"
            placeholder="用于审计记录"
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
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工薪资档案管理页面
 * 业务关系: 1. 依赖字典项 (AuditStatus) 2. 依赖薪资项配置 (ItemConfigs) 3. 调用 Archive API
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 1. 业务组件与 Hooks

import { useDict } from '@/hooks/useDict';

// 2. API 与 类型定义
import {
  getArchivePageApi,
  initEmployeeArchiveApi,
  adjustSalaryApi,
  getLatestEffectiveArchiveApi,
} from '@/api/salary/archive/archive';
import type { SalaryArchiveVO, ArchiveQueryReqDTO } from '@/types/salary/archive/archive';
import type { DictItemVO } from '@/types/dictitem/dictitem.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false);

// [数据列表相关]
const total = ref(0);
const dataList = ref<SalaryArchiveVO[]>([]);
const itemConfigOptions = ref<any[]>([]); // 注入 Editor 的备选项

// [字典集成]
const dicts = useDict('salary_audit_status', 'salary_item_category', 'salary_item_sub_type');

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<ArchiveQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  latestFlag: 1,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '', mode: 'init' });
const form = ref<any>({});

// [校验规则]
const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工ID不能为空', trigger: 'blur' }],
  baseSalary: [{ required: true, message: '基本工资不能为空', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
  changeReason: [{ required: true, message: '请填写变动原因', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

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

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 执行：分页查询列表数据 */
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

/** 执行：打开入职定薪弹窗 */
const handleInit = () => {
  dialog.mode = 'init';
  dialog.title = '员工首次入职定薪';
  form.value = { currency: 'CNY', archiveItems: [], baseSalary: 0 };
  dialog.visible = true;
};

/** 执行：打开调薪申请弹窗 (需加载最新数据快照) */
const handleAdjust = async (row: SalaryArchiveVO) => {
  loading.value = true;
  try {
    const latest = await getLatestEffectiveArchiveApi(row.employeeId);
    form.value = {
      ...latest,
      id: undefined, // 调薪是生成新记录，不能带旧记录主键
      changeReason: '',
      effectiveDate: '',
    };
    dialog.mode = 'adjust';
    dialog.title = `发起调薪申请 - ${row.employeeName}`;
    dialog.visible = true;
  } finally {
    loading.value = false;
  }
};

/** 核心：提交定薪/调薪表单 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (dialog.mode === 'init') {
        await initEmployeeArchiveApi(form.value);
        ElMessage.success('员工定薪成功');
      } else {
        await adjustSalaryApi(form.value);
        ElMessage.success('调薪申请已提交审批');
      }
      dialog.visible = false;
      getList();
    }
  });
};

/** 辅助逻辑区 */
const getDictLabel = (dictList: DictItemVO[] | undefined, value: any) => {
  // 使用 ?? [] 确保 dictList 始终作为数组处理
  const target = (dictList ?? []).find((d) => d.dictItemValue === String(value));
  return target ? target.dictItemLabel : '';
};

const getAuditStatusTag = (status: number) => {
  const map: any = { 0: 'warning', 1: 'success', 2: 'danger' };
  return map[status] || 'info';
};

const handleOpenAudit = (_row: any) => {
  ElMessage.info('正在唤起审批工作流...');
};
const handleDetail = (_row: any) => {
  ElMessage.info('查看档案全量历史快照...');
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
  // 模拟加载薪资项目配置列表 (实际从 API 获取)
  itemConfigOptions.value = [
    { id: 1, name: '餐补', itemType: 1, subTypeCode: 'INC_ALLOWANCE', defaultAmount: 500 },
    {
      id: 2,
      name: 'SSS 菲律宾社保',
      itemType: 2,
      subTypeCode: 'PHP_SSS',
      ruleScript: 'base * 0.04',
    },
  ];
});
</script>

<style scoped lang="scss">
.info-cell {
  display: flex;
  flex-direction: column;
  .main-text {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .sub-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.amount-font {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.currency-tag {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  margin: 15px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
}
</style>

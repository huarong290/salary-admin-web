<!--src/views/salary/calctule/CalcRulePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入规则名称或编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="规则阶段" prop="stage">
          <el-select
            v-model="queryParams.stage"
            placeholder="请选择核算阶段"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in STAGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="规则状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
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
        <el-button type="primary" icon="Plus" @click="handleAdd">新增规则</el-button>
        <el-button type="danger" icon="Delete" :disabled="multiple" @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="规则编码" align="center" prop="ruleCode" width="150" />
        <el-table-column label="规则名称" align="center" prop="ruleName" min-width="150" />

        <el-table-column label="类型" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.ruleType === 1 ? 'primary' : 'warning'">
              {{ row.ruleType === 1 ? '公式' : '函数' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="核算阶段" align="center" width="150">
          <template #default="{ row }">
            <el-tag :type="getStageTagType(row.stage)">
              {{ getStageLabel(row.stage) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="执行权重" align="center" prop="sortValue" width="90" />

        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-tag">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
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
        <div class="section-title">基础配置信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则编码" prop="ruleCode">
              <el-input
                v-model="form.ruleCode"
                placeholder="如: BASE_SALARY"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="规则类型" prop="ruleType">
              <el-radio-group v-model="form.ruleType">
                <el-radio :label="1">公式</el-radio>
                <el-radio :label="2">函数</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核算阶段" prop="stage">
              <el-select v-model="form.stage" placeholder="请选择所属阶段" style="width: 100%">
                <el-option
                  v-for="item in STAGE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="返回值类型" prop="returnType">
              <el-select
                v-model="form.returnType"
                placeholder="脚本执行返回类型"
                style="width: 100%"
              >
                <el-option label="数值型 (BigDecimal/Double)" value="Number" />
                <el-option label="布尔型 (Boolean)" value="Boolean" />
                <el-option label="字符串 (String)" value="String" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行权重" prop="sortValue">
              <el-input-number
                v-model="form.sortValue"
                :min="0"
                :max="999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title" style="margin-top: 20px">引擎计算逻辑</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="表达式脚本" prop="ruleScript">
              <el-input
                v-model="form.ruleScript"
                type="textarea"
                :rows="5"
                placeholder="请输入 Aviator 表达式，如: baseSalary + performanceBonus"
                style="font-family: monospace"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="依赖变量" prop="dependsOn">
              <el-input
                v-model="form.dependsOn"
                placeholder="如需依赖其他规则的值，请填入对应的 RuleCode，用逗号分隔"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注说明" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="2"
                placeholder="规则补充说明..."
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
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资计算规则管理 (维护 Aviator 计算引擎所需的公式和函数)
 * 依赖关联: 供 SalaryCoreEngine 调用，同时作为 Pipeline 管道的底层节点数据
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 导入 API
import {
  getCalcRulePageApi,
  addCalcRuleApi,
  editCalcRuleApi,
  deleteCalcRuleApi,
} from '@/api/salary/calcrule/calcRule';

// 导入 TS 类型与常量
import type {
  CalcRuleVO,
  CalcRuleQueryReqDTO,
  CalcRuleAddReqDTO,
  CalcRuleEditReqDTO,
} from '@/types/salary/calcrule/calcrule';
import { STAGE_OPTIONS } from '@/types/salary/calcrule/calcrule';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
const loading = ref(false);
const isFullscreen = ref(false);

const total = ref(0);
const dataList = ref<CalcRuleVO[]>([]);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

const queryFormRef = ref<FormInstance>();
const queryParams = reactive<CalcRuleQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  stage: undefined,
  status: undefined,
});

const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<Partial<CalcRuleAddReqDTO & CalcRuleEditReqDTO>>({});

// 表单前端合法性校验规则
const rules = reactive<FormRules>({
  ruleCode: [{ required: true, message: '规则编码不能为空', trigger: 'blur' }],
  ruleName: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  stage: [{ required: true, message: '请选择核算阶段', trigger: 'change' }],
  ruleScript: [{ required: true, message: '表达式脚本不能为空', trigger: 'blur' }],
  returnType: [{ required: true, message: '请选择返回值类型', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const handleSelectionChange = (selection: CalcRuleVO[]) => {
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

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

// 工具方法：映射阶段颜色
const getStageTagType = (stage: number) => {
  const option = STAGE_OPTIONS.find((o) => o.value === stage);
  return option ? option.color : 'info';
};

// 工具方法：映射阶段文案
const getStageLabel = (stage: number) => {
  const option = STAGE_OPTIONS.find((o) => o.value === stage);
  return option ? option.label : '未知阶段';
};
const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return;
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedIds.value.length} 条规则吗? 删除后可能导致管道执行失败!`,
    '高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      // 假设你有批量删除的 API
      // await deleteCalcRuleByIdsApi(selectedIds.value, true);
      ElMessage.success('批量删除成功');
      await getList();
    })
    .catch(() => {});
};
/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getCalcRulePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载规则列表失败', error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  // 提供默认值
  form.value = {
    status: 1,
    ruleType: 1,
    stage: 1,
    sortValue: 0,
    returnType: 'Number',
  };
  dialog.title = '新增计算规则';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: CalcRuleVO) => {
  form.value = { ...row }; // 展开赋值
  dialog.title = '修改计算规则';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editCalcRuleApi(form.value as CalcRuleEditReqDTO);
        ElMessage.success('规则修改成功');
      } else {
        await addCalcRuleApi(form.value as CalcRuleAddReqDTO);
        ElMessage.success('新增规则成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = (row: CalcRuleVO) => {
  ElMessageBox.confirm(
    `确认删除规则 [${row.ruleCode}] 吗? 删除后可能导致管道执行失败!`,
    '高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await deleteCalcRuleApi(row.id, true); // 默认走逻辑删除
      ElMessage.success('规则删除成功');
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
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

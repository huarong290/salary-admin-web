<!--src/views/salary/config/SalaryConfigPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="配置名称" prop="configName">
          <el-input
            v-model="queryParams.configName"
            placeholder="搜索配置名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="配置键" prop="configKey">
          <el-input
            v-model="queryParams.configKey"
            placeholder="如: SETTLEMENT_CURRENCY"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="activeFlag">
          <el-select
            v-model="queryParams.activeFlag"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="1" />
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
        <el-button v-hasPerm="['salary:config:add']" type="primary" icon="Plus" @click="handleAdd">
          新增配置项
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="配置名称" prop="configName" min-width="150" show-overflow-tooltip />
        <el-table-column label="配置键 (Key)" prop="configKey" min-width="200">
          <template #default="{ row }">
            <code class="code-font amount-font">{{ row.configKey }}</code>
          </template>
        </el-table-column>
        <el-table-column label="配置值" prop="configValue" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.activeFlag"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.updateTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:config:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleEdit(row)"
            >
              修改
            </el-button>
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
      width="600px"
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
        <div class="section-title">核心属性配置</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="配置名称" prop="configName">
              <el-input v-model="form.configName" placeholder="如：结算币种、默认核算标准" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="配置键" prop="configKey">
              <el-input
                v-model="form.configKey"
                placeholder="如：SETTLEMENT_CURRENCY"
                :disabled="dialog.type === 'edit'"
              >
                <template v-if="dialog.type === 'edit'" #append>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
              <div v-if="dialog.type === 'add'" class="form-tips">
                由大写字母和下划线组成，保存后不可修改其 Key。
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">数值与生命周期</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="配置值" prop="configValue">
              <el-input v-model="form.configValue" placeholder="请输入配置内容" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置状态" prop="activeFlag">
              <el-radio-group v-model="form.activeFlag">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="描述该配置项的作用范围、取值标准等..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm"
            >确 定 保 存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资系统全局配置管理 (支撑整个薪资引擎的核心元数据参数)
 * 依赖关联: 决定核算周期、基准币种、社保公积金计算基数等底层逻辑
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
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Lock, FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import { addConfigApi, editConfigApi, getConfigPageApi } from '@/api/salary/config/config.ts';

// [4] TS 强类型定义约束 (DTO / VO)
import type { SalaryConfigVO } from '@/types/salary/config/config.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false); // 表格加载层
const submitLoading = ref(false); // 按钮防抖加载
const isFullscreen = ref(false); // 弹窗全屏

// [表格与分页状态]
const total = ref(0);
const dataList = ref<SalaryConfigVO[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  configName: '',
  configKey: '',
  activeFlag: undefined as number | undefined,
});

// [配置弹窗状态]
const dialog = reactive({
  visible: false,
  title: '',
  type: 'add', // 'add' | 'edit'
});
const formRef = ref<FormInstance>();
const form = ref<any>({
  id: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  activeFlag: 1,
  remark: '',
});

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  configName: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  configKey: [
    { required: true, message: '配置键不能为空', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '仅允许大写字母与下划线', trigger: 'blur' },
  ],
  configValue: [{ required: true, message: '配置值不能为空', trigger: 'blur' }],
  activeFlag: [{ required: true, message: '请选择状态', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 触发搜索查询 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索过滤 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 取消并关闭弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取配置分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getConfigPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增配置项 */
const handleAdd = () => {
  dialog.type = 'add';
  dialog.title = '新增薪资配置项';
  form.value = {
    id: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    activeFlag: 1,
    remark: '',
  };
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：编辑现有配置 */
const handleEdit = (row: SalaryConfigVO) => {
  dialog.type = 'edit';
  dialog.title = '修改薪资配置项';
  form.value = { ...row }; // 回显快照
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交配置表单映射 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (dialog.type === 'add') {
          await addConfigApi(form.value);
          ElMessage.success('配置新增成功');
        } else {
          // 架构师细节：对应 EditReqDTO，排除不可修改的 configKey 字段
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { configKey: _, ...updateData } = form.value;
          await editConfigApi(updateData);
          ElMessage.success('配置更新成功');
        }
        dialog.visible = false;
        await getList();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

/** * 业务：快捷切换配置启用状态 (Switch 直接联动) */
const handleStatusChange = async (row: SalaryConfigVO) => {
  const text = row.activeFlag === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认要 ${text} 配置项 "${row.configName}" 吗？`, '安全风险提示', {
      type: 'warning',
    });
    // 采用状态变更专用映射 (只发送状态相关字段)
    await editConfigApi({
      id: row.id,
      configName: row.configName,
      configValue: row.configValue,
      activeFlag: row.activeFlag,
    });
    ElMessage.success(`${text}成功`);
  } catch {
    // 操作撤销：回滚 Switch 组件状态
    row.activeFlag = row.activeFlag === 1 ? 0 : 1;
  }
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList(); // 首屏渲染
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处仅保留配置项特有的代码展示风格及表单提示。
   ===================================================================== */

.code-font {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 12px;
}

.form-tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin-top: 6px;
  padding-left: 2px;
}
</style>

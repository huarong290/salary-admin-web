<!--src/views/salary/config/SalaryConfigPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
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

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['salary:config:add']" type="primary" icon="Plus" @click="handleAdd">
          新增配置项
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%" stripe>
        <el-table-column label="配置名称" prop="configName" min-width="150" />
        <el-table-column label="配置键 (Key)" prop="configKey" min-width="200">
          <template #default="{ row }">
            <code class="code-font">{{ row.configKey }}</code>
          </template>
        </el-table-column>
        <el-table-column label="配置值" prop="configValue" min-width="180">
          <template #default="{ row }">
            <span class="value-text">{{ row.configValue }}</span>
          </template>
        </el-table-column>
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
        <el-table-column label="更新时间" align="center" prop="updateTime" width="160" />
        <el-table-column label="备注" prop="remark" show-overflow-tooltip min-width="150" />

        <el-table-column label="操作" align="center" width="120" fixed="right">
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
      :title="dialog.title"
      width="600px"
      append-to-body
      draggable
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入直观的配置名称，如：结算币种" />
        </el-form-item>

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
            由大写字母和下划线组成，保存后不可修改。
          </div>
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <el-input v-model="form.configValue" placeholder="请输入配置值" />
        </el-form-item>

        <el-form-item label="配置状态" prop="activeFlag">
          <el-radio-group v-model="form.activeFlag">
            <el-radio :label="1">正常 (启用)</el-radio>
            <el-radio :label="0">停用 (草稿)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="描述该配置的作用、取值范围等"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资系统全局配置管理 (元数据维护)
 * 依赖关联: 控制整个薪资引擎的核心参数 (如币种、核算天数标准等)
 * ====================================================================
 */

// 1. Vue 与核心功能依赖
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Lock } from '@element-plus/icons-vue';

// 2. 业务 API 接口与类型
import { addConfigApi, editConfigApi, getConfigPageApi } from '@/api/salary/config/config.ts';
import type { SalaryConfigVO } from '@/types/salary/config/config.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const submitLoading = ref(false);

// [表格与分页状态]
const total = ref(0);
const dataList = ref<SalaryConfigVO[]>([]);

// [查询条件状态]
const queryFormRef = ref<any>();
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
const formRef = ref<any>();
const form = ref<any>({
  id: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  activeFlag: 1,
  remark: '',
});

// [表单校验规则]
const rules = {
  configName: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  configKey: [
    { required: true, message: '配置键不能为空', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '配置键只能包含大写字母和下划线', trigger: 'blur' },
  ],
  configValue: [{ required: true, message: '配置值不能为空', trigger: 'blur' }],
  activeFlag: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

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
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** 获取分页列表 */
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

/** 发起新增 */
const handleAdd = () => {
  dialog.type = 'add';
  dialog.title = '新增配置项';
  form.value = {
    id: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    activeFlag: 1,
    remark: '',
  };
  dialog.visible = true;
};

/** 发起编辑 */
const handleEdit = (row: SalaryConfigVO) => {
  dialog.type = 'edit';
  dialog.title = '修改配置项';
  // 回显数据，编辑时无需校验 configKey，前端将其置灰
  form.value = { ...row };
  dialog.visible = true;
};

/** 提交表单 (Add/Edit 共用) */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (dialog.type === 'add') {
          await addConfigApi(form.value);
          ElMessage.success('新增配置成功');
        } else {
          /**
           * 对应 SalaryConfigEditReqDTO：不包含 configKey
           * 使用解构赋值：把 configKey 拎出来丢掉，其余属性放入 updateData
           */
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { configKey: _, ...updateData } = form.value;
          // 这样发出的请求体就只有：id, configName, configValue, activeFlag, remark
          await editConfigApi(updateData);
          ElMessage.success('修改配置成功');
        }
        dialog.visible = false;
        await getList();
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

/** 快捷修改状态 (Switch 组件触发) */
const handleStatusChange = async (row: SalaryConfigVO) => {
  const text = row.activeFlag === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认要 ${text} 配置项 "${row.configName}" 吗？`, '状态变更', {
      type: 'warning',
    });
    // 复用 edit 接口更新状态
    await editConfigApi({
      id: row.id,
      configName: row.configName,
      configValue: row.configValue,
      activeFlag: row.activeFlag,
    });
    ElMessage.success(`${text}成功`);
  } catch (err) {
    // 捕获取消操作，恢复 Switch 的状态
    row.activeFlag = row.activeFlag === 1 ? 0 : 1;
    console.log('出错了', err);
  }
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  =====================================================================
*/
.code-font {
  font-family: 'Consolas', 'Courier New', monospace;
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 13px;
}

.value-text {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.form-tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 4px;
}
</style>

<!--src/views/salary/itemconfig/ItemConfigPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="0">
        <el-form-item prop="searchText">
          <el-input
            v-model="queryParams.searchText"
            placeholder="项目名称/编码/拼音"
            clearable
            prefix-icon="Search"
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item prop="itemCategory">
          <el-select
            v-model="queryParams.itemCategory"
            placeholder="项目分类"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in dict.salary_item_category"
              :key="item.dictItemValue"
              :label="item.dictItemLabel"
              :value="item.dictItemValue"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button
            v-hasPerm="['salary:item_config:add']"
            type="success"
            icon="Plus"
            @click="handleAdd"
          >
            新增项目
          </el-button>
          <el-button icon="Cpu" @click="handleRefreshCache">同步配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card flex-1">
      <el-table v-loading="loading" :data="list" border height="100%" highlight-current-row>
        <el-table-column label="计算顺序" prop="calcPriority" width="90" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" type="warning" class="amount-font">{{ row.calcPriority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="项目名称/编码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="item-info">
              <span class="font-bold">{{ row.itemName }}</span>
              <span class="text-secondary amount-font">[{{ row.itemCode }}]</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="脚本变量名" prop="envVarName" min-width="140">
          <template #default="{ row }">
            <code class="var-code">{{ row.envVarName }}</code>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.itemCategory)" class="status-tag">
              {{ row.categoryLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="合规属性" width="160">
          <template #default="{ row }">
            <div class="tag-group">
              <el-tag v-if="row.taxableFlag" size="small" type="danger">计税</el-tag>
              <el-tag v-if="row.taxDeductibleFlag" size="small" type="primary">税前扣除</el-tag>
              <el-tag v-if="row.fixedFlag" size="small" type="info">系统内置</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              disabled
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:item_config:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:item_config:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      width="700px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ dialog.title }}</span>
          <el-button link class="fullscreen-btn" @click="isFullscreen = !isFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">核心定义</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="itemName">
              <el-input v-model="form.itemName" placeholder="如：绩效奖金" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目编码" prop="itemCode">
              <el-input
                v-model="form.itemCode"
                placeholder="如：PERF_BONUS"
                :disabled="form.id && form.fixedFlag === 1"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目大类" prop="itemCategory">
              <el-select
                v-model="form.itemCategory"
                placeholder="项目分类"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in dict.salary_item_category"
                  :key="item.dictItemValue"
                  :label="item.dictItemLabel"
                  :value="item.dictItemValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字典映射" prop="categoryDictValue">
              <el-select
                v-model="form.categoryDictValue"
                placeholder="业务细类"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in dict.salary_item_sub_type"
                  :key="item.dictItemValue"
                  :label="item.dictItemLabel"
                  :value="item.dictItemValue"
                >
                  <span style="float: left">{{ item.dictItemLabel }}</span>
                  <span style="float: right; color: #999; font-size: 12px">{{
                    item.dictItemValue
                  }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">引擎与脚本</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="变量名" prop="envVarName">
              <el-input
                v-model="form.envVarName"
                placeholder="脚本变量名"
                :disabled="form.id && form.fixedFlag === 1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算优先级" prop="calcPriority">
              <el-input-number v-model="form.calcPriority" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规则脚本" prop="defaultRuleScript">
          <el-input
            v-model="form.defaultRuleScript"
            type="textarea"
            :rows="3"
            placeholder="支持 Groovy 表达式，例如：baseSalary * 0.1"
          />
        </el-form-item>

        <div class="section-title">财务开关</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="计税标识" prop="taxableFlag">
              <el-switch v-model="form.taxableFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税前扣除" prop="taxDeductibleFlag">
              <el-switch v-model="form.taxDeductibleFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
 * 功能描述: 薪资项目统一配置 (定义发薪项元数据、计算优先级、Groovy脚本)
 * 业务逻辑:
 * 1. 优先级 (calcPriority) 决定引擎计算先后顺序。
 * 2. 系统内置项 (fixedFlag=1) 禁止修改核心变量名，防止破坏预设公式。
 * 3. 修改配置后需点击“同步配置”清理 Redis 缓存。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
// [1] Vue 核心钩子与原生生态 (Vue Core)
import { ref, reactive, onMounted } from 'vue';
// [2] 第三方 UI 组件库与图标 (Element Plus & Icons)
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import type {
  SalaryItemConfigVO,
  ItemConfigQueryReqDTO,
} from '@/types/salary/itemconfig/itemConfig.ts';
import {
  addItemConfigApi,
  deleteItemConfigApi,
  editItemConfigApi,
  getItemConfigDetailApi,
  getItemConfigPageApi,
  refreshItemConfigCacheApi,
} from '@/api/salary/itemconfig/itemType.ts';
import { useDict } from '@/hooks/useDict.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
const loading = ref(false);
const total = ref(0);
const list = ref<SalaryItemConfigVO[]>([]);
const queryFormRef = ref<FormInstance>();
const isFullscreen = ref(false);
// 只需要这一行，就拿到了两个维度的字典数据
const dict = useDict('salary_item_category', 'salary_item_sub_type');
// [查询参数状态]
const queryParams = reactive<ItemConfigQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  searchText: undefined,
  itemCategory: undefined,
});

// [UI 控制状态]
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<FormInstance>();
const form = ref<any>({});

// [校验规则集]
const rules = reactive<FormRules>({
  itemName: [{ required: true, message: '项目名称必填', trigger: 'blur' }],
  itemCode: [{ required: true, message: '业务编码必填', trigger: 'blur' }],
  envVarName: [{ required: true, message: '脚本变量必填', trigger: 'blur' }],
  itemCategory: [{ required: true, message: '必须选择分类', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
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

const getCategoryType = (cat: number) => {
  const map: any = { 1: 'success', 2: 'danger', 3: 'warning', 4: 'info' };
  return map[cat] || 'info';
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 执行：获取分页列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getItemConfigPageApi(queryParams);
    list.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增项目 */
const handleAdd = () => {
  form.value = {
    status: 1,
    calcPriority: 10,
    taxableFlag: 0,
    taxDeductibleFlag: 0,
    fixedFlag: 0, // 显式设置固定项标识为 0 (非系统内置)
  };
  dialog.title = '新增薪资项目';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改项目 (获取详情) */
const handleUpdate = async (row: SalaryItemConfigVO) => {
  const res = await getItemConfigDetailApi(row.id);
  form.value = { ...res };
  dialog.title = '修改薪资项目';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：提交配置表单 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editItemConfigApi(form.value);
        ElMessage.success('配置已更新');
      } else {
        await addItemConfigApi(form.value);
        ElMessage.success('项目已创建');
      }
      dialog.visible = false;
      getList();
    }
  });
};

/** * 执行：逻辑删除
 * 警告：删除薪资项会导致历史数据解析变量失败，需二次确认
 */
const handleDelete = (row: SalaryItemConfigVO) => {
  ElMessageBox.confirm(`确认删除 "${row.itemName}" 吗？此操作可能导致关联公式失效。`, '危险提示', {
    type: 'error',
  }).then(async () => {
    await deleteItemConfigApi(row.id);
    ElMessage.success('已逻辑删除');
    getList();
  });
};

/** * 执行：强制刷新 Redis 缓存 */
const handleRefreshCache = async () => {
  await refreshItemConfigCacheApi();
  ElMessage.success('计算引擎缓存已实时同步');
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
/* 业务私有样式 */
.item-info {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
  .font-bold {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.var-code {
  font-family: 'Fira Code', 'Courier New', monospace;
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 13px;
}

.tag-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>

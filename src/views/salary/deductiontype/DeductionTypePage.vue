<!--src/views/salary/deductiontype/DeductionTypePage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索编码、名称或拼音"
            clearable
            @keyup.enter="handleQuery"
          />
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
          v-hasPerm="['salary:deduction_type:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
          >新增类型</el-button
        >
        <el-button
          v-hasPerm="['salary:deduction_type:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
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
        <el-table-column label="编码" align="center" width="160">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.typeCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="扣款名称" prop="typeName" min-width="150" show-overflow-tooltip />
        <el-table-column label="拼音" align="center" width="100">
          <template #default="{ row }">
            <span class="amount-font">{{ row.pinyinCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" align="center" width="140">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.categoryName)" effect="plain" class="status-tag">
              {{ row.categoryName || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="固定扣款" align="center" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.isFixed === 1 ? 'danger' : 'info'"
              :effect="row.isFixed === 1 ? 'dark' : 'plain'"
              class="status-tag"
            >
              {{ row.isFixed === 1 ? '固定' : '按需' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" width="80">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.sortValue }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:deduction_type:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:deduction_type:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
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
        <div class="section-title">基础标识配置</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="扣款名称" prop="typeName">
              <el-input
                v-model="form.typeName"
                placeholder="如: 养老保险、事假扣除"
                @input="handleTypeNameInput"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型编码" prop="typeCode">
              <el-input v-model="form.typeCode" placeholder="系统自动生成" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拼音缩写" prop="pinyinCode">
              <el-input v-model="form.pinyinCode" placeholder="系统自动生成" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">业务属性与排序</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目分类" prop="categoryName">
              <el-select
                v-model="form.categoryName"
                placeholder="请选择或输入"
                style="width: 100%"
                filterable
                allow-create
              >
                <el-option label="五险一金" value="五险一金" />
                <el-option label="考勤扣除" value="考勤扣除" />
                <el-option label="行政罚款" value="行政罚款" />
                <el-option label="后勤代扣" value="后勤代扣" />
                <el-option label="个人所得税" value="个人所得税" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sortValue">
              <el-input-number
                v-model="form.sortValue"
                :min="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="固定扣款" prop="isFixed">
              <el-switch
                v-model="form.isFixed"
                :active-value="1"
                :inactive-value="0"
                active-text="固定扣除项"
                inactive-text="变动录入项"
              />
              <div class="form-tips">固定项通常用于档案配置，变动项用于每月临时录入。</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="适用范围或计算逻辑说明"
          />
        </el-form-item>
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
 * 功能描述: 薪资扣款类型管理 (底层字典配置)
 * 依赖关联: 支撑 Archive (固定薪资配置) 和 Variable (每月变动扣款)
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted } from 'vue';
import { pinyin } from 'pinyin-pro';

// [2] 第三方 UI 组件库与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  addDeductionTypeApi,
  batchDeleteDeductionTypeApi,
  deleteDeductionTypeApi,
  editDeductionTypeApi,
  getDeductionTypePageApi,
} from '@/api/salary/deductiontype/deductionType.ts';

// [4] TS 强类型定义约束
import type {
  DeductionTypeQueryReqDTO,
  DeductionTypeVO,
} from '@/types/salary/deductiontype/deductionType.ts';

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
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<DeductionTypeVO[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<DeductionTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '扣款名称不能为空', trigger: 'blur' }],
  sortValue: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
  categoryName: [{ required: true, message: '项目分类不能为空', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

/** 表格复选框状态改变 */
const handleSelectionChange = (selection: DeductionTypeVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
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

/** UI 辅助：根据分类动态映射标签颜色 */
const getCategoryTagType = (categoryName: string) => {
  if (!categoryName) return 'info';
  if (categoryName.includes('五险一金')) return 'primary';
  if (categoryName.includes('考勤') || categoryName.includes('罚款')) return 'danger';
  if (categoryName.includes('税')) return 'warning';
  return '';
};

/** 🌟 核心交互：监听名称输入，智能生成拼音及编码 */
const handleTypeNameInput = (val: string) => {
  if (!form.value.id && val) {
    const shortPinyin = pinyin(val, { pattern: 'first', toneType: 'none' })
      .replace(/\s+/g, '')
      .toUpperCase();
    form.value.pinyinCode = shortPinyin;
    form.value.typeCode = `DED_${shortPinyin}`;
  } else if (!form.value.id && !val) {
    form.value.pinyinCode = '';
    form.value.typeCode = 'DED_';
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
    const res = await getDeductionTypePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增数据 */
const handleAdd = () => {
  form.value = { typeCode: 'DED_', sortValue: 99, isFixed: 0, categoryName: '' };
  dialog.title = '新增扣款项目定义';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改数据 */
const handleUpdate = (row: DeductionTypeVO) => {
  form.value = { ...row };
  dialog.title = '修改扣款项目定义';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：提交表单映射 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editDeductionTypeApi(form.value);
        ElMessage.success('配置修改成功');
      } else {
        await addDeductionTypeApi(form.value);
        ElMessage.success('配置新增成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：物理删除记录 (高危操作) */
const handleDelete = (row: DeductionTypeVO) => {
  ElMessageBox.confirm(
    `即将永久删除扣款项 "${row.typeName}"！若已有档案关联此类型，可能导致核算异常，确认删除?`,
    '底层数据高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await deleteDeductionTypeApi(row.id);
      ElMessage.success('数据已销毁');
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 个扣款定义项?`,
    '高危操作提示',
    { type: 'error' }
  )
    .then(async () => {
      await batchDeleteDeductionTypeApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区 (Lifecycle Hooks)
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
   ===================================================================== */

.form-tips {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  margin-top: 8px;
  padding: 4px 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>

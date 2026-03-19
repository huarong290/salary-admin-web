<!--src/views/salary/deductiontype/DeductionTypePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
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

    <el-card shadow="never" class="table-card">
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
          <template #default="scope">
            <span class="amount-font text-secondary">{{ scope.row.typeCode }}</span>
          </template>
        </el-table-column>

        <el-table-column label="扣款名称" prop="typeName" min-width="150" show-overflow-tooltip />

        <el-table-column label="拼音" align="center" width="120">
          <template #default="scope">
            <span class="amount-font">{{ scope.row.pinyinCode }}</span>
          </template>
        </el-table-column>

        <el-table-column label="分类" align="center" width="140">
          <template #default="scope">
            <el-tag :type="getCategoryTagType(scope.row.categoryName)" effect="plain" size="small">
              {{ scope.row.categoryName || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="固定扣款" align="center" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.isFixed === 1 ? 'danger' : 'info'"
              :effect="scope.row.isFixed === 1 ? 'dark' : 'plain'"
              size="small"
            >
              {{ scope.row.isFixed === 1 ? '固定扣除' : '按需扣除' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序值" align="center" width="90">
          <template #default="scope">
            <span class="amount-font">{{ scope.row.sortValue }}</span>
          </template>
        </el-table-column>

        <el-table-column label="说明" prop="description" min-width="180" show-overflow-tooltip />

        <el-table-column label="创建时间" align="center" width="170">
          <template #default="scope">
            <span class="amount-font">{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:deduction_type:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:deduction_type:del']"
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
          <el-button link @click="toggleFullscreen">
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
              <el-input v-model="form.typeCode" placeholder="如: DED_TAX" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拼音缩写" prop="pinyinCode">
              <el-input v-model="form.pinyinCode" placeholder="如: YLBX" />
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
                <el-option label="个人所得税" value="个人所得税" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sortValue">
              <el-input-number
                v-model="form.sortValue"
                :min="1"
                :max="99999"
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
                active-text="是"
                inactive-text="否"
              />
              <div class="tips-box">
                若开启，该扣款项通常作为档案的固定配置，而非每月临时录入的变动项。
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="项目说明" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入该扣款项的适用范围或计算说明"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资扣款类型字典管理页 (配置薪资单上的【扣发项】基准数据)
 * 依赖关联: 该模块作为底层字典，支撑 Archive(档案明细) 和 Variable(变动明细)
 * ====================================================================
 */

// 1. Vue 与核心功能依赖
import { ref, reactive, onMounted } from 'vue';
import { pinyin } from 'pinyin-pro';

// 2. Element Plus 依赖
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 3. 业务 API 接口与类型定义
import {
  addDeductionTypeApi,
  batchDeleteDeductionTypeApi,
  deleteDeductionTypeApi,
  editDeductionTypeApi,
  getDeductionTypePageApi,
} from '@/api/salary/deductiontype/deductionType.ts';
import type {
  DeductionTypeQueryReqDTO,
  DeductionTypeVO,
} from '@/types/salary/deductiontype/deductionType.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

const loading = ref(false);
const isFullscreen = ref(false);

const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<DeductionTypeVO[]>([]);

const queryFormRef = ref<FormInstance>();
const queryParams = reactive<DeductionTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});

const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '扣款名称不能为空', trigger: 'blur' }],
  sortValue: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
  categoryName: [{ required: true, message: '项目分类不能为空', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleSelectionChange = (selection: DeductionTypeVO[]) => {
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

/** UI 辅助：根据不同分类自动映射不同的 Tag 颜色 */
const getCategoryTagType = (categoryName: string) => {
  if (!categoryName) return 'info';
  if (categoryName.includes('五险一金')) return 'primary';
  if (categoryName.includes('考勤') || categoryName.includes('罚款')) return 'danger';
  if (categoryName.includes('税')) return 'warning';
  return '';
};

/** 智能录入体验：监听输入，动态生成拼音和编码 */
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
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

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

const handleAdd = () => {
  form.value = {
    typeCode: 'DED_',
    sortValue: 99,
    isFixed: 0,
    categoryName: '',
  };
  dialog.title = '新增扣款字典项';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: DeductionTypeVO) => {
  form.value = { ...row };
  dialog.title = '修改扣款字典项';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editDeductionTypeApi(form.value);
        ElMessage.success('配置修改成功');
      } else {
        await addDeductionTypeApi(form.value);
        ElMessage.success('字典项新增成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

/** 高危操作：防呆防御机制 */
const handleDelete = (row: DeductionTypeVO) => {
  ElMessageBox.confirm(
    `即将永久删除扣款项 "${row.typeName}"！若已有档案或变动明细使用此类型，可能导致核算异常，是否确认?`,
    '系统底层高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await deleteDeductionTypeApi(row.id);
      ElMessage.success('字典项已销毁');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 个扣款字典项?`,
    '系统底层高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await batchDeleteDeductionTypeApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      // 处理由于删除导致当前页变空，自动往前跳一页
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      getList();
    })
    .catch(() => {});
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
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  =====================================================================
*/

.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 500;
}
.text-secondary {
  color: var(--el-text-color-secondary);
}

.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 10px 0 20px;
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

/* 提示框美化：与 PeriodPage 保持一致的提示感 */
.tips-box {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  padding: 4px 10px;
  border-radius: 4px;
  line-height: 1.4;
  margin-top: 8px;
  margin-left: 10px;
  display: inline-block;
}
</style>

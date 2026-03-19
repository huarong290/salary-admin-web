<!--src/views/salary/incometype/IncomeTypePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索类型编码或名称"
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
          v-hasPerm="['salary:income_type:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
          >新增类型</el-button
        >
        <el-button
          v-hasPerm="['salary:income_type:del']"
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

        <el-table-column label="收入名称" prop="typeName" min-width="150" show-overflow-tooltip />

        <el-table-column label="拼音缩写" align="center" width="120">
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
              v-hasPerm="['salary:income_type:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:income_type:del']"
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
            <el-form-item label="收入名称" prop="typeName">
              <el-input
                v-model="form.typeName"
                placeholder="如: 基本工资、绩效奖金"
                @input="handleTypeNameInput"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型编码" prop="typeCode">
              <el-input v-model="form.typeCode" placeholder="如: INC_BASE" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拼音缩写" prop="pinyinCode">
              <el-input v-model="form.pinyinCode" placeholder="如: JCGZ" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">业务属性与排序</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目分类" prop="categoryName">
              <el-select
                v-model="form.categoryName"
                placeholder="选择或输入分类"
                style="width: 100%"
                filterable
                allow-create
              >
                <el-option label="固定工资" value="固定工资" />
                <el-option label="绩效奖金" value="绩效奖金" />
                <el-option label="津贴福利" value="津贴福利" />
                <el-option label="考勤相关" value="考勤相关" />
                <el-option label="专项奖金" value="专项奖金" />
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
            <el-form-item label="项目说明" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入该收入项的适用范围或计发说明"
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
 * 功能描述: 薪资收入类型字典管理页 (配置薪资单上的【应发项】基准数据)
 * 依赖关联: 该模块作为底层字典，支撑 Archive(档案明细) 和 Variable(变动明细)
 * ====================================================================
 */

// 1. Vue 与核心功能依赖
import { ref, reactive, onMounted } from 'vue';
import { pinyin } from 'pinyin-pro'; // 用于智能提取拼音缩写

// 2. Element Plus 依赖
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 3. 业务 API 接口
import {
  addIncomeTypeApi,
  batchDeleteIncomeTypeApi,
  deleteIncomeTypeApi,
  editIncomeTypeApi,
  getIncomeTypePageApi,
} from '@/api/salary/incometype/incomeType.ts';
import type { IncomeTypeQueryReqDTO, IncomeTypeVO } from '@/types/salary/incometype/incomeType.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const isFullscreen = ref(false); // 弹窗全屏控制

// [表格与分页状态]
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const dataList = ref<IncomeTypeVO[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<IncomeTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// 字典强规则校验
const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '收入名称不能为空', trigger: 'blur' }],
  sortValue: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
  categoryName: [{ required: true, message: '项目分类不能为空', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

const handleSelectionChange = (selection: IncomeTypeVO[]) => {
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

/** 🌟 UI 辅助：根据不同分类自动映射不同的 Tag 颜色 */
const getCategoryTagType = (categoryName: string) => {
  if (!categoryName) return 'info';
  if (categoryName.includes('固定')) return 'primary';
  if (categoryName.includes('绩效') || categoryName.includes('奖金')) return 'warning';
  if (categoryName.includes('福利') || categoryName.includes('津贴')) return 'success';
  return '';
};

/** 🌟 智能录入体验：监听输入，动态生成拼音和编码 */
const handleTypeNameInput = (val: string) => {
  // 仅在新增模式触发，防止编辑时意外覆盖已有编码
  if (!form.value.id && val) {
    const shortPinyin = pinyin(val, { pattern: 'first', toneType: 'none' })
      .replace(/\s+/g, '')
      .toUpperCase();
    form.value.pinyinCode = shortPinyin;
    form.value.typeCode = `INC_${shortPinyin}`;
  } else if (!form.value.id && !val) {
    // 文本清空时同步清理
    form.value.pinyinCode = '';
    form.value.typeCode = 'INC_';
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
    const res = await getIncomeTypePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  form.value = {
    typeCode: 'INC_', // 预留前缀，提示用户规范
    sortValue: 99, // 默认排序优先级
    categoryName: '',
  };
  dialog.title = '新增收入字典项';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: IncomeTypeVO) => {
  // 深拷贝回显数据，防止污染表格视图
  form.value = { ...row };
  dialog.title = '修改收入字典项';
  dialog.visible = true;
  isFullscreen.value = false;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 🌟 修复原代码隐患：直接传递组装好的 form.value，后端按需接收
      if (form.value.id) {
        await editIncomeTypeApi(form.value);
        ElMessage.success('配置修改成功');
      } else {
        await addIncomeTypeApi(form.value);
        ElMessage.success('字典项新增成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

/** 高危：删除底层字典 */
const handleDelete = (row: IncomeTypeVO) => {
  ElMessageBox.confirm(
    `即将永久删除 "${row.typeName}" 字典项！若已有员工使用此类型，可能导致数据异常，是否确认?`,
    '系统底层高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await deleteIncomeTypeApi(row.id);
      ElMessage.success('字典项已销毁');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 个字典项?`,
    '系统底层高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await batchDeleteIncomeTypeApi(selectedIds.value);
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

/* 金融/开发双重特征字体：英文字母与数字等宽，非常适合展示编码与拼音 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 500;
}

/* 弱化次要信息的视觉权重 */
.text-secondary {
  color: var(--el-text-color-secondary);
}

/* 弹窗表单的区块分割规范 */
.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 10px 0 20px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

/* 辅助间距 */
.margin-top-20 {
  margin-top: 20px;
}

/* 统一弹窗自定义头部布局 */
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
</style>

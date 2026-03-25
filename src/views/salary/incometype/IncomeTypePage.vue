<!--src/views/salary/incometype/IncomeTypePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
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

    <el-card shadow="hover" class="table-card">
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
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.typeCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收入名称" prop="typeName" min-width="150" show-overflow-tooltip />
        <el-table-column label="拼音缩写" align="center" width="120">
          <template #default="{ row }">
            <span class="amount-font">{{ row.pinyinCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="项目分类" align="center" width="140">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.categoryName)" effect="plain" class="status-tag">
              {{ row.categoryName || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" width="90">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.sortValue }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:income_type:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:income_type:del']"
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
              <el-input v-model="form.typeCode" placeholder="INC_开头" :disabled="!!form.id" />
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
                placeholder="选择或输入"
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
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="描述该收入项的适用范围或计发说明"
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
 * 功能描述: 薪资收入类型字典管理 (配置薪资单上的【应发项】基准元数据)
 * 依赖关联: 支撑 Archive (合同薪资) 和 Variable (变动奖金) 的分类映射
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
  addIncomeTypeApi,
  batchDeleteIncomeTypeApi,
  deleteIncomeTypeApi,
  editIncomeTypeApi,
  getIncomeTypePageApi,
} from '@/api/salary/incometype/incomeType.ts';

// [4] TS 强类型定义约束 (DTO / VO)
import type { IncomeTypeQueryReqDTO, IncomeTypeVO } from '@/types/salary/incometype/incomeType.ts';

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

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '收入名称不能为空', trigger: 'blur' }],
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
const handleSelectionChange = (selection: IncomeTypeVO[]) => {
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

/** UI 辅助：根据分类动态渲染标签色彩 */
const getCategoryTagType = (categoryName: string) => {
  if (!categoryName) return 'info';
  if (categoryName.includes('固定')) return 'primary';
  if (categoryName.includes('绩效') || categoryName.includes('奖金')) return 'warning';
  if (categoryName.includes('福利') || categoryName.includes('津贴')) return 'success';
  return '';
};

/** 🌟 核心录入交互：自动提取拼音缩写及生成 INC_ 编码 */
const handleTypeNameInput = (val: string) => {
  // 仅在新增模式开启“自动生成”逻辑，保护历史数据
  if (!form.value.id && val) {
    const shortPinyin = pinyin(val, { pattern: 'first', toneType: 'none' })
      .replace(/\s+/g, '')
      .toUpperCase();
    form.value.pinyinCode = shortPinyin;
    form.value.typeCode = `INC_${shortPinyin}`;
  } else if (!form.value.id && !val) {
    form.value.pinyinCode = '';
    form.value.typeCode = 'INC_';
  }
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取收入类型分页列表 */
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

/** * 发起：新增数据 */
const handleAdd = () => {
  form.value = { typeCode: 'INC_', sortValue: 99, categoryName: '' };
  dialog.title = '新增收入项目定义';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改数据 */
const handleUpdate = (row: IncomeTypeVO) => {
  form.value = { ...row }; // 深拷贝防污染
  dialog.title = '修改收入项目定义';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交表单映射 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editIncomeTypeApi(form.value);
        ElMessage.success('配置更新成功');
      } else {
        await addIncomeTypeApi(form.value);
        ElMessage.success('配置新增成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：物理/逻辑删除单条记录 */
const handleDelete = (row: IncomeTypeVO) => {
  ElMessageBox.confirm(
    `即将永久删除收入项 "${row.typeName}"！此操作属于底层字典改动，确认删除?`,
    '底层数据高危操作',
    { type: 'error' }
  )
    .then(async () => {
      await deleteIncomeTypeApi(row.id);
      ElMessage.success('数据已注销');
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除选中的记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量注销选中的 ${selectedIds.value.length} 个收入定义项?`,
    '高危操作提示',
    { type: 'error' }
  )
    .then(async () => {
      await batchDeleteIncomeTypeApi(selectedIds.value);
      ElMessage.success('批量注销成功');
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
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

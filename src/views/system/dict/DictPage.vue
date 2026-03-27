<!--src/views/system/dict/DictPage.vue-->
<template>
  <div class="app-container">
    <el-row :gutter="15" class="full-height-row">
      <el-col :span="11" class="flex-column">
        <el-card shadow="hover" class="search-card">
          <el-form ref="typeQueryFormRef" :model="typeQueryParams" :inline="true" label-width="0">
            <el-form-item prop="dictTypeName">
              <el-input
                v-model="typeQueryParams.dictTypeName"
                placeholder="字典名称/编码"
                clearable
                prefix-icon="Search"
                style="width: 180px"
                @keyup.enter="handleTypeQuery"
                @clear="handleTypeQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleTypeQuery">搜索</el-button>
              <el-button
                v-hasPerm="['sys:dict_type:add']"
                type="success"
                icon="Plus"
                @click="handleAddType"
                >新增分类</el-button
              >
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="table-card flex-1">
          <el-table
            v-loading="typeLoading"
            :data="typeList"
            border
            height="100%"
            highlight-current-row
            @row-click="handleTypeRowClick"
          >
            <el-table-column
              label="字典名称"
              prop="dictTypeName"
              min-width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span
                  style="font-weight: 600; cursor: pointer; color: var(--el-text-color-primary)"
                  >{{ row.dictTypeName }}</span
                >
              </template>
            </el-table-column>
            <el-table-column
              label="字典编码"
              prop="dictTypeCode"
              min-width="140"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span class="amount-font text-secondary">{{ row.dictTypeCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-tag">
                  {{ row.status === 1 ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  v-hasPerm="['sys:dict_type:edit']"
                  link
                  type="primary"
                  icon="Edit"
                  @click.stop="handleUpdateType(scope.row)"
                  >修改</el-button
                >
                <el-button
                  v-hasPerm="['sys:dict_type:del']"
                  link
                  type="danger"
                  icon="Delete"
                  @click.stop="handleDeleteType(scope.row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="typeQueryParams.pageNum"
              v-model:page-size="typeQueryParams.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="typeTotal"
              layout="total, prev, pager, next"
              @size-change="getTypeList"
              @current-change="getTypeList"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="13" class="flex-column">
        <el-card shadow="hover" class="search-card">
          <div class="right-header">
            <div class="current-type-info">
              <span v-if="currentType.dictTypeCode">
                当前分类:
                <el-tag effect="dark" class="status-tag">{{ currentType.dictTypeName }}</el-tag>
                <span class="amount-font text-secondary" style="margin-left: 10px">{{
                  currentType.dictTypeCode
                }}</span>
              </span>
              <span
                v-else
                class="text-secondary"
                style="display: flex; align-items: center; gap: 4px"
              >
                <el-icon><InfoFilled /></el-icon> 请从左侧列表选择字典分类
              </span>
            </div>
            <div class="right-toolbar">
              <el-button
                v-hasPerm="['sys:dict_item:add']"
                type="primary"
                icon="Plus"
                :disabled="!currentType.dictTypeCode"
                @click="handleAddItem"
              >
                新增项
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="table-card flex-1">
          <el-table
            v-loading="itemLoading"
            :data="itemList"
            border
            height="100%"
            empty-text="选择左侧分类加载数据"
          >
            <el-table-column label="键值 (Value)" prop="dictItemValue" min-width="120">
              <template #default="{ row }">
                <el-tag type="info" effect="plain" class="amount-font status-tag">{{
                  row.dictItemValue
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据标签 (Label)" prop="dictItemLabel" min-width="140">
              <template #default="{ row }">
                <span style="font-weight: 600; color: var(--el-text-color-primary)">{{
                  row.dictItemLabel
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="排序" prop="dictItemSort" width="80" align="center">
              <template #default="{ row }">
                <span class="amount-font text-secondary">{{ row.dictItemSort }}</span>
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
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  v-hasPerm="['sys:dict_item:edit']"
                  link
                  type="primary"
                  icon="Edit"
                  @click="handleUpdateItem(scope.row)"
                  >修改</el-button
                >
                <el-button
                  v-hasPerm="['sys:dict_item:del']"
                  link
                  type="danger"
                  icon="Delete"
                  @click="handleDeleteItem(scope.row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="typeDialog.visible"
      width="500px"
      append-to-body
      draggable
      :fullscreen="isTypeFullscreen"
      @close="cancelType"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ typeDialog.title }}</span>
          <el-button link class="fullscreen-btn" @click="isTypeFullscreen = !isTypeFullscreen">
            <el-icon><FullScreen v-if="!isTypeFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
        <div class="section-title">分类基础信息</div>
        <el-form-item label="字典名称" prop="dictTypeName">
          <el-input v-model="typeForm.dictTypeName" placeholder="如：系统结算币种" />
        </el-form-item>
        <el-form-item label="字典编码" prop="dictTypeCode">
          <el-input
            v-model="typeForm.dictTypeCode"
            placeholder="如：currency_type"
            :disabled="!!typeForm.id"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="typeForm.remark"
            type="textarea"
            placeholder="请输入备注内容"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelType">取 消</el-button>
          <el-button type="primary" @click="submitTypeForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="itemDialog.visible"
      width="550px"
      append-to-body
      draggable
      :fullscreen="isItemFullscreen"
      @close="cancelItem"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ itemDialog.title }}</span>
          <el-button link class="fullscreen-btn" @click="isItemFullscreen = !isItemFullscreen">
            <el-icon><FullScreen v-if="!isItemFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="100px">
        <el-alert
          :title="`正在为分类 [${currentType.dictTypeName}] 添加数据`"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <div class="section-title">明细键值配置</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="数据键值" prop="dictItemValue">
              <el-input v-model="itemForm.dictItemValue" placeholder="存库用，如：USD" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="数据标签" prop="dictItemLabel">
              <el-input v-model="itemForm.dictItemLabel" placeholder="展示用，如：美元 (USD)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="显示排序" prop="dictItemSort">
              <el-input-number
                v-model="itemForm.dictItemSort"
                :min="0"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="itemForm.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="停用"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="itemForm.remark" type="textarea" placeholder="选填备注" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelItem">取 消</el-button>
          <el-button type="primary" @click="submitItemForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统字典管理页 (左分类右明细布局，支撑全系统下拉框与映射逻辑)
 * 业务逻辑:
 * 1. 左侧加载字典大类，默认加载首行并联动右侧列表。
 * 2. 右侧展示具体字典项，新增明细时强制绑定左侧当前选中的类型编码。
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
import { FullScreen, Minus, InfoFilled } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import {
  addDictTypeApi,
  deleteDictTypeApi,
  getDictTypePageApi,
  updateDictTypeApi,
} from '@/api/dicttype/dictType.ts';
import {
  addDictItemApi,
  deleteDictItemApi,
  getItemsByTypeApi,
  updateDictItemApi,
} from '@/api/dictitem/dictItem.ts';

// [4] TS 强类型定义约束 (DTO / VO)
import type { DictItemVO } from '@/types/dictitem/dictitem.ts';
import type { DictTypeQueryReqDTO, DictTypeVO } from '@/types/dicttype/dicttype.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// --- [左侧：字典类型状态] ---
const typeLoading = ref(false);
const typeTotal = ref(0);
const typeList = ref<DictTypeVO[]>([]);
const typeQueryFormRef = ref<FormInstance>();
const typeQueryParams = reactive<DictTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  dictTypeName: undefined,
});
const currentType = ref<Partial<DictTypeVO>>({}); // 记录左侧选中的焦点类型

// --- [右侧：字典明细状态] ---
const itemLoading = ref(false);
const itemList = ref<DictItemVO[]>([]);

// --- [UI 控制状态：全屏与弹窗] ---
const isTypeFullscreen = ref(false);
const isItemFullscreen = ref(false);
const typeDialog = reactive({ visible: false, title: '' });
const itemDialog = reactive({ visible: false, title: '' });

// --- [业务表单数据] ---
const typeFormRef = ref<FormInstance>();
const typeForm = ref<any>({});
const itemFormRef = ref<FormInstance>();
const itemForm = ref<any>({});

// --- [校验规则集] ---
const typeRules = reactive<FormRules>({
  dictTypeName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictTypeCode: [{ required: true, message: '字典编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
});

const itemRules = reactive<FormRules>({
  dictItemLabel: [{ required: true, message: '标签不能为空', trigger: 'blur' }],
  dictItemValue: [{ required: true, message: '键值不能为空', trigger: 'blur' }],
  dictItemSort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

// [类型管理相关交互]
const handleTypeQuery = () => {
  typeQueryParams.pageNum = 1;
  getTypeList();
};
const cancelType = () => {
  typeDialog.visible = false;
  typeFormRef.value?.resetFields();
};

/** 🌟 核心：行点击联动逻辑 (触发右侧加载) */
const handleTypeRowClick = (row: DictTypeVO) => {
  currentType.value = row;
  getItemList();
};

// [明细管理相关交互]
const cancelItem = () => {
  itemDialog.visible = false;
  itemFormRef.value?.resetFields();
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

// ================= 左侧：字典大类管理业务逻辑 =================

/** * 执行：获取字典分类分页列表
 * 说明：若存在数据且右侧为空，则默认触发表格第一行的点击联动
 */
const getTypeList = async () => {
  typeLoading.value = true;
  try {
    const res = await getDictTypePageApi(typeQueryParams);
    typeList.value = res.records || [];
    typeTotal.value = res.total || 0;

    const firstItem = typeList.value[0];
    if (firstItem && !currentType.value.dictTypeCode) {
      handleTypeRowClick(firstItem);
    }
  } finally {
    typeLoading.value = false;
  }
};

/** * 发起：新增分类 */
const handleAddType = () => {
  typeForm.value = { status: 1 };
  typeDialog.title = '新增字典分类';
  typeDialog.visible = true;
  isTypeFullscreen.value = false;
};

/** * 发起：修改分类 */
const handleUpdateType = (row: DictTypeVO) => {
  typeForm.value = { ...row };
  typeDialog.title = '修改字典分类';
  typeDialog.visible = true;
  isTypeFullscreen.value = false;
};

/** * 核心：提交分类表单 */
const submitTypeForm = async () => {
  if (!typeFormRef.value) return;
  await typeFormRef.value.validate(async (valid) => {
    if (valid) {
      if (typeForm.value.id) {
        await updateDictTypeApi(typeForm.value);
        ElMessage.success('分类修改成功');
      } else {
        await addDictTypeApi(typeForm.value);
        ElMessage.success('分类新增成功');
      }
      typeDialog.visible = false;
      getTypeList();
    }
  });
};

/** * 执行：删除指定分类
 * 说明：涉及级联风险，加入高危确认。若删除的是当前选中项，需清空右侧明细。
 */
const handleDeleteType = (row: DictTypeVO) => {
  ElMessageBox.confirm(`确认永久删除分类 "${row.dictTypeName}" 吗?`, '危险操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteDictTypeApi(row.id);
      ElMessage.success('分类已删除');
      if (currentType.value.id === row.id) {
        currentType.value = {};
        itemList.value = [];
      }
      getTypeList();
    })
    .catch(() => {});
};

// ================= 右侧：字典明细项管理业务逻辑 =================

/** * 核心：获取当前选中分类下的所有明细项 */
const getItemList = async () => {
  if (!currentType.value.dictTypeCode) return;
  itemLoading.value = true;
  try {
    const res = await getItemsByTypeApi(currentType.value.dictTypeCode);
    itemList.value = res || [];
  } finally {
    itemLoading.value = false;
  }
};

/** * 发起：新增明细
 * 说明：强制注入当前焦点的分类编码 (dictTypeCode)
 */
const handleAddItem = () => {
  if (!currentType.value.dictTypeCode) return;
  itemForm.value = { dictTypeCode: currentType.value.dictTypeCode, dictItemSort: 0, status: 1 };
  itemDialog.title = '新增项明细';
  itemDialog.visible = true;
  isItemFullscreen.value = false;
};

/** * 发起：修改明细 */
const handleUpdateItem = (row: DictItemVO) => {
  itemForm.value = { ...row };
  itemDialog.title = '修改项明细';
  itemDialog.visible = true;
  isItemFullscreen.value = false;
};

/** * 核心：提交明细表单 */
const submitItemForm = async () => {
  if (!itemFormRef.value) return;
  await itemFormRef.value.validate(async (valid) => {
    if (valid) {
      if (itemForm.value.id) {
        await updateDictItemApi(itemForm.value);
        ElMessage.success('明细修改成功');
      } else {
        await addDictItemApi(itemForm.value);
        ElMessage.success('明细新增成功');
      }
      itemDialog.visible = false;
      getItemList();
    }
  });
};

/** * 执行：删除明细项 */
const handleDeleteItem = (row: DictItemVO) => {
  ElMessageBox.confirm(`确认删除明细 "${row.dictItemLabel}" 吗?`, '危险操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteDictItemApi(row.id);
      ElMessage.success('明细项已删除');
      getItemList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getTypeList(); // 初始化：拉取左侧分类列表
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   规范：此页采用特殊的左(11)右(13)双卡片结构。
   全局阴影、标题、弹窗、Brilliant/Breeze 主题逻辑全由 _layout.scss 自动托管。
   ===================================================================== */

.full-height-row {
  flex: 1;
  min-height: 0;
  margin: 0 !important;
  width: 100%;
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 模块垂直间距对齐全局 app-container 规范 */
  height: 100%;
}

/* 右侧顶部联动信息栏对齐优化 */
.right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  .current-type-info {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}
</style>

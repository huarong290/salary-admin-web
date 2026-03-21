<!--src/views/system/dict/DictPage.vue-->
<template>
  <div class="app-container split-container">
    <el-row :gutter="20" style="height: 100%">
      <el-col :span="11" class="flex-column">
        <el-card shadow="never" class="search-card" style="margin-bottom: 10px">
          <el-form ref="typeQueryFormRef" :model="typeQueryParams" :inline="true" label-width="0">
            <el-form-item prop="dictTypeName" style="margin-bottom: 0; margin-right: 10px">
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
            <el-form-item style="margin-bottom: 0">
              <el-button type="primary" @click="handleTypeQuery">搜索</el-button>
              <el-button
                v-hasPerm="['sys:dict_type:add']"
                type="success"
                icon="Plus"
                @click="handleAddType"
              >
                新增分类
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="table-card flex-1">
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
                <span style="font-weight: bold; cursor: pointer">{{ row.dictTypeName }}</span>
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
                <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
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
        <el-card shadow="never" class="search-card" style="margin-bottom: 10px">
          <div class="right-header">
            <div class="current-type-info">
              <span v-if="currentType.dictTypeCode">
                当前分类: <el-tag effect="dark">{{ currentType.dictTypeName }}</el-tag>
                <span class="amount-font text-secondary" style="margin-left: 10px">{{
                  currentType.dictTypeCode
                }}</span>
              </span>
              <span v-else class="text-secondary"
                ><el-icon><InfoFilled /></el-icon> 请点击左侧列表选择一个字典分类</span
              >
            </div>
            <div class="right-toolbar">
              <el-button
                v-hasPerm="['sys:dict_item:add']"
                type="primary"
                icon="Plus"
                :disabled="!currentType.dictTypeCode"
                @click="handleAddItem"
              >
                新增字典项
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="table-card flex-1">
          <el-table
            v-loading="itemLoading"
            :data="itemList"
            border
            height="100%"
            empty-text="点击左侧分类查看明细，或当前分类下暂无数据"
          >
            <el-table-column label="键值 (Value)" prop="dictItemValue" min-width="120">
              <template #default="{ row }">
                <el-tag type="info" effect="plain" class="amount-font">{{
                  row.dictItemValue
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据标签 (Label)" prop="dictItemLabel" min-width="140">
              <template #default="{ row }">
                <span style="font-weight: bold">{{ row.dictItemLabel }}</span>
              </template>
            </el-table-column>
            <el-table-column label="排序" prop="sort" width="80" align="center">
              <template #default="{ row }">
                <span class="amount-font">{{ row.sort }}</span>
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
          <el-button link @click="isTypeFullscreen = !isTypeFullscreen">
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
        <el-button @click="cancelType">取 消</el-button>
        <el-button type="primary" @click="submitTypeForm">确 定 保 存</el-button>
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
          <el-button link @click="isItemFullscreen = !isItemFullscreen">
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
            <el-form-item label="显示排序" prop="sort">
              <el-input-number
                v-model="itemForm.sort"
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
        <el-button @click="cancelItem">取 消</el-button>
        <el-button type="primary" @click="submitItemForm">确 定 保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统字典管理页 (左树右表经典布局：管理字典大类及底层数据池)
 * 依赖关联: 全局配置、业务下拉框的核心数据源。
 * ====================================================================
 */

// 1. Vue 内置与核心依赖库
import { ref, reactive, onMounted } from 'vue';

// 2. 第三方 UI 组件库及图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, InfoFilled } from '@element-plus/icons-vue';
// 3. 业务 API 接口 (请确认路径是否与实际一致)
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

// 4. TS 类型定义 (DTO/VO)
import type { DictItemVO } from '@/types/dictitem/dictitem.ts';
import type { DictTypeQueryReqDTO, DictTypeVO } from '@/types/dicttype/dicttype.ts';
/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// --- 左侧：字典类型 (Dict Type) 状态 ---
const typeLoading = ref(false);
const typeTotal = ref(0);
const typeList = ref<DictTypeVO[]>([]);
const typeQueryFormRef = ref<FormInstance>();
const typeQueryParams = reactive<DictTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  dictTypeName: undefined,
});
const currentType = ref<Partial<DictTypeVO>>({}); // 记录左侧当前点击选中的类型

// --- 右侧：字典明细 (Dict Item) 状态 ---
const itemLoading = ref(false);
const itemList = ref<DictItemVO[]>([]);

// --- 弹窗状态 ---
const isTypeFullscreen = ref(false);
const isItemFullscreen = ref(false);

const typeDialog = reactive({ visible: false, title: '' });
const typeFormRef = ref<FormInstance>();
const typeForm = ref<any>({});

const itemDialog = reactive({ visible: false, title: '' });
const itemFormRef = ref<FormInstance>();
const itemForm = ref<any>({});

// --- 校验规则 ---
const typeRules = reactive<FormRules>({
  dictTypeName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictTypeCode: [{ required: true, message: '字典编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
});

const itemRules = reactive<FormRules>({
  dictItemLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
  dictItemValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

// ================= 左侧类型交互 =================
const handleTypeQuery = () => {
  typeQueryParams.pageNum = 1;
  getTypeList();
};

const cancelType = () => {
  typeDialog.visible = false;
  typeFormRef.value?.resetFields();
};

/** 🌟 核心联动：点击左侧类型行，加载右侧明细 */
const handleTypeRowClick = (row: DictTypeVO) => {
  currentType.value = row;
  getItemList();
};

// ================= 右侧明细交互 =================
const cancelItem = () => {
  itemDialog.visible = false;
  itemFormRef.value?.resetFields();
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

// ================= 左侧：字典类型 (Type) 业务逻辑 =================
const getTypeList = async () => {
  typeLoading.value = true;
  try {
    const res = await getDictTypePageApi(typeQueryParams);
    typeList.value = res.records || [];
    typeTotal.value = res.total || 0;

    // 如果列表刷新且右侧还没有选中任何项，默认选中第一项
    // 🌟 修复 TS 报错：使用中间变量安全提取首个元素
    const firstItem = typeList.value[0];
    // 如果列表有数据，且右侧还没有选中任何项，默认选中第一项
    if (firstItem && !currentType.value.dictTypeCode) {
      handleTypeRowClick(firstItem);
    }
  } finally {
    typeLoading.value = false;
  }
};

const handleAddType = () => {
  typeForm.value = { status: 1 };
  typeDialog.title = '新增字典类型';
  typeDialog.visible = true;
  isTypeFullscreen.value = false;
};

const handleUpdateType = (row: DictTypeVO) => {
  typeForm.value = { ...row };
  typeDialog.title = '修改字典类型';
  typeDialog.visible = true;
  isTypeFullscreen.value = false;
};

const submitTypeForm = async () => {
  if (!typeFormRef.value) return;
  await typeFormRef.value.validate(async (valid) => {
    if (valid) {
      if (typeForm.value.id) {
        await updateDictTypeApi(typeForm.value);
        ElMessage.success('字典类型修改成功');
      } else {
        await addDictTypeApi(typeForm.value);
        ElMessage.success('字典类型新增成功');
      }
      dialogCloseAndRefreshType();
    }
  });
};

const handleDeleteType = (row: DictTypeVO) => {
  ElMessageBox.confirm(`确认永久删除字典类型 "${row.dictTypeName}" 吗?`, '高危操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteDictTypeApi(row.id);
      ElMessage.success('分类已删除');

      // 如果删除的是当前选中的项，清空右侧
      if (currentType.value.id === row.id) {
        currentType.value = {};
        itemList.value = [];
      }
      getTypeList();
    })
    .catch(() => {});
};

const dialogCloseAndRefreshType = () => {
  typeDialog.visible = false;
  getTypeList();
};

// ================= 右侧：字典明细 (Item) 业务逻辑 =================
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

const handleAddItem = () => {
  if (!currentType.value.dictTypeCode) return;
  itemForm.value = {
    dictTypeCode: currentType.value.dictTypeCode, // 🌟 核心：强制绑定当前分类编码
    sort: 0,
    status: 1,
  };
  itemDialog.title = '新增字典项';
  itemDialog.visible = true;
  isItemFullscreen.value = false;
};

const handleUpdateItem = (row: DictItemVO) => {
  itemForm.value = { ...row };
  itemDialog.title = '修改字典项';
  itemDialog.visible = true;
  isItemFullscreen.value = false;
};

const submitItemForm = async () => {
  if (!itemFormRef.value) return;
  await itemFormRef.value.validate(async (valid) => {
    if (valid) {
      if (itemForm.value.id) {
        await updateDictItemApi(itemForm.value);
        ElMessage.success('字典项修改成功');
      } else {
        await addDictItemApi(itemForm.value);
        ElMessage.success('字典项新增成功');
      }
      itemDialog.visible = false;
      getItemList(); // 刷新右侧列表
    }
  });
};

const handleDeleteItem = (row: DictItemVO) => {
  ElMessageBox.confirm(`确认删除字典项 "${row.dictItemLabel}" 吗?`, '高危操作提示', {
    type: 'warning',
  })
    .then(async () => {
      await deleteDictItemApi(row.id);
      ElMessage.success('字典项已删除');
      getItemList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getTypeList();
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：继承 EmployeePage.vue 的高级感与严谨风格
  =====================================================================
*/

.split-container {
  height: calc(100vh - 84px); /* 适配后台框架高度，防止出现双滚动条 */
  display: flex;
  flex-direction: column;
}

.flex-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.flex-1 {
  flex: 1;
  min-height: 0; /* 嵌套 Flex 滚动核心属性 */
}

/* 金融级数字排版 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 500;
}
.text-secondary {
  color: var(--el-text-color-secondary);
}

/* 弹窗区块标题 */
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

/* 弹窗自定义头部 */
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

/* 右侧顶部控制台 */
.right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px; /* 与左侧搜索框对齐高度 */

  .current-type-info {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}
</style>

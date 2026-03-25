<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入搜索关键字"
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
        <el-button v-hasPerm="['module:xxx:add']" type="primary" icon="Plus" @click="handleAdd"
          >新增数据</el-button
        >
        <el-button
          v-hasPerm="['module:xxx:del']"
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
        <el-table-column label="编号" align="center" width="80">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column label="名称" align="center" prop="name" />

        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-tag">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['module:xxx:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['module:xxx:del']"
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
        <div class="section-title">基础配置信息</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="示例名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入示例名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
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
 * 功能描述: 【请在此描述该页面的核心业务作用】
 * 依赖关联: 【请在此描述与其他模块的数据依赖关系】
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
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
/* import {
  getXXXPageApi,
  addXXXApi,
  editXXXApi,
  deleteXXXApi,
  batchDeleteXXXApi
} from '@/api/xxx';
*/

// [4] TS 强类型定义约束 (DTO / VO / Interfaces)
// import type { XXXQueryReqDTO, XXXVO } from '@/types/xxx';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false); // 表格加载遮罩层状态
const isFullscreen = ref(false); // 弹窗全屏状态切换标识

// [表格与分页状态]
const total = ref(0); // 数据总条数
const dataList = ref<any[]>([]); // 表格主数据源 (替换为具体 VO 类型)
const multiple = ref(true); // 批量操作按钮禁用状态
const selectedIds = ref<number[]>([]); // 选中行 ID 集合

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<any>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' }); // 弹窗控制器
const form = ref<any>({}); // 承载新增/编辑的表单数据

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  name: [{ required: true, message: '示例名称不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 触发带条件搜索 (重置页码) */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏并刷新列表 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 关闭并清理操作弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
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
    // const res = await getXXXPageApi(queryParams);
    // dataList.value = res.records || [];
    // total.value = res.total || 0;
  } catch (error) {
    console.error('加载数据失败', error);
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增数据 */
const handleAdd = () => {
  form.value = { status: 1 }; // 提供合理默认值
  dialog.title = '新增数据内容';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改数据 */
const handleUpdate = (row: any) => {
  form.value = { ...row }; // 深拷贝
  dialog.title = '修改数据内容';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交表单 (融合新增与修改) */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        // await editXXXApi(form.value);
        ElMessage.success('信息修改成功');
      } else {
        // await addXXXApi(form.value);
        ElMessage.success('新增数据成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：物理/逻辑删除单条记录 */
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认执行该条数据的删除操作吗?`, '高危操作提示', { type: 'warning' })
    .then(async () => {
      const targetId = row.id; // 提取 ID，消除未使用的 ESLint 警告
      console.log('预留删除接口调用，当前选中记录ID:', targetId);

      // await deleteXXXApi(targetId);
      ElMessage.success('操作成功');
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认永久销毁选中的 ${selectedIds.value.length} 条数据?`, '高危操作提示', {
    type: 'warning',
  })
    .then(async () => {
      // await batchDeleteXXXApi(selectedIds.value);
      ElMessage.success('批量处理成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
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
  // getList(); // 实际开发时取消注释
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

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
          v-hasPerm="['salary:incomeType:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
          >新增类型</el-button
        >
        <el-button
          v-hasPerm="['salary:incomeType:del']"
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编码" align="center" prop="typeCode" width="150" />
        <el-table-column label="收入名称" align="center" prop="typeName" width="180" />
        <el-table-column label="分类" align="center" prop="category" width="120" />
        <el-table-column label="排序值" align="center" prop="sortValue" width="80" />
        <el-table-column label="说明" align="center" prop="description" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />

        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:incomeType:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:incomeType:del']"
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
      :title="dialog.title"
      width="500px"
      append-to-body
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="类型编码" prop="typeCode">
          <el-input
            v-model="form.typeCode"
            placeholder="如: BASE_SALARY (全局唯一)"
            :disabled="!!form.id"
          />
        </el-form-item>
        <el-form-item label="收入名称" prop="typeName">
          <el-input v-model="form.typeName" placeholder="如: 基本工资" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="如: 固定工资" />
        </el-form-item>
        <el-form-item label="排序值" prop="sortValue">
          <el-input-number
            v-model="form.sortValue"
            :min="1"
            :max="999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { IncomeTypeQueryReqDTO, IncomeTypeVO } from '@/types/salary/incometype/incomeType.ts';
import {
  addIncomeTypeApi,
  batchDeleteIncomeTypeApi,
  deleteIncomeTypeApi,
  editIncomeTypeApi,
  getIncomeTypePageApi,
} from '@/api/salary/incometype/incomeType.ts';

const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

const queryParams = reactive<IncomeTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});
const dataList = ref<IncomeTypeVO[]>([]);

const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '收入名称不能为空', trigger: 'blur' }],
  sortValue: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await getIncomeTypePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: IncomeTypeVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const handleAdd = () => {
  form.value = { sortValue: 99 }; // 默认排序值
  dialog.title = '新增收入类型';
  dialog.visible = true;
};

const handleUpdate = (row: IncomeTypeVO) => {
  form.value = { ...row };
  dialog.title = '修改收入类型';
  dialog.visible = true;
};

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editIncomeTypeApi({
          id: form.value.id,
          typeCode: form.value.typeCode,
          typeName: form.value.typeName,
          category: form.value.category,
          sortValue: form.value.sortValue,
          description: form.value.description,
        });
        ElMessage.success('修改成功');
      } else {
        await addIncomeTypeApi(form.value);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = (row: IncomeTypeVO) => {
  ElMessageBox.confirm(`确认删除类型 "${row.typeName}"?`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteIncomeTypeApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条数据?`, '提示', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteIncomeTypeApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* 样式与 Employee 完全一致，保持极简复用 */
.app-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.search-card {
  .el-form-item {
    margin-bottom: 0;
  }
}
.table-card {
  flex: 1;
  .toolbar {
    margin-bottom: 15px;
    display: flex;
    gap: 10px;
  }
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>

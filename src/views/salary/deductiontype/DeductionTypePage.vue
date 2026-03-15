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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编码" align="center" prop="typeCode" width="130" />
        <el-table-column label="扣款名称" align="center" prop="typeName" width="150" />
        <el-table-column label="拼音" align="center" prop="pinyinCode" width="100">
          <template #default="scope">
            <span style="color: #909399; font-family: monospace">{{ scope.row.pinyinCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" align="center" prop="category" width="120" />
        <el-table-column label="固定扣款" align="center" prop="isFixed" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isFixed === 1 ? 'success' : 'info'">
              {{ scope.row.isFixed === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序值" align="center" prop="sortValue" width="80" />
        <el-table-column label="说明" align="center" prop="description" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />

        <el-table-column label="操作" align="center" width="150" fixed="right">
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
      :title="dialog.title"
      width="500px"
      append-to-body
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="类型编码" prop="typeCode">
          <el-input
            v-model="form.typeCode"
            placeholder="建议格式：DED_业务缩写 (如: DED_TAX)"
            :disabled="!!form.id"
          />
        </el-form-item>
        <el-form-item label="扣款名称" prop="typeName">
          <el-input
            v-model="form.typeName"
            placeholder="如: 养老保险"
            @input="handleTypeNameInput"
          />
        </el-form-item>
        <el-form-item label="拼音缩写" prop="pinyinCode">
          <el-input v-model="form.pinyinCode" placeholder="自动生成或手动修改" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="form.category"
            placeholder="请选择分类"
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
        <el-form-item label="固定扣款" prop="isFixed">
          <el-switch
            v-model="form.isFixed"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
          <span style="color: #999; font-size: 12px; margin-left: 10px"
            >(固定扣款将自动每月带入)</span
          >
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
import { pinyin } from 'pinyin-pro'; // 🌟 引入拼音库
import type {
  DeductionTypeQueryReqDTO,
  DeductionTypeVO,
} from '@/types/salary/deductiontype/deductionType.ts';
import {
  addDeductionTypeApi,
  batchDeleteDeductionTypeApi,
  deleteDeductionTypeApi,
  editDeductionTypeApi,
  getDeductionTypePageApi,
} from '@/api/salary/deductiontype/deductionType.ts';

const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

const queryParams = reactive<DeductionTypeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
});
const dataList = ref<DeductionTypeVO[]>([]);

const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  typeCode: [{ required: true, message: '类型编码不能为空', trigger: 'blur' }],
  typeName: [{ required: true, message: '扣款名称不能为空', trigger: 'blur' }],
  sortValue: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await getDeductionTypePageApi(queryParams);
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

const handleSelectionChange = (selection: DeductionTypeVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

// 🌟 自动生成拼音
const handleTypeNameInput = (val: string) => {
  // 仅在新增模式下自动填充
  if (!form.value.id) {
    // 1. 生成拼音缩写 (如: JCGZ)
    const shortPinyin = pinyin(val, { pattern: 'first', toneType: 'none' })
      .replace(/\s+/g, '')
      .toUpperCase();
    form.value.pinyinCode = shortPinyin;

    // 2. 自动拼装业务编码
    // 注意：这里判断一下，如果用户已经手动改了前缀后面的内容，就不覆盖了
    form.value.typeCode = `DED_${shortPinyin}`;
  }
};

const handleAdd = () => {
  form.value = {
    typeCode: 'DED_', // 🌟 预设扣款项前缀
    sortValue: 99999,
    isFixed: 0, // 默认非固定
  };
  dialog.title = '新增扣款类型';
  dialog.visible = true;
};

const handleUpdate = (row: DeductionTypeVO) => {
  form.value = { ...row };
  dialog.title = '修改扣款类型';
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
      const submitData = {
        id: form.value.id,
        typeCode: form.value.typeCode,
        typeName: form.value.typeName,
        pinyinCode: form.value.pinyinCode, // 🌟 传参
        category: form.value.category,
        isFixed: form.value.isFixed, // 🌟 传参
        sortValue: form.value.sortValue,
        description: form.value.description,
      };

      if (form.value.id) {
        await editDeductionTypeApi(submitData);
        ElMessage.success('修改成功');
      } else {
        await addDeductionTypeApi(submitData);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

const handleDelete = (row: DeductionTypeVO) => {
  ElMessageBox.confirm(`确认删除扣款类型 "${row.typeName}"?`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteDeductionTypeApi(row.id);
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
      await batchDeleteDeductionTypeApi(selectedIds.value);
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

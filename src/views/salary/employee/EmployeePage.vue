<!--src/views/salary/employee/EmployeePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入姓名或工号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="在职状态" prop="employmentStatus">
          <el-select
            v-model="queryParams.employmentStatus"
            placeholder="选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
          </el-select>
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
          v-hasPerm="['salary:employee:add']"
          type="primary"
          icon="Plus"
          @click="handleAdd"
        >
          新增员工
        </el-button>
        <el-button
          v-hasPerm="['salary:employee:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="工号" prop="employeeCode" width="120" />
        <el-table-column label="姓名" prop="employeeName" width="120" />
        <el-table-column
          label="所属公司"
          prop="companyName"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="部门" prop="department" width="120" />

        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.employmentStatus === 1 ? 'success' : 'info'">
              {{ scope.row.employmentStatus === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="转岗情况" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isTransferred === 1 ? 'primary' : 'warning'">
              {{ scope.row.isTransferred === 1 ? '已转岗' : '未转岗' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="入库时间" prop="createTime" width="170" />

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['salary:employee:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:employee:del']"
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
      :title="dialog.title"
      width="600px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 18px; font-weight: bold">{{ dialog.title }}</span>
          <el-button link @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工号" prop="employeeCode">
              <el-input
                v-model="form.employeeCode"
                placeholder="请输入工号"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="employeeName">
              <el-input v-model="form.employeeName" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属公司" prop="companyName">
              <el-input v-model="form.companyName" placeholder="公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-input v-model="form.department" placeholder="部门名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转岗状态" prop="isTransferred">
              <el-switch
                v-model="form.isTransferred"
                :active-value="1"
                :inactive-value="0"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="在职状态" prop="employmentStatus">
              <el-radio-group v-model="form.employmentStatus">
                <el-radio :label="1">在职</el-radio>
                <el-radio :label="0">离职</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="住宿状态" prop="accommodationStatus">
              <el-select
                v-model="form.accommodationStatus"
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="不住宿" :value="0" />
                <el-option label="公司宿舍" :value="1" />
                <el-option label="外宿补贴" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
import { FullScreen, Minus } from '@element-plus/icons-vue';
import {
  getEmployeePageApi,
  addEmployeeApi,
  editEmployeeApi,
  deleteEmployeeApi,
  batchDeleteEmployeeApi,
} from '@/api/salary/employee';
import type { EmployeeQueryReqDTO, EmployeeVO } from '@/types/salary/employee/employee.ts';

/** 响应式变量 */
const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);
const isFullscreen = ref(false);

const queryParams = reactive<EmployeeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  employmentStatus: undefined,
});

const dataList = ref<EmployeeVO[]>([]);
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  employeeCode: [{ required: true, message: '工号不能为空', trigger: 'blur' }],
  employeeName: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
});

/** 逻辑方法 */
const toggleFullscreen = () => (isFullscreen.value = !isFullscreen.value);

// 查询列表
const getList = async () => {
  loading.value = true;
  try {
    const res = await getEmployeePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
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

const handleSelectionChange = (selection: EmployeeVO[]) => {
  selectedIds.value = selection.map((item) => item.id as unknown as number);
  multiple.value = !selection.length;
};

// 新增按钮
const handleAdd = () => {
  // ⭐ 初始化值全部使用数字，确保与后端 DTO 类型一致
  form.value = {
    employmentStatus: 1,
    isTransferred: 0,
    accommodationStatus: 0,
  };
  dialog.title = '新增员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

// 修改按钮
const handleUpdate = (row: EmployeeVO) => {
  // ⭐ 直接解构赋值，因为 VO 和 DTO 字段已经完全对应数字类型
  form.value = { ...row };
  dialog.title = '修改员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editEmployeeApi(form.value);
        ElMessage.success('修改成功');
      } else {
        await addEmployeeApi(form.value);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

// 删除单条
const handleDelete = (row: EmployeeVO) => {
  ElMessageBox.confirm(`确认删除员工 "${row.employeeName}" 的档案吗?`, '警告', {
    type: 'warning',
  }).then(async () => {
    await deleteEmployeeApi(row.id);
    ElMessage.success('删除成功');
    getList();
  });
};

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条数据?`, '警告', {
    type: 'warning',
  }).then(async () => {
    await batchDeleteEmployeeApi(selectedIds.value);
    ElMessage.success('批量删除成功');
    getList();
  });
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  .search-card {
    margin-bottom: 10px;
  }
  .table-card {
    flex: 1;
    .toolbar {
      margin-bottom: 15px;
    }
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
.dialog-footer {
  padding-top: 10px;
}
</style>

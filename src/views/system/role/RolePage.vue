<!--src/views/system/role/RolePage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="queryParams.roleCode"
            placeholder="请输入角色编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="roleStatus">
          <el-select
            v-model="queryParams.roleStatus"
            placeholder="角色状态"
            clearable
            style="width: 160px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="0" />
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
        <el-button type="primary" icon="Plus" @click="handleAdd">新增角色</el-button>
        <el-button type="danger" icon="Delete" :disabled="multiple" @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="roleList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="角色编号" align="center" prop="id" width="100" />
        <el-table-column label="角色名称" align="center" prop="roleName" />
        <el-table-column label="角色编码" align="center" prop="roleCode" />
        <el-table-column label="角色描述" align="center" prop="roleDesc" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="显示顺序" align="center" prop="roleSort" width="100" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.roleStatus"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)"
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
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 18px; font-weight: bold">{{ dialog.title }}</span>
          <el-button
            link
            style="margin-right: 15px; font-size: 16px; color: #909399"
            @click="toggleFullscreen"
          >
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" placeholder="请输入角色名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色编码" prop="roleCode">
              <el-input v-model="form.roleCode" placeholder="请输入角色编码 (如 admin)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="roleSort">
              <el-input-number
                v-model="form.roleSort"
                controls-position="right"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="roleStatus">
              <el-radio-group v-model="form.roleStatus">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="form.roleDesc" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注内容" />
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
import { FullScreen, Minus } from '@element-plus/icons-vue';
import {
  getRolePageApi,
  addRoleApi,
  editRoleApi,
  deleteRoleApi,
  batchDeleteRoleApi,
} from '@/api/role';
import type { RoleQueryReqDTO, SysRoleVO } from '@/types/role/role.ts';

// --- 状态与数据 ---
const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

const queryParams = reactive<RoleQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  roleName: undefined,
  roleCode: undefined,
  roleStatus: undefined,
});

const roleList = ref<SysRoleVO[]>([]);

// 弹窗控制
const dialog = reactive({ visible: false, title: '' });
const isFullscreen = ref(false);

const form = ref<any>({});
const roleFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
});

// --- 核心业务方法 ---
const getList = async () => {
  loading.value = true;
  try {
    const res = await getRolePageApi(queryParams);
    roleList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('获取角色列表失败', error);
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

const handleSelectionChange = (selection: SysRoleVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

const handleStatusChange = (row: SysRoleVO) => {
  const text = row.roleStatus === 1 ? '启用' : '停用';
  ElMessageBox.confirm(`确认要"${text}""${row.roleName}"角色吗?`, '系统提示', { type: 'warning' })
    .then(async () => {
      await editRoleApi({
        id: row.id,
        roleName: row.roleName,
        roleCode: row.roleCode,
        roleSort: row.roleSort,
        roleStatus: row.roleStatus,
      });
      ElMessage.success(`${text}成功`);
    })
    .catch(() => {
      row.roleStatus = row.roleStatus === 1 ? 0 : 1;
    });
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const handleAdd = () => {
  form.value = { roleSort: 0, roleStatus: 1 };
  dialog.title = '添加角色';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = (row: SysRoleVO) => {
  form.value = { ...row };
  dialog.title = '修改角色';
  dialog.visible = true;
  isFullscreen.value = false;
};

const cancel = () => {
  dialog.visible = false;
  roleFormRef.value?.resetFields();
};

const submitForm = async () => {
  if (!roleFormRef.value) return;
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        // 严格映射 DTO 避免脏数据
        await editRoleApi({
          id: form.value.id,
          roleName: form.value.roleName,
          roleCode: form.value.roleCode,
          roleSort: form.value.roleSort,
          roleStatus: form.value.roleStatus,
          roleDesc: form.value.roleDesc,
          remark: form.value.remark,
        });
        ElMessage.success('修改成功');
      } else {
        await addRoleApi(form.value);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

const handleDelete = (row: SysRoleVO) => {
  ElMessageBox.confirm(`是否确认删除角色 "${row.roleName}" ?`, '危险操作', { type: 'warning' })
    .then(async () => {
      await deleteRoleApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`是否确认删除选中的 ${selectedIds.value.length} 个角色?`, '危险操作', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteRoleApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      if (roleList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      getList();
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
}
</style>

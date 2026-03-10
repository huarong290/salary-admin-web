<!--src/views/system/user/UserPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="用户状态"
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
        <el-button v-hasPerm="['sys:user:add']" type="primary" icon="Plus" @click="handleAdd"
          >新增用户</el-button
        >
        <el-button
          v-hasPerm="['sys:user:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="userList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编号" align="center" prop="id" width="80" />
        <el-table-column label="用户名" align="center" prop="username" />
        <el-table-column label="昵称" align="center" prop="nickname" />
        <el-table-column label="手机号" align="center" prop="phone" width="130" />
        <el-table-column label="性别" align="center" prop="sex" width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.sex === 1 ? 'primary' : scope.row.sex === 2 ? 'danger' : 'info'"
            >
              {{ scope.row.sex === 1 ? '男' : scope.row.sex === 2 ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="上次登录时间" align="center" prop="lastLoginTime" width="170" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />

        <el-table-column label="操作" align="center" width="240" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPerm="['sys:user:assign']"
              link
              type="success"
              icon="UserFilled"
              @click="handleAssignRole(scope.row)"
            >
              分配角色
            </el-button>
            <el-button
              v-hasPerm="['sys:user:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button link type="warning" icon="Key" @click="handleResetPwd(scope.row)"
              >重置密码</el-button
            >
            <el-button
              v-hasPerm="['sys:user:del']"
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
          <el-button
            link
            style="margin-right: 15px; font-size: 16px; color: #909399"
            @click="toggleFullscreen"
          >
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-form-item label="性别" prop="sex">
              <el-select v-model="form.sex" placeholder="请选择性别" style="width: 100%">
                <el-option label="未知" :value="0" />
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="!form.id">
          <el-col :span="12">
            <el-form-item label="登录密码" prop="password">
              <el-input
                v-model="form.password"
                placeholder="不填则使用默认密码"
                type="password"
                show-password
              />
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

    <el-dialog v-model="roleDialog.visible" title="分配角色" width="500px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="选择角色">
          <el-select
            v-model="roleDialog.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="item in allRoles"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitUserRole">确 定</el-button>
          <el-button @click="roleDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
// 🌟 严格引入统一类型的 API
import {
  getUserPageApi,
  addUserApi,
  editUserApi,
  deleteUserApi,
  batchDeleteUserApi,
  resetUserPwdApi,
} from '@/api/user';
import type { UserQueryReqDTO, SysUserVO } from '@/types/user/user';
import { FullScreen, Minus } from '@element-plus/icons-vue';
import { assignUserRoleApi, getUserRoleIdsApi } from '@/api/userrole';
import { listAllNormalRolesApi } from '@/api/role';

// --- 状态与数据 ---
const loading = ref(false);
const total = ref(0);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// 查询参数
const queryParams = reactive<UserQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  username: undefined,
  status: undefined,
});

// 表格数据
const userList = ref<SysUserVO[]>([]);

// 弹窗控制
const dialog = reactive({
  visible: false,
  title: '',
});

// 表单对象
const form = ref<any>({});
const userFormRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

// 🌟 严格的前端校验规则 (必须对齐后端正则)
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }],
});
// 在 script setup 区域的上方增加这个状态变量
const isFullscreen = ref(false);

// 切换全屏状态的方法
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};
// --- 角色分配相关的响应式状态 ---
const roleDialog = reactive({
  visible: false,
  userId: 0,
  roleIds: [] as number[],
});
// 存放系统中所有的角色，供下拉框选择
const allRoles = ref<any[]>([]);
// --- 核心业务方法 ---

/** 1. 获取用户列表 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getUserPageApi(queryParams);
    // 因为 request.ts 已经帮你剥掉了 ApiResult 的外壳
    // 此时的 res 就是 PageResult 对象本身
    userList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('获取用户列表失败', error);
  } finally {
    loading.value = false;
  }
};

/** 2. 搜索与重置 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 3. 多选框选中数据 */
const handleSelectionChange = (selection: SysUserVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 4. 状态开关直接修改 */
const handleStatusChange = (row: SysUserVO) => {
  const text = row.status === 1 ? '启用' : '停用';
  ElMessageBox.confirm(`确认要"${text}""${row.username}"用户吗?`, '系统提示', { type: 'warning' })
    .then(async () => {
      // 仅发送需要的字段，防止后端报错
      await editUserApi({ id: row.id, status: row.status });
      ElMessage.success(`${text}成功`);
    })
    .catch(() => {
      // 撤销界面的切换
      row.status = row.status === 1 ? 0 : 1;
    });
};

/** 5. 弹窗控制 (新增/修改) */
const handleAdd = () => {
  form.value = { status: 1, sex: 0 };
  dialog.title = '添加用户';
  dialog.visible = true;
  isFullscreen.value = false; // 重置全屏状态
};

const handleUpdate = (row: SysUserVO) => {
  // 深拷贝的同时，使用空值合并运算符 (??) 进行安全兜底
  // 如果后端传回的 sex 是 null 或 undefined，强制重置为 0 (未知)
  form.value = {
    ...row,
    sex: row.sex ?? 0,
  };
  form.value = { ...row };
  dialog.title = '修改用户';
  dialog.visible = true;
  isFullscreen.value = false; // 重置全屏状态
};

const cancel = () => {
  dialog.visible = false;
  userFormRef.value?.resetFields();
};

/** 6. 提交表单 (严格 DTO 字段映射) */
const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        // 🌟 架构师细节：手工提取需要的字段，彻底抛弃 row 里带过来的无关 VO 字段（如 createTime, username等）
        await editUserApi({
          id: form.value.id,
          nickname: form.value.nickname,
          phone: form.value.phone,
          email: form.value.email,
          sex: form.value.sex,
          status: form.value.status,
        });
        ElMessage.success('修改成功');
      } else {
        await addUserApi(form.value);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** 7. 重置密码 */
const handleResetPwd = (row: SysUserVO) => {
  ElMessageBox.prompt(`请输入"${row.username}"的新密码`, '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{6,20}$/,
    inputErrorMessage: '密码长度必须在 6 到 20 个字符之间',
    inputType: 'password',
  })
    .then(async ({ value }) => {
      await resetUserPwdApi({ id: row.id, password: value });
      ElMessage.success(`成功重置用户 "${row.username}" 的密码`);
    })
    .catch(() => {});
};

/** 8. 删除操作 (单条/批量) */
const handleDelete = (row: SysUserVO) => {
  ElMessageBox.confirm(`是否确认删除用户 "${row.username}" ?`, '危险操作', { type: 'warning' })
    .then(async () => {
      await deleteUserApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`是否确认删除选中的 ${selectedIds.value.length} 个用户?`, '危险操作', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteUserApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      // 如果当前页数据被删光，退回上一页
      if (userList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};
// 打开分配角色弹窗
const handleAssignRole = async (row: any) => {
  roleDialog.userId = row.id;
  roleDialog.roleIds = []; // 先清空上次的选择
  roleDialog.visible = true;

  try {
    // 1. 懒加载所有可用角色 (如果已经加载过可以不重复请求)
    if (allRoles.value.length === 0) {
      // 这个接口你需要确保后端能返回 List<SysRoleVO>
      allRoles.value = await listAllNormalRolesApi();
    }

    // 2. 调用后端回显接口，获取该用户已有的角色ID数组
    const existingRoleIds = await getUserRoleIdsApi(row.id);
    roleDialog.roleIds = existingRoleIds || [];
  } catch (error) {
    console.error('获取角色数据失败', error);
  }
};

// 提交分配
const submitUserRole = async () => {
  try {
    await assignUserRoleApi({
      userId: roleDialog.userId,
      roleIds: roleDialog.roleIds,
    });
    ElMessage.success('角色分配成功');
    roleDialog.visible = false;
  } catch (error) {
    console.error('角色分配失败', error);
  }
};
// --- 初始化 ---
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

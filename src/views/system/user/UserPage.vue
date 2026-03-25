<!--src/views/system/user/UserPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
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

    <el-card shadow="hover" class="table-card">
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
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编号" align="center" width="80">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="用户名" align="center" prop="username" />
        <el-table-column label="昵称" align="center" prop="nickname" />
        <el-table-column label="手机号" align="center" width="130">
          <template #default="{ row }">
            <span class="amount-font">{{ row.phone }}</span>
          </template>
        </el-table-column>
        <el-table-column label="性别" align="center" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.sex === 1 ? 'primary' : row.sex === 2 ? 'danger' : 'info'"
              class="status-tag"
            >
              {{ row.sex === 1 ? '男' : row.sex === 2 ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="上次登录时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.lastLoginTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['sys:user:assign']"
              link
              type="success"
              icon="UserFilled"
              @click="handleAssignRole(row)"
              >分配角色</el-button
            >
            <el-button
              v-hasPerm="['sys:user:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button link type="warning" icon="Key" @click="handleResetPwd(row)"
              >重置密码</el-button
            >
            <el-button
              v-hasPerm="['sys:user:del']"
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
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">
        <div class="section-title">基础身份信息</div>
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

        <div class="section-title" style="margin-top: 20px">联系方式与安全</div>
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
          <el-col :span="24">
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
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialog.visible" width="500px" append-to-body draggable>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">分配角色</span>
        </div>
      </template>
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
          <el-button @click="roleDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitUserRole">确 定 分 配</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统用户管理页 (RBAC 核心底座，负责账号生命周期及角色挂载)
 * 依赖关联: 该模块数据是 角色管理 (Role) 和 权限校验的核心基石
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

// [4] TS 强类型定义约束 (DTO / VO / Interfaces)
import {
  getUserPageApi,
  addUserApi,
  editUserApi,
  deleteUserApi,
  batchDeleteUserApi,
  resetUserPwdApi,
} from '@/api/user';
import { assignUserRoleApi, getUserRoleIdsApi } from '@/api/userrole';
import { listAllNormalRolesApi } from '@/api/role';

// 4. TS 类型定义 (DTO/VO)
import type { UserQueryReqDTO, SysUserVO } from '@/types/user/user';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false); // 表格加载遮罩层状态
const isFullscreen = ref(false); // 用户弹窗全屏状态切换标识

// [表格与分页状态]
const total = ref(0); // 数据总条数
const userList = ref<SysUserVO[]>([]); // 表格主数据源
const multiple = ref(true); // 批量操作按钮禁用状态 (无选中时禁用)
const selectedIds = ref<number[]>([]); // 当前表格选中的主键 ID 集合

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<UserQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  username: undefined,
  status: undefined,
});

// [业务表单状态 - 用户管理]
const userFormRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' }); // 用户弹窗控制器
const form = ref<any>({}); // 承载新增/编辑的用户表单数据

// 表单前端合法性校验规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 4, max: 20, message: '长度在 4 到 20 个字符', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }],
});

// [业务表单状态 - 角色分配]
const roleDialog = reactive({ visible: false, userId: 0, roleIds: [] as number[] });
const allRoles = ref<any[]>([]); // 系统中所有的可用角色列表

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换用户弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: SysUserVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 触发带条件搜索 (必须强制将页码重置为 1) */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏并刷新列表 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 关闭并清理用户操作弹窗 */
const cancel = () => {
  dialog.visible = false;
  userFormRef.value?.resetFields();
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取分页列表数据
 * 设计：采用 try-finally 结构，确保哪怕接口报错，loading 遮罩层也能被顺利移除
 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getUserPageApi(queryParams);
    userList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增数据
 * 设计：给定合理的业务初始值，避免前端校验提前阻断
 */
const handleAdd = () => {
  form.value = { status: 1, sex: 0 };
  dialog.title = '添加系统用户';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改数据
 * 设计：基于深拷贝回显数据，同时处理可能为空的兜底字段
 */
const handleUpdate = (row: SysUserVO) => {
  form.value = { ...row, sex: row.sex ?? 0 };
  dialog.title = '修改用户信息';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 执行：快捷开关修改用户状态
 * 设计：加入撤销机制，接口报错或用户取消时恢复界面状态
 */
const handleStatusChange = (row: SysUserVO) => {
  const text = row.status === 1 ? '启用' : '停用';
  ElMessageBox.confirm(`确认要 "${text}" 用户 "${row.username}" 吗?`, '系统状态提示', {
    type: 'warning',
  })
    .then(async () => {
      await editUserApi({ id: row.id, status: row.status });
      ElMessage.success(`${text}成功`);
    })
    .catch(() => {
      /* 取消操作，撤销界面的状态切换 */
      row.status = row.status === 1 ? 0 : 1;
    });
};

/** * 核心：校验并提交表单 (融合新增与修改)
 */
const submitForm = async () => {
  if (!userFormRef.value) return;
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        // 架构师细节：提取必要字段，抛弃多余 VO 字段
        await editUserApi({
          id: form.value.id,
          nickname: form.value.nickname,
          phone: form.value.phone,
          email: form.value.email,
          sex: form.value.sex,
          status: form.value.status,
        });
        ElMessage.success('信息修改成功');
      } else {
        await addUserApi(form.value);
        ElMessage.success('新增用户成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：管理员强制重置指定用户密码
 */
const handleResetPwd = (row: SysUserVO) => {
  ElMessageBox.prompt(`请输入 "${row.username}" 的新密码`, '安全设置', {
    confirmButtonText: '强制重置',
    cancelButtonText: '取消',
    inputPattern: /^.{6,20}$/,
    inputErrorMessage: '密码长度必须在 6 到 20 个字符之间',
    inputType: 'password',
  })
    .then(async ({ value }) => {
      await resetUserPwdApi({ id: row.id, password: value });
      ElMessage.success(`成功重置密码`);
    })
    .catch(() => {
      /* 取消操作，安静退出 */
    });
};

/** * 执行：物理/逻辑删除单条记录
 * 设计：涉及敏感操作，加入二次确认阻断机制
 */
const handleDelete = (row: SysUserVO) => {
  ElMessageBox.confirm(`确认销毁用户 "${row.username}" 的账号吗?`, '系统高危操作', {
    type: 'warning',
  })
    .then(async () => {
      await deleteUserApi(row.id);
      ElMessage.success('账号已销毁');
      getList();
    })
    .catch(() => {
      /* 取消操作，安静退出 */
    });
};

/** * 执行：批量删除记录
 * 设计：检测删除后当前页是否清空，自动回退上一页
 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认销毁选中的 ${selectedIds.value.length} 个账号?`, '系统高危操作', {
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteUserApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      if (userList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {
      /* 取消操作，安静退出 */
    });
};

/** * 发起：打开分配角色弹窗，并懒加载角色数据
 */
const handleAssignRole = async (row: any) => {
  roleDialog.userId = row.id;
  roleDialog.roleIds = [];
  roleDialog.visible = true;
  try {
    if (allRoles.value.length === 0) {
      allRoles.value = await listAllNormalRolesApi();
    }
    const existingRoleIds = await getUserRoleIdsApi(row.id);
    roleDialog.roleIds = existingRoleIds || [];
  } catch (error) {
    console.error('获取角色数据失败', error);
  }
};

/** * 核心：提交角色与用户的绑定映射
 */
const submitUserRole = async () => {
  try {
    await assignUserRoleApi({ userId: roleDialog.userId, roleIds: roleDialog.roleIds });
    ElMessage.success('角色分配成功');
    roleDialog.visible = false;
  } catch (error) {
    console.error('角色分配失败', error);
  }
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList(); // 组件挂载完毕后，立即拉取首屏数据
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   全盘继承 _layout.scss 黄金规范！
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

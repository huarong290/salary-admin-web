<!--src/views/system/role/RolePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
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

    <el-card shadow="hover" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['sys:role:add']" type="primary" icon="Plus" @click="handleAdd"
          >新增角色</el-button
        >
        <el-button
          v-hasPerm="['sys:role:del']"
          type="danger"
          icon="Delete"
          :disabled="multiple"
          @click="handleBatchDelete"
          >批量删除</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="roleList"
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
        <el-table-column label="角色名称" align="center" prop="roleName" min-width="120" />
        <el-table-column label="角色编码" align="center" prop="roleCode" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.roleCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="显示顺序" align="center" width="100">
          <template #default="{ row }">
            <span class="amount-font">{{ row.roleSort }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.roleStatus"
              :active-value="1"
              :inactive-value="0"
              :disabled="!checkPermission('sys:role:edit')"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['sys:role:assign']"
              link
              type="success"
              icon="Key"
              @click="handleAuth(row)"
              >分配权限</el-button
            >
            <el-button
              v-hasPerm="['sys:role:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['sys:role:del']"
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

      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="80px">
        <div class="section-title">基础身份信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" prop="roleName">
              <el-input v-model="form.roleName" placeholder="中文名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色编码" prop="roleCode">
              <el-input v-model="form.roleCode" placeholder="唯一标识 (admin)" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
            <el-form-item label="角色状态" prop="roleStatus">
              <el-radio-group v-model="form.roleStatus">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">辅助描述信息</div>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input
            v-model="form.roleDesc"
            type="textarea"
            :rows="2"
            placeholder="请输入角色职能描述"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="管理员备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="authDialog.visible"
      width="500px"
      append-to-body
      draggable
      @close="authDialog.visible = false"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">分配菜单权限</span>
        </div>
      </template>
      <el-form label-width="80px">
        <el-form-item label="资源权限">
          <div class="tree-border-wrapper">
            <el-tree
              ref="menuTreeRef"
              :data="menuOptions"
              show-checkbox
              node-key="id"
              empty-text="权限加载中..."
              :props="{ label: 'menuName', children: 'children' }"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="authDialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitAuth">确 定 分 配</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统角色管理 (权限控制核心模型，管理功能菜单的访问许可)
 * 依赖关联: 决定用户登录后侧边栏及按钮的 checkPerm 渲染结果
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态 (Vue Core)
import { ref, reactive, onMounted, nextTick } from 'vue';

// [2] 第三方 UI 组件库与图标 (Element Plus & Icons)
import { ElMessage, ElMessageBox, ElTree } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import {
  getRolePageApi,
  addRoleApi,
  editRoleApi,
  deleteRoleApi,
  batchDeleteRoleApi,
} from '@/api/role';
import { getMenuTreeApi } from '@/api/menu';
import { assignRoleMenuApi, getRoleMenuIdsApi } from '@/api/rolemenu';

// [4] TS 强类型定义与工具类 (DTO / VO / Utils)
import type { RoleQueryReqDTO, SysRoleVO } from '@/types/role/role.ts';
import { checkPermission } from '@/utils/permission.ts';

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
const roleList = ref<SysRoleVO[]>([]);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<RoleQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  roleName: undefined,
  roleCode: undefined,
  roleStatus: undefined,
});

// [业务表单状态 - 角色信息]
const roleFormRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// [业务表单状态 - 权限树]
const authDialog = reactive({ visible: false, roleId: 0 });
const menuOptions = ref<any[]>([]);
const menuTreeRef = ref<InstanceType<typeof ElTree>>();

// [表单前端校验规则]
const rules = reactive<FormRules>({
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换角色弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: SysRoleVO[]) => {
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

/** 关闭并清理角色信息弹窗 */
const cancel = () => {
  dialog.visible = false;
  roleFormRef.value?.resetFields();
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取角色分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getRolePageApi(queryParams);
    roleList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增角色数据 */
const handleAdd = () => {
  form.value = { roleSort: 0, roleStatus: 1 };
  dialog.title = '添加系统角色';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改角色数据 */
const handleUpdate = (row: SysRoleVO) => {
  form.value = { ...row };
  dialog.title = '修改角色信息';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 执行：快捷修改角色启用状态 */
const handleStatusChange = (row: SysRoleVO) => {
  const text = row.roleStatus === 1 ? '启用' : '停用';
  ElMessageBox.confirm(`确认要 "${text}" 角色 "${row.roleName}" 吗?`, '状态提示', {
    type: 'warning',
  })
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

/** * 核心：提交角色表单映射 (新增/修改) */
const submitForm = async () => {
  if (!roleFormRef.value) return;
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        // 严格映射 DTO，过滤 VO 特有字段
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

/** * 执行：物理/逻辑删除单条记录 */
const handleDelete = (row: SysRoleVO) => {
  ElMessageBox.confirm(`是否确认删除角色 "${row.roleName}" ?`, '高危操作', { type: 'warning' })
    .then(async () => {
      await deleteRoleApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除选中的记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认批量销毁选中的 ${selectedIds.value.length} 个角色?`, '高危操作', {
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

// ================= 🌟 权限树专项处理逻辑 =================

/** * 发起：打开分配权限弹窗
 * 说明：涉及精准回显算法，仅勾选叶子节点以防止父节点自动全选
 */
const handleAuth = async (row: SysRoleVO) => {
  authDialog.roleId = row.id;
  authDialog.visible = true;

  // 懒加载菜单树
  if (menuOptions.value.length === 0) {
    menuOptions.value = (await getMenuTreeApi()) || [];
  }

  // 重置勾选状态
  nextTick(() => {
    menuTreeRef.value?.setCheckedKeys([]);
  });

  try {
    const checkedKeys = await getRoleMenuIdsApi(row.id);
    // 🌟 精准回显策略：遍历节点，仅勾选后端返回且为 Leaf 的节点
    nextTick(() => {
      checkedKeys.forEach((key: number) => {
        const node = menuTreeRef.value?.getNode(key);
        if (node && node.isLeaf) {
          menuTreeRef.value?.setChecked(key, true, false);
        }
      });
    });
  } catch (error) {
    console.error('获取权限失败', error);
  }
};

/** * 核心：提交分配好的权限映射 (全选 + 半选节点) */
const submitAuth = async () => {
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() || [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || [];
  const finalMenuIds = [...checkedKeys, ...halfCheckedKeys] as number[];

  try {
    await assignRoleMenuApi({ roleId: authDialog.roleId, menuIds: finalMenuIds });
    ElMessage.success('分配权限成功');
    authDialog.visible = false;
  } catch (error) {
    console.error('分配失败', error);
  }
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
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
   此处仅对“权限树”容器进行深度视觉微调，适配暗黑模式。
   ===================================================================== */

.tree-border-wrapper {
  margin-top: 5px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  border-radius: 8px;
  width: 100%;
  height: 380px;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  /* 适配暗黑模式下的树背景 */
  html.dark & {
    background: #141414;
    border-color: rgba(255, 255, 255, 0.08);
  }
}
</style>

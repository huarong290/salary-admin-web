<!--src/views/system/menu/MenuPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" icon="Plus" @click="handleAdd()">新增菜单</el-button>
        <el-button icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </div>

      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="menuList"
        row-key="id"
        border
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="menuName" label="菜单名称" width="200" show-overflow-tooltip />
        <el-table-column prop="menuType" label="类型" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.menuType === 1" type="warning">目录</el-tag>
            <el-tag v-else-if="scope.row.menuType === 2" type="success">菜单</el-tag>
            <el-tag v-else-if="scope.row.menuType === 3" type="info">按钮</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="menuIcon" label="图标" align="center" width="80">
          <template #default="scope">
            <el-icon v-if="scope.row.menuIcon" size="16">
              <component :is="formatIcon(scope.row.menuIcon)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="menuSort" label="排序" align="center" width="80" />
        <el-table-column prop="menuPermission" label="权限标识" show-overflow-tooltip />
        <el-table-column prop="menuComponent" label="组件路径" show-overflow-tooltip />
        <el-table-column prop="menuStatus" label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.menuStatus === 1 ? 'success' : 'danger'">
              {{ scope.row.menuStatus === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
              >修改</el-button
            >
            <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)"
              >新增</el-button
            >
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="680px"
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

      <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级菜单" prop="menuParentId">
              <el-tree-select
                v-model="form.menuParentId"
                :data="menuOptions"
                :props="{ value: 'id', label: 'menuName', children: 'children' }"
                value-key="id"
                placeholder="选择上级菜单"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio :label="0">目录</el-radio>
                <el-radio :label="1">菜单</el-radio>
                <el-radio :label="2">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType !== 2" :span="24">
            <el-form-item label="菜单图标" prop="menuIcon">
              <el-input
                v-model="form.menuIcon"
                placeholder="请输入Element Plus图标名称 (如 User)"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单编码" prop="menuCode">
              <el-input v-model="form.menuCode" placeholder="如 sys_user (全局唯一)" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="显示排序" prop="menuSort">
              <el-input-number
                v-model="form.menuSort"
                controls-position="right"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType !== 2" :span="12">
            <el-form-item label="路由地址" prop="menuPath">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的路由地址，如：`user`。如需外链请以 `http(s)://` 开头"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  路由地址
                </span>
              </template>
              <el-input v-model="form.menuPath" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType === 1" :span="12">
            <el-form-item label="组件路径" prop="menuComponent">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的组件路径，如：`system/user/UserPage`，默认在 `views` 目录下"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  组件路径
                </span>
              </template>
              <el-input v-model="form.menuComponent" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType === 1 || form.menuType === 2" :span="12">
            <el-form-item label="权限字符" prop="menuPermission">
              <template #label>
                <span>
                  <el-tooltip content="控制器中定义的权限字符，如：`sys:user:list`" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  权限字符
                </span>
              </template>
              <el-input
                v-model="form.menuPermission"
                placeholder="请输入权限标识"
                maxlength="100"
              />
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType !== 2" :span="12">
            <el-form-item label="显示状态" prop="menuVisible">
              <template #label>
                <span>
                  <el-tooltip
                    content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  显示状态
                </span>
              </template>
              <el-radio-group v-model="form.menuVisible">
                <el-radio :label="1">显示</el-radio>
                <el-radio :label="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="菜单状态" prop="menuStatus">
              <template #label>
                <span>
                  <el-tooltip
                    content="选择停用则路由将不会出现在侧边栏，也不能被访问"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  菜单状态
                </span>
              </template>
              <el-radio-group v-model="form.menuStatus">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, QuestionFilled } from '@element-plus/icons-vue';
import { addMenuApi, deleteMenuApi, editMenuApi, getMenuTreeApi } from '@/api/menu';
import type { MenuTreeVO } from '@/types/menu/menu.ts';

// --- 状态与数据 ---
const loading = ref(false);
const refreshTable = ref(true);
const isExpandAll = ref(false);
const menuList = ref<MenuTreeVO[]>([]);
const menuOptions = ref<any[]>([]);

const dialog = reactive({ visible: false, title: '' });
const isFullscreen = ref(false);

const form = ref<any>({});
const menuFormRef = ref<FormInstance>();

const rules = reactive<FormRules>({
  menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  menuCode: [{ required: true, message: '菜单编码不能为空', trigger: 'blur' }],
  menuSort: [{ required: true, message: '菜单顺序不能为空', trigger: 'blur' }],
  menuPath: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
});

// 图标首字母大写转换
const formatIcon = (icon: string) => {
  if (!icon) return '';
  return icon.charAt(0).toUpperCase() + icon.slice(1);
};

// --- 核心业务方法 ---

const getList = async () => {
  loading.value = true;
  try {
    const res = await getMenuTreeApi();
    menuList.value = res || [];
  } catch (error) {
    console.error('获取菜单树失败', error);
  } finally {
    loading.value = false;
  }
};

const getTreeselect = async () => {
  const res = await getMenuTreeApi();
  const menus = res || [];
  menuOptions.value = [{ id: 0, menuName: '主类目', children: menus }];
};

const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const handleAdd = (row?: MenuTreeVO) => {
  getTreeselect();
  form.value = {
    menuParentId: row != null && row.id ? row.id : 0,
    menuType: 1, // 🚨 默认选中目录(1)
    menuVisible: 1,
    menuStatus: 1,
    menuSort: 0,
  };
  dialog.title = '添加菜单';
  dialog.visible = true;
  isFullscreen.value = false;
};

const handleUpdate = async (row: MenuTreeVO) => {
  await getTreeselect();
  form.value = { ...row };
  dialog.title = '修改菜单';
  dialog.visible = true;
  isFullscreen.value = false;
};

const cancel = () => {
  dialog.visible = false;
  menuFormRef.value?.resetFields();
};

const submitForm = async () => {
  if (!menuFormRef.value) return;
  await menuFormRef.value.validate(async (valid) => {
    if (valid) {
      // 提取核心数据，过滤无用字段
      const submitData = {
        id: form.value.id,
        menuParentId: form.value.menuParentId,
        menuName: form.value.menuName,
        menuCode: form.value.menuCode,
        menuType: form.value.menuType,
        menuSort: form.value.menuSort,
        menuPath: form.value.menuPath,
        menuComponent: form.value.menuComponent,
        menuIcon: form.value.menuIcon,
        menuPermission: form.value.menuPermission,
        menuVisible: form.value.menuVisible,
        menuStatus: form.value.menuStatus,
      };

      if (form.value.id) {
        await editMenuApi(submitData);
        ElMessage.success('修改成功');
      } else {
        await addMenuApi(submitData);
        ElMessage.success('新增成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

const handleDelete = (row: MenuTreeVO) => {
  ElMessageBox.confirm(
    `是否确认删除名称为 "${row.menuName}" 的菜单? (如有子节点将无法删除)`,
    '危险操作',
    { type: 'warning' }
  )
    .then(async () => {
      await deleteMenuApi(row.id);
      ElMessage.success('删除成功');
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

  .table-card {
    flex: 1;
    .toolbar {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
    }
  }
}
</style>

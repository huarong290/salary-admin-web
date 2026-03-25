<!--src/views/system/menu/MenuPage.vue-->

<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <div class="toolbar">
        <el-button v-hasPerm="['sys:menu:add']" type="primary" icon="Plus" @click="handleAdd()"
          >新增根菜单</el-button
        >
        <el-button icon="Sort" @click="toggleExpandAll">展开/折叠全部</el-button>
        <el-button icon="Refresh" @click="getList">刷新列表</el-button>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <el-table
        v-if="refreshTable"
        v-loading="loading"
        :data="menuList"
        row-key="id"
        border
        height="100%"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="menuIcon" label="图标" align="center" width="70">
          <template #default="{ row }">
            <el-icon v-if="row.menuIcon" size="18" style="vertical-align: middle">
              <component :is="formatIcon(row.menuIcon)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="menuType" label="类型" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.menuType === 1" type="warning" size="small" class="status-tag"
              >目录</el-tag
            >
            <el-tag v-else-if="row.menuType === 2" type="success" size="small" class="status-tag"
              >菜单</el-tag
            >
            <el-tag v-else-if="row.menuType === 3" type="info" size="small" class="status-tag"
              >按钮</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="menuSort" label="排序" align="center" width="70">
          <template #default="{ row }">
            <span class="amount-font">{{ row.menuSort }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="menuPermission"
          label="权限标识"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.menuPermission || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="menuComponent"
          label="组件路径"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="menuStatus" label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.menuStatus === 1 ? 'success' : 'danger'"
              size="small"
              class="status-tag"
            >
              {{ row.menuStatus === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="160">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['sys:menu:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['sys:menu:add']"
              link
              type="primary"
              icon="Plus"
              @click="handleAdd(row)"
              >新增</el-button
            >
            <el-button
              v-hasPerm="['sys:menu:del']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialog.visible"
      width="680px"
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

      <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">层级与类型</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="上级菜单" prop="menuParentId">
              <el-tree-select
                v-model="form.menuParentId"
                :data="menuOptions"
                :props="{ value: 'id', label: 'menuName', children: 'children' }"
                value-key="id"
                placeholder="选择上级菜单 (不选则为根目录)"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio :label="1">目录</el-radio>
                <el-radio :label="2">菜单</el-radio>
                <el-radio :label="3">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">基础属性配置</div>
        <el-row :gutter="20">
          <el-col v-if="form.menuType !== 3" :span="24">
            <el-form-item label="菜单图标" prop="menuIcon">
              <el-select
                v-model="form.menuIcon"
                placeholder="选择图标 (支持搜索)"
                clearable
                filterable
                style="width: 100%"
              >
                <template #prefix>
                  <el-icon v-if="form.menuIcon" class="el-input__icon"
                    ><component :is="form.menuIcon"
                  /></el-icon>
                  <el-icon v-else class="el-input__icon"><Search /></el-icon>
                </template>
                <el-option v-for="icon in iconList" :key="icon" :label="icon" :value="icon">
                  <div style="display: flex; align-items: center; gap: 10px">
                    <el-icon size="18"><component :is="icon" /></el-icon>
                    <span>{{ icon }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="页面显示名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单编码" prop="menuCode">
              <el-input v-model="form.menuCode" placeholder="路由唯一标识(系统名_模块)" />
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
          <el-col v-if="form.menuType !== 3" :span="12">
            <el-form-item label="路由地址" prop="menuPath">
              <template #label>
                <span
                  >路由地址
                  <el-tooltip
                    content="侧边栏访问路径，如 `user`，外链需以 `http` 开头"
                    placement="top"
                    ><el-icon><QuestionFilled /></el-icon></el-tooltip
                ></span>
              </template>
              <el-input v-model="form.menuPath" placeholder="如: user" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">权限与状态控制</div>
        <el-row :gutter="20">
          <el-col v-if="form.menuType !== 3" :span="12">
            <el-form-item label="组件路径" prop="menuComponent">
              <template #label>
                <span
                  >组件路径
                  <el-tooltip
                    content="前端 views 下的组件位置，如 `system/user/index`"
                    placement="top"
                    ><el-icon><QuestionFilled /></el-icon></el-tooltip
                ></span>
              </template>
              <el-input v-model="form.menuComponent" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 1" :span="12">
            <el-form-item label="权限字符" prop="menuPermission">
              <template #label>
                <span
                  >权限字符
                  <el-tooltip content="后端控制器定义的标识，如 `sys:user:add`" placement="top"
                    ><el-icon><QuestionFilled /></el-icon></el-tooltip
                ></span>
              </template>
              <el-input v-model="form.menuPermission" placeholder="请输入权限标识" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 3" :span="12">
            <el-form-item label="显示状态" prop="menuVisible">
              <el-radio-group v-model="form.menuVisible">
                <el-radio :label="1">显示</el-radio>
                <el-radio :label="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单状态" prop="menuStatus">
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
 * 功能描述: 系统菜单权限管理 (树形结构维护、路由配置、RBAC 按钮权限控制)
 * 依赖关联: 该数据直接决定侧边栏渲染、页面路由定义及用户权限过滤
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态 (Vue Core)
import { ref, reactive, onMounted, nextTick, shallowRef } from 'vue';

// [2] 第三方 UI 组件库与图标 (Element Plus & Icons)
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, QuestionFilled, Search } from '@element-plus/icons-vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// [3] 业务 API 请求接口 (API Services)
import { addMenuApi, deleteMenuApi, editMenuApi, getMenuTreeApi } from '@/api/menu';

// [4] TS 强类型定义约束 (DTO / VO)
import type { MenuTreeVO } from '@/types/menu/menu.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false); // 加载层状态
const isFullscreen = ref(false); // 弹窗全屏状态
const refreshTable = ref(true); // 树表强制刷新标识
const isExpandAll = ref(false); // 树表全展开标识
const iconList = shallowRef(Object.keys(ElementPlusIconsVue)); // 全量图标名列表

// [表格数据状态]
const menuList = ref<MenuTreeVO[]>([]); // 菜单树源数据
const menuOptions = ref<any[]>([]); // 弹窗中上级菜单的选择树

// [业务表单状态]
const menuFormRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  menuName: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  menuCode: [{ required: true, message: '菜单编码不能为空', trigger: 'blur' }],
  menuSort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  menuPath: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换用户弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 树形表格：一键展开或折叠全部节点 */
const toggleExpandAll = () => {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
};

/** 关闭并清理弹窗 */
const cancel = () => {
  dialog.visible = false;
  menuFormRef.value?.resetFields();
};

/** 工具：图标首字母大写转换 (适配组件库渲染) */
const formatIcon = (icon: string) => {
  if (!icon) return '';
  return icon.charAt(0).toUpperCase() + icon.slice(1);
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取系统菜单树形列表数据 */
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

/** * 业务：加载用于上级菜单选择的树形结构 */
const getTreeselect = async () => {
  const res = await getMenuTreeApi();
  const menus = res || [];
  // 注入“主类目”作为根节点
  menuOptions.value = [{ id: 0, menuName: '主类目', children: menus }];
};

/** * 发起：新增菜单
 * 说明：若携带 row 则视为新增该行下的子菜单，否则为新增根菜单
 */
const handleAdd = async (row?: MenuTreeVO) => {
  await getTreeselect();
  form.value = {
    menuParentId: row != null && row.id ? row.id : 0,
    menuType: 1, // 默认选中目录
    menuVisible: 1,
    menuStatus: 1,
    menuSort: 0,
    menuCode: undefined,
    menuIcon: undefined,
    menuPath: undefined,
    menuComponent: undefined,
    menuPermission: undefined,
  };
  dialog.title = '添加菜单配置';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改菜单配置 */
const handleUpdate = async (row: MenuTreeVO) => {
  await getTreeselect();
  form.value = { ...row };
  dialog.title = '修改菜单配置';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交菜单表单映射 */
const submitForm = async () => {
  if (!menuFormRef.value) return;
  await menuFormRef.value.validate(async (valid) => {
    if (valid) {
      // 提取核心路由参数，剥离无关的 VO 字段
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
        ElMessage.success('配置更新成功');
      } else {
        await addMenuApi(submitData);
        ElMessage.success('菜单创建成功');
      }
      dialog.visible = false;
      getList();
    }
  });
};

/** * 执行：物理/逻辑删除指定菜单节点
 * 风险点：后端会校验是否有子节点，此处提示用户
 */
const handleDelete = (row: MenuTreeVO) => {
  ElMessageBox.confirm(
    `确认删除菜单 "${row.menuName}" 吗? 若存在子节点将无法直接删除。`,
    '系统高危操作',
    { type: 'warning' }
  )
    .then(async () => {
      await deleteMenuApi(row.id);
      ElMessage.success('删除成功');
      getList();
    })
    .catch(() => {});
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
   仅处理树形表格特定的垂直排版逻辑。
   ===================================================================== */
</style>

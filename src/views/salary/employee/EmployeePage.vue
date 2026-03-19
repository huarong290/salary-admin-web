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
        <el-button v-hasPerm="['salary:employee:add']" type="primary" icon="Plus" @click="handleAdd"
          >新增员工</el-button
        >
        <el-button
          v-hasPerm="['salary:employee:del']"
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
        <el-table-column label="工号" width="120" align="center">
          <template #default="scope">
            <span class="amount-font text-secondary">{{ scope.row.employeeCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="姓名" prop="employeeName" width="120" align="center" />
        <el-table-column
          label="所属公司"
          prop="companyName"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="部门" prop="department" width="120" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.employmentStatus === 1 ? 'success' : 'info'"
              :effect="scope.row.employmentStatus === 1 ? 'dark' : 'plain'"
              size="small"
            >
              {{ scope.row.employmentStatus === 1 ? '在职' : '已离职' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="转岗情况" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.isTransferred === 1 ? 'warning' : 'info'"
              effect="plain"
              size="small"
            >
              {{ scope.row.isTransferred === 1 ? '已转岗' : '未转岗' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="入库时间" width="170" align="center">
          <template #default="scope">
            <span class="amount-font">{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
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
      width="650px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
      @close="cancel"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">{{ dialog.title }}</span>
          <el-button link @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <div class="section-title">基础身份信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工工号" prop="employeeCode">
              <el-input
                v-model="form.employeeCode"
                placeholder="请输入工号"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeName">
              <el-input v-model="form.employeeName" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title margin-top-20">组织架构与状态</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属公司" prop="companyName">
              <el-input v-model="form.companyName" placeholder="如：集团总部" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department">
              <el-input v-model="form.department" placeholder="如：研发中心" />
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
                active-text="已转岗"
                inactive-text="未转岗"
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
                placeholder="请选择住宿安排"
                style="width: 100%"
              >
                <el-option label="不住宿 (自行解决)" :value="0" />
                <el-option label="公司宿舍 (统一安排)" :value="1" />
                <el-option label="外宿补贴 (享受房补)" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定 保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 员工基础档案管理页 (负责员工核心身份及组织状态的维护)
 * 依赖关联: 该模块数据是 薪资档案 (Archive) 和 薪资周期 (Period) 的基石
 * ====================================================================
 */

// 1. Vue 内置与核心依赖库
import { ref, reactive, onMounted } from 'vue';

// 2. 第三方 UI 组件库及图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus } from '@element-plus/icons-vue';

// 3. 业务 API 接口
import {
  getEmployeePageApi,
  addEmployeeApi,
  editEmployeeApi,
  deleteEmployeeApi,
  batchDeleteEmployeeApi,
} from '@/api/salary/employee';

// 4. TS 类型定义 (DTO/VO)
import type { EmployeeQueryReqDTO, EmployeeVO } from '@/types/salary/employee/employee.ts';

/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false); // 表格加载遮罩层状态
const isFullscreen = ref(false); // 弹窗全屏状态切换标识

// [表格与分页状态]
const total = ref(0); // 数据总条数
const dataList = ref<EmployeeVO[]>([]); // 表格主数据源
const multiple = ref(true); // 批量操作按钮禁用状态 (无选中时禁用)
const selectedIds = ref<number[]>([]); // 当前表格选中的主键 ID 集合

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<EmployeeQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  employmentStatus: undefined,
});

// [业务表单状态]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' }); // 弹窗控制器
const form = ref<any>({}); // 承载新增/编辑的表单数据 (动态抹平差异)

// 表单前端合法性校验规则
const rules = reactive<FormRules>({
  employeeCode: [{ required: true, message: '工号不能为空', trigger: 'blur' }],
  employeeName: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: EmployeeVO[]) => {
  // 提取选中行的 ID 集合，供批量删除使用
  selectedIds.value = selection.map((item) => item.id as unknown as number);
  multiple.value = !selection.length;
};

/** 重置搜索栏并刷新列表 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 关闭并清理弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields(); // 必须重置表单，防止下次打开残留校验报错
};

/**
 * --------------------------------------------------------------------
 * 🧠 三、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取分页列表数据
 * 设计：采用 try-finally 结构，确保哪怕接口报错，loading 遮罩层也能被顺利移除
 */
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

/** 触发带条件搜索 (必须强制将页码重置为 1) */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** * 发起：新增数据
 * 设计：给定合理的业务初始值，避免前端校验提前阻断
 */
const handleAdd = () => {
  form.value = {
    employmentStatus: 1, // 默认在职
    isTransferred: 0, // 默认未转岗
    accommodationStatus: 0, // 默认不住宿
  };
  dialog.title = '新增员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改数据
 * 设计：基于深拷贝回显数据，防止直接修改表格绑定的原引用
 */
const handleUpdate = (row: EmployeeVO) => {
  form.value = { ...row };
  dialog.title = '修改员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交表单 (融合新增与修改)
 */
const submitForm = async () => {
  if (!formRef.value) return;
  // 1. 触发 Element Plus 底层表单规则校验
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 2. 根据是否存在 ID 路由不同的持久化接口
      if (form.value.id) {
        await editEmployeeApi(form.value);
        ElMessage.success('员工修改成功');
      } else {
        await addEmployeeApi(form.value);
        ElMessage.success('员工入档成功');
      }
      // 3. 收尾动作：关弹窗、刷新列表
      dialog.visible = false;
      getList();
    }
  });
};

/** * 执行：物理/逻辑删除单条记录
 * 设计：涉及敏感操作，必须加入二次确认阻断机制
 */
const handleDelete = (row: EmployeeVO) => {
  ElMessageBox.confirm(
    `即将永久删除员工 "${row.employeeName}" 的档案数据，此操作不可逆，是否继续?`,
    '系统高危操作提示',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '放弃操作',
    }
  )
    .then(async () => {
      await deleteEmployeeApi(row.id);
      ElMessage.success('档案已销毁');
      getList();
    })
    .catch(() => {
      /* 取消操作，安静退出 */
    });
};

/** 执行：批量删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 名员工数据?`,
    '系统高危操作提示',
    {
      type: 'warning',
    }
  )
    .then(async () => {
      await batchDeleteEmployeeApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  getList(); // 组件挂载完毕后，立即拉取首屏数据
});
</script>

<style scoped lang="scss">
/* =====================================================================
  🎨 页面私有样式定制区
  规范：只放置本页面独有的微调样式，通用结构样式已由 src/styles/_layout.scss 接管
  =====================================================================
*/

/* 金融级数字排版：强制等宽对齐，极大提升表格数字的可读性 */
.amount-font {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 500;
}

/* 弱化次要文本颜色 */
.text-secondary {
  color: var(--el-text-color-secondary);
}

/* 弹窗表单的区块分割标题 (保持与整个系统的高级视觉一致) */
.section-title {
  font-weight: bold;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
  margin: 10px 0 20px;
  color: var(--el-text-color-primary);
  font-size: 15px;
}

/* 常用辅助间距 */
.margin-top-20 {
  margin-top: 20px;
}

/* 弹窗自定义头部布局：确保左侧标题与右侧图标的完美对齐 */
.dialog-custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 20px; /* 预留给原生关闭按钮的空间，防止重叠 */

  .title {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}
</style>

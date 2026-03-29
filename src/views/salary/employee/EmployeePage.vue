<!--src/views/salary/employee/EmployeePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
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
            placeholder="选择用工状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="dict in dicts.employment_status || []"
              :key="dict.dictItemValue"
              :label="dict.dictItemLabel"
              :value="Number(dict.dictItemValue)"
            />
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
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.employeeCode }}</span>
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
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.employmentStatus)" class="status-tag">
              {{ getDictLabel(dicts.employment_status, row.employmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="入职日期" width="120" align="center">
          <template #default="{ row }">
            <span class="amount-font">{{ row.entryDate }}</span>
          </template>
        </el-table-column>

        <el-table-column label="转正日期" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.probationEndDate" class="amount-font text-success">
              {{ row.probationEndDate }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>

        <el-table-column label="离职日期" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.actualLeaveDate" class="amount-font text-danger">
              {{ row.actualLeaveDate }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="转岗情况" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.transferFlag === 1 ? 'warning' : 'info'"
              effect="plain"
              class="status-tag"
            >
              {{ row.transferFlag === 1 ? '已转岗' : '未转岗' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="入库时间" width="170" align="center">
          <template #default="{ row }">
            <span class="amount-font text-secondary">{{ row.createTime }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['salary:employee:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(row)"
              >修改</el-button
            >
            <el-button
              v-hasPerm="['salary:employee:del']"
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
      width="650px"
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
            <el-form-item label="岗位职级" prop="jobTitle">
              <el-input v-model="form.jobTitle" placeholder="如：高级Java工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entryDate">
              <el-date-picker
                v-model="form.entryDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择入职日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计转正" prop="probationEndDate">
              <el-date-picker
                v-model="form.probationEndDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="转正考核日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="离职日期" prop="actualLeaveDate">
              <el-date-picker
                v-model="form.actualLeaveDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="实际最后工作日"
                style="width: 100%"
                :disabled="form.employmentStatus != 0"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转岗状态" prop="transferFlag">
              <el-switch
                v-model="form.transferFlag"
                :active-value="1"
                :inactive-value="0"
                active-text="已转岗"
                inactive-text="未转岗"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="在职状态" prop="employmentStatus">
              <el-select v-model="form.employmentStatus" placeholder="选择状态" style="width: 100%">
                <el-option
                  v-for="dict in dicts.employment_status || []"
                  :key="dict.dictItemValue"
                  :label="dict.dictItemLabel"
                  :value="Number(dict.dictItemValue)"
                  :disabled="!form.id && dict.dictItemValue == '0'"
                />
              </el-select>
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
                <el-option label="外宿 (享受房补)" :value="2" />
              </el-select>
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
 * 功能描述: 员工基础档案管理 (负责员工核心身份及组织状态的维护)
 * 依赖关联: 该模块数据是 薪资档案 (Archive) 和 薪资周期 (Period) 的基石
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

// [3] 业务 API 请求接口 (API Services)
import {
  getEmployeePageApi,
  addEmployeeApi,
  editEmployeeApi,
  deleteEmployeeApi,
  batchDeleteEmployeeApi,
} from '@/api/salary/employee';

// [4] TS 强类型定义约束 (DTO / VO)
import type { EmployeeQueryReqDTO, EmployeeVO } from '@/types/salary/employee/employee.ts';
import { useDict } from '@/hooks/useDict';
/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
//  触发字典数据初始化加载
const dicts = useDict('employment_status');
// [UI 控制状态]
const loading = ref(false); // 表格加载遮罩层状态
const isFullscreen = ref(false); // 弹窗全屏状态切换标识

// [表格与分页状态]
const total = ref(0); // 数据总条数
const dataList = ref<EmployeeVO[]>([]); // 表格主数据源
const multiple = ref(true); // 批量操作按钮禁用状态
const selectedIds = ref<number[]>([]); // 当前选中的 ID 集合

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
const dialog = reactive({ visible: false, title: '' });
const form = ref<any>({});

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  employeeCode: [{ required: true, message: '工号不能为空', trigger: 'blur' }],
  employeeName: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  entryDate: [{ required: true, message: '入职日期是算薪依据，必填', trigger: 'change' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: EmployeeVO[]) => {
  selectedIds.value = selection.map((item) => item.id as unknown as number);
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

/** 关闭并清理弹窗内容 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};
const getStatusType = (status: number | string) => {
  const map: Record<string, string> = {
    '1': 'success',
    '2': 'warning',
    '3': 'primary',
    '4': 'info',
    '0': 'danger',
  };
  return map[String(status)] || 'info';
};

//翻译函数
const getDictLabel = (dictList: any[] | undefined | null, value: number | string) => {
  console.log('当前字典列表:', dictList, '待匹配值:', value);
  // 1. 如果字典还没加载完，或者没有值，先显示空，避免显示尴尬的数字
  if (!dictList || dictList.length === 0) return '';

  // 2. 强行把 value 转成字符串进行查找，确保 "1" == 1 匹配成功
  const item = dictList.find((d) => String(d.dictItemValue) === String(value));

  // 3. 如果找到了显示 Label，找不到则返回原始值
  return item ? item.dictItemLabel : value;
};
/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getEmployeePageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载员工列表失败', error);
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增员工数据 */
const handleAdd = () => {
  form.value = {
    employmentStatus: 1, // 默认在职
    transferFlag: 0, // 默认未转岗
    accommodationStatus: 0, // 默认不住宿
    entryDate: new Date().toISOString().split('T')[0], // 🌟 默认今天
    probationEndDate: undefined,
    actualLeaveDate: undefined,
  };
  dialog.title = '新增员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改员工数据 */
const handleUpdate = (row: EmployeeVO) => {
  form.value = { ...row };
  dialog.title = '修改员工档案';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交员工表单 (融合新增与修改) */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editEmployeeApi(form.value);
        ElMessage.success('信息更新成功');
      } else {
        await addEmployeeApi(form.value);
        ElMessage.success('员工入档成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：物理/逻辑删除单条档案数据 */
const handleDelete = (row: EmployeeVO) => {
  ElMessageBox.confirm(
    `确认永久销毁员工 "${row.employeeName}" 的档案吗? 操作后无法恢复。`,
    '系统高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await deleteEmployeeApi(row.id);
      ElMessage.success('档案已销毁');
      getList();
    })
    .catch(() => {});
};

/** * 执行：批量删除档案数据 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认批量销毁选中的 ${selectedIds.value.length} 条员工档案吗?`,
    '系统高危操作提示',
    { type: 'warning' }
  )
    .then(async () => {
      await batchDeleteEmployeeApi(selectedIds.value);
      ElMessage.success('批量销毁成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、 Vue 生命周期区 (Lifecycle Hooks)
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
   此处已无需任何多余的 CSS，干干净净才是大厂风范！
   ===================================================================== */
</style>

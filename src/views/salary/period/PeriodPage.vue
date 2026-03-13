<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="员工信息" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="姓名或工号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="仅看最新" prop="isLatest">
          <el-select
            v-model="queryParams.isLatest"
            placeholder="版本状态"
            clearable
            style="width: 120px"
          >
            <el-option label="最新版本" :value="1" />
            <el-option label="所有历史" :value="0" />
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
        <el-button v-hasPerm="['salary:archive:add']" type="primary" icon="Plus" @click="handleAdd">
          定薪/调薪
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border row-key="id">
        <el-table-column type="expand">
          <template #default="scope">
            <div style="padding: 10px 50px">
              <el-descriptions title="薪资项目明细" :column="3" border>
                <el-descriptions-item
                  v-for="item in scope.row.items"
                  :key="item.typeId"
                  :label="item.typeName"
                >
                  <span :class="item.itemType === 1 ? 'text-success' : 'text-danger'">
                    {{ item.itemType === 1 ? '+' : '-' }}
                    {{
                      item.calcType === 1
                        ? item.amount
                        : (scope.row.baseSalary * item.ratio).toFixed(2)
                    }}
                  </span>
                  <el-tag
                    v-if="item.calcType === 2"
                    size="small"
                    style="margin-left: 8px"
                    type="info"
                  >
                    比例: {{ (item.ratio * 100).toFixed(2) }}%
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="!scope.row.items || scope.row.items.length === 0"
                  label="提示"
                >
                  <span style="color: #909399">暂无固定收支明细项</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="员工姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="员工编号" align="center" prop="employeeCode" width="120" />
        <el-table-column label="版本号" align="center" prop="version" width="90">
          <template #default="scope">
            <el-tag effect="dark" type="info">V{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="基本工资" align="center" prop="baseSalary" width="130">
          <template #default="scope">
            <span style="font-weight: bold; color: #409eff">{{ scope.row.baseSalary }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isLatest === 1 ? 'success' : 'info'">
              {{ scope.row.isLatest === 1 ? '当前有效' : '历史版本' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="调薪原因"
          align="center"
          prop="changeReason"
          show-overflow-tooltip
        />
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleDetail(scope.row)"
              >详情</el-button
            >
            <el-button
              v-if="scope.row.isLatest === 1 && scope.row.auditStatus === 0"
              link
              type="danger"
              icon="RefreshLeft"
              @click="handleRevoke(scope.row)"
              >撤销</el-button
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
      width="850px"
      append-to-body
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                reserve-keyword
                placeholder="搜索员工"
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                style="width: 100%"
                @change="handleEmployeeChange"
              >
                <el-option
                  v-for="item in employeeOptions"
                  :key="item.id"
                  :label="item.employeeName"
                  :value="item.id"
                >
                  <span style="float: left">{{ item.employeeName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 12px">{{
                    item.employeeCode
                  }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="基本工资" prop="baseSalary">
              <el-input-number
                v-model="form.baseSalary"
                :precision="2"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">薪资组成明细项</el-divider>

        <div class="item-toolbar">
          <el-button type="success" size="small" icon="Plus" @click="addItem(1)"
            >添加收入项</el-button
          >
          <el-button type="danger" size="small" icon="Plus" @click="addItem(2)"
            >添加扣款项</el-button
          >
        </div>

        <el-table
          :data="form.items"
          border
          size="small"
          style="margin-top: 10px; margin-bottom: 20px"
        >
          <el-table-column label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.itemType === 1 ? 'success' : 'danger'">
                {{ scope.row.itemType === 1 ? '收入项' : '扣款项' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目名称" width="180">
            <template #default="scope">
              <el-select
                v-model="scope.row.typeId"
                placeholder="选择项目"
                style="width: 100%"
                @change="handleItemTypeChange($event, scope.row)"
              >
                <el-option
                  v-for="dict in scope.row.itemType === 1 ? incomeDict : deductionDict"
                  :key="dict.id"
                  :label="dict.typeName"
                  :value="dict.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="计算方式" width="130">
            <template #default="scope">
              <el-select
                v-model="scope.row.calcType"
                style="width: 100%"
                @change="
                  () => {
                    scope.row.amount = 0;
                    scope.row.ratio = 0;
                  }
                "
              >
                <el-option label="固定金额" :value="1" />
                <el-option label="底薪比例" :value="2" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="值(金额/比例)">
            <template #default="scope">
              <div class="flex-align-center">
                <el-input-number
                  v-if="scope.row.calcType === 1"
                  v-model="scope.row.amount"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
                <el-input-number
                  v-else
                  v-model="scope.row.ratio"
                  :precision="4"
                  :step="0.01"
                  :max="1"
                  placeholder="如0.08"
                  :controls="false"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="预览结果" width="120" align="right">
            <template #default="scope">
              <span class="preview-amount">
                {{ calculatePreview(scope.row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="scope">
              <el-button link type="danger" icon="Delete" @click="removeItem(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>

        <el-row>
          <el-col :span="24">
            <el-form-item label="调薪原因" prop="changeReason">
              <el-input
                v-model="form.changeReason"
                type="textarea"
                :rows="2"
                placeholder="请输入本次定薪或调薪的具体原因（如：年度普调、晋升等）"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确认提交</el-button>
          <el-button @click="dialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

import { listEmployeeOptionsApi } from '@/api/salary/employee';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee';
import type {
  ArchiveAddReqDTO,
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
} from '@/types/salary/archive/archive.ts';
import {
  getArchivePageApi,
  getCurrentArchiveApi,
  revokeLatestVersionApi,
  saveOrAdjustArchiveApi,
} from '@/api/salary/archive/archive.ts';
import type { ArchiveItemDTO } from '@/types/salary/archiveitem/archiveItem.ts';
import {
  getDeductionTypeListApi,
  getIncomeTypeListApi,
} from '@/api/salary/archiveitem/archiveItem.ts';

// --- 数据定义 ---
const loading = ref(false);
const total = ref(0);
const dataList = ref<SalaryArchiveVO[]>([]);
const queryParams = reactive<ArchiveQueryReqDTO>({ pageNum: 1, pageSize: 10, isLatest: 1 });

const dialog = reactive({ visible: false, title: '' });
const form = ref<ArchiveAddReqDTO>({
  employeeId: '',
  baseSalary: 0,
  effectiveDate: '',
  changeReason: '',
  items: [],
});
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();

const searchLoading = ref(false);
const employeeOptions = ref<EmployeeOptionVO[]>([]);
const incomeDict = ref<any[]>([]);
const deductionDict = ref<any[]>([]);

const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  baseSalary: [{ required: true, message: '请输入基本工资', trigger: 'blur' }],
  effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
});

// --- 核心方法 ---
const getList = async () => {
  loading.value = true;
  try {
    const res = await getArchivePageApi(queryParams);
    // 注意：根据你的 PageResult 封装结构，这里可能是 res.data.records 或者是 res.records
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

const handleAdd = () => {
  form.value = { employeeId: '', baseSalary: 0, effectiveDate: '', items: [], changeReason: '' };
  dialog.title = '新增定薪/发起调薪';
  dialog.visible = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  form.value.items = [];
};

/** 联动：选择员工后自动获取其当前薪资作为初始值 (极佳的用户体验) */
const handleEmployeeChange = async (val: number) => {
  try {
    const res = await getCurrentArchiveApi(val);
    if (res && res.baseSalary !== undefined) {
      // 老员工调薪：自动回显底薪和明细
      form.value.baseSalary = res.baseSalary;
      form.value.items = res.items
        ? res.items.map((i) => ({
            itemType: i.itemType,
            typeId: i.typeId,
            calcType: i.calcType,
            amount: i.amount,
            ratio: i.ratio,
          }))
        : [];
    } else {
      // 没查到档案，说明是纯新员工第一次定薪，清空预设数据
      form.value.baseSalary = 0;
      form.value.items = [];
    }
  } catch (e) {
    form.value.baseSalary = 0;
    form.value.items = [];
    console.error('捕获到异常:', e);
  }
};

/** 动态项操作 */
const addItem = (type: number) => {
  if (!form.value.items) form.value.items = [];
  form.value.items.push({
    itemType: type,
    typeId: undefined as any,
    calcType: 1,
    amount: 0,
    ratio: 0,
  });
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

/** 🌟 修复：项目类型切换时的防呆处理 */
const handleItemTypeChange = (_val: number, row: ArchiveItemDTO) => {
  // 既然切换了具体的津贴/扣款项目，顺手把旧的金额清零，防止 HR 忘了改金额
  row.amount = 0;
  row.ratio = 0;
};

/** 🌟 修复：预览计算逻辑 (增强防空指针处理) */
const calculatePreview = (row: ArchiveItemDTO) => {
  if (row.calcType === 1) {
    return Number(row.amount || 0).toFixed(2);
  } else {
    // 比例计算：表单当前底薪 * 比例
    const base = Number(form.value.baseSalary || 0);
    const ratio = Number(row.ratio || 0);
    return (base * ratio).toFixed(2);
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 提交前的防呆校验
      const invalidItem = form.value.items.find((i) => !i.typeId);
      if (invalidItem) {
        ElMessage.warning('明细项目中存在未选择类型的记录，请检查');
        return;
      }

      await saveOrAdjustArchiveApi(form.value);
      ElMessage.success('提交成功');
      dialog.visible = false;
      getList();
    }
  });
};

const handleRevoke = (row: SalaryArchiveVO) => {
  ElMessageBox.confirm('撤销将恢复至上一个有效的薪资版本，确定继续吗？', '撤销确认', {
    type: 'warning',
  })
    .then(async () => {
      await revokeLatestVersionApi(row.employeeId);
      ElMessage.success('撤销成功');
      getList();
    })
    .catch(() => {});
};

const handleDetail = (row: SalaryArchiveVO) => {
  // 使用模板字符串 `${}` 把员工姓名拼进去，row 就被使用了！
  ElMessage.info(`查看【${row.employeeName}】的详情功能：通常用于展示历史调薪时间轴，待后续扩展。`);
};

/** 字典与搜索 */
const remoteSearchEmployees = async (q: string) => {
  if (!q) {
    employeeOptions.value = [];
    return;
  }
  searchLoading.value = true;
  try {
    const res = await listEmployeeOptionsApi(q);
    employeeOptions.value = res as any;
  } finally {
    searchLoading.value = false;
  }
};

const loadDicts = async () => {
  try {
    incomeDict.value = (await getIncomeTypeListApi()) || [];
    deductionDict.value = (await getDeductionTypeListApi()) || [];
  } catch (e) {
    console.error('加载字典失败', e);
  }
};

onMounted(() => {
  getList();
  loadDicts();
});
</script>

<style scoped lang="scss">
.app-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.search-card .el-form-item {
  margin-bottom: 0;
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
.item-toolbar {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
.preview-amount {
  font-weight: bold;
  color: #67c23a;
}
.text-success {
  color: #67c23a;
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
.flex-align-center {
  display: flex;
  align-items: center;
}
</style>

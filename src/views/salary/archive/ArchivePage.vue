<!--src/views/salary/archive/ArchivePage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索姓名或工号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="版本状态" prop="isLatest">
          <el-select
            v-model="queryParams.isLatest"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="当前最新" :value="1" />
            <el-option label="历史版本" :value="0" />
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
          新员工定薪
        </el-button>
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="工号" align="center" prop="employeeCode" width="120" />
        <el-table-column label="姓名" align="center" prop="employeeName" width="120" />
        <el-table-column label="版本号" align="center" prop="version" width="80">
          <template #default="scope">
            <el-tag type="info">V{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="基本工资" align="center" prop="baseSalary" width="150">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold">{{ scope.row.baseSalary }}</span>
            <span style="margin-left: 4px; font-size: 12px; color: #909399">{{
              scope.row.currency || 'CNY'
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
        <el-table-column label="审核状态" align="center" prop="auditStatus" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getArchiveStatus(row.auditStatus).tagType"
              :effect="getVersionStatus(row.auditStatus).effect"
            >
              {{ getArchiveStatus(row.auditStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否最新" align="center" prop="isLatest" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getVersionStatus(row.isLatest).type"
              :effect="getVersionStatus(row.isLatest).effect"
            >
              {{ getVersionStatus(row.isLatest).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="调薪原因"
          align="center"
          prop="changeReason"
          show-overflow-tooltip
        />
        <el-table-column label="操作" align="center" width="260" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.isLatest === 1 && scope.row.auditStatus === 0"
              v-hasPerm="['salary:archive:audit']"
              link
              type="warning"
              icon="Stamp"
              @click="handleAudit(scope.row)"
              >审核</el-button
            >
            <el-button
              v-if="scope.row.isLatest === 1"
              v-hasPerm="['salary:archive:edit']"
              link
              type="primary"
              icon="Edit"
              @click="handleAdjust(scope.row)"
              >调薪</el-button
            >
            <el-button link type="info" icon="View" @click="handleDetail(scope.row)"
              >详情</el-button
            >
            <el-button
              v-if="scope.row.isLatest === 1 && scope.row.auditStatus === 0"
              v-hasPerm="['salary:archive:revoke']"
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
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">基础档案</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择员工" prop="employeeId">
              <el-select
                v-model="form.employeeId"
                filterable
                remote
                reserve-keyword
                placeholder="输入姓名搜索"
                :remote-method="remoteSearchEmployees"
                :loading="searchLoading"
                :disabled="isAdjusting"
                style="width: 100%"
              >
                <el-option
                  v-for="item in employeeOptions"
                  :key="item.id"
                  :label="item.employeeName"
                  :value="item.id"
                >
                  <span style="float: left">{{ item.employeeName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{
                    item.employeeCode
                  }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                placeholder="选择生效日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基本工资" prop="baseSalary">
              <div class="flex-align-center" style="width: 100%">
                <el-input-number
                  v-model="form.baseSalary"
                  :min="0"
                  :precision="form.currency === 'USDT' ? 4 : 2"
                  :controls="false"
                  style="flex: 1"
                  placeholder="请输入基本工资"
                />
                <el-select v-model="form.currency" style="width: 90px; margin-left: 5px">
                  <el-option label="CNY" value="CNY" />
                  <el-option label="USDT" value="USDT" />
                  <el-option label="USD" value="USD" />
                </el-select>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调薪原因" prop="changeReason">
              <el-input v-model="form.changeReason" placeholder="如: 入职定薪, 晋升调薪" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title flex-justify-between">
          <span>薪资明细项</span>
          <div>
            <el-button type="success" plain size="small" @click="addItem(1)"
              >+ 增加收入项</el-button
            >
            <el-button type="danger" plain size="small" @click="addItem(2)">+ 增加扣款项</el-button>
          </div>
        </div>

        <el-table :data="form.items" border size="small" style="margin-bottom: 20px">
          <el-table-column label="收支类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.itemType === 1 ? 'success' : 'danger'">
                {{ scope.row.itemType === 1 ? '收入项' : '扣款项' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="明细项目" width="160">
            <template #default="scope">
              <el-select
                v-model="scope.row.typeId"
                placeholder="请选择"
                size="small"
                style="width: 100%"
              >
                <template v-if="scope.row.itemType === 1">
                  <el-option
                    v-for="dict in incomeOptions"
                    :key="dict.id"
                    :label="dict.typeName"
                    :value="dict.id"
                  />
                </template>
                <template v-else>
                  <el-option
                    v-for="dict in deductionOptions"
                    :key="dict.id"
                    :label="dict.typeName"
                    :value="dict.id"
                  />
                </template>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="计算方式" width="130">
            <template #default="scope">
              <el-select
                v-model="scope.row.calcType"
                size="small"
                style="width: 100%"
                @change="
                  () => {
                    scope.row.amount = 0;
                    scope.row.ratio = 0;
                  }
                "
              >
                <el-option label="固定金额" :value="1" />
                <el-option label="按基数比例" :value="2" />
                <el-option label="按出勤折算" :value="3" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="金额 / 比例">
            <template #default="scope">
              <div
                v-if="scope.row.calcType === 1 || scope.row.calcType === 3"
                class="flex-align-center"
              >
                <el-input-number
                  v-model="scope.row.amount"
                  :min="0"
                  :precision="form.currency === 'USDT' ? 4 : 2"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                />
                <span style="margin-left: 5px; font-size: 12px; color: #909399">{{
                  form.currency || 'CNY'
                }}</span>
              </div>
              <div v-else class="flex-align-center">
                <el-input-number
                  v-model="scope.row.ratio"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  :controls="false"
                  size="small"
                  style="width: 100%"
                />
                <el-tooltip content="不填基数则默认取基本工资进行计算" placement="top">
                  <span style="margin-left: 5px; font-size: 12px; color: #409eff; cursor: help"
                    >(比例)</span
                  >
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button
                link
                type="danger"
                icon="Delete"
                @click="removeItem(scope.$index)"
              ></el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialog.visible" title="薪资档案审核" width="500px" append-to-body>
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :label="1">通过 (生效)</el-radio>
            <el-radio :label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          label="审核备注"
          :prop="auditForm.auditStatus === 2 ? 'remark' : ''"
          :rules="
            auditForm.auditStatus === 2
              ? { required: true, message: '驳回时必须填写原因', trigger: 'blur' }
              : []
          "
        >
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            placeholder="请输入审核意见或驳回原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitAudit">确 定</el-button>
          <el-button @click="auditDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawer.visible"
      title="薪资档案版本详情"
      size="700px"
      destroy-on-close
    >
      <div v-loading="detailDrawer.loading" style="padding: 0 10px">
        <el-descriptions title="基础薪资配置" :column="2" border>
          <el-descriptions-item label="员工姓名">{{
            detailDrawer.data.employeeName
          }}</el-descriptions-item>
          <el-descriptions-item label="员工工号">{{
            detailDrawer.data.employeeCode
          }}</el-descriptions-item>
          <el-descriptions-item label="版本号">
            <el-tag size="small" effect="dark">V{{ detailDrawer.data.version }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生效日期">{{
            detailDrawer.data.effectiveDate
          }}</el-descriptions-item>
          <el-descriptions-item label="基本工资">
            <span style="font-weight: bold; color: #f56c6c"
              >{{ detailDrawer.data.baseSalary }} {{ detailDrawer.data.currency }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getArchiveStatus(detailDrawer.data.auditStatus).tagType">
              {{ getArchiveStatus(detailDrawer.data.auditStatus).text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 25px 0 10px 0; border-left: 4px solid #409eff; padding-left: 10px">
          薪资构成明细
        </h4>
        <el-table :data="detailDrawer.data.items" border stripe size="small">
          <el-table-column label="明细项目" prop="typeName" min-width="120" />
          <el-table-column label="项目分类" prop="categoryName" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="info" size="small" effect="plain">{{
                row.categoryName || '常规项'
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="收支类型" align="center" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.itemType === 1 ? 'success' : 'danger'" size="small">
                {{ scope.row.itemType === 1 ? '收入' : '扣款' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额/比例" align="right" width="150">
            <template #default="scope">
              <span
                v-if="scope.row.calcType === 1"
                :style="{
                  color: scope.row.itemType === 1 ? '#67c23a' : '#f56c6c',
                  fontWeight: 'bold',
                }"
              >
                {{ scope.row.amount }}
              </span>
              <span v-else style="color: #409eff">
                {{ (scope.row.ratio * 100).toFixed(2) }}% (按基数)
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div
          style="
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px dashed #dcdfe6;
          "
        >
          <p style="margin-bottom: 8px">
            <strong>调薪原因：</strong>{{ detailDrawer.data.changeReason || '无' }}
          </p>
          <p><strong>档案备注：</strong>{{ detailDrawer.data.remark || '无' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDrawer.visible = false">关闭</el-button>
        <el-button
          v-if="detailDrawer.data.auditStatus === 0"
          v-hasPerm="['salary:archive:audit']"
          type="primary"
          @click="handleAudit(detailDrawer.data)"
          >去审核</el-button
        >
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// 脚本部分逻辑逻辑已非常完善，保持不变...
// 只需确保 handleDetail 接口返回的数据结构包含 typeName 和 categoryName 即可。
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { listEmployeeOptionsApi } from '@/api/salary/employee';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee';
import type {
  ArchiveAddReqDTO,
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
  ArchiveAuditDTO,
} from '@/types/salary/archive/archive.ts';
import {
  getArchivePageApi,
  getCurrentArchiveApi,
  revokeLatestVersionApi,
  saveOrAdjustArchiveApi,
  auditArchiveApi,
  getArchiveDetailApi,
} from '@/api/salary/archive/archive.ts';
import { getIncomeTypeOptionsApi } from '@/api/salary/incometype/incomeType.ts';
import { getDeductionTypeOptionsApi } from '@/api/salary/deductiontype/deductionType.ts';

const loading = ref(false);
const total = ref(0);
const queryParams = reactive<ArchiveQueryReqDTO>({ pageNum: 1, pageSize: 10, isLatest: 1 });
const dataList = ref<SalaryArchiveVO[]>([]);
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<FormInstance>();
const isAdjusting = ref(false);
const queryFormRef = ref<FormInstance>();
const auditDialog = reactive({ visible: false });
const auditForm = reactive<ArchiveAuditDTO>({ id: 0, auditStatus: 1, remark: '' });

const form = ref<ArchiveAddReqDTO & { currency?: string }>({
  employeeId: '',
  baseSalary: 0,
  currency: 'CNY',
  effectiveDate: '',
  version: 0,
  remark: '',
  items: [],
});

const detailDrawer = reactive({
  visible: false,
  loading: false,
  data: {} as SalaryArchiveVO,
});

const searchLoading = ref(false);
const employeeOptions = ref<EmployeeOptionVO[]>([]);
const incomeOptions = ref<any[]>([]);
const deductionOptions = ref<any[]>([]);

const rules = reactive<FormRules>({
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  effectiveDate: [{ required: true, message: '生效日期不能为空', trigger: 'change' }],
  baseSalary: [{ required: true, message: '基本工资不能为空', trigger: 'blur' }],
});

const ARCHIVE_STATUS: Record<number, { text: string; tagType: string }> = {
  0: { text: '待审核', tagType: 'warning' },
  1: { text: '已生效', tagType: 'success' },
  2: { text: '已驳回', tagType: 'danger' },
};

const VERSION_STATUS: Record<
  number,
  { text: string; type: string; effect: 'dark' | 'light' | 'plain' }
> = {
  1: { text: '最新', type: 'success', effect: 'dark' },
  0: { text: '历史', type: 'info', effect: 'plain' },
};

const getArchiveStatus = (status: any) =>
  ARCHIVE_STATUS[Number(status)] || { text: '未知', tagType: 'info' };
const getVersionStatus = (isLatest: any) =>
  VERSION_STATUS[Number(isLatest)] || { text: '未知', type: 'info', effect: 'plain' };

const getList = async () => {
  loading.value = true;
  try {
    const res = await getArchivePageApi({
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || '',
      isLatest: queryParams.isLatest,
    });
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  getList();
};
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const loadDicts = async () => {
  incomeOptions.value = (await getIncomeTypeOptionsApi()) || [];
  deductionOptions.value = (await getDeductionTypeOptionsApi()) || [];
};

const remoteSearchEmployees = async (query: string) => {
  if (query) {
    searchLoading.value = true;
    try {
      const res = await listEmployeeOptionsApi(query);
      employeeOptions.value = res as any;
    } finally {
      searchLoading.value = false;
    }
  }
};

const handleAudit = (row: any) => {
  auditForm.id = row.id;
  auditForm.auditStatus = 1;
  auditForm.remark = '';
  auditDialog.visible = true;
};

const submitAudit = async () => {
  if (auditForm.auditStatus === 2 && !auditForm.remark) {
    ElMessage.warning('驳回时必须填写备注');
    return;
  }
  await auditArchiveApi(auditForm);
  ElMessage.success('审核成功');
  auditDialog.visible = false;
  getList();
  if (detailDrawer.visible) handleDetail(auditForm.id);
};

const handleAdd = () => {
  isAdjusting.value = false;
  form.value = {
    employeeId: '',
    baseSalary: 0,
    currency: 'CNY',
    effectiveDate: '',
    version: 0,
    remark: '',
    changeReason: '入职定薪',
    items: [],
  };
  dialog.title = '新员工定薪';
  dialog.visible = true;
};

const handleAdjust = async (row: any) => {
  isAdjusting.value = true;
  // 回显下拉框选项
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];

  try {
    const currentData = await getCurrentArchiveApi(row.employeeId);
    if (!currentData) {
      throw new Error('未找到该员工的生效薪资档案');
    }

    // 🌟 核心规范：绝不能直接 ...currentData，必须清洗出干净的表单数据！
    form.value = {
      employeeId: currentData.employeeId,
      baseSalary: currentData.baseSalary,
      currency: currentData.currency || 'CNY',
      effectiveDate: '', // 调薪必须重新选生效日期
      changeReason: '年度调薪',
      version: currentData.version,
      remark: currentData.remark,
      // 🌟 完美清洗：遍历旧明细，剥离 id 等无用字段，只保留准入参字段
      items: (currentData.items || []).map((item: any) => ({
        itemType: item.itemType,
        typeId: item.typeId,
        calcType: item.calcType,
        amount: item.amount,
        ratio: item.ratio,
      })),
    };

    dialog.title = '员工调薪';
    dialog.visible = true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    ElMessage.error('获取当前薪资档案失败: ' + msg);
  }
};

const addItem = (itemType: number) => {
  form.value.items.push({ itemType, typeId: undefined, calcType: 1, amount: 0, ratio: 0 });
};
const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};
const cancel = () => {
  dialog.visible = false;
};

const submitForm = async () => {
  await formRef.value?.validate(async (valid) => {
    if (valid) {
      await saveOrAdjustArchiveApi(form.value);
      ElMessage.success('提交成功');
      dialog.visible = false;
      getList();
    }
  });
};

const handleDetail = async (data: any) => {
  detailDrawer.visible = true;
  detailDrawer.loading = true;
  const id = typeof data === 'number' ? data : data.id;
  detailDrawer.data = await getArchiveDetailApi(id);
  detailDrawer.loading = false;
};

const handleRevoke = (row: any) => {
  ElMessageBox.confirm(`确认撤销该待审核版本并回滚吗?`, '警告', { type: 'warning' }).then(
    async () => {
      await revokeLatestVersionApi(row.employeeId);
      ElMessage.success('已撤销');
      getList();
    }
  );
};

onMounted(() => {
  getList();
  loadDicts();
});
</script>

<style scoped lang="scss">
/* 保持原有样式，增加抽屉内描述文字样式 */
.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}
.flex-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.flex-align-center {
  display: flex;
  align-items: center;
}
</style>

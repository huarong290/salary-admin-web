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
            <span style="margin-left: 4px; font-size: 12px; color: #909399">
              {{ scope.row.currency || 'CNY' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="生效日期" align="center" prop="effectiveDate" width="120" />
        <el-table-column label="审核状态" align="center" prop="auditStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="ARCHIVE_STATUS[row.auditStatus]?.tagType">
              {{ ARCHIVE_STATUS[row.auditStatus]?.text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="是否最新" align="center" prop="isLatest" width="100">
          <template #default="{ row }">
            <el-tag
              :type="VERSION_STATUS[row.isLatest]?.type"
              :effect="VERSION_STATUS[row.isLatest]?.effect"
            >
              {{ VERSION_STATUS[row.isLatest]?.text }}
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
      width="800px"
      append-to-body
      @close="cancel"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <div class="section-title">基础档案</div>
        <el-row>
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
        <el-row>
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
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="金额 / 比例">
            <template #default="scope">
              <div v-if="scope.row.calcType === 1" class="flex-align-center">
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
                <span style="margin-left: 5px; font-size: 12px; color: #909399">(如0.08)</span>
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
      size="650px"
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
            <span style="font-weight: bold; color: #f56c6c">
              {{ detailDrawer.data.baseSalary }} {{ detailDrawer.data.currency }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="ARCHIVE_STATUS[detailDrawer.data.auditStatus]?.tagType">
              {{ ARCHIVE_STATUS[detailDrawer.data.auditStatus]?.text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 20px 0 10px 0; border-left: 4px solid #409eff; padding-left: 10px">
          薪资构成明细
        </h4>
        <el-table :data="detailDrawer.data.items" border stripe size="small">
          <el-table-column label="明细项目" prop="itemName" />
          <el-table-column label="类型" align="center" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.itemType === 1 ? 'success' : 'danger'">
                {{ scope.row.itemType === 1 ? '收入' : '扣款' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额/比例" align="right">
            <template #default="scope">
              <span
                v-if="scope.row.calcType === 1"
                :style="{ color: scope.row.itemType === 1 ? '#67c23a' : '#f56c6c' }"
              >
                {{ scope.row.amount }}
              </span>
              <span v-else style="color: #409eff"
                >{{ (scope.row.ratio * 100).toFixed(2) }}% (按基数)</span
              >
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px">
          <p><strong>调薪原因：</strong>{{ detailDrawer.data.changeReason || '无' }}</p>
          <p style="margin-top: 10px">
            <strong>档案备注：</strong>{{ detailDrawer.data.remark || '无' }}
          </p>
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

import { listEmployeeOptionsApi } from '@/api/salary/employee';
import type { EmployeeOptionVO } from '@/types/salary/employee/employee';
import type {
  ArchiveAddReqDTO,
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
  ArchiveAuditDTO, // 🌟 修改点：引入审核类型定义
} from '@/types/salary/archive/archive.ts';
import {
  getArchivePageApi,
  getCurrentArchiveApi,
  revokeLatestVersionApi,
  saveOrAdjustArchiveApi,
  auditArchiveApi,
  getArchiveDetailApi, // 🌟 修改点：引入审核接口
} from '@/api/salary/archive/archive.ts';
import { getIncomeTypeOptionsApi } from '@/api/salary/incometype/incomeType.ts';
import { getDeductionTypeOptionsApi } from '@/api/salary/deductiontype/deductionType.ts';

const loading = ref(false);
const total = ref(0);
const queryParams = reactive<ArchiveQueryReqDTO>({ pageNum: 1, pageSize: 10, isLatest: 1 });
const dataList = ref<SalaryArchiveVO[]>([]);

// 表单与弹窗
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<FormInstance>();
const isAdjusting = ref(false);
const queryFormRef = ref<FormInstance>();

// 🌟 修改点：定义审核相关的响应式数据
const auditDialog = reactive({ visible: false });
const auditForm = reactive<ArchiveAuditDTO>({
  id: 0,
  auditStatus: 1, // 默认通过
  remark: '',
});

const form = ref<ArchiveAddReqDTO & { currency?: string }>({
  employeeId: '',
  baseSalary: 0,
  currency: 'CNY',
  effectiveDate: '',
  items: [],
});
const detailDrawer = reactive({
  visible: false,
  loading: false,
  data: {} as SalaryArchiveVO, // 建议根据接口返回定义具体的 DTO 类型
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
// 1. 统一薪资档案状态配置，并显式指定键类型为 [key: number]
const ARCHIVE_STATUS: Record<number, { text: string; tagType: string }> = {
  0: { text: '待审核', tagType: 'warning' },
  1: { text: '已生效', tagType: 'success' },
  2: { text: '已驳回', tagType: 'danger' },
};

// 统一版本状态配置
const VERSION_STATUS = {
  1: { text: '最新', type: 'success', effect: 'dark' },
  0: { text: '历史', type: 'info', effect: 'plain' },
};
// ================== 数据加载 ==================
// 1. 确保 getList 调用时参数是干净的
const getList = async () => {
  loading.value = true;
  try {
    // 明确传递参数，避免 queryParams 中包含多余的 undefined 字段
    const res = await getArchivePageApi({
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || '',
      isLatest: queryParams.isLatest,
    });
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    // 这样如果报错了，你能直接在控制台看到是哪个接口挂了
    console.error('加载列表异常:', error);
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

const loadDicts = async () => {
  try {
    incomeOptions.value = (await getIncomeTypeOptionsApi()) || [];
    deductionOptions.value = (await getDeductionTypeOptionsApi()) || [];
  } catch (error) {
    console.warn('未获取到字典数据，请检查接口配置error', error);
  }
};

const remoteSearchEmployees = async (query: string) => {
  if (query) {
    searchLoading.value = true;
    try {
      const res = await listEmployeeOptionsApi(query);
      employeeOptions.value = res as unknown as EmployeeOptionVO[];
    } finally {
      searchLoading.value = false;
    }
  } else {
    employeeOptions.value = [];
  }
};

// ================== 审核逻辑 (🌟 新增部分) ==================

/** 处理审核点击 */
const handleAudit = (row: SalaryArchiveVO) => {
  auditForm.id = row.id;
  auditForm.auditStatus = 1; // 默认通过
  auditForm.remark = '';
  auditDialog.visible = true;
};

/** 提交审核结果 */
const submitAudit = async () => {
  if (!auditForm.id) return;

  // 驳回时强制检查备注
  if (auditForm.auditStatus === 2 && !auditForm.remark) {
    ElMessage.warning('驳回时必须填写审核备注');
    return;
  }

  try {
    await auditArchiveApi(auditForm);
    ElMessage.success('审核处理成功');
    auditDialog.visible = false;
    await getList();
    // 🌟 完美同步：不仅刷新列表，如果详情开着，同步刷新详情内容
    if (detailDrawer.visible && detailDrawer.data.id === auditForm.id) {
      handleDetail({ id: auditForm.id });
    }
  } catch (error) {
    console.error('审核失败', error);
  }
};

// ================== 定薪/调薪操作交互 ==================

const handleAdd = () => {
  isAdjusting.value = false;
  form.value = {
    employeeId: '',
    baseSalary: 0,
    currency: 'CNY',
    effectiveDate: '',
    changeReason: '入职定薪',
    items: [],
  };
  dialog.title = '新员工定薪';
  dialog.visible = true;
};

const handleAdjust = async (row: SalaryArchiveVO) => {
  // 1. 安全校验：确保 row 存在且有员工 ID
  if (!row || !row.employeeId) {
    ElMessage.warning('无法获取员工信息，请重试');
    return;
  }
  isAdjusting.value = true;
  dialog.title = '员工调薪';
  // 回显下拉框选项
  employeeOptions.value = [
    { id: row.employeeId, employeeName: row.employeeName, employeeCode: row.employeeCode },
  ];

  try {
    const currentData = await getCurrentArchiveApi(row.employeeId);
    // 🚩 核心调整：判断 res 是否为空（后端可能返回 null 或 data 为空）
    if (!currentData) {
      throw new Error('未找到该员工的生效薪资档案');
    }
    form.value = {
      employeeId: currentData.employeeId,
      baseSalary: currentData.baseSalary,
      currency: currentData.currency || 'CNY',
      probationBaseSalary: currentData.probationBaseSalary,
      effectiveDate: '',
      changeReason: '年度调薪',
      // 🚩 处理 items 列表，增加空数组容错
      items: (currentData.items || []).map((item) => ({
        itemType: item.itemType,
        typeId: item.typeId,
        calcType: item.calcType,
        amount: item.amount,
        ratio: item.ratio,
      })),
    };
    dialog.visible = true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    ElMessage.error('获取当前薪资档案失败: ' + msg);
    console.error(error);
  }
};

const addItem = (itemType: number) => {
  if (!form.value.items) form.value.items = [];
  // 显式定义新增项的结构
  form.value.items.push({
    itemType: itemType,
    typeId: undefined,
    calcType: 1,
    amount: 0,
    ratio: 0,
  });
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const invalidItem = form.value.items.find((i) => !i.typeId);
      if (invalidItem) {
        ElMessage.warning('明细项目中存在未选择类型的记录，请检查');
        return;
      }

      try {
        await saveOrAdjustArchiveApi(form.value);
        ElMessage.success('操作成功，版本已生成（待审核）');
        dialog.visible = false;
        await getList();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

// ================== 列表操作 ==================
/**
 * 查看详情
 * 完美兼容：开启抽屉 -> 请求聚合接口 -> 渲染主表+明细 支持传入整行 row 对象，也支持单独传入 id 数字
 */
const handleDetail = async (data: SalaryArchiveVO | { id: number } | number) => {
  detailDrawer.visible = true;
  detailDrawer.loading = true;
  try {
    // 🌟 修正点：提取 ID 的逻辑
    const archiveId = typeof data === 'number' ? data : data.id;

    // 调用接口
    const res = await getArchiveDetailApi(archiveId);
    detailDrawer.data = res;
  } catch (error) {
    console.error('获取档案详情失败:', error);
    detailDrawer.visible = false;
  } finally {
    detailDrawer.loading = false;
  }
};

const handleRevoke = (row: SalaryArchiveVO) => {
  ElMessageBox.confirm(`由于此调薪记录尚未审核生效，是否确认将其撤销回滚至上一版本?`, '风险警告', {
    type: 'warning',
    confirmButtonText: '强制撤销',
    cancelButtonText: '取消',
  })
    .then(async () => {
      await revokeLatestVersionApi(row.employeeId);
      ElMessage.success('撤销成功，已回滚至上一版本');
      getList();
    })
    .catch(() => {});
};

onMounted(() => {
  getList();
  loadDicts();
});
</script>

<style scoped lang="scss">
/* 布局样式已由全局接管 */
:deep(.el-tag) {
  min-width: 65px;
  text-align: center;
}
/* ================= 页面专属业务样式 ================= */

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

.detail-container {
  padding: 10px;
  .salary-amount {
    font-weight: bold;
    color: #409eff;
  }
  .section-title {
    margin: 25px 0 15px 0;
    padding-left: 10px;
    border-left: 4px solid #409eff;
  }
  .footer-info {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 13px;
    line-height: 1.8;
  }
}
</style>

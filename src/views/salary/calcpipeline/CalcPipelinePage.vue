<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索管道名称或编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
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
        <el-button v-hasPerm="['salary:pipeline:add']" type="primary" icon="Plus" @click="handleAdd"
          >新建核算管道</el-button
        >
        <el-button
          v-hasPerm="['salary:pipeline:del']"
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
        <el-table-column label="流程编码" prop="pipelineCode" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.pipelineCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程名称" prop="pipelineName" min-width="180" />
        <el-table-column label="版本" align="center" width="90">
          <template #default="{ row }">
            <el-tag type="warning" effect="dark" class="amount-font">V{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="步骤总数" align="center" width="100">
          <template #default="{ row }">
            <el-badge :value="row.stepCount || 0" :type="row.stepCount > 0 ? 'primary' : 'info'" />
          </template>
        </el-table-column>
        <el-table-column label="默认" align="center" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.defaultFlag === 1" color="#67C23A" size="18"
              ><SuccessFilled
            /></el-icon>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" class="status-tag">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后更新" align="center" prop="updateTime" width="170" />

        <el-table-column label="操作" align="center" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Operation" @click="handleOpenDesigner(row)"
              >编排步骤</el-button
            >
            <el-button link type="success" icon="Upload" @click="handleUpgrade(row)"
              >升版本</el-button
            >
            <el-dropdown trigger="click" class="ml-2">
              <el-button link type="primary"
                >更多<el-icon class="el-icon--right"><ArrowDown /></el-icon
              ></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item icon="Star" @click="handleSetDefault(row)"
                    >设为默认</el-dropdown-item
                  >
                  <el-dropdown-item icon="Edit" @click="handleUpdate(row)"
                    >修改信息</el-dropdown-item
                  >
                  <el-dropdown-item
                    icon="Delete"
                    style="color: var(--el-color-danger)"
                    @click="handleDelete(row)"
                    >逻辑删除</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <div class="section-title">管道元数据配置</div>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="流程编码" prop="pipelineCode">
              <el-input
                v-model="form.pipelineCode"
                placeholder="如: DEFAULT_PIPELINE"
                :disabled="!!form.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="流程名称" prop="pipelineName">
              <el-input v-model="form.pipelineName" placeholder="请输入名称，如：正式员工核算流" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注说明" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                placeholder="填写该计算管道的适用范围等"
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

    <el-dialog
      v-model="designer.visible"
      fullscreen
      append-to-body
      :show-close="false"
      class="designer-dialog"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title"
            >正在编排：{{ designer.currentName }} [{{ designer.currentCode }} - V{{
              designer.currentVersion
            }}]</span
          >
          <div class="header-actions">
            <el-button type="success" icon="Plus" @click="handleAddStep">添加步骤</el-button>
            <el-button type="primary" icon="Check" :loading="saving" @click="handleSaveSteps"
              >发布配置</el-button
            >
            <el-button icon="Close" @click="designer.visible = false">退出</el-button>
          </div>
        </div>
      </template>

      <div v-loading="designer.loading" class="designer-body">
        <el-alert
          title="架构提示：拖拽左侧句柄调整执行顺序。系统按物理层级分阶段核算。"
          type="warning"
          show-icon
          class="mb-4"
        />

        <div class="drag-table-header">
          <div class="col-handle"></div>
          <div class="col-index">顺序</div>
          <div class="col-rule">关联规则(快照)</div>
          <div class="col-script">执行条件(选填)</div>
          <div class="col-config">执行控制</div>
          <div class="col-status">启用</div>
          <div class="col-action">操作</div>
        </div>

        <draggable
          v-model="pipelineSteps"
          item-key="_tempId"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost-row"
        >
          <template #item="{ element, index }">
            <div class="drag-row">
              <div class="col-handle">
                <el-icon class="drag-handle"><Rank /></el-icon>
              </div>
              <div class="col-index">
                <span class="index-badge">{{ index + 1 }}</span>
              </div>
              <div class="col-rule">
                <el-select
                  v-model="element.ruleCode"
                  filterable
                  placeholder="选择核算规则"
                  style="width: 100%"
                  @change="(val: string) => onRuleChange(val, element)"
                >
                  <el-option
                    v-for="r in allRules"
                    :key="r.ruleCode"
                    :label="`[${r.ruleCode}] ${r.ruleName}`"
                    :value="r.ruleCode"
                  />
                </el-select>
                <div v-if="element.ruleName" class="rule-snapshot-info">
                  <el-tag size="small" :type="getStageTagType(element.stage)">
                    {{ getStageLabel(element.stage) }}
                  </el-tag>
                </div>
              </div>
              <div class="col-script">
                <el-input
                  v-model="element.conditionScript"
                  placeholder="Aviator脚本，如: gender == 'M'"
                  clearable
                />
              </div>
              <div class="col-config">
                <el-checkbox v-model="element.blockFlag" :true-label="1" :false-label="0"
                  >异常阻断</el-checkbox
                >
                <el-checkbox v-model="element.skipIfNull" :true-label="1" :false-label="0"
                  >空值跳过</el-checkbox
                >
              </div>
              <div class="col-status">
                <el-switch v-model="element.status" :active-value="1" :inactive-value="0" />
              </div>
              <div class="col-action">
                <el-button
                  type="danger"
                  icon="Delete"
                  circle
                  plain
                  @click="pipelineSteps.splice(index, 1)"
                />
              </div>
            </div>
          </template>
        </draggable>
        <el-empty v-if="pipelineSteps.length === 0" description="暂无核算步骤，请添加" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资引擎-计算管道管理 (支持主子表架构与版本控制)
 * 依赖关联: 依赖 salary_calc_pipeline_info (主表) 与 salary_calc_pipeline_step (子表)，并引用薪资规则库。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted } from 'vue';

// [2] 第三方 UI 组件库与图标
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, Rank, SuccessFilled, ArrowDown } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';

// [3] 业务 API 请求接口
import { useDict } from '@/hooks/useDict';
import { getCalcRulePageApi } from '@/api/salary/calcrule/calcRule';

// [4] TS 强类型定义约束
import type {
  CalcPipelineInfoVO,
  CalcPipelineInfoQueryReqDTO,
} from '@/types/salary/calcpiplineinfo/calcpiplineinfo';
import {
  addPipelineInfoApi,
  deletePipelineInfoApi,
  deletePipelineInfoBatchApi,
  editPipelineInfoApi,
  getPipelineInfoPageApi,
  setDefaultPipelineApi,
  upgradePipelineVersionApi,
} from '@/api/salary/calcpiplineinfo/calcPiplineInfo.ts';
import {
  listPipelineStepsApi,
  savePipelineStepBatchApi,
} from '@/api/salary/calcpiplinestep/calcpiplinestep.ts';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */
// 声明字典
const dicts = useDict('salary_calc_stage');
// [UI 控制状态]
const loading = ref(false); // 表格加载遮罩层状态
const isFullscreen = ref(false); // 基础配置弹窗全屏状态切换标识
const saving = ref(false); // 设计器发布按钮 Loading

// [表格与分页状态]
const total = ref(0); // 数据总条数
const dataList = ref<CalcPipelineInfoVO[]>([]); // 表格主数据源
const multiple = ref(true); // 批量操作按钮禁用状态
const selectedIds = ref<number[]>([]); // 选中行 ID 集合

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<CalcPipelineInfoQueryReqDTO>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  status: undefined,
});

// [业务表单状态 (主表)]
const formRef = ref<FormInstance>();
const dialog = reactive({ visible: false, title: '' }); // 弹窗控制器
const form = ref<any>({}); // 承载新增/编辑的表单数据

// [表单前端合法性校验规则]
const rules = reactive<FormRules>({
  pipelineCode: [{ required: true, message: '流程编码不能为空', trigger: 'blur' }],
  pipelineName: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
});

// [业务表单状态 (设计器/子表)]
const designer = reactive({
  visible: false,
  loading: false,
  currentCode: '',
  currentName: '',
  currentVersion: 1,
});
const pipelineSteps = ref<any[]>([]); // 设计器内部拖拽的数据源
const allRules = ref<any[]>([]); // 规则库下拉字典缓存

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换基础配置弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: any[]) => {
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

/** 关闭并清理基础配置弹窗 */
const cancel = () => {
  dialog.visible = false;
  formRef.value?.resetFields();
};
// 保留颜色映射逻辑 (因为字典表通常不存颜色，我们在前端做美化映射)
const getStageTagType = (stageValue: number | string) => {
  const map: Record<string, string> = {
    '1': 'info',
    '2': 'success',
    '3': 'warning',
    '4': 'danger',
    '5': 'primary',
  };
  return map[String(stageValue)] || 'info';
};
/** 辅助方法：解析阶段枚举值中文 */
// 重构原来的 getStageLabel 方法，改为从字典读取
const getStageLabel = (val: number | string) => {
  const target = (dicts.salary_calc_stage ?? []).find((d) => d.dictItemValue === String(val));
  return target ? target.dictItemLabel : '未知阶段';
};

/** 设计器方法：根据下拉选择，同步规则快照属性 */
const onRuleChange = (ruleCode: string, row: any) => {
  const rule = allRules.value.find((r) => r.ruleCode === ruleCode);
  if (rule) {
    row.ruleName = rule.ruleName;
    row.ruleType = rule.ruleType;
    row.stage = rule.stage;
  }
};

/** 设计器方法：添加一行新步骤 */
const handleAddStep = () => {
  pipelineSteps.value.push({
    _tempId: Date.now(), // 临时主键供 vue-draggable 使用
    pipelineCode: designer.currentCode,
    pipelineVersion: designer.currentVersion,
    ruleCode: '',
    stage: 1,
    blockFlag: 1,
    skipIfNull: 0,
    status: 1,
  });
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务与 API 交互区 (Business & API Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：获取主表分页列表数据 */
const getList = async () => {
  loading.value = true;
  try {
    const res = await getPipelineInfoPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载管道数据失败', error);
  } finally {
    loading.value = false;
  }
};

/** * 发起：新增主表数据 */
const handleAdd = () => {
  form.value = { status: 1, version: 1, defaultFlag: 0 };
  dialog.title = '新增核算管道';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 发起：修改主表数据 */
const handleUpdate = (row: any) => {
  form.value = { ...row };
  dialog.title = '修改管道元数据';
  dialog.visible = true;
  isFullscreen.value = false;
};

/** * 核心：校验并提交主表表单 */
const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editPipelineInfoApi(form.value);
        ElMessage.success('信息修改成功');
      } else {
        await addPipelineInfoApi(form.value);
        ElMessage.success('新增管道成功');
      }
      dialog.visible = false;
      await getList();
    }
  });
};

/** * 执行：逻辑删除单条记录 */
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认执行该条管道记录的逻辑删除操作吗?`, '高危操作提示', { type: 'warning' })
    .then(async () => {
      await deletePipelineInfoApi(row.id);
      ElMessage.success('删除成功');
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量逻辑删除记录 */
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条管道数据?`, '批量删除提示', {
    type: 'warning',
  })
    .then(async () => {
      await deletePipelineInfoBatchApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      if (dataList.value.length === selectedIds.value.length && queryParams.pageNum > 1) {
        queryParams.pageNum--;
      }
      await getList();
    })
    .catch(() => {});
};

/** * 业务高级：设为系统默认管道 */
const handleSetDefault = async (row: any) => {
  await setDefaultPipelineApi(row.id);
  ElMessage.success('已设为全局默认核算管道');
  await getList();
};

/** * 业务高级：复制管道并升级新版本 */
const handleUpgrade = (row: any) => {
  ElMessageBox.confirm(
    `确定要将 [${row.pipelineName}] 升级到下一版本吗？系统将复制 V${row.version} 现有的所有编排步骤。`,
    '版本升级',
    { type: 'success' }
  )
    .then(async () => {
      await upgradePipelineVersionApi(row.id);
      ElMessage.success('版本升级成功，新版本已生成');
      await getList();
    })
    .catch(() => {});
};

/** * 设计器核心：打开设计器弹窗并加载全量快照步骤 */
const handleOpenDesigner = async (row: any) => {
  designer.currentCode = row.pipelineCode;
  designer.currentName = row.pipelineName;
  designer.currentVersion = row.version;
  designer.visible = true;
  designer.loading = true;

  try {
    // 聚合拉取：明细步骤 + 最新启用的规则库字典
    const [steps, ruleRes] = await Promise.all([
      listPipelineStepsApi(row.pipelineCode, row.version),
      getCalcRulePageApi({ pageNum: 1, pageSize: 1000, status: 1 }),
    ]);
    pipelineSteps.value = steps.map((s) => ({ ...s, _tempId: Math.random() }));
    allRules.value = ruleRes.records || [];
  } finally {
    designer.loading = false;
  }
};

/** * 设计器核心：全量发布编排步骤至后端 */
const handleSaveSteps = async () => {
  if (pipelineSteps.value.some((s) => !s.ruleCode))
    return ElMessage.error('存在未绑定规则的步骤，请检查配置');

  saving.value = true;
  try {
    // 按顺序赋予 sortOrder，丢弃无用的临时数据
    const payload = pipelineSteps.value.map((s, index) => ({
      ...s,
      sortOrder: index + 1,
    }));
    await savePipelineStepBatchApi(designer.currentCode, designer.currentVersion, payload);
    ElMessage.success('核算编排发布成功');
    designer.visible = false;
    await getList(); // 刷新主表步骤总数统计
  } finally {
    saving.value = false;
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
   ===================================================================== */
.section-title {
  font-size: 15px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 4px solid var(--el-color-primary);
}

/* --- 设计器专有样式 --- */
.designer-body {
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 20px;
  background: var(--el-fill-color-blank);
}
.drag-table-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-weight: bold;
  margin-bottom: 10px;
}
.drag-row {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.3s;
  &:hover {
    box-shadow: var(--el-box-shadow-light);
    border-color: var(--el-color-primary-light-5);
  }
}
.drag-handle {
  cursor: grab;
  font-size: 20px;
  color: #909399;
}
.index-badge {
  width: 24px;
  height: 24px;
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 栅格化列宽控制 */
.col-handle {
  width: 40px;
}
.col-index {
  width: 50px;
}
.col-rule {
  width: 300px;
  margin-right: 20px;
}
.col-script {
  flex: 1;
  margin-right: 20px;
}
.col-config {
  width: 180px;
}
.col-status {
  width: 80px;
}
.col-action {
  width: 50px;
}

.rule-snapshot-info {
  margin-top: 4px;
}
.ghost-row {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
}
</style>

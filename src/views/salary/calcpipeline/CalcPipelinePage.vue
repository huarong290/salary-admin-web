<!--src/views/salary/calcpipeline/CalcPipelinePage.vue-->
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
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <div class="toolbar">
        <el-button v-hasPerm="['salary:pipeline:add']" type="success" icon="Plus" @click="handleAdd"
          >新建计算管道</el-button
        >
      </div>

      <el-table v-loading="loading" :data="dataList" border height="100%">
        <el-table-column label="编号" align="center" width="80" prop="id" />
        <el-table-column label="流程编码" align="center" prop="pipelineCode">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.pipelineCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程名称" align="center" prop="pipelineName" />
        <el-table-column label="步骤总数" align="center" width="100">
          <template #default="{ row }">
            <el-badge :value="row.stepCount || 0" type="primary" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后更新" align="center" prop="updateTime" width="180" />

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Operation" @click="handleDesign(row)"
              >编排步骤</el-button
            >
            <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="流程编码" prop="pipelineCode">
          <el-input
            v-model="form.pipelineCode"
            placeholder="如: DEFAULT_PIPELINE"
            :disabled="!!form.id"
          />
        </el-form-item>
        <el-form-item label="流程名称" prop="pipelineName">
          <el-input v-model="form.pipelineName" placeholder="请输入管道名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="designer.visible"
      title="薪资核算瀑布流编排"
      fullscreen
      append-to-body
      :show-close="false"
      class="pipeline-designer-dialog"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title"
            >正在编排：{{ designer.currentPipelineName }} ({{ designer.currentPipelineCode }})</span
          >
          <div class="header-actions">
            <el-button type="success" icon="Plus" @click="handleAddStep">添加执行步骤</el-button>
            <el-button type="primary" icon="Check" :loading="saving" @click="handleSaveDesign"
              >发布管道配置</el-button
            >
            <el-button icon="Close" @click="designer.visible = false">退出设计器</el-button>
          </div>
        </div>
      </template>

      <div v-loading="designer.loading" class="designer-body">
        <el-alert
          title="架构提示：拖拽左侧句柄调整执行顺序。系统按阶段（基础->补贴->扣款->税->汇总）物理分层。"
          type="warning"
          show-icon
          class="mb-4"
        />

        <div class="drag-table-header">
          <div class="col-handle"></div>
          <div class="col-index">顺序</div>
          <div class="col-stage">核算阶段</div>
          <div class="col-rule">关联计算规则</div>
          <div class="col-status">启用</div>
          <div class="col-action">操作</div>
        </div>

        <draggable
          v-model="pipelineSteps"
          item-key="_tempId"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost-row"
          class="drag-list-wrapper"
        >
          <template #item="{ element, index }">
            <div class="drag-row">
              <div class="col-handle">
                <el-icon class="drag-handle"><Rank /></el-icon>
              </div>
              <div class="col-index">
                <span class="index-badge">{{ index + 1 }}</span>
              </div>
              <div class="col-stage">
                <el-select v-model="element.stage" size="default" disabled style="width: 100%">
                  <el-option
                    v-for="item in STAGE_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="col-rule">
                <el-select
                  v-model="element.ruleCode"
                  filterable
                  placeholder="选择核算规则"
                  style="width: 100%"
                  @change="handleRuleSelect(element)"
                >
                  <el-option
                    v-for="r in allActiveRules"
                    :key="r.ruleCode"
                    :label="`[${r.ruleCode}] ${r.ruleName}`"
                    :value="r.ruleCode"
                  />
                </el-select>
              </div>
              <div class="col-status">
                <el-switch v-model="element.status" :active-value="1" :inactive-value="0" />
              </div>
              <div class="col-action">
                <el-button type="danger" icon="Delete" circle plain @click="removeStep(index)" />
              </div>
            </div>
          </template>
        </draggable>
        <el-empty v-if="pipelineSteps.length === 0" description="暂无编排步骤" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资计算管道管理 (可视化编排算薪瀑布流)
 * 核心逻辑: 采用 vuedraggable 实现规则步骤的物理排序与批量保存
 * ====================================================================
 */

import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import draggable from 'vuedraggable';

// API 与 类型

import { getCalcRulePageApi } from '@/api/salary/calcrule/calcRule';
import type {
  CalcPipelineQueryReqDTO,
  CalcPipelineVO,
} from '@/types/salary/calcpipline/calcpipline.ts';
import {
  addPipelineApi,
  deletePipelineApi,
  editPipelineApi,
  getPipelinePageApi,
} from '@/api/salary/calcpipline/calcPipline.ts';
import { savePipelineBatchApi } from '@/api/engine/engine.ts';
import { type CalcRuleVO, STAGE_OPTIONS } from '@/types/salary/calcrule/calcrule.ts';

/**
 * --------------------------------------------------------------------
 * 📦 状态管理
 * --------------------------------------------------------------------
 */
const loading = ref(false);
const saving = ref(false);
const total = ref(0);
const dataList = ref<CalcPipelineVO[]>([]);

// 查询与表单
const queryParams = reactive<CalcPipelineQueryReqDTO>({ pageNum: 1, pageSize: 10, keyword: '' });
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<FormInstance>();
const form = ref<any>({});
const rules = reactive<FormRules>({
  pipelineCode: [{ required: true, message: '流程编码不能为空', trigger: 'blur' }],
  pipelineName: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
});

// 设计器状态
const designer = reactive({
  visible: false,
  loading: false,
  currentPipelineCode: '',
  currentPipelineName: '',
});
// 对于带 _tempId 的步骤，可以用交叉类型 (Intersection Types) 优雅解决
const pipelineSteps = ref<(CalcPipelineVO & { _tempId?: string })[]>([]);
const allActiveRules = ref<CalcRuleVO[]>([]);

/**
 * --------------------------------------------------------------------
 * 🧠 核心业务逻辑
 * --------------------------------------------------------------------
 */

const getList = async () => {
  loading.value = true;
  try {
    const res = await getPipelinePageApi(queryParams);
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
  queryParams.keyword = '';
  handleQuery();
};

/** --- 设计器逻辑 --- */
const handleDesign = async (row: any) => {
  designer.currentPipelineCode = row.pipelineCode;
  designer.currentPipelineName = row.pipelineName;
  designer.visible = true;
  designer.loading = true;

  try {
    // 拉取当前管道的所有步骤 (pageSize给大)
    const stepRes = await getPipelinePageApi({
      pageNum: 1,
      pageSize: 500,
      pipelineCode: row.pipelineCode,
    });
    pipelineSteps.value = stepRes.records.map((s) => ({
      ...s,
      _tempId: `id_${s.id}_${Math.random()}`,
    }));

    // 拉取规则库字典
    const ruleRes = await getCalcRulePageApi({ pageNum: 1, pageSize: 1000, status: 1 });
    allActiveRules.value = ruleRes.records || [];
  } finally {
    designer.loading = false;
  }
};

const handleAddStep = () => {
  pipelineSteps.value.push({
    id: undefined as unknown as number,
    _tempId: `new_${Date.now()}`,
    pipelineCode: designer.currentPipelineCode,
    pipelineName: designer.currentPipelineName,
    stage: 1,
    ruleCode: '',
    sortOrder: pipelineSteps.value.length + 1,
    status: 1,
  });
};
/** 处理规则选择联动，自动同步阶段状态 */
const handleRuleSelect = (row: any) => {
  // 这里的 row 就是传进来的 element
  const targetRule = allActiveRules.value.find((r) => r.ruleCode === row.ruleCode);
  if (targetRule) {
    row.stage = targetRule.stage;
  }
};

const removeStep = (index: number) => {
  pipelineSteps.value.splice(index, 1);
};

const handleSaveDesign = async () => {
  if (pipelineSteps.value.some((s) => !s.ruleCode)) return ElMessage.error('存在未绑定规则的步骤');

  saving.value = true;
  try {
    const payload = pipelineSteps.value.map((s, idx) => ({
      id: typeof s.id === 'number' ? s.id : null,
      ruleCode: s.ruleCode,
      stage: s.stage,
      sortOrder: idx + 1,
      status: s.status,
    }));
    await savePipelineBatchApi(designer.currentPipelineCode, payload);
    ElMessage.success('管道编排已发布');
    designer.visible = false;
    getList();
  } finally {
    saving.value = false;
  }
};

/** --- 基础 CRUD --- */
const handleAdd = () => {
  form.value = { status: 1 };
  dialog.title = '新建管道';
  dialog.visible = true;
};
const handleUpdate = (row: any) => {
  form.value = { ...row };
  dialog.title = '修改管道';
  dialog.visible = true;
};

const submitForm = async () => {
  if (!formRef.value) return;

  //
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.value.id) {
        await editPipelineApi(form.value);
      } else {
        await addPipelineApi(form.value);
      }
      ElMessage.success('操作成功');
      dialog.visible = false;
      getList();
    }
  });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该计算管道吗？').then(async () => {
    await deletePipelineApi(row.id);
    ElMessage.success('删除成功');
    getList();
  });
};

onMounted(() => getList());
</script>

<style scoped lang="scss">
/* 设计器特有布局 */
.designer-body {
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 20px;
}
.drag-table-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-weight: bold;
}
.drag-row {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: #fff;
  &:hover {
    background: var(--el-fill-color-extra-light);
  }
}
.drag-handle {
  cursor: grab;
  font-size: 18px;
  color: #909399;
}
.index-badge {
  width: 24px;
  height: 24px;
  background: #333;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 列宽分配 */
.col-handle {
  width: 40px;
}
.col-index {
  width: 60px;
}
.col-stage {
  width: 150px;
  margin-right: 15px;
}
.col-rule {
  flex: 1;
  margin-right: 15px;
}
.col-status {
  width: 80px;
}
.col-action {
  width: 60px;
}

.ghost-row {
  opacity: 0.5;
  background: var(--el-color-primary-light-9);
  border: 1px dashed var(--el-color-primary);
}
</style>

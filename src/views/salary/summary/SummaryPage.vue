<!--src/views/salary/summary/SummaryPage.vue-->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="search-card">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="关键字" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="员工姓名/工号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="核算年份" prop="settlementYear">
          <el-date-picker
            v-model="queryParams.settlementYear"
            type="year"
            placeholder="选择年份"
            value-format="YYYY"
            clearable
            style="width: 120px"
            @change="handleYearChange"
          />
        </el-form-item>
        <el-form-item label="结算月份" prop="settlementMonth">
          <el-date-picker
            v-model="queryParams.settlementMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYYMM"
            clearable
            style="width: 160px"
            @change="handleMonthChange"
          />
        </el-form-item>
        <el-form-item label="计算状态" prop="calcStatus">
          <el-select
            v-model="queryParams.calcStatus"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未计算" :value="0" />
            <el-option label="计算成功" :value="1" />
            <el-option label="计算失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发放状态" prop="paymentStatus">
          <el-select
            v-model="queryParams.paymentStatus"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="支付失败" :value="2" />
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
        <el-button
          v-hasPerm="['salary:summary:init']"
          type="primary"
          icon="MagicStick"
          @click="handleOpenInit"
        >
          初始化本月账套
        </el-button>
        <el-button
          v-hasPerm="['salary:summary:calc']"
          type="success"
          icon="DataBoard"
          @click="handleOpenCalc"
        >
          执行全员核算发薪
        </el-button>

        <el-divider direction="vertical" style="height: 2em; margin: 0 15px" />

        <el-button
          v-hasPerm="['salary:summary:lock']"
          type="warning"
          icon="Lock"
          :disabled="multiple"
          @click="handleBatchLock(1)"
        >
          批量锁定 (准备发薪)
        </el-button>
        <el-button
          v-hasPerm="['salary:summary:lock']"
          type="danger"
          plain
          icon="Unlock"
          :disabled="multiple"
          @click="handleBatchLock(0)"
        >
          批量解锁 (允许重算)
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="dataList"
        border
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column label="员工信息" min-width="140" show-overflow-tooltip fixed="left">
          <template #default="{ row }">
            <el-link
              type="primary"
              :underline="false"
              class="drill-link"
              @click="handleQuickFilter(row)"
            >
              <div style="font-weight: 600">
                {{ row.employeeName }}
              </div>
            </el-link>
            <div class="text-secondary amount-font" style="font-size: 12px">
              [{{ row.employeeCode }}]
            </div>
          </template>
        </el-table-column>

        <el-table-column label="结算月份" align="center" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" class="amount-font">{{
              row.settlementMonth
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="应发工资 (Gross)" align="right" min-width="130">
          <template #default="{ row }">
            <span class="amount-font text-success">{{ row.grossSalary?.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="扣除与税费" align="right" min-width="130">
          <template #default="{ row }">
            <span v-if="row.deductionTotal || row.taxTotal" class="amount-font text-danger">
              -{{ ((row.deductionTotal || 0) + (row.taxTotal || 0)).toFixed(2) }}
            </span>
            <span v-else class="text-secondary">0.00</span>
          </template>
        </el-table-column>

        <el-table-column label="实发工资 (Net)" align="right" min-width="130" fixed="right">
          <template #default="{ row }">
            <span v-if="row.calcStatus === 0" class="text-secondary" style="font-size: 12px">
              (待核算)
            </span>
            <span
              v-else
              class="amount-font text-primary"
              style="font-weight: bold; font-size: 15px"
            >
              {{ row.netSalary?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="手工调整" align="right" min-width="110" fixed="right">
          <template #default="{ row }">
            <span
              v-if="!row.manualPaymentAmount || row.manualPaymentAmount === 0"
              class="text-secondary"
            >
              0.00
            </span>
            <span
              v-else
              class="amount-font"
              :class="row.manualPaymentAmount > 0 ? 'text-success' : 'text-danger'"
            >
              {{ row.manualPaymentAmount > 0 ? '+' : '' }}{{ row.manualPaymentAmount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="计算状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.calcStatus === 1 ? 'success' : row.calcStatus === 2 ? 'danger' : 'info'"
              size="small"
            >
              {{ row.calcStatus === 1 ? '成功' : row.calcStatus === 2 ? '失败' : '未计算' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态控制" align="center" width="100">
          <template #default="{ row }">
            <el-tooltip
              :content="row.lockFlag === 1 ? '已锁定：禁止重算' : '未锁定：允许重算'"
              placement="top"
            >
              <el-tag
                :type="row.lockFlag === 1 ? 'danger' : 'success'"
                effect="dark"
                size="small"
                style="cursor: pointer"
                @click="handleToggleLock(row)"
              >
                <el-icon style="vertical-align: middle; margin-right: 2px">
                  <Lock v-if="row.lockFlag === 1" />
                  <Unlock v-else />
                </el-icon>
                {{ row.lockFlag === 1 ? '已锁定' : '未锁定' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" icon="Refresh" @click="handleSingleCalc(row)">
              重算
            </el-button>
            <el-button
              v-hasPerm="['salary:summary:adjust']"
              link
              type="warning"
              icon="EditPen"
              @click="handleOpenAdjust(row)"
            >
              手工账
            </el-button>
            <el-button
              v-hasPerm="['salary:summary:detail']"
              link
              type="info"
              icon="Document"
              @click="handleDetail(row)"
              >工资条</el-button
            >
            <el-button link type="primary" icon="Money" @click="handleGoToRecord(row)">
              流水
            </el-button>
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

    <el-dialog v-model="initDialog.visible" width="400px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">初始化月份账套</span>
        </div>
      </template>

      <el-form ref="initFormRef" :model="initForm" :rules="initRules" label-width="80px">
        <el-alert
          title="此操作将为所有【在职员工】创建该月的薪资周期及汇总单。已存在的记录将自动跳过。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form-item label="目标月份" prop="settlementMonth">
          <el-date-picker
            v-model="initForm.settlementMonth"
            type="month"
            value-format="YYYYMM"
            placeholder="选择月份"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="initDialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="initializing" @click="submitInit">
            立即生成账套
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="calcDialog.visible" width="480px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">系统核算控制台</span>
        </div>
      </template>

      <el-form ref="calcFormRef" :model="calcForm" :rules="calcRules" label-width="100px">
        <el-alert
          title="即将对所选单据执行引擎跑批！未锁定的单据数据将被重新覆盖。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 25px"
        />

        <el-form-item label="核算范围">
          <span
            >共选中
            <b>{{ selectedIds.length > 0 ? selectedIds.length : '当前列表未锁定' }}</b> 条单据</span
          >
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="calcDialog.visible = false">放弃操作</el-button>
          <el-button type="success" :loading="calculating" @click="submitCalculate">
            {{ calculating ? '引 擎 运 算 中...' : '确 认 并 执 行 核 算' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="previewDialog.visible" width="550px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">算薪引擎：单人核算预览</span>
        </div>
      </template>

      <div v-loading="previewDialog.loading">
        <div
          style="
            margin-bottom: 15px;
            padding: 12px;
            background-color: #f8f8f9;
            border-radius: 4px;
            border-left: 4px solid var(--el-color-primary);
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          <div>
            <span style="font-size: 14px; font-weight: bold; margin-right: 15px">
              <el-icon style="vertical-align: middle"><Clock /></el-icon> 算薪依据档案:
            </span>
            <el-select
              v-model="previewDialog.selectedArchiveId"
              placeholder="默认使用该员工最新生效档案"
              clearable
              style="width: 320px"
              @change="handleArchiveChange"
            >
              <el-option
                v-for="arch in previewDialog.archives"
                :key="arch.id"
                :label="`V${arch.version} - ${arch.effectiveDate}生效 (底薪: ${arch.baseSalary})`"
                :value="arch.id"
              />
            </el-select>
          </div>
          <el-button
            type="primary"
            plain
            icon="Refresh"
            :loading="previewDialog.loading"
            @click="handleArchiveChange"
            >刷新预览数据</el-button
          >
        </div>
        <el-descriptions :column="1" border size="small" class="preview-descriptions">
          <el-descriptions-item label="员工姓名">
            {{ previewDialog.data?.employeeName }}
          </el-descriptions-item>
          <el-descriptions-item label="核算月份">
            {{ previewDialog.data?.settlementMonth }}
          </el-descriptions-item>

          <el-descriptions-item label="核算依据档案">
            <div
              v-if="
                previewDialog.data?.usedArchives && previewDialog.data.usedArchives.length === 1
              "
            >
              <el-tag size="small" type="success" effect="plain">
                版本 V{{ previewDialog.data.usedArchives[0]?.version }}
              </el-tag>
              <span class="archive-date-hint">
                (生效区间: {{ previewDialog.data.usedArchives[0]?.effectiveDate }} ~
                {{ formatExpiry(previewDialog.data.usedArchives[0]?.expiryDate) }})
              </span>
            </div>
            <div
              v-else-if="
                previewDialog.data?.usedArchives && previewDialog.data.usedArchives.length > 1
              "
            >
              <el-tooltip placement="top" effect="light">
                <template #content>
                  <div class="tooltip-content">
                    <div style="margin-bottom: 5px; font-weight: bold; color: #e6a23c">
                      <el-icon><Warning /></el-icon> 检测到月中调薪，已开启分段计薪
                    </div>
                    <div
                      v-for="arch in previewDialog.data.usedArchives"
                      :key="arch.archiveId"
                      class="archive-slice"
                    >
                      • <b>版本 V{{ arch.version }}</b
                      >：适用 {{ arch.effectiveDate }} 至 {{ formatExpiry(arch.expiryDate) }}
                    </div>
                  </div>
                </template>
                <el-tag size="small" type="warning" effect="dark" style="cursor: help">
                  <el-icon><Warning /></el-icon> 跨版本分段计薪 (包含
                  {{ previewDialog.data.usedArchives.length }} 份档案)
                </el-tag>
              </el-tooltip>
            </div>
            <div v-else>
              <el-tag size="small" type="danger">未匹配到生效档案</el-tag>
            </div>
          </el-descriptions-item>

          <el-descriptions-item label="计薪基准 (Gross)">
            <span class="amount-font text-success"
              >+{{ previewDialog.data?.grossSalary?.toFixed(2) }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="应扣合计 (实扣)">
            <span class="amount-font text-danger">
              -{{
                (
                  (previewDialog.data?.deductionTotal || 0) + (previewDialog.data?.taxTotal || 0)
                ).toFixed(2)
              }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="手工调整 (线下)">
            <span
              v-if="
                !previewDialog.data?.manualPaymentAmount ||
                previewDialog.data.manualPaymentAmount === 0
              "
              class="text-secondary"
            >
              无
            </span>
            <span
              v-else
              class="amount-font"
              :class="previewDialog.data.manualPaymentAmount > 0 ? 'text-success' : 'text-danger'"
              style="font-weight: bold"
            >
              {{ previewDialog.data.manualPaymentAmount > 0 ? '+' : ''
              }}{{ previewDialog.data.manualPaymentAmount.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="预计实发净额">
            <b class="amount-font text-primary" style="font-size: 20px">
              {{ previewDialog.data?.netSalary?.toFixed(2) }}
            </b>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="previewDialog.data?.details" style="margin-top: 15px">
          <el-row :gutter="10">
            <el-col :span="12">
              <div style="font-size: 12px; margin-bottom: 5px; color: #67c23a; font-weight: bold">
                <el-icon><Plus /></el-icon> 应发项明细
              </div>
              <el-table :data="previewDialog.data.details.income" size="small" border stripe>
                <el-table-column label="项目" prop="itemName" show-overflow-tooltip />
                <el-table-column label="金额" align="right" width="90">
                  <template #default="{ row }">
                    <span class="amount-font text-success"
                      >+{{ row.settlementAmount?.toFixed(2) }}</span
                    >
                  </template>
                </el-table-column>
              </el-table>
            </el-col>

            <el-col :span="12">
              <div style="font-size: 12px; margin-bottom: 5px; color: #f56c6c; font-weight: bold">
                <el-icon><Minus /></el-icon> 扣除项明细
              </div>
              <el-table
                :data="[
                  ...(previewDialog.data.details.deduction || []),
                  ...(previewDialog.data.details.tax || []),
                ]"
                size="small"
                border
                stripe
              >
                <el-table-column label="项目" prop="itemName" show-overflow-tooltip />
                <el-table-column label="金额" align="right" width="90">
                  <template #default="{ row }">
                    <span v-if="row.settlementAmount > 0" class="amount-font text-danger">
                      -{{ row.settlementAmount?.toFixed(2) }}
                    </span>
                    <span v-else class="text-secondary">0.00</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
        </div>
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 15px; line-height: 1.5"
        >
          <template #title>
            预览数据基于当前周期的考勤快照与 <b>上述标明的生效档案</b> 实时试算。<br />
            点击“确认存盘”后，系统将固化当前核算上下文并覆写该员工结算单。
          </template>
        </el-alert>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialog.visible = false">取 消</el-button>
          <el-button type="success" :loading="previewDialog.submitting" @click="confirmSingleCalc">
            确认存盘并更新账单
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="detailDialog.visible"
      width="850px"
      append-to-body
      draggable
      :fullscreen="isFullscreen"
    >
      <template #header>
        <div class="dialog-custom-header">
          <span class="title"
            >薪资核算单明细 - {{ currentDetail?.employeeName }} ({{
              currentDetail?.settlementMonth
            }})</span
          >
          <el-button link class="fullscreen-btn" @click="toggleFullscreen">
            <el-icon><FullScreen v-if="!isFullscreen" /><Minus v-else /></el-icon>
          </el-button>
        </div>
      </template>

      <div
        v-if="currentDetail && currentDetail.details"
        v-loading="detailLoading"
        class="payslip-container"
      >
        <el-descriptions :column="4" border class="margin-bottom-20">
          <el-descriptions-item label="出勤天数">
            <span class="amount-font"
              >{{ currentDetail.details.attendanceDays }} /
              {{ currentDetail.details.monthDays }}</span
            >
          </el-descriptions-item>
          <el-descriptions-item label="计薪基准 (Gross)">
            <span class="amount-font text-success">{{
              currentDetail.grossSalary?.toFixed(2)
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实发净额 (Net)">
            <span class="amount-font text-primary" style="font-weight: bold">{{
              currentDetail.netSalary?.toFixed(2)
            }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="手工调整">
            <span
              v-if="!currentDetail.manualPaymentAmount || currentDetail.manualPaymentAmount === 0"
              class="text-secondary"
            >
              无
            </span>
            <span
              v-else
              class="amount-font"
              :class="currentDetail.manualPaymentAmount > 0 ? 'text-success' : 'text-danger'"
              style="font-weight: bold"
            >
              {{ currentDetail.manualPaymentAmount > 0 ? '+' : ''
              }}{{ currentDetail.manualPaymentAmount.toFixed(2) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <div class="section-title text-success">应发收入明细 (Earnings)</div>
            <el-table :data="allIncomeItems" size="small" border stripe>
              <el-table-column label="项目名称" min-width="120">
                <template #default="{ row }">
                  <span style="font-weight: 500">{{ row.itemName }}</span>
                  <div v-if="row.itemCode" class="text-secondary" style="font-size: 10px">
                    {{ row.itemCode }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="金额" align="right" width="110">
                <template #default="{ row }">
                  <span class="amount-font text-success"
                    >+{{ row.settlementAmount?.toFixed(2) }}</span
                  >
                </template>
              </el-table-column>
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="calc-debug-info">
                    <p>
                      <b>数据来源：</b><el-tag size="small">{{ row.source || '系统核算' }}</el-tag>
                    </p>
                    <p><b>计算公式/过程：</b></p>
                    <code class="code-block">{{ row.calcLog || '无计算过程 (固定值)' }}</code>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <div class="subtotal amount-font text-success">
              应发合计 (Gross): {{ currentDetail?.grossSalary?.toFixed(2) }}
            </div>
          </el-col>

          <el-col :span="12">
            <div class="section-title text-danger">应扣与税费明细 (Deductions)</div>
            <el-table :data="allDeductionItems" size="small" border stripe>
              <el-table-column label="项目名称" prop="itemName" />
              <el-table-column label="扣减金额" align="right" width="110">
                <template #default="{ row }">
                  <span class="amount-font text-danger"
                    >-{{ Math.abs(row.settlementAmount || 0).toFixed(2) }}</span
                  >
                </template>
              </el-table-column>
            </el-table>
            <div class="subtotal amount-font text-danger">
              扣/税合计: -{{
                ((currentDetail?.deductionTotal || 0) + (currentDetail?.taxTotal || 0)).toFixed(2)
              }}
            </div>
          </el-col>
        </el-row>
        <div class="final-net-box">
          本月实发 (Net Pay):
          <span class="amount-font final-amount">{{ currentDetail?.netSalary?.toFixed(2) }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无详细核算快照" />

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustDialog.visible" width="450px" append-to-body>
      <template #header>
        <div class="dialog-custom-header">
          <span class="title">录入线下手工账 - {{ adjustForm.employeeName }}</span>
        </div>
      </template>

      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="85px">
        <el-alert
          title="手工账独立于系统算薪引擎！输入正数代表额外补发，负数代表线下扣回。"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form-item label="调整金额" prop="manualPaymentAmount">
          <el-input-number
            v-model="adjustForm.manualPaymentAmount"
            :precision="2"
            :step="100"
            controls-position="right"
            style="width: 100%"
            placeholder="正数增加，负数扣除"
          />
        </el-form-item>
        <el-form-item label="调整备注" prop="remark">
          <el-input
            v-model="adjustForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请务必填写调整原因 (如: 报销合并发放 / 上月错扣补偿)"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="adjustDialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="adjusting" @click="submitAdjust"
            >确认并留痕</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 薪资汇总与发薪台 (展示计算引擎结果、工资单详情、发薪锁定控制)
 * 依赖关联: 数据由 Salary Rule Engine 生成，此处仅提供只读展示与状态流转。
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、 依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */
// [1] Vue 核心钩子与原生生态
import { ref, reactive, onMounted, computed } from 'vue';

// 引入 useRouter
import { useRouter } from 'vue-router';

// [2] 第三方 UI 组件库与图标 (🌟 增加 Warning 图标)
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { FullScreen, Minus, Lock, Unlock, Warning } from '@element-plus/icons-vue';

// [3] 业务 API 请求接口
import {
  getSummaryPageApi,
  getSummaryDetailApi,
  updateSummaryLockStatusApi,
  adjustSummaryAmountApi,
} from '@/api/salary/summary/summary.ts';

import {
  initSummaryAccountApi,
  calculateBatchSalaryApi,
  calculateSingleSalaryApi,
  previewSingleSalaryApi,
} from '@/api/salary/engine/engine.ts';

// [4] TS 强类型定义约束
import type {
  SummaryQueryReqDTO,
  SalarySummaryVO,
  SummaryAdjustReqDTO,
} from '@/types/salary/summary/summary.ts';
import type {
  SalaryCalcSingleReqDTO,
  SalaryCalcBatchReqDTO,
} from '@/types/salary/engine/engine.ts';
import { listArchiveHistoryApi } from '@/api/salary/archive/archive.ts';

const router = useRouter();

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [UI 控制状态]
const loading = ref(false);
const detailLoading = ref(false);
const isFullscreen = ref(false);

// [表格与分页状态]
const total = ref(0);
const dataList = ref<SalarySummaryVO[]>([]);
const multiple = ref(true);
const selectedIds = ref<number[]>([]);

// [查询条件状态]
const queryFormRef = ref<FormInstance>();
const queryParams = reactive<SummaryQueryReqDTO & { employeeId?: any }>({
  pageNum: 1,
  pageSize: 10,
  keyword: undefined,
  settlementYear: undefined,
  settlementMonth: undefined,
  calcStatus: undefined,
  paymentStatus: undefined,
  employeeId: undefined,
});

// [详情弹窗状态]
const detailDialog = reactive({ visible: false });
const currentDetail = ref<SalarySummaryVO>();

// [初始化账套控制台状态]
const initDialog = reactive({ visible: false });
const initFormRef = ref<FormInstance>();
const initForm = ref({ settlementMonth: '' });
const initializing = ref(false);
const initRules = reactive<FormRules>({
  settlementMonth: [{ required: true, message: '请选择要初始化的月份', trigger: 'change' }],
});

// [核心核算控制台表单状态]
const calcDialog = reactive({ visible: false });
const calcFormRef = ref<FormInstance>();
const calcForm = ref<any>({ settlementMonth: '', remark: '' });
const calculating = ref(false);
const calcRules = reactive<FormRules>({});

// [单人核算预览对话框状态]
const previewDialog = reactive({
  visible: false,
  loading: false,
  submitting: false,
  data: {} as any,
  // 🌟 新增：用于时间旅行的字段
  summaryId: 0,
  archives: [] as any[], // 存放下拉框的档案历史列表
  selectedArchiveId: undefined as number | undefined, // 选中的历史档案ID
});
// [手工调整弹窗状态]
const adjustDialog = reactive({ visible: false });
const adjustFormRef = ref<FormInstance>();
const adjusting = ref(false);
// 扩展一下表单，带上姓名方便展示
const adjustForm = ref<SummaryAdjustReqDTO & { employeeName?: string }>({
  id: 0,
  manualPaymentAmount: 0,
  remark: '手工账',
});
const adjustRules = reactive<FormRules>({
  manualPaymentAmount: [
    { required: true, message: '必须填写调整金额，若清空请填 0', trigger: 'blur' },
  ],
  remark: [{ required: true, message: '请务必填写备注，用于财务审计留痕', trigger: 'blur' }],
});
/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */
/** 🌟 监听年份变化：选年则清空月 */
const handleYearChange = (val: string) => {
  if (val) {
    queryParams.settlementMonth = undefined;
  }
  handleQuery();
};

/** 🌟 监听月份变化：选月则清空年 */
const handleMonthChange = (val: string) => {
  if (val) {
    queryParams.settlementYear = undefined;
  }
  handleQuery();
};
/** 🌟 新增：格式化无限远的失效日期 */
const formatExpiry = (dateStr?: string) => {
  if (!dateStr) return '至今';
  return dateStr === '9999-12-31' ? '至今' : dateStr;
};

/** 切换弹窗全屏模式 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/** 表格复选框状态改变时触发 */
const handleSelectionChange = (selection: SalarySummaryVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
};

/** 触发带条件搜索 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置搜索栏 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.employeeId = undefined; // 🌟 重置时清空钻取条件
  handleQuery();
};

/** 快捷过滤钻取 */
const handleQuickFilter = (row: SalarySummaryVO) => {
  queryParams.employeeId = row.employeeId;
  queryParams.keyword = row.employeeName; // 顺便回填搜索框直观展示
  handleQuery();
};

/** ：跳转打款记录 */
const handleGoToRecord = (row: SalarySummaryVO) => {
  router.push({
    path: '/salary/paymentrecord',
    query: { summaryId: row.id },
  });
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
    const res = await getSummaryPageApi(queryParams);
    dataList.value = res.records || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error('加载汇总数据失败', error);
  } finally {
    loading.value = false;
  }
};

/** 1：初始化账套 */
const handleOpenInit = () => {
  initForm.value = { settlementMonth: '' };
  initDialog.visible = true;
};

/** 执行账套初始化 (绑定到 initDialog 的确定按钮) */
const submitInit = async () => {
  if (!initFormRef.value) return;
  await initFormRef.value.validate(async (valid) => {
    if (valid) {
      initializing.value = true;
      try {
        const targetMonth = initForm.value.settlementMonth;
        await initSummaryAccountApi({ settlementMonth: targetMonth });

        ElMessage.success(`成功初始化 ${targetMonth} 月份账套！`);
        initDialog.visible = false;
        queryParams.settlementMonth = targetMonth;
        getList();
      } catch (error) {
        console.error('初始化账套失败:', error);
      } finally {
        initializing.value = false;
      }
    }
  });
};

/** 2：全员/批量跑批 */
const handleOpenCalc = () => {
  const targetIds =
    selectedIds.value.length > 0
      ? selectedIds.value
      : dataList.value
          .filter((item) => item.calcStatus === 0 || item.calcStatus === 2)
          .map((item) => item.id);

  if (targetIds.length === 0) {
    ElMessage.warning('当前列表无待核算数据，请先【初始化账套】或确认是否已全部锁定！');
    return;
  }

  calcForm.value = { settlementMonth: queryParams.settlementMonth || '', remark: '' };
  calcDialog.visible = true;
};

/** 引擎驱动：批量核算指令 (绑定到 calcDialog 的确定按钮) */
const submitCalculate = async () => {
  if (!calcFormRef.value) return;
  await calcFormRef.value.validate(async (valid) => {
    if (valid) {
      calculating.value = true;
      try {
        const targetIds =
          selectedIds.value.length > 0
            ? selectedIds.value
            : dataList.value
                .filter((item) => item.calcStatus === 0 || item.calcStatus === 2)
                .map((item) => item.id);

        const params: SalaryCalcBatchReqDTO = {
          summaryIds: targetIds,
          pipelineCode: 'OFFICIAL_STAFF_2026', // 默认管道
          pipelineVersion: 1,
        };
        await calculateBatchSalaryApi(params);

        ElMessage.success('核算引擎执行完毕！账单已生成。');
        calcDialog.visible = false;
        handleQuery();
      } catch (error) {
        console.error('薪资引擎运算触发失败:', error);
      } finally {
        calculating.value = false;
      }
    }
  });
};

/** 3：单人引擎预览 */
const handleSingleCalc = async (row: SalarySummaryVO) => {
  if (row.lockFlag === 1) {
    ElMessage.warning('该单据已被锁定，禁止重算！');
    return;
  }
  // 初始化弹窗状态
  previewDialog.summaryId = row.id;
  previewDialog.selectedArchiveId = undefined; // 每次打开默认置空(取最新)
  previewDialog.visible = true;
  previewDialog.loading = true;
  previewDialog.data = { ...row };

  try {
    // 异步 1: 获取下拉框的档案历史列表
    // 注意：请确保你的 API 返回的是个数组，且包含 version, effectiveDate, baseSalary 等字段
    const archRes = await listArchiveHistoryApi(row.employeeId);
    previewDialog.archives = archRes || [];

    // 异步 2: 加载默认的预览数据
    await loadPreviewData();
  } catch (error) {
    ElMessage.error('引擎预览失败，请检查员工档案与公式配置');
    previewDialog.visible = false;
  } finally {
    previewDialog.loading = false;
  }
};
/** 🌟 新增：切换档案后重新拉取预览数据 */
const handleArchiveChange = async () => {
  previewDialog.loading = true;
  try {
    await loadPreviewData();
    ElMessage.success('时间旅行成功，预览数据已更新为所选档案版本！');
  } catch (error) {
    console.error('刷新预览失败', error);
  } finally {
    previewDialog.loading = false;
  }
};
/** ：提取公共的向引擎请求预览的方法 */
const loadPreviewData = async () => {
  const payload: SalaryCalcSingleReqDTO = {
    summaryId: previewDialog.summaryId,
    archiveId: previewDialog.selectedArchiveId, // 透传用户选中的版本
  };
  const res = await previewSingleSalaryApi(payload);
  previewDialog.data = { ...previewDialog.data, ...res };
};
/** 4：确认单人预览落盘 */
const confirmSingleCalc = async () => {
  previewDialog.submitting = true;
  try {
    const payload: SalaryCalcSingleReqDTO = {
      summaryId: previewDialog.summaryId,
      archiveId: previewDialog.selectedArchiveId, // 落盘时告诉引擎用这个版本
    };
    await calculateSingleSalaryApi(payload);
    ElMessage.success(`${previewDialog.data.employeeName} 的薪资记录已成功更新`);
    previewDialog.visible = false;
    handleQuery();
  } catch (error) {
    console.error('单人核算存盘失败:', error);
  } finally {
    previewDialog.submitting = false;
  }
};

// =========================================================================

/** * 核心：查看工资条详情快照 */
const handleDetail = async (row: SalarySummaryVO) => {
  detailLoading.value = true;
  detailDialog.visible = true;
  isFullscreen.value = false;

  try {
    // 重新请求详情接口，获取完整的 details 快照数据
    const res = await getSummaryDetailApi(row.id);
    currentDetail.value = res;
  } catch (error) {
    console.error('加载工资条快照失败', error);
    detailDialog.visible = false;
  } finally {
    detailLoading.value = false;
  }
};

/** * 执行：单条快速锁定/解锁 */
const handleToggleLock = (row: SalarySummaryVO) => {
  if (row.paymentStatus === 1) {
    ElMessage.warning('已支付的工资单禁止变更锁定状态！');
    return;
  }

  const targetStatus = row.lockFlag === 1 ? 0 : 1;
  const actionText = targetStatus === 1 ? '锁定' : '解锁';

  ElMessageBox.confirm(
    `确认要【${actionText}】员工 ${row.employeeName} 的本月工资单吗?`,
    '状态流转提示',
    {
      type: targetStatus === 1 ? 'warning' : 'info',
    }
  )
    .then(async () => {
      await updateSummaryLockStatusApi({ ids: [row.id], lockFlag: targetStatus });
      ElMessage.success(`已${actionText}`);
      await getList();
    })
    .catch(() => {});
};

/** * 执行：批量锁定/解锁记录 */
const handleBatchLock = (lockFlag: number) => {
  const actionText = lockFlag === 1 ? '锁定并准备发薪' : '解锁并允许重算';

  ElMessageBox.confirm(
    `确认要对选中的 ${selectedIds.value.length} 条数据执行【${actionText}】操作吗?`,
    '批量操作提示',
    {
      type: lockFlag === 1 ? 'warning' : 'error',
    }
  )
    .then(async () => {
      await updateSummaryLockStatusApi({ ids: selectedIds.value, lockFlag });
      ElMessage.success('批量流转处理成功');
      await getList();
    })
    .catch(() => {});
};
// 🌟 万能收入项提取：汇总所有属于“收入”性质的明细
const allIncomeItems = computed(() => {
  const d = currentDetail.value?.details;
  if (!d) return [];

  // 1. 聚合所有可能的收入来源桶
  // 注意：这里包含了你定义的 income，以及可能存在的遗留/扩展字段
  const rawItems = [
    ...(d.income || []),
    // 如果后端把全勤奖放错了地方，或者放在了某些自定义扩展字段里，可以在此追加
  ];

  // 2. 这里的“万能”体现在：如果后端没有按分类放，我们根据业务逻辑过滤
  // 只要金额 > 0，且不属于税费和已知扣款的，都视为收入
  return rawItems.filter((item) => item.settlementAmount > 0);
});

// 🌟 万能扣项提取：汇总所有扣款与税费
const allDeductionItems = computed(() => {
  const d = currentDetail.value?.details;
  if (!d) return [];

  const rawItems = [...(d.deduction || []), ...(d.tax || [])];

  // 过滤出所有金额 > 0 的扣项（前端展示取反即可）
  return rawItems.filter((item) => item.settlementAmount !== 0);
});

/** 打开手工调整弹窗 */
const handleOpenAdjust = (row: SalarySummaryVO) => {
  // 被锁定的账单绝对不允许改钱
  if (row.lockFlag === 1) {
    ElMessage.warning('该员工账单已被财务锁定准备发薪，请先解除锁定！');
    return;
  }
  if (row.paymentStatus === 1) {
    ElMessage.error('该账单已支付完毕，严禁篡改金额！');
    return;
  }
  // 动态生成备注 解析 settlementMonth (例如 "202503")
  let dynamicRemark = '手工账';
  if (row.settlementMonth && row.settlementMonth.length === 6) {
    const year = row.settlementMonth.substring(0, 4);
    const month = parseInt(row.settlementMonth.substring(4, 6), 10); // 去掉前导0
    dynamicRemark = `${year}年${month}月手工账`;
  }
  // 抹平数据并回显
  adjustForm.value = {
    id: row.id,
    employeeName: row.employeeName,
    manualPaymentAmount: row.manualPaymentAmount || 0,
    remark: row.remark || dynamicRemark,
  };

  if (adjustFormRef.value) {
    adjustFormRef.value.clearValidate();
  }
  adjustDialog.visible = true;
};

/** 提交手工调整请求 */
const submitAdjust = async () => {
  if (!adjustFormRef.value) return;
  await adjustFormRef.value.validate(async (valid) => {
    if (valid) {
      adjusting.value = true;
      try {
        const payload: SummaryAdjustReqDTO = {
          id: adjustForm.value.id,
          manualPaymentAmount: adjustForm.value.manualPaymentAmount,
          remark: adjustForm.value.remark,
        };
        await adjustSummaryAmountApi(payload);
        ElMessage.success('手工账调整成功，已计入总额！');
        adjustDialog.visible = false;
        // 刷新列表，你能立刻看到列表上的数字和黄色 [手] 标签的变化
        getList();
      } catch (error) {
        console.error('手工调账失败:', error);
      } finally {
        adjusting.value = false;
      }
    }
  });
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
   ===================================================================== */

.calc-debug-info {
  padding: 15px;
  background-color: #fcfcfc;
  font-size: 12px;
  line-height: 1.6;

  .code-block {
    display: block;
    padding: 8px;
    background: #f4f4f5;
    border-radius: 4px;
    color: #409eff;
    margin-top: 5px;
    word-break: break-all;
  }
}
.text-secondary {
  color: #909399;
}
.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid currentColor;
}

/* 让总计行更醒目 */
.subtotal {
  margin-top: 10px;
  padding: 8px;
  background: #fdfdfd;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.final-net-box {
  margin-top: 20px;
  padding: 15px 20px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);

  .final-amount {
    color: var(--el-color-primary);
    font-size: 24px;
    margin-left: 10px;
  }
}

.text-success {
  color: var(--el-color-success);
}
.text-danger {
  color: var(--el-color-danger);
}
.real-pay-amount {
  color: var(--el-color-primary);
}
.drill-link {
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}

/* 溯源档案相关样式 */
.preview-descriptions {
  margin-top: 10px;
}
.archive-date-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
.tooltip-content {
  font-size: 13px;
  line-height: 1.6;
}
.archive-slice {
  margin-top: 4px;
  padding-left: 5px;
}
</style>

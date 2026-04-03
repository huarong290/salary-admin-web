// src/types/salary/engine/engine.ts

/**
 * ====================================================================
 * 📌 模块说明
 * 功能描述: 薪资核心计算引擎 (Salary Rule Engine) 相关的数据类型定义
 * 接口映射: 对应后端 com.salary.admin.model.dto.engine 包下的请求实体
 * ====================================================================
 */

/** * 引擎-单人薪资核算指令参数
 * 用于触发单个员工某个月份的薪资流水线计算（如：发薪台单人重新核算、核算预览）
 */
export interface SalaryCalcSingleReqDTO {
  /** * 待核算的薪资汇总单ID (对应 salary_summary.id)
   * @required 必填项
   */
  summaryId: number | string;

  /** 薪资周期ID */
  periodId?: number | string;

  /** 员工ID */
  employeeId?: number | string;

  /** * 核算管道编码
   * @note 后端已改为非必填，若前端不传，后端可走默认路由逻辑
   */
  pipelineCode?: string;

  /** * 管道版本号
   * @note 后端已改为非必填
   */
  pipelineVersion?: number;

  /** * 💡 架构师预留字段：是否强制重算
   * 用于无视数据当前的锁定状态 (lock_flag) 强行跑批，仅限拥有特权的角色使用
   */
  isForceRetry?: boolean;
}

/** * 引擎-批量薪资核算指令参数
 * 用于发薪台全员/批量选中人员的高并发核算跑批
 */
export interface SalaryCalcBatchReqDTO {
  /** * 待核算的薪资汇总单ID集合 (对应 salary_summary.id)
   * @required 必填项，至少包含一条单据
   */
  summaryIds: (number | string)[];

  /** * 核算管道编码 (如：OFFICIAL_STAFF_2026)
   * @required 必填项
   */
  pipelineCode: string;

  /** * 管道版本号
   * @required 必填项
   */
  pipelineVersion: number;
}

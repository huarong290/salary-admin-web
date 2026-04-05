// src/types/salary/adjustment/adjustment.ts

import type { PageQuery } from '@/types/common';

/**
 * 薪资专项调整 - 分页查询请求参数 (DTO)
 */
export interface AdjustmentQueryReqDTO extends PageQuery {
  /** 关联核算周期ID (精确查询) */
  periodId?: number;
  /** 员工ID (精确查询) */
  employeeId?: number;
  /** 薪资项编码 (模糊或精确查询) */
  itemCode?: string;
  /** 数据状态: 0-草稿, 1-已生效 */
  status?: number;
}

/**
 * 薪资专项调整 - 新增请求参数 (DTO)
 */
export interface AdjustmentAddReqDTO {
  /** 关联核算周期ID */
  periodId: number;
  /** 员工ID */
  employeeId: number;
  /** 薪资项编码 (如：LATE_DEDUCTION) */
  itemCode: string;
  /** 薪资项名称 (如：迟到扣款) */
  itemName: string;
  /** 调账类型: 1-增加(补发收入), 2-扣减(扣款项) */
  adjustType: number;
  /** 原币种代码 (ISO 4217, 如 CNY, USD) */
  currency: string;
  /** 原币发生金额 */
  originalAmount: number;
  /** 当期核算汇率 (原币兑换发薪本币的汇率) */
  exchangeRate: number;
  /** 调账原因及备注 (审计用) */
  remark?: string;
}

/**
 * 薪资专项调整 - 修改请求参数 (DTO)
 * 结构与新增高度相似，但必须携带主键ID
 */
export interface AdjustmentEditReqDTO extends AdjustmentAddReqDTO {
  /** 调整记录的主键ID */
  id: number;
}

/**
 * 薪资专项调整 - 详情视图对象 (VO / 实体)
 * 用于表格展示和回显
 */
export interface SalaryAdjustmentVO {
  /** 主键ID */
  id: number;
  /** 员工ID */
  employeeId: number;
  /** 关联核算周期ID */
  periodId: number;
  /** 薪资项编码 */
  itemCode: string;
  /** 薪资项名称 */
  itemName: string;
  /** 原币种代码 */
  currency: string;
  /** 原币发生金额 */
  originalAmount: number;
  /** 当期核算汇率 */
  exchangeRate: number;
  /**
   *  折算本币金额
   * 实际参与引擎运算的金额 (originalAmount * exchangeRate)
   * 后端计算并返回，前端仅作展示
   */
  settlementAmount: number;
  /** 调账类型: 1-增加, 2-扣减 */
  adjustType: number;
  /** 数据来源: 1-手工录入, 2-系统生成, 3-API对接 */
  sourceType: number;
  /** 状态: 0-草稿, 1-已生效(参与算薪) */
  status: number;
  /** 调账原因及备注 */
  remark: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

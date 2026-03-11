// src/types/salary/deductiondetail/deductionDetail.ts

import type { PageQuery } from '@/types/common.ts';

/** 扣款明细流水返回对象 VO (展示员工在特定周期内的各项扣除) */
export interface DeductionDetailVO {
  /** 明细ID */
  id: number;
  /** 周期ID (关联 salary_period) */
  periodId: number;
  /** 扣款类型ID (关联 salary_deduction_type) */
  deductionTypeId: number;
  /** 🌟 扣款项目名称 (动态关联填充，如: 缺勤扣款) */
  deductionTypeName?: string;
  /** 🌟 员工姓名 (动态通过 periodId 关联填充) */
  employeeName?: string;
  /** 💰 金额 (使用 number | string 兼容后端 BigDecimal) */
  amount: number | string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 创建者 */
  createBy?: string;
}

/** 分页查询扣款明细请求参数 */
export interface DeductionDetailQueryReqDTO extends PageQuery {
  /** 指定查询的薪资周期ID */
  periodId?: number | string;
  /** 指定员工ID (用于查某员工的所有历史扣款流水) */
  employeeId?: number | string;
}

/** 新增扣款明细请求参数 */
export interface DeductionDetailAddReqDTO {
  /** 薪资周期ID - 必填项 */
  periodId: number | string;
  /** 扣款类型ID - 必填项 */
  deductionTypeId: number | string;
  /** 金额 (不能为负数) - 必填项 */
  amount: number | string;
  /** 备注 */
  remark?: string;
}

// src/types/salary/calcpiplineinfo/calcpiplineinfo.ts
import type { PageQuery } from '@/types/common';

/**
 * 薪资计算管道步骤返回对象 VO
 * 对应后端: com.salary.admin.model.vo.pipeline.CalcPipelineStepVO
 */
export interface CalcPipelineStepVO {
  /** 步骤主键 ID */
  id: number;
  /** 所属管道编码 */
  pipelineCode: string;
  /** 管道版本 */
  pipelineVersion: number;
  /** 规则编码 */
  ruleCode: string;
  /** 规则名称快照 */
  ruleName: string;
  /** 规则类型快照 (1:公式, 2:函数) */
  ruleType: number;
  /** 执行条件表达式 */
  conditionScript?: string;
  /** 阶段 (1:基础, 2:补贴, 3:扣款, 4:税, 5:汇总) */
  stage: number;
  /** 执行顺序 */
  sortOrder: number;
  /** 失败是否阻断 (1:阻断, 0:不中断) */
  blockFlag: number;
  /** 结果为空是否跳过 (1:跳过, 0:不跳过) */
  skipIfNull: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 创建时间 (ISO 时间字符串) */
  createTime?: string;
  /** 更新时间 (ISO 时间字符串) */
  updateTime?: string;
}

/**
 * 薪资计算管道步骤查询请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineStepQueryReqDTO
 */
export interface CalcPipelineStepQueryReqDTO extends PageQuery {
  /** 所属管道编码 */
  pipelineCode?: string;
  /** 管道版本 */
  pipelineVersion?: number;
  /** 阶段筛选 */
  stage?: number;
  /** 状态筛选 (1:启用, 0:停用) */
  status?: number;
}

/**
 * 薪资计算管道步骤新增请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineStepAddReqDTO
 */
export interface CalcPipelineStepAddReqDTO {
  /** 所属管道编码 */
  pipelineCode: string;
  /** 管道版本 */
  pipelineVersion: number;
  /** 规则编码 */
  ruleCode: string;
  /** 规则名称快照 */
  ruleName: string;
  /** 规则类型快照 (1:公式, 2:函数) */
  ruleType: number;
  /** 执行条件表达式 */
  conditionScript?: string;
  /** 阶段 (1:基础, 2:补贴, 3:扣款, 4:税, 5:汇总) */
  stage: number;
  /** 执行顺序 */
  sortOrder: number;
  /** 失败是否阻断 (1:阻断, 0:不中断) */
  blockFlag: number;
  /** 结果为空是否跳过 (1:跳过, 0:不跳过) */
  skipIfNull: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
}

/**
 * 薪资计算管道步骤修改请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineStepEditReqDTO
 */
export interface CalcPipelineStepEditReqDTO extends Partial<CalcPipelineStepAddReqDTO> {
  /** 步骤主键 ID (修改时必填) */
  id: number;
}

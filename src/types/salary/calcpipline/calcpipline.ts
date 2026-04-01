// src/types/salary/calcpipline/calcpipline.ts
import type { PageQuery } from '@/types/common';

/**
 * 薪资计算流程管道返回对象 VO
 * 对应后端: com.salary.admin.model.vo.calcpipeline.CalcPipelineVO
 */
export interface CalcPipelineVO {
  /** 管道主键 ID */
  id: number;
  /** 流程编码 (如: DEFAULT_PIPELINE) */
  pipelineCode: string;
  /** 流程名称 */
  pipelineName: string;
  /** 阶段 (1:基础, 2:补贴, 3:扣款, 4:税, 5:汇总) */
  stage: number;
  /** 关联的规则编码 (对应 salary_calc_rule) */
  ruleCode: string;
  /** 执行顺序 (阶段内排序) */
  sortOrder: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 创建时间 (ISO 时间字符串) */
  createTime?: string;
  /** 更新时间 (ISO 时间字符串) */
  updateTime?: string;
}

/**
 * 薪资计算流程管道查询请求参数
 * 对应后端: com.salary.admin.model.dto.calcpipeline.CalcPipelineQueryReqDTO
 */
export interface CalcPipelineQueryReqDTO extends PageQuery {
  /** 流程编码/名称关键字搜索 */
  keyword?: string;
  /** 流程编码精确筛选 */
  pipelineCode?: string;
  /** 阶段筛选 */
  stage?: number;
  /** 状态筛选 */
  status?: number;
}

/**
 * 薪资计算流程管道新增请求参数
 * 对应后端: com.salary.admin.model.dto.calcpipeline.CalcPipelineAddReqDTO
 */
export interface CalcPipelineAddReqDTO {
  /** 流程编码 */
  pipelineCode: string;
  /** 流程名称 */
  pipelineName: string;
  /** 阶段 (1基础 2补贴 3扣款 4税 5汇总) */
  stage: number;
  /** 规则编码 (关联 salary_calc_rule) */
  ruleCode: string;
  /** 执行顺序 */
  sortOrder: number;
  /** 状态 (1启用, 0停用) */
  status: number;
}

/**
 * 薪资计算流程管道修改请求参数
 * 对应后端: com.salary.admin.model.dto.calcpipeline.CalcPipelineEditReqDTO
 */
export interface CalcPipelineEditReqDTO extends Partial<CalcPipelineAddReqDTO> {
  /** 管道主键 ID (修改时必填) */
  id: number;
}

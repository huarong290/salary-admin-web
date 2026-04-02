import type { PageQuery } from '@/types/common';

/**
 * 薪资计算管道主表返回对象 VO
 * 对应后端: com.salary.admin.model.vo.pipeline.CalcPipelineInfoVO
 */
export interface CalcPipelineInfoVO {
  /** 管道主键 ID */
  id: number;
  /** 管道唯一编码 */
  pipelineCode: string;
  /** 管道名称 */
  pipelineName: string;
  /** 版本号 */
  version: number;
  /** 是否默认流程 (1:默认, 0:否) */
  defaultFlag: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 备注 */
  remark?: string;
  /** 创建时间 (ISO 时间字符串) */
  createTime?: string;
  /** 更新时间 (ISO 时间字符串) */
  updateTime?: string;
}

/**
 * 薪资计算管道主表查询请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineInfoQueryReqDTO
 */
export interface CalcPipelineInfoQueryReqDTO extends PageQuery {
  /** 管道编码/名称关键字搜索 */
  keyword?: string;
  /** 状态筛选 (1:启用, 0:停用) */
  status?: number;
}

/**
 * 薪资计算管道主表新增请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineInfoAddReqDTO
 */
export interface CalcPipelineInfoAddReqDTO {
  /** 管道唯一编码 */
  pipelineCode: string;
  /** 管道名称 */
  pipelineName: string;
  /** 版本号 */
  version: number;
  /** 是否默认流程 (1:默认, 0:否) */
  defaultFlag: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 备注 */
  remark?: string;
}

/**
 * 薪资计算管道主表修改请求参数
 * 对应后端: com.salary.admin.model.dto.pipeline.CalcPipelineInfoEditReqDTO
 */
export interface CalcPipelineInfoEditReqDTO extends Partial<CalcPipelineInfoAddReqDTO> {
  /** 管道主键 ID (修改时必填) */
  id: number;
}
/**
 * 薪资计算管道步骤批量保存项类型
 * 对应后端: com.salary.admin.model.dto.calcpipelinestep.CalcPipelineStepAddReqDTO
 * 用于前端拖拽排序后全量提交步骤列表
 */
export interface CalcPipelineStepBatchItem {
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
  /** 阶段 (1:基础, 2:补贴, 3:扣款, 4:税, 5:汇总) */
  stage: number;
  /** 执行顺序 (升序) */
  sortOrder: number;
  /** 失败是否阻断 (1:阻断, 0:不中断) */
  blockFlag: number;
  /** 结果为空是否跳过 (1:跳过, 0:不跳过) */
  skipIfNull: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 执行条件表达式 (QLExpress 脚本) */
  conditionScript?: string;
}

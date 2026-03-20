// src/types/salary/config/config.ts

/** 薪资配置返回对象 VO (用于表格展示) */
export interface SalaryConfigVO {
  /** 主键ID */
  id: number;
  /** 配置名称 */
  configName: string;
  /** 配置键 (全局唯一) */
  configKey: string;
  /** 配置值 */
  configValue: string;
  /** 备注说明 */
  remark?: string;
  /** 是否启用 (0:停用, 1:启用) */
  activeFlag: number;
  /** 创建时间 */
  createTime?: string;
  /** 最后更新时间 */
  updateTime?: string;
}

/** 分页查询配置请求参数 */
export interface SalaryConfigQueryReqDTO {
  pageNum: number;
  pageSize: number;
  /** 配置名称 (模糊搜索) */
  configName?: string;
  /** 配置键 (模糊搜索) */
  configKey?: string;
  /** 状态 (0:停用, 1:启用) */
  activeFlag?: number;
}

/** 新增薪资配置请求参数 */
export interface SalaryConfigAddReqDTO {
  /** 配置名称 */
  configName: string;
  /** 配置键 (必须且全局唯一) */
  configKey: string;
  /** 配置值 */
  configValue: string;
  /** 备注 */
  remark?: string;
}

/** 修改薪资配置请求参数 */
export interface SalaryConfigEditReqDTO {
  /** 主键ID (必填) */
  id: number;
  /** 配置名称 */
  configName: string;
  /** 配置值 */
  configValue: string;
  /** 是否启用 (0:停用, 1:启用) */
  activeFlag?: number;
  /** 备注 */
  remark?: string;
}

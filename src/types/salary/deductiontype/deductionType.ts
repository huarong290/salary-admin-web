// src/types/salary/deductiontype/deductionType.ts

import type { PageQuery } from '@/types/common.ts';

/** 扣款类型字典返回对象 VO (定义薪资扣减项的元数据) */
export interface DeductionTypeVO {
  /** 主键ID */
  id: number;
  /** 类型编码 (如: TAX, INSURANCE) */
  typeCode: string;
  /** 类型名称 (如: 个人所得税, 社保扣款) */
  typeName: string;
  /** 扣款分类 */
  category?: string;
  /** 扣款项说明 */
  description?: string;
  /** 排序值 (数值越小越靠前) */
  sortValue: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 创建者 */
  createBy?: string;
}

/** 分页查询扣款类型请求参数 */
export interface DeductionTypeQueryReqDTO extends PageQuery {
  /** 关键词 (编码或名称模糊匹配) */
  keyword?: string;
}

/** 新增扣款类型请求参数 */
export interface DeductionTypeAddReqDTO {
  /** 类型编码 (全局唯一) - 必填项 */
  typeCode: string;
  /** 类型名称 - 必填项 */
  typeName: string;
  /** 扣款分类 */
  category?: string;
  /** 扣款项说明 */
  description?: string;
  /** 排序值 (数值越小越靠前) - 必填项 */
  sortValue: number;
}

/** 修改扣款类型请求参数 */
export interface DeductionTypeEditReqDTO extends DeductionTypeAddReqDTO {
  /** 主键ID - 必填项 */
  id: number | string;
}

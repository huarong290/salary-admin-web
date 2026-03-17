// src/types/salary/incometype/incomeType.ts

import type { PageQuery } from '@/types/common.ts';

/** 收入类型字典返回对象 VO (定义薪资构成的基础元数据) */
export interface IncomeTypeVO {
  /** 主键ID */
  id: number;
  /** 类型编码 (如: BASE, OT) */
  typeCode: string;
  /** 类型名称 (如: 基本工资, 加班费) */
  typeName: string;
  /** 拼音缩写*/
  pinyinCode?: string;
  /** 分类 (如: 固定工资, 补贴, 奖金) */
  categoryName?: string;
  /** 收入项说明 */
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

/** 分页查询收入类型请求参数 */
export interface IncomeTypeQueryReqDTO extends PageQuery {
  /** 关键词 (编码或名称模糊匹配) */
  keyword?: string;
}

/** 新增收入类型请求参数 */
export interface IncomeTypeAddReqDTO {
  /** 类型编码 (全局唯一) - 必填项 */
  typeCode: string;
  /** 类型名称 - 必填项 */
  typeName: string;
  /** 拼音缩写*/
  pinyinCode?: string;
  /** 分类 */
  categoryName?: string;
  /** 收入项说明 */
  description?: string;
  /** 排序值 (数值越小越靠前) - 必填项 */
  sortValue: number;
}

/** 修改收入类型请求参数 */
export interface IncomeTypeEditReqDTO extends IncomeTypeAddReqDTO {
  /** 主键ID - 必填项 */
  id: number | string;
  /** 💡 注意：修改时同样会校验 typeCode 的全局唯一性 */
}

/** 收入类型下拉选项返回对象 (用于表单下拉选择) */
export interface IncomeTypeOptionVO {
  /** 主键ID */
  id: number;
  /** 类型名称 (如: 基本工资) */
  typeName: string;
  /** 类型编码 (如: BASE) */
  typeCode: string;
}

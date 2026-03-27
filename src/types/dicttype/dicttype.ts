// src/types/dicttype/dicttype.ts

import type { PageQuery } from '@/types/common.ts';

/* ========================================================================
 * 📦 一、字典类型 (Dict Type) 相关的类型定义
 * ======================================================================== */

/** 字典类型展示视图对象 VO */
export interface DictTypeVO {
  /** 字典类型自增主键 */
  id: number;
  /** 字典类型编码 (全局唯一, 如: sys_user_sex) */
  dictTypeCode: string;
  /** 字典类型名称 (中文描述, 如: 用户性别) */
  dictTypeName: string;
  /** 类别 */
  dictCategory: string;
  /** 状态: 0-停用, 1-正常 */
  status: number;
  /** 备注说明 */
  remark?: string;
  /** 创建时间 (YYYY-MM-DD HH:mm:ss) */
  createTime?: string;
  /** 最后更新时间 (YYYY-MM-DD HH:mm:ss) */
  updateTime?: string;
}

/** 分页查询字典类型请求参数 DTO */
export interface DictTypeQueryReqDTO extends PageQuery {
  /**  字典类型名称 - 支持模糊搜索 */
  dictTypeName?: string;
  /**  字典类型编码 - 支持模糊搜索 */
  dictTypeCode?: string;
  /** 状态筛选: 0-停用, 1-正常 */
  status?: number;
}

/** 新增字典类型请求参数 DTO (用于维护系统基础参数) */
export interface DictTypeAddReqDTO {
  /** 字典类型编码 - 必填项 (不可重复) */
  dictTypeCode: string;
  /** 字典类型名称 - 必填项 */
  dictTypeName: string;
  /** 类别 */
  dictCategory: string;
  /** 状态: 0-停用, 1-正常 - 默认 1 */
  status: number;
  /** 类型备注说明 */
  remark?: string;
}

/** 修改字典类型请求参数 DTO (包含 ID 标识) */
export interface DictTypeEditReqDTO extends DictTypeAddReqDTO {
  /** 字典类型主键 ID - 必填项 */
  id: number;
}

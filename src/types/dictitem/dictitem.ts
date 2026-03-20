// src/types/dictitem/dictitem.ts

import type { PageQuery } from '@/types/common.ts';

/* ========================================================================
 * 📦 二、字典明细项 (Dict Item) 相关的类型定义
 * ======================================================================== */

/** 字典明细项展示视图对象 VO */
export interface DictItemVO {
  /** 字典项自增主键 */
  id: number;
  /** 关联的字典类型编码 (如: sys_user_sex) */
  dictTypeCode: string;
  /** 字典标签 (展示文本, 如: 男、女、未知) */
  dictItemLabel: string;
  /** 字典键值 (后端存储值, 如: 1, 2, 0) */
  dictItemValue: string;
  /** 显示排序 (数值越小越靠前) */
  sort: number;
  /** 状态: 0-停用, 1-正常 */
  status: number;
  /** 字典项备注 */
  remark?: string;
  /** 创建时间 (YYYY-MM-DD HH:mm:ss) */
  createTime?: string;
}

/** 新增字典明细项请求参数 DTO */
export interface DictItemAddReqDTO {
  /** 所属字典类型编码 - 必填项 */
  dictTypeCode: string;
  /** 字典标签 - 必填项 (UI 显示文字) */
  dictItemLabel: string;
  /** 字典键值 - 必填项 (业务逻辑判定值) */
  dictItemValue: string;
  /** 排序号 - 必填项 (默认可设为 0) */
  sort: number;
  /** 状态: 0-停用, 1-正常 - 必填项 */
  status: number;
  /** 备注说明 */
  remark?: string;
}

/** 修改字典明细项请求参数 DTO (继承自新增对象) */
export interface DictItemUpdateReqDTO extends DictItemAddReqDTO {
  /** 字典项主键 ID - 🌟 修改时必传，用于定位记录 */
  id: number;
}

/** 字典项简单过滤请求参数 (通常用于下拉列表搜索) */
export interface DictItemQueryReqDTO extends PageQuery {
  /** 🌟 核心过滤：所属字典类型编码 */
  dictTypeCode?: string;
  /** 标签模糊匹配 */
  dictItemLabel?: string;
  /** 状态筛选 */
  status?: number;
}

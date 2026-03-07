// src/types/common.ts
/** 通用接口响应结构 */
export interface ApiResult<T = unknown> {
  /** 状态码（如 "0" 表示成功） */
  code: string;
  /** 提示信息（如 "操作成功"） */
  message: string;
  /** 实际返回的数据内容 */
  data: T;
  /** 时间戳（可选） */
  timestamp?: number;
}

/** 通用分页响应结构 */
export interface PageResult<T> {
  /** 总记录数 */
  total: number;
  /** 列表数据 */
  records: T[];
  /** 当前页码 */
  pageNum: number;
  /** 每页记录数 */
  pageSize: number;
  /** 总页数 */
  totalPage: number;
}

/** * 分页请求参数基类 (顺手为你准备好，方便后续列表查询继承)
 */
export interface PageQuery {
  pageNum: number;
  pageSize: number;
}

// src/types/salary/itemconfig/itemConfig.ts
import type { PageQuery } from '@/types/common.ts';

/** 薪资项目统一配置返回对象 VO (承载计算引擎、计税逻辑及展示属性) */
export interface SalaryItemConfigVO {
  /** 主键ID (雪花算法生成) */
  id: number | string;
  /** 项编码 (业务唯一标识，如：BASIC_SALARY) */
  itemCode: string;
  /** 项名称 (界面展示名称) */
  itemName: string;
  /** 项目大类: 1-收入, 2-扣款, 3-税费, 4-公司支出/补贴 */
  itemCategory: number;
  /** 项目大类显示名称 (由后端关联字典表获取，如: 收入) */
  categoryLabel?: string;
  /** 引擎上下文变量名 (Groovy 脚本中引用的变量名) */
  envVarName: string;
  /** 默认表达式脚本模板 (支持 Groovy 语法) */
  defaultRuleScript?: string;
  /** 计算优先级 (数值越小越靠前，确保前置变量先于计算项执行) */
  calcPriority: number;
  /** 业务分类字典值 (关联业务字典，如: allowance, insurance) */
  categoryDictValue: string;
  /** 计税标识: 0-不计税, 1-计入个税基数 (仅对收入类有效) */
  taxableFlag: number;
  /** 税前扣除标识: 0-否, 1-是 (仅对扣款类有效，如社保公积金) */
  taxDeductibleFlag: number;
  /** 是否固定项: 0-动态计算, 1-固定录入项 */
  fixedFlag: number;
  /** 拼音缩写 (支持前端快速首字母检索) */
  pinyinCode?: string;
  /** 状态: 0-禁用, 1-启用 */
  status: number;
  /** 显示排序 (数值越小越靠前) */
  sortValue: number;
  /** 配置备注/业务说明 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 创建者姓名 (由后端关联用户表获取) */
  createByName?: string;
}

/** 薪资项目分页查询请求参数 */
export interface ItemConfigQueryReqDTO extends PageQuery {
  /** 全字段搜索关键字 (支持名称、编码、拼音缩写) */
  searchText?: string;
  /** 项目分类过滤: 1-收入, 2-扣款, 3-税费, 4-公司支出 */
  itemCategory?: number;
  /** 业务分类字典值过滤 (如: insurance) */
  categoryDictValue?: string;
  /** 启用状态过滤: 0-禁用, 1-启用 */
  status?: number;
  /** 是否固定项过滤: 0-否, 1-是 */
  fixedFlag?: number;
}

/** 新增薪资项目请求参数 */
export interface ItemConfigAddReqDTO {
  /** 项编码 (必须为大写字母、数字或下划线组合) - 必填 */
  itemCode: string;
  /** 项名称 - 必填 */
  itemName: string;
  /** 项目分类: 1-收入, 2-扣款, 3-税费, 4-公司支出 - 必填 */
  itemCategory: number;
  /** 引擎上下文变量名 (需符合小驼峰命名规范) - 必填 */
  envVarName: string;
  /** 默认表达式脚本模板 */
  defaultRuleScript?: string;
  /** 计算优先级 (建议 10, 20, 30 间隔分布) - 必填 */
  calcPriority: number;
  /** 业务分类字典值 (如: allowance) - 必填 */
  categoryDictValue: string;
  /** 是否计税: 0-否, 1-是 - 必填 */
  taxableFlag: number;
  /** 是否税前扣除: 0-否, 1-是 - 必填 */
  taxDeductibleFlag: number;
  /** 是否固定项: 0-动态计算, 1-固定录入项 - 必填 */
  fixedFlag: number;
  /** 状态: 0-禁用, 1-启用 - 必填 */
  status: number;
  /** 显示排序值 */
  sortValue?: number;
  /** 备注说明 */
  remark?: string;
}

/** 修改薪资项目请求参数 */
export interface ItemConfigEditReqDTO extends ItemConfigAddReqDTO {
  /** 主键ID - 必填 */
  id: number | string;
}

/** 薪资项目简易选项对象 (用于下拉选择、公式编辑器的变量选择) */
export interface ItemConfigOptionVO {
  /** 主键ID */
  id: number | string;
  /** 薪资项名称 */
  itemName: string;
  /** 薪资项编码 */
  itemCode: string;
  /** 脚本变量名 (前端配置公式时插入该变量) */
  envVarName: string;
}

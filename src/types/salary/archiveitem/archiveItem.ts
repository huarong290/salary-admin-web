// src/types/salary/archiveitem/archiveItem

/**
 * 薪资档案明细项提交参数 (DTO)
 * 用于入职定薪和调薪申请时，级联提交的具体金额配置
 */
export interface ArchiveItemReqDTO {
  /** 项目配置ID (对应 salary_item_config.id) */
  itemConfigId: number;
  /** 固定金额 */
  amount: number;
  /** 个性化表达式脚本 (可选) */
  ruleScript?: string;
}

/**
 * 薪资档案项明细视图对象 (VO)
 * 后端返回的聚合了字典翻译和快照信息的完整明细
 */
export interface SalaryArchiveItemVO {
  /** 明细ID (自增主键) */
  id: number;
  /** 关联的具体某一个版本的档案ID */
  archiveId: number;
  /** 项目类型 (1:收入项, 2:扣款项) */
  itemType: number;
  itemTypeLabel?: string;
  itemConfigId: number;
  /** 项目名称快照 (如：餐补) */
  typeName: string;
  /** 分类字典值快照 */
  categoryDictValue: string;
  categoryDictLabel?: string;
  /** 固定金额 */
  amount: number;
  ruleScript?: string;
  sort?: number;
}

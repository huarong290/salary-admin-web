// src/types/salary/archiveitem/archiveItem

/**
 * 薪资档案明细项提交参数 (DTO)
 * 用于入职定薪和调薪申请时，级联提交的具体金额配置
 */
export interface ArchiveItemReqDTO {
  /** 项目配置ID (对应 salary_item_config.id) */
  itemConfigId: number;
  /** *
   * 计算模式
   * 1: 按月固定, 2: 按出勤天数, 3: 按现场出勤, 4: 按居家出勤
   */
  calcMode: number;
  /**
   * 若按月固定(1)则代表月总额（如2000）；若按天计算(2,3,4)则代表日单价（如30）
   */
  amount: number;
  /**
   * 个性化表达式脚本 (可选)
   */
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
  /**
   * 计算模式快照：(1:按月固定, 2:按出勤天数, 3:按现场出勤, 4:按居家出勤)
   */
  calcMode: number;
  /** 计算模式文本 (字典翻译: 如 "按现场出勤计算") */
  calcModeLabel?: string;
  /**
   *  精度控制快照
   * 来源：salary_item_config
   */
  decimalPlaces: number;
  /**
   * 舍入规则快照
   * HALF_UP, DOWN, UP
   */
  roundingMode: string;
  /**
   * 项目名称快照 (如：餐补)
   */
  typeName: string;
  /**
   * 分类字典值快照
   */
  categoryDictValue: string;
  categoryDictLabel?: string;
  /** * 基准标准金额
   * 页面展示时，若 calcMode 为 1 显示“元/月”，若为 2,3,4 显示“元/天”
   */
  amount: number;
  ruleScript?: string;
  sort?: number;
}

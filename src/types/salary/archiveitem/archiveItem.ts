// src/types/salary/archiveitem/archiveItem

/** 薪资档案固定项明细对象 (用于定义具体的收入或扣款配置) */
export interface ArchiveItemDTO {
  /** 明细ID (自增主键) */
  id?: number;
  /** 关联的具体某一个版本的档案ID */
  archiveId?: number;
  /** 项目类型: 1-收入项, 2-扣款项 */
  itemType: number;
  /** 对应字典项ID (收入类型或扣款类型ID) */
  typeId: number;
  /** 🌟 项目名称 (如：全勤奖、社保扣款) */
  typeName?: string;
  /** 项目编码 (如：ATTENDANCE_BONUS) */
  typeCode?: string;
  /** 计算方式: 1-固定金额, 2-按基数比例 */
  calcType: number;
  /** 计算基数 (为空则默认取底薪) */
  baseAmount?: number;
  /** 固定金额 (若为比例计算，此字段作为计算结果缓存) */
  amount?: number;
  /** 计算比例 (如: 0.0800 代表 8%) */
  ratio?: number;
}

// src/api/salary/archiveitem/archiveItem.ts

import request from '@/utils/request';
import type { ArchiveItemDTO } from '@/types/salary/archiveitem/archiveItem.ts';

/**
 * 获取指定档案的明细项列表
 * (根据主表档案ID，获取该版本下配置的所有固定收入/扣款明细项)
 */
export function listItemsByArchiveIdApi(archiveId: number | string) {
  return request.get<ArchiveItemDTO[]>(`/salary-archive-item/list/${archiveId}`);
}

/**
 * 获取所有可用的收入类型字典
 * (用于定薪页面添加收入项时的下拉选择)
 */
export function getIncomeTypeListApi() {
  return request.get<any[]>(`/salary/income-type/list`);
}

/**
 * 获取所有可用的扣款类型字典
 * (用于定薪页面添加扣款项时的下拉选择)
 */
export function getDeductionTypeListApi() {
  return request.get<any[]>(`/salary/deduction-type/list`);
}

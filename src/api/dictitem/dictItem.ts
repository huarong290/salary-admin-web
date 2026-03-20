// src/api/dictitem/dictItem.ts
import request from '@/utils/request';
import type {
  DictItemAddReqDTO,
  DictItemUpdateReqDTO,
  DictItemVO,
} from '@/types/dictitem/dictitem.ts';

/**
 * 🌟 核心高频接口：根据类型编码获取字典项列表 (带 Redis 缓存)
 * 常用于前端各种表单下拉框的数据回显
 * @param typeCode 字典类型编码 (如: 'currency_type')
 */
export function getItemsByTypeApi(typeCode: string) {
  return request.get<DictItemVO[]>(`/dict/item/list/${typeCode}`);
}

/**
 * 新增字典明细项
 */
export function addDictItemApi(data: DictItemAddReqDTO) {
  return request.post<number>(`/dict/item/add`, data);
}

/**
 * 修改字典明细项
 */
export function updateDictItemApi(data: DictItemUpdateReqDTO) {
  return request.put<boolean>(`/dict/item/edit`, data);
}

/**
 * 删除单个字典明细项
 * @param id 字典项ID
 */
export function deleteDictItemApi(id: number | string) {
  return request.delete<boolean>(`/dict/item/delete/${id}`);
}

/**
 * 批量删除字典明细项
 * @param ids 字典项ID数组
 */
export function batchDeleteDictItemApi(ids: (number | string)[]) {
  // 注意：axios DELETE 请求中如果要带 request body，必须放在 data 属性里
  return request.delete<boolean>(`/dict/item/batch-delete`, {
    data: ids,
  });
}

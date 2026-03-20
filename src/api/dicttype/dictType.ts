// src/api/dicttype/dictType.ts

import request from '@/utils/request';
import type {
  DictTypeAddReqDTO,
  DictTypeQueryReqDTO,
  DictTypeVO,
} from '@/types/dictitem/dictitem.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 分页查询字典类型列表
 */
export function getDictTypePageApi(data: DictTypeQueryReqDTO) {
  return request.post<PageResult<DictTypeVO>>(`/dict/type/page`, data);
}

/**
 * 新增字典类型
 */
export function addDictTypeApi(data: DictTypeAddReqDTO) {
  return request.post<number>(`/dict/type/add`, data);
}

class DictTypeUpdateReqDTO {}

/**
 * 修改字典类型
 */
export function updateDictTypeApi(data: DictTypeUpdateReqDTO) {
  return request.put<boolean>(`/dict/type/edit`, data);
}

/**
 * 删除单个字典类型
 * @param id 字典类型ID
 */
export function deleteDictTypeApi(id: number | string) {
  return request.delete<boolean>(`/dict/type/delete/${id}`);
}

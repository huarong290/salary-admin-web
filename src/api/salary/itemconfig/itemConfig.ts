// src/api/salary/itemconfig/itemConfig.ts

import request from '@/utils/request';
import type {
  SalaryItemConfigVO,
  ItemConfigAddReqDTO,
  ItemConfigEditReqDTO,
  ItemConfigQueryReqDTO,
  ItemConfigOptionVO,
} from '@/types/salary/itemconfig/itemConfig.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 分页查询薪资项目配置列表
 * @param data 查询过滤条件 (含分页、搜索关键字、分类等)
 */
export function getItemConfigPageApi(data: ItemConfigQueryReqDTO) {
  return request.post<PageResult<SalaryItemConfigVO>>('/salary/item-config/page', data);
}

/**
 * 新增薪资项目配置
 * @param data 配置信息 (含 itemCode, envVarName, 脚本等)
 * @returns 返回新生成的记录 ID
 */
export function addItemConfigApi(data: ItemConfigAddReqDTO) {
  return request.post<number | string>('/salary/item-config/add', data);
}

/**
 * 修改薪资项目配置
 * @param data 修改内容 (💡 系统固定项将无法修改编码和变量名)
 */
export function editItemConfigApi(data: ItemConfigEditReqDTO) {
  return request.put<boolean>('/salary/item-config/edit', data);
}

/**
 * 获取单个薪资项目配置详情
 * @param id 配置项 ID
 */
export function getItemConfigDetailApi(id: number | string) {
  return request.get<SalaryItemConfigVO>(`/salary/item-config/detail/${id}`);
}

/**
 * 删除薪资项目配置
 * @param id 配置项 ID
 * @param logicalDelete 是否逻辑删除 (默认 true，生产环境建议逻辑删除以保留审计痕迹)
 */
export function deleteItemConfigApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/item-config/delete/${id}`, {
    params: { logicalDelete },
  });
}
/**
 * 获取所有启用的薪资配置项 (用于下拉选择)
 * @returns 简易配置选项列表
 */
export function listItemConfigOptionsApi() {
  return request.get<ItemConfigOptionVO[]>('/salary/item-config/listOptions');
}
/**
 * 手动刷新计算引擎相关缓存
 * 当在数据库直接修改脚本或参数后，调用此接口同步 Redis 缓存
 */
export function refreshItemConfigCacheApi() {
  return request.post<boolean>('/salary/item-config/refresh-cache');
}

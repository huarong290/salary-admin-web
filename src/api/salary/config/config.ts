// src/api/salary/config/config.ts

import request from '@/utils/request';
import type {
  SalaryConfigAddReqDTO,
  SalaryConfigEditReqDTO,
  SalaryConfigQueryReqDTO,
  SalaryConfigVO,
} from '@/types/salary/config/config.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 分页查询薪资全局配置
 * @param data 查询条件
 */
export function getConfigPageApi(data: SalaryConfigQueryReqDTO) {
  return request.post<PageResult<SalaryConfigVO>>('/salary/config/page', data);
}

/**
 * 获取全量薪资配置列表 (通常用于其他模块初始化加载)
 */
export function listAllConfigsApi() {
  return request.get<SalaryConfigVO[]>('/salary/config/listAll');
}

/**
 * 新增全局配置项
 * @param data 新增数据
 */
export function addConfigApi(data: SalaryConfigAddReqDTO) {
  return request.post<number>('/salary/config/add', data);
}

/**
 * 修改全局配置项 (包含状态启停)
 * @param data 修改数据
 */
export function editConfigApi(data: SalaryConfigEditReqDTO) {
  return request.put<boolean>('/salary/config/edit', data);
}

/**
 * 根据 Key 获取单个配置的值 (供其他业务快捷调用)
 * @param configKey 配置键
 */
export function getConfigValueApi(configKey: string) {
  return request.get<string>('/salary/config/getVal', { params: { configKey } });
}

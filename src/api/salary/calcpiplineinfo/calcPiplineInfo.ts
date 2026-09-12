// src/api/salary/calcpiplineinfo/calcPiplineInfo.ts
import request from '@/utils/request';
import type { PageResult } from '@/types/common';
import type {
  CalcPipelineInfoAddReqDTO,
  CalcPipelineInfoEditReqDTO,
  CalcPipelineInfoQueryReqDTO,
  CalcPipelineInfoVO,
} from '@/types/salary/calcpiplineinfo/calcpiplineinfo.ts';

/**
 * 分页查询薪资管道主表
 * @param data 查询条件 (包含 keyword, status 等)
 */
export function getPipelineInfoPageApi(data: CalcPipelineInfoQueryReqDTO) {
  return request.post<PageResult<CalcPipelineInfoVO>>(
    '/salary/salary-calc-pipeline-info/page',
    data
  );
}

/**
 * 新增管道主表
 * @param data 管道信息
 */
export function addPipelineInfoApi(data: CalcPipelineInfoAddReqDTO) {
  return request.post<number>('/salary/salary-calc-pipeline-info/add', data);
}

/**
 * 修改管道主表
 * @param data 修改数据 (包含 id)
 */
export function editPipelineInfoApi(data: CalcPipelineInfoEditReqDTO) {
  return request.put<boolean>('/salary/salary-calc-pipeline-info/edit', data);
}

/**
 * 删除管道主表
 * @param id 管道 ID
 * @param logical 是否逻辑删除 (默认 true)
 */
export function deletePipelineInfoApi(id: number | string, logical: boolean = true) {
  return request.delete<boolean>(`/salary/salary-calc-pipeline-info/delete/${id}`, {
    params: { logical },
  });
}

/**
 * 批量删除管道主表
 * @param ids ID 数组
 * @param logical 是否逻辑删除
 */
export function deletePipelineInfoBatchApi(ids: (number | string)[], logical: boolean = true) {
  return request.delete<boolean>('/salary/salary-calc-pipeline-info/delete/batch', {
    data: ids,
    params: { logical },
  });
}
/**
 *  设为全局默认核算管道
 * 业务逻辑：成功后，其他所有管道的默认标识会被后端自动置为 0
 * @param id 管道主键 ID
 */
export function setDefaultPipelineApi(id: number | string) {
  return request.put<boolean>(`/salary/salary-calc-pipeline-info/setDefault/${id}`);
}

/**
 *  复制并升级管道版本 (核心功能)
 * 场景：年度调薪或规则大改时，基于当前版生成 V+1 版，并自动拷贝所有步骤明细
 * @param id 源管道主键 ID
 * @returns 新生成的管道 ID (Long)
 */
export function upgradePipelineVersionApi(id: number | string) {
  return request.post<number>(`/salary/salary-calc-pipeline-info/upgradeVersion/${id}`);
}

/**
 *  获取全局默认薪资计算管道
 * 场景：发薪台/核算入口据此确定本次核算使用的管道，避免在前端写死管道编码与版本；
 *      后端解析优先级为：调用方指定 → 默认管道 → 唯一可用管道 → 快速失败
 * @returns 默认管道 VO；未配置默认管道时返回 null
 */
export function getDefaultPipelineApi() {
  return request.get<CalcPipelineInfoVO>('/salary/salary-calc-pipeline-info/default');
}

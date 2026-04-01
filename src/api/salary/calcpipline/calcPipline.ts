// src/salary/calcpipline/calcPipline.ts
import request from '@/utils/request';
import type { PageResult } from '@/types/common.ts';
import type {
  CalcPipelineAddReqDTO,
  CalcPipelineEditReqDTO,
  CalcPipelineQueryReqDTO,
  CalcPipelineVO,
} from '@/types/salary/calcpipline/calcpipline.ts';

/**
 * 分页查询薪资流程管道
 * @param data 查询条件 (包含 keyword, pipelineCode, stage 等)
 */
export function getPipelinePageApi(data: CalcPipelineQueryReqDTO) {
  return request.post<PageResult<CalcPipelineVO>>('/salary/calc-pipeline/page', data);
}

/**
 * 获取流程管道详情
 * @param id 管道主键 ID
 */
export function getPipelineDetailApi(id: number | string) {
  return request.get<CalcPipelineVO>(`/salary/calc-pipeline/${id}`);
}

/**
 * 新增单条流程管道步骤
 * @param data 管道配置信息
 */
export function addPipelineApi(data: CalcPipelineAddReqDTO) {
  return request.post<number>('/salary/calc-pipeline/add', data);
}

/**
 * 修改流程管道步骤
 * @param data 修改数据 (包含 id)
 */
export function editPipelineApi(data: CalcPipelineEditReqDTO) {
  return request.put<boolean>('/salary/calc-pipeline/edit', data);
}

/**
 * 批量保存/重排流程管道 (核心接口)
 * 通常用于前端拖拽排序后，点击“保存排序”时调用
 * @param pipelineCode 流程编码 (如: DEFAULT_PIPELINE)
 * @param pipelines 排序后的全量步骤列表
 */
export function savePipelineBatchApi(pipelineCode: string, pipelines: any[]) {
  return request.post<boolean>('/salary/calc-pipeline/batch-save', pipelines, {
    params: { pipelineCode },
  });
}

/**
 * 删除单个管道步骤
 * @param id 管道 ID
 * @param logical 是否逻辑删除 (默认 true)
 */
export function deletePipelineApi(id: number | string, logical: boolean = true) {
  return request.delete<boolean>(`/salary/calc-pipeline/${id}`, {
    params: { logical },
  });
}

/**
 * 批量删除管道步骤
 * @param ids ID 数组
 * @param logical 是否逻辑删除
 */
export function deletePipelineBatchApi(ids: (number | string)[], logical: boolean = true) {
  return request.delete<boolean>('/salary/calc-pipeline/batch', {
    data: ids,
    params: { logical },
  });
}

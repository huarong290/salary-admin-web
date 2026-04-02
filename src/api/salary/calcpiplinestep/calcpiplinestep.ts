// src/api/salary/calcpiplinestep/calcpiplinestep.ts
import request from '@/utils/request';
import type { PageResult } from '@/types/common';
import type {
  CalcPipelineStepAddReqDTO,
  CalcPipelineStepEditReqDTO,
  CalcPipelineStepQueryReqDTO,
  CalcPipelineStepVO,
} from '@/types/salary/calcpiplinestep/calcpiplinestep.ts';

/**
 * 分页查询薪资管道步骤
 * @param data 查询条件 (包含 pipelineCode, pipelineVersion, stage 等)
 */
export function getPipelineStepPageApi(data: CalcPipelineStepQueryReqDTO) {
  return request.post<PageResult<CalcPipelineStepVO>>(
    '/salary/salary-calc-pipeline-step/page',
    data
  );
}

/**
 * 获取管道步骤详情
 * @param id 步骤主键 ID
 */
export function getPipelineStepDetailApi(id: number | string) {
  return request.get<CalcPipelineStepVO>(`/salary/salary-calc-pipeline-step/${id}`);
}

/**
 * 新增管道步骤
 * @param data 步骤信息
 */
export function addPipelineStepApi(data: CalcPipelineStepAddReqDTO) {
  return request.post<number>('/salary/salary-calc-pipeline-step/add', data);
}

/**
 * 修改管道步骤
 * @param data 修改数据 (包含 id)
 */
export function editPipelineStepApi(data: CalcPipelineStepEditReqDTO) {
  return request.put<boolean>('/salary/salary-calc-pipeline-step/edit', data);
}

/**
 * 删除单个管道步骤
 * @param id 步骤 ID
 * @param logical 是否逻辑删除 (默认 true)
 */
export function deletePipelineStepApi(id: number | string, logical: boolean = true) {
  return request.delete<boolean>(`/salary/salary-calc-pipeline-step/${id}`, {
    params: { logical },
  });
}

/**
 * 批量删除管道步骤
 * @param ids ID 数组
 * @param logical 是否逻辑删除
 */
export function deletePipelineStepBatchApi(ids: (number | string)[], logical: boolean = true) {
  return request.delete<boolean>('/salary/salary-calc-pipeline-step/batch', {
    data: ids,
    params: { logical },
  });
}
/**
 *  获取指定管道版本下的所有执行步骤 (不分页)
 * 场景：编排设计器打开时，需要一次性加载全量步骤进行拖拽展示
 * @param pipelineCode 流程编码
 * @param pipelineVersion 管道版本
 */
export function listPipelineStepsApi(pipelineCode: string, pipelineVersion: number) {
  return request.get<CalcPipelineStepVO[]>('/salary/salary-calc-pipeline-step/list', {
    params: { pipelineCode, pipelineVersion },
  });
}

/**
 *  批量发布管道步骤 (全量覆盖模式)
 * 场景：拖拽设计器点击“发布”时调用。
 * 逻辑：后端会物理删除该 Code+Version 下的旧步骤，按数组顺序重新生成 sortOrder 并插入。
 * @param pipelineCode 流程编码
 * @param pipelineVersion 管道版本
 * @param steps 排序后的步骤 DTO 列表 (不带 ID)
 */
export function savePipelineStepBatchApi(
  pipelineCode: string,
  pipelineVersion: number,
  steps: CalcPipelineStepAddReqDTO[]
) {
  return request.post<boolean>('/salary/salary-calc-pipeline-step/batch-save', steps, {
    params: { pipelineCode, pipelineVersion },
  });
}

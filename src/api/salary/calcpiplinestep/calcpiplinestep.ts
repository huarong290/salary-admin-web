// src/api/salary/calcpiplinestep/calcpiplinestep.ts
import request from '@/utils/request';
import type {
  CalcPipelineStepAddReqDTO,
  CalcPipelineStepVO,
} from '@/types/salary/calcpiplinestep/calcpiplinestep.ts';

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

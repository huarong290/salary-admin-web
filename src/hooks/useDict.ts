import { onMounted, reactive } from 'vue';
import { getItemsByTypeApi } from '@/api/dictitem/dictItem';
import type { DictItemVO } from '@/types/dictitem/dictitem';

/**
 * 🌟 统一字典获取 Hook
 * @param types 字典类型编码列表 (如: 'salary_item_category', 'salary_item_sub_type')
 */
export function useDict(...types: string[]) {
  const dicts = reactive<{ [key: string]: DictItemVO[] }>({});

  // 初始化 key，防止模板渲染时报 undefined
  types.forEach((type) => {
    dicts[type] = [];
  });

  onMounted(() => {
    types.forEach(async (type) => {
      try {
        // 尝试从本地持久化缓存拿数据（可选，减少网络请求）
        const cache = sessionStorage.getItem(`dict:${type}`);
        if (cache) {
          dicts[type] = JSON.parse(cache);
        } else {
          const res = await getItemsByTypeApi(type);
          if (res) {
            dicts[type] = res;
            sessionStorage.setItem(`dict:${type}`, JSON.stringify(res));
          }
        }
      } catch (error) {
        console.error(`加载字典 [${type}] 失败:`, error);
      }
    });
  });

  return dicts;
}

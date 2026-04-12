// src/hooks/useHitokoto.ts
import { ref } from 'vue';

export function useHitokoto() {
  const quote = ref('今日宜保持微笑，好运自然来。');
  const from = ref('System');

  const fetchQuote = async () => {
    try {
      // c=k 代表哲学/励志类，c=d 代表文学类，保证句子有格调且适合办公场景
      const res = await fetch('https://v1.hitokoto.cn/?c=k&c=d');
      const data = await res.json();
      quote.value = data.hitokoto;
      from.value = data.from_who || data.from || '佚名';
    } catch (error) {
      console.error('获取一言失败:', error);
    }
  };

  return { quote, from, fetchQuote };
}

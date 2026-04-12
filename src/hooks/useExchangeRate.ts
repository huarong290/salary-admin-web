// src/hooks/useExchangeRate.ts
import { ref } from 'vue';

export function useExchangeRate() {
  // 存放全量汇率快照
  const rates = ref<Record<string, number>>({});
  const updateTime = ref('');

  // 预设财务常用货币圈
  const currencyOptions = ['CNY', 'PHP', 'USD', 'USDT', 'EUR', 'JPY', 'HKD', 'GBP', 'AUD', 'SGD'];

  // 获取基准汇率大全
  const fetchRate = async (baseCurrency = 'CNY') => {
    try {
      // 1. 获取传统法币汇率
      const fiatRes = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const fiatData = await fiatRes.json();

      if (fiatData.result === 'success') {
        const fiatRates = fiatData.rates;
        // 2. 异步并发获取 CoinGecko 的 USDT 真实汇率
        try {
          // 查询 USDT 对 CNY, PHP, USD 的价格
          const cryptoRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=cny,php,usd'
          );
          const cryptoData = await cryptoRes.json();

          // CoinGecko 返回的是 1 USDT = 多少目标币，我们需要转换成以 baseCurrency (如 CNY) 为基准
          // 如果 baseCurrency 是 CNY，那么 1 CNY = 1 / (USDT/CNY 的价格) USDT
          const usdtToCny = cryptoData.tether.cny;
          fiatRates['USDT'] = 1 / usdtToCny;
        } catch (cryptoErr) {
          console.error('获取 USDT 汇率失败，降级使用 USD 汇率', cryptoErr);
          fiatRates['USDT'] = fiatRates['USD']; // 失败时走降级策略
        }

        rates.value = fiatRates;
        const date = new Date(fiatData.time_last_update_unix * 1000);
        updateTime.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('获取汇率失败:', error);
    }
  };

  /** * 🌟 核心：交叉汇率算法
   * 利用已有的基准汇率字典，在纯前端瞬间完成任意两个币种的转换，无需重复请求API
   */
  const calcExchange = (amount: number, from: string, to: string) => {
    if (!rates.value[from] || !rates.value[to]) return '0.0000';
    // 先折算成基准币，再折算成目标币
    const baseAmount = amount / rates.value[from];
    return (baseAmount * rates.value[to]).toFixed(4);
  };

  return { rates, updateTime, currencyOptions, fetchRate, calcExchange };
}

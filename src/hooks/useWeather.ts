// src/hooks/useWeather.ts
import { ref } from 'vue';

// 1. 定义天气数据的 TS 类型规范
export interface WeatherData {
  location: string;
  temp: string;
  desc: string;
  humidity: string;
}

// 2. 国际标准 WMO 天气代码映射字典 (内置)
const WEATHER_CODE_MAP: Record<number, string> = {
  0: '晴朗',
  1: '大部晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '结冰雾',
  51: '轻毛毛雨',
  53: '中毛毛雨',
  55: '重毛毛雨',
  56: '轻冻毛毛雨',
  57: '重冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '轻冻雨',
  67: '重冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴轻微冰雹',
  99: '雷暴伴重冰雹',
};

/**
 * 封装获取实时天气的 Composable (基于免秘钥的 Open-Meteo)
 * @param initialLat 默认纬度 (默认: 宿务 10.3157)
 * @param initialLon 默认经度 (默认: 宿务 123.8854)
 * @param locationName 默认展示的城市名
 */
export function useWeather(
  initialLat = 17.6132,
  initialLon = 121.727,
  locationName = '卡加延省/土格加劳 (Tuguegarao)'
) {
  // 响应式状态
  const loading = ref(false);
  const weatherInfo = ref<WeatherData>({
    location: locationName,
    temp: '--°C',
    desc: '加载中...',
    humidity: '--%',
  });

  // 核心请求方法
  const fetchWeather = async (lat = initialLat, lon = initialLon, name = locationName) => {
    loading.value = true;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
      const res = await fetch(url);

      if (!res.ok) throw new Error('网络响应异常');

      const data = await res.json();
      const code = data.current.weather_code;

      weatherInfo.value = {
        location: name,
        temp: `${Math.round(data.current.temperature_2m)}°C`,
        desc: WEATHER_CODE_MAP[code] || '未知',
        humidity: `${data.current.relative_humidity_2m}%`,
      };
    } catch (error) {
      console.error('获取实时天气失败:', error);
      weatherInfo.value.desc = '获取失败';
    } finally {
      loading.value = false;
    }
  };

  // 暴露出状态和方法
  return {
    weatherInfo,
    loading,
    fetchWeather,
  };
}

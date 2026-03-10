// src/hooks/useTheme.ts
import { ref } from 'vue';

/**
 * 🎨 核心色彩算法：RGB 转 Hex 字符串
 * 使用 ES2017 padStart 确保位数为 2，彻底规避数组索引可能产生的 undefined 报错
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');
  return `#${hexR}${hexG}${hexB}`;
};

/**
 * 🎨 核心色彩算法：颜色混合 (模拟 SCSS mix)
 * 用于计算主题色的淡化色 (light) 和加深色 (dark)
 */
const mixColor = (color1: string, color2: string, weight: number): string => {
  weight = Math.max(Math.min(Number(weight), 1), 0);
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);

  return rgbToHex(r, g, b);
};

/**
 * 🎨 极客算法：判断颜色亮度 (YIQ 算法)
 * 用于实现“亮底黑字，暗底白字”的自动反转
 */
const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128; // 亮度阈值设为 128
};

export const useTheme = () => {
  // --- 🧊 状态持久化 (从 localStorage 读取) ---
  const primaryColor = ref<string>(localStorage.getItem('theme-primary') || '#409EFF');
  const isDark = ref<boolean>(localStorage.getItem('theme-dark') === 'true');
  const menuStyle = ref<string>(localStorage.getItem('theme-menu-style') || 'breeze');

  /**
   * 🚀 核心方法：修改主题色
   * 包含主色注入、衍生色阶计算、以及文字反色逻辑
   */
  const changePrimaryColor = (val?: string | null) => {
    const safeColor = val || '#409EFF';
    primaryColor.value = safeColor;
    localStorage.setItem('theme-primary', safeColor);

    // 1. 注入 Element Plus 核心主色变量
    const el = document.documentElement;
    el.style.setProperty('--el-color-primary', safeColor);

    // 2. 注入极客反色变量：亮色主题下文字变黑 (#303133)，深色主题下文字用纯白
    const textColor = isLightColor(safeColor) ? '#303133' : '#ffffff';
    el.style.setProperty('--theme-primary-text-color', textColor);

    // 3. 计算 1-9 阶衍生色 (用于 Hover、Active、浅色背景)
    // 算法关键：暗黑模式下与深色背景混合，白天模式下与白色背景混合
    const mixBaseColor = isDark.value ? '#141414' : '#ffffff';
    const mixActiveColor = isDark.value ? '#ffffff' : '#000000';

    for (let i = 1; i <= 9; i++) {
      el.style.setProperty(
        `--el-color-primary-light-${i}`,
        mixColor(safeColor, mixBaseColor, i * 0.1)
      );
    }
    // 注入 dark-2 变量 (Element 按钮点击态常用)
    el.style.setProperty('--el-color-primary-dark-2', mixColor(safeColor, mixActiveColor, 0.2));
  };

  /**
   * 🚀 核心方法：切换暗黑模式
   */
  const toggleDark = () => {
    isDark.value = !isDark.value;
    localStorage.setItem('theme-dark', String(isDark.value));

    const html = document.documentElement;
    if (isDark.value) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // 模式切换后，必须重算衍生色，因为混合底色变了
    changePrimaryColor(primaryColor.value);
  };

  /**
   * 🚀 核心方法：切换菜单风格 (A/B 方案切换)
   * brilliant: 方案 A - 实心高亮
   * breeze: 方案 B - 柔和呼吸
   */
  const changeMenuStyle = (style: string) => {
    menuStyle.value = style;
    localStorage.setItem('theme-menu-style', style);
    // 通过 HTML 属性驱动 CSS 选择器，实现样式瞬间分流
    document.documentElement.setAttribute('data-menu-style', style);
  };

  /**
   * 🚀 核心方法：全局初始化
   * 建议在 App.vue 的 onMounted 中调用
   */
  const initTheme = () => {
    // 初始化主色与衍生色
    changePrimaryColor(primaryColor.value);

    // 初始化暗黑类名
    if (isDark.value) {
      document.documentElement.classList.add('dark');
    }

    // 初始化菜单风格属性
    document.documentElement.setAttribute('data-menu-style', menuStyle.value);
  };

  return {
    primaryColor,
    isDark,
    menuStyle,
    changePrimaryColor,
    toggleDark,
    changeMenuStyle,
    initTheme,
  };
};

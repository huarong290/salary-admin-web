<template>
  <div class="dashboard-container">
    <el-row class="welcome-row">
      <el-col :span="24">
        <el-card shadow="hover" class="welcome-card" body-class="welcome-card-body">
          <div class="welcome-content">
            <div class="greeting-area">
              <el-avatar
                :size="52"
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
              <div class="greeting-text">
                <h3>早安，Harvey，今天也是火力全开的一天！</h3>
                <span class="sub-text"
                  >Hi, Commander. 愿你今天的代码永不报错，薪资核算分毫不差。</span
                >
              </div>
            </div>

            <div class="status-widgets">
              <div class="widget-item">
                <div class="widget-icon-box bg-warning-light">
                  <el-icon class="text-warning"><Sunny /></el-icon>
                </div>
                <div class="widget-info">
                  <span class="value">{{ weatherInfo.location }} · {{ weatherInfo.temp }}</span>
                  <span class="label"
                    >{{ weatherInfo.desc }} | 湿度 {{ weatherInfo.humidity }}</span
                  >
                </div>
              </div>

              <div class="widget-item">
                <div class="widget-icon-box bg-purple-light">
                  <el-icon class="text-purple" style="color: #8a2be2"><Star /></el-icon>
                </div>
                <div class="widget-info">
                  <span class="value">{{ currentZodiac }} · 每日一言</span>

                  <div class="hitokoto-display" :title="quote">
                    <span class="quote-text">{{ quote }}</span>
                    <span class="quote-from">—— 「{{ from }}」</span>
                  </div>
                </div>
              </div>

              <el-divider direction="vertical" class="widget-divider" />
              <el-popover
                placement="bottom-end"
                :width="320"
                trigger="click"
                popper-style="border-radius: 12px; padding: 0;"
              >
                <template #reference>
                  <div class="widget-item clickable-widget">
                    <div class="widget-icon-box bg-success-light">
                      <el-icon class="text-success" style="color: #67c23a"><Money /></el-icon>
                    </div>
                    <div class="widget-info">
                      <span class="value"
                        >1 {{ exchangeForm.from }} =
                        {{ calcExchange(1, exchangeForm.from, exchangeForm.to) }}
                        {{ exchangeForm.to }}</span
                      >
                      <span class="label">点此展开计算器 | 更新于 {{ updateTime || '--:--' }}</span>
                    </div>
                  </div>
                </template>

                <div class="exchange-calculator">
                  <div class="ex-header">实时汇率计算器</div>
                  <div class="ex-body">
                    <el-input-number
                      v-model="exchangeForm.amount"
                      :min="0"
                      :controls="false"
                      style="width: 100%; margin-bottom: 12px"
                      placeholder="输入金额"
                    />
                    <div class="currency-selectors">
                      <el-select v-model="exchangeForm.from" style="width: 42%">
                        <el-option v-for="c in currencyOptions" :key="c" :label="c" :value="c" />
                      </el-select>
                      <el-button circle plain type="info" @click="swapCurrency">
                        <el-icon><Switch /></el-icon>
                      </el-button>
                      <el-select v-model="exchangeForm.to" style="width: 42%">
                        <el-option v-for="c in currencyOptions" :key="c" :label="c" :value="c" />
                      </el-select>
                    </div>
                    <div class="ex-result">
                      <span class="symbol">{{ exchangeForm.to }}</span>
                      <span class="amount">{{ exchangeResult }}</span>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="full-height-row">
      <el-col :xs="24" :md="14" class="left-col">
        <el-card shadow="hover" class="calendar-card" body-class="calendar-card-body">
          <el-calendar v-model="currentDate">
            <template #header>
              <div class="custom-calendar-header">
                <div class="title">
                  <el-icon class="header-icon"><Calendar /></el-icon>
                  财务万年历日程
                </div>
                <div class="calendar-toolbar">
                  <el-button-group size="small" class="nav-group">
                    <el-button @click="changeYear(-1)">«</el-button>
                    <el-dropdown trigger="click" @command="handleYearSelect">
                      <el-button plain class="ym-label">
                        {{ year }}年 <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="custom-scroll-menu">
                          <el-dropdown-item
                            v-for="y in yearOptions"
                            :key="y"
                            :command="y"
                            :class="{ 'is-active': y === year }"
                          >
                            {{ y }}年
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button @click="changeYear(1)">»</el-button>
                  </el-button-group>

                  <el-button-group size="small" class="nav-group" style="margin: 0 10px">
                    <el-button @click="changeMonth(-1)">‹</el-button>
                    <el-dropdown trigger="click" @command="handleMonthSelect">
                      <el-button plain class="ym-label">
                        {{ month }}月 <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu class="custom-scroll-menu">
                          <el-dropdown-item
                            v-for="m in 12"
                            :key="m"
                            :command="m"
                            :class="{ 'is-active': m === month }"
                          >
                            {{ m }}月
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <el-button @click="changeMonth(1)">›</el-button>
                  </el-button-group>

                  <el-button size="small" type="primary" @click="goToday"> 回到今天 </el-button>
                </div>
              </div>
            </template>

            <template #date-cell="{ data }">
              <div
                class="date-cell-inner"
                :class="{
                  'is-today': data.isToday,
                  'is-selected': data.day === selectedDate,
                  'is-weekend':
                    new Date(data.day).getDay() === 0 || new Date(data.day).getDay() === 6,
                }"
                @click="selectDate(data.day)"
              >
                <div
                  v-if="getLunarInfo(data.day).badge"
                  class="classic-badge"
                  :class="getLunarInfo(data.day).badge === '休' ? 'badge-rest' : 'badge-work'"
                >
                  {{ getLunarInfo(data.day).badge }}
                </div>
                <div class="solar-day">{{ data.day.split('-')[2] }}</div>
                <div
                  class="lunar-day"
                  :class="{ 'is-festival': getLunarInfo(data.day).isRedHoliday }"
                >
                  {{ getLunarInfo(data.day).text }}
                </div>
                <div v-if="memoMap[data.day]" class="memo-dot"></div>
              </div>
            </template>
          </el-calendar>
        </el-card>

        <el-card shadow="hover" class="memo-card">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon><Notebook /></el-icon> {{ selectedDate }} 备忘录
                <el-tag
                  v-if="selectedDate"
                  size="small"
                  type="info"
                  effect="plain"
                  round
                  style="margin-left: 10px; font-weight: normal"
                >
                  {{ getLunarInfo(selectedDate).xingZuo }}
                </el-tag>
              </span>
            </div>
          </template>
          <el-input
            v-model="currentMemo"
            type="textarea"
            :rows="3"
            placeholder="记录当天重要事项，自动保存..."
            resize="none"
            class="mac-textarea"
            @input="saveMemo"
          />
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10" class="right-col">
        <el-card shadow="hover" class="calculator-card" body-class="calc-card-body">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon><Operation /></el-icon> 财务计算器
              </span>
            </div>
          </template>

          <div class="calculator-core">
            <div class="calc-screen">
              <div class="screen-top">
                <div class="calc-history">{{ history }}</div>
                <el-tooltip content="将计算结果同步到暂存区" placement="left">
                  <el-button
                    class="record-btn"
                    link
                    type="primary"
                    :disabled="!display"
                    @click="recordToNote"
                  >
                    <el-icon><DocumentAdd /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              <div class="calc-result">{{ display || '0' }}</div>
            </div>

            <div class="calc-keyboard">
              <button class="key-btn key-func" @click="clear">AC</button>
              <button class="key-btn key-func" @click="del">DEL</button>
              <button class="key-btn key-func" @click="op('%')">%</button>
              <button class="key-btn key-op" @click="op('/')">÷</button>

              <button
                v-for="n in ['7', '8', '9']"
                :key="'k' + n"
                class="key-btn key-num"
                @click="num(n)"
              >
                {{ n }}
              </button>
              <button class="key-btn key-op" @click="op('*')">×</button>

              <button
                v-for="n in ['4', '5', '6']"
                :key="'k' + n"
                class="key-btn key-num"
                @click="num(n)"
              >
                {{ n }}
              </button>
              <button class="key-btn key-op" @click="op('-')">-</button>

              <button
                v-for="n in ['1', '2', '3']"
                :key="'k' + n"
                class="key-btn key-num"
                @click="num(n)"
              >
                {{ n }}
              </button>
              <button class="key-btn key-op" @click="op('+')">+</button>

              <button class="key-btn key-num key-zero" @click="num('0')">0</button>
              <button class="key-btn key-num" @click="num('.')">.</button>
              <button class="key-btn key-eq" @click="calc">=</button>
            </div>
          </div>

          <el-divider style="margin: 16px 0" />

          <div class="notepad-area">
            <div class="notepad-header">
              <span class="notepad-title">
                <el-icon><EditPen /></el-icon> 计算结果暂存区
              </span>
              <el-button link type="danger" size="small" @click="clearNotes">清空</el-button>
            </div>
            <el-input
              v-model="calcNotes"
              type="textarea"
              :rows="5"
              placeholder="点击计算器右上角图标，自动记录结果..."
              resize="none"
              class="mac-textarea"
              @input="saveNotesToLocal"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统首页工作台 (Dashboard)
 * 包含模块: 财务万年历日程、每日备忘录、极客计算器、计算结果暂存区
 * ====================================================================
 */

// 1. Vue 内置与核心依赖库
import { ref, onMounted, computed, reactive } from 'vue';

// 2. 第三方工具库与图标
import { Solar, HolidayUtil } from 'lunar-javascript';
import { Calendar, Operation, DocumentAdd, EditPen, Notebook } from '@element-plus/icons-vue';
// 引入天气 Hook
import { useWeather } from '@/hooks/useWeather';
import { useHitokoto } from '@/hooks/useHitokoto';

// 3. 架构级强化依赖
import { evaluate, format } from 'mathjs';
import { debounce } from 'lodash-es';
import { useExchangeRate } from '@/hooks/useExchangeRate.ts';
/**
 * --------------------------------------------------------------------
 * 📦 一、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

// [日历控制状态]
const currentDate = ref(new Date());
const selectedDate = ref('');
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);

// [备忘录状态]
const memoMap = ref<Record<string, string>>({});
const currentMemo = ref('');

// [计算器与暂存区状态]
const display = ref('');
const history = ref('');
const calcNotes = ref('');

// [农历缓存字典]
const lunarCache = new Map();

/**
 * --------------------------------------------------------------------
 * 🖱️ 二、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 切换日历年份 */
const changeYear = (n: number) => {
  const d = new Date(currentDate.value);
  d.setFullYear(d.getFullYear() + n);
  currentDate.value = d;
  syncYM();
};

/** 切换日历月份 */
const changeMonth = (n: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + n);
  currentDate.value = d;
  syncYM();
};
/** 生成年份下拉列表 (当前年份前后10年) */
const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  const options = [];
  for (let i = current - 10; i <= current + 10; i++) {
    options.push(i);
  }
  return options;
});
/** 下拉精准选择年份 */
const handleYearSelect = (targetYear: number) => {
  const d = new Date(currentDate.value);
  d.setFullYear(targetYear);
  currentDate.value = d;
  syncYM();
};

/** 下拉精准选择月份 */
const handleMonthSelect = (targetMonth: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(targetMonth - 1); // JS 中月份是 0 索引 (0-11)
  currentDate.value = d;
  syncYM();
};
/** 日历返回今天 */
const goToday = () => {
  const d = new Date();
  currentDate.value = d;
  selectedDate.value = formatDate(d);
  syncYM();
};

/** 选中具体日期并回显备忘录 */
const selectDate = (day: string) => {
  selectedDate.value = day;
  currentMemo.value = memoMap.value[day] || '';
};

/** 计算器：输入数字或小数点 */
const num = (n: string) => (display.value += n);

/** 计算器：输入操作符 */
const op = (o: string) => (display.value += o);

/** 计算器：清空全部 */
const clear = () => {
  display.value = '';
  history.value = '';
};

/** 计算器：退格删除 */
const del = () => (display.value = display.value.slice(0, -1));

/** *  计算器：执行计算 (企业级重构版)
 * 采用 mathjs 替代 Function/eval，杜绝 JS 浮点数黑洞 (如 0.1+0.2=0.30000004) 及 XSS 注入风险
 */
const calc = () => {
  if (!display.value) return; // 为空不计算

  try {
    history.value = display.value + ' =';
    // evaluate 解析公式，format 限制最高 14 位精度并自动抹平尾数误差
    const result = evaluate(display.value);
    display.value = String(format(result, { precision: 14 }));
  } catch {
    display.value = '错误';
  }
};

/** --------------------------------------------------------------------
 * 🧠 三、核心业务与存储逻辑区 (Business & Storage Logic)
 * --------------------------------------------------------------------
 */

/** * 核心：同步当前日历的年月显示状态 */
const syncYM = () => {
  year.value = currentDate.value.getFullYear();
  month.value = currentDate.value.getMonth() + 1;
};

/** * 工具：格式化 Date 对象为 YYYY-MM-DD */
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** * 核心：获取指定日期的农历、节假日及班休标志 */
const getLunarInfo = (dateStr: string) => {
  // 如果输入为空，直接返回默认值防报错
  if (!dateStr) return { text: '', isRedHoliday: false, badge: '', xingZuo: '' };
  if (lunarCache.has(dateStr)) return lunarCache.get(dateStr);

  const [y, m, d] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  let text: string;
  let isRedHoliday = false;
  let badge = '';
  // 获取星座并拼接“座”字
  const xingZuo = solar.getXingZuo() + '座';
  const h = HolidayUtil.getHoliday(y, m, d);
  if (h) badge = h.isWork() ? '班' : '休';

  const lf = lunar.getFestivals();
  const sf = solar.getFestivals();
  const jq = lunar.getJieQi();

  if (lf.length) {
    text = lf[0];
    isRedHoliday = true;
  } else if (sf.length) {
    text = sf[0];
    if (['元旦节', '劳动节', '国庆节'].includes(text)) isRedHoliday = true;
  } else if (jq) {
    text = jq;
    isRedHoliday = true;
  } else {
    text = lunar.getDayInChinese();
  }
  if (badge === '休') isRedHoliday = true;

  const r = { text, isRedHoliday, badge, xingZuo };
  lunarCache.set(dateStr, r);
  return r;
};
// 计算当前选中日期的星座
const currentZodiac = computed(() => {
  return selectedDate.value ? getLunarInfo(selectedDate.value).xingZuo : '';
});

// 根据星座和日期动态生成专属运势
//调用一言 Hook 提取变量
const { quote, from, fetchQuote } = useHitokoto();

//  调用自定义 Hook
const { weatherInfo, fetchWeather } = useWeather();
// 汇率相关逻辑
const { rates, updateTime, currencyOptions, fetchRate, calcExchange } = useExchangeRate();

const exchangeForm = reactive({
  amount: 1,
  from: 'USDT',
  to: 'CNY',
});

const exchangeResult = computed(() => {
  return calcExchange(exchangeForm.amount, exchangeForm.from, exchangeForm.to);
});

const swapCurrency = () => {
  const temp = exchangeForm.from;
  exchangeForm.from = exchangeForm.to;
  exchangeForm.to = temp;
};
/** * 存储：加载本地备忘录数据 */
const loadMemo = () => {
  const data = localStorage.getItem('salaryMemoMap');
  if (data) memoMap.value = JSON.parse(data);
};

/** * 保存当前日期备忘录到本地 (防抖保护版)
 * 用户连续输入时不触发，停下键盘 500ms 后静默存盘
 */
const saveMemo = debounce(() => {
  memoMap.value[selectedDate.value] = currentMemo.value;
  localStorage.setItem('salaryMemoMap', JSON.stringify(memoMap.value));
}, 500);

/** * 存储：加载本地计算器暂存记录 */
const loadNotes = () => {
  const saved = localStorage.getItem('salaryCalcNotes');
  if (saved) calcNotes.value = saved;
};

/** * 保存计算器暂存记录到本地 (防抖保护版)
 */
const saveNotesToLocal = debounce(() => {
  localStorage.setItem('salaryCalcNotes', calcNotes.value);
}, 500);

/** * 业务：将计算器当前结果追加至暂存区 */
const recordToNote = () => {
  if (!display.value || display.value === '错误') return;
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const formula = history.value ? `${history.value.replace('=', '')} = ` : '';
  const entry = `[${time}] ${formula}${display.value}\n`;
  calcNotes.value += entry;
  saveNotesToLocal();
};

/** * 业务：清空暂存区数据 */
const clearNotes = () => {
  calcNotes.value = '';
  saveNotesToLocal();
};

/**
 * --------------------------------------------------------------------
 * ⚡ 四、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  // 初始化日期状态
  selectedDate.value = formatDate(new Date());
  syncYM();

  // 初始化本地存储数据
  loadMemo();
  selectDate(selectedDate.value);
  loadNotes();

  // 挂载时获取宿务的实时天气
  fetchWeather();
  // 挂载时获取每日一言
  fetchQuote();

  // 挂载时获取基准汇率
  fetchRate('CNY');
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 页面私有样式定制区
   规范：负责 Dashboard 专用的网格、计算器与万年历深度定制
   ===================================================================== */

.dashboard-container {
  padding: 16px;
  height: calc(100vh - 84px);
  overflow-y: auto;
}

/*
========================
   1. 全局布局结构
========================
*/
.full-height-row {
  height: 100%;
  align-items: stretch;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-col {
  display: flex;
  flex-direction: column;
}

/*
========================
   2. 卡片通用系统 (继承暗黑基因)（统一质感）
========================
*/
.el-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.25s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  }

  html.dark & {
    background: #0f0f10;
    border: 1px solid rgba(255, 255, 255, 0.06);
    &:hover {
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
    }
  }
}
/* ===== 卡片通用头部 ===== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
    .header-icon {
      margin-right: 8px;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }
}
/*
========================
   3.万年历深度定制
========================
*/
.calendar-card {
  flex: 1;
}

/* 放开原生头部，重置边距，将布局权交给我们的自定义栏 */
:deep(.el-calendar__header) {
  display: block !important;
  padding: 12px 16px 8px !important;
  border-bottom: 1px solid var(--el-border-color-lighter) !important;

  html.dark & {
    border-bottom-color: rgba(255, 255, 255, 0.05) !important;
  }
}

.custom-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-bottom: 4px;

  .title {
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    .header-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }

  .calendar-toolbar {
    display: flex;
    align-items: center;
    .ym-label {
      width: 70px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      cursor: default;
      html.dark & {
        color: #ccc;
      }
    }
  }
}

/* 紧凑型日历网格 */
:deep(.el-calendar__body) {
  padding: 0 8px 12px;
}
:deep(.el-calendar-table thead th) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding: 8px 0;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

/* 周末表头标红 */
:deep(.el-calendar-table thead th:nth-child(6)),
:deep(.el-calendar-table thead th:nth-child(7)) {
  color: var(--el-color-danger);
}

/* 单元格基础重置 */
:deep(.el-calendar-table .el-calendar-day) {
  height: 64px !important;
  padding: 0;
  border: none;
}
:deep(.el-calendar-table td) {
  border: 1px solid var(--el-border-color-extra-light);
  html.dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
}
/* 融合 Dropdown 与 ButtonGroup */
.nav-group {
  display: inline-flex;
  :deep(.el-dropdown) {
    display: inline-flex;
    .el-button {
      border-radius: 0; /* 抹平中间按钮的圆角 */
      margin-left: -1px; /* 解决边框重叠变粗 */
    }
  }
}

/* 下拉菜单滚动与选中高亮 */
.custom-scroll-menu {
  max-height: 250px;
  overflow-y: auto;

  .is-active {
    color: var(--el-color-primary);
    font-weight: bold;
    background-color: var(--el-color-primary-light-9);
  }
}
/* 单元格核心交互设计 */
.date-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    background: var(--el-fill-color-light);
    html.dark & {
      background: #1a1a1a;
    }
  }

  &.is-today .solar-day {
    color: var(--el-color-primary) !important;
    font-weight: 800;
    font-size: 18px;
  }

  .solar-day {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    html.dark & {
      color: #e5eaf3;
    }
  }

  &.is-weekend .solar-day {
    color: var(--el-color-danger);
  }

  .lunar-day {
    font-size: 11px;
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.5px;
    html.dark & {
      color: #a3a6ad;
    }

    &.is-festival {
      color: var(--el-color-danger) !important;
      font-weight: 600;
    }
  }

  .classic-badge {
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 10px;
    line-height: 1;
    padding: 2px;
    border-radius: 2px;
    color: #fff;
    transform: scale(0.9);

    &.badge-rest {
      background: var(--el-color-danger);
    }
    &.badge-work {
      background: var(--el-color-info);
    }
  }

  .memo-dot {
    position: absolute;
    bottom: 3px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--el-color-primary);
  }
}

/* ===== 4. 财务计算器与暂存区定制 ===== */
.calculator-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.calc-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.calculator-core {
  background: var(--el-fill-color-extra-light);
  border-radius: 12px;
  padding: 14px;
  html.dark & {
    background: #111;
  }
}

.calc-screen {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
  text-align: right;
  border: 1px solid var(--el-border-color-lighter);

  html.dark & {
    background: #141414;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .screen-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 24px;

    .calc-history {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      font-family: monospace;
    }
  }
}

.calc-result {
  font-size: 28px;
  font-weight: 600;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
  font-family: 'Inter', 'SF Mono', monospace;
}

/* 极客计算器键盘 Grid */
.calc-keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  .key-btn {
    height: 46px;
    border-radius: 10px;
    border: none;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.12s ease;
    font-family: inherit;

    &:active {
      transform: scale(0.94);
    }
  }

  .key-zero {
    grid-column: span 2;
  }

  .key-num {
    background: var(--el-bg-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    &:hover {
      background: var(--el-fill-color-light);
    }
    html.dark & {
      background: #1a1a1a;
    }
  }

  .key-op {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 20px;
    box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
    html.dark & {
      background: rgba(var(--el-color-primary-rgb), 0.15);
    }
  }

  .key-func {
    background: var(--el-fill-color);
  }

  .key-eq {
    background: var(--el-color-primary);
    color: #fff;
    box-shadow: 0 6px 14px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

/* 记事本区域 */
.notepad-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.notepad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .notepad-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.mac-textarea {
  flex: 1;
  :deep(textarea) {
    height: 100%;
    border-radius: 10px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 13px;
    line-height: 1.6;
    background: var(--el-fill-color-blank);

    html.dark & {
      background: #111;
      color: #ddd;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  }
}
/* ========================
    欢迎看板 (Welcome Header)
======================== */
.welcome-row {
  margin-bottom: 16px;
}

:deep(.welcome-card-body) {
  padding: 16px 24px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.greeting-area {
  display: flex;
  align-items: center;
  gap: 16px;

  h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  .sub-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.status-widgets {
  display: flex;
  align-items: center;
  gap: 32px;
}

.widget-divider {
  height: 36px;
  margin: 0;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .widget-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.bg-warning-light {
      background: var(--el-color-warning-light-9);
      html.dark & {
        background: rgba(230, 162, 60, 0.15);
      }
    }
    &.bg-purple-light {
      background: #f3e8ff;
      html.dark & {
        background: rgba(138, 43, 226, 0.15);
      }
    }
  }

  .widget-info {
    display: flex;
    flex-direction: column;

    .value {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }
    .label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

/* 适配新增头部后的高度 */
.dashboard-container {
  /* 减去头部卡片大约的高度 */
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}
.full-height-row {
  flex: 1;
  min-height: 0; /* 防止内容撑破 flex 容器 */
}
/* ========================
   🌟 一言 (Hitokoto) 专属样式
======================== */
.hitokoto-display {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 13px;
  max-width: 420px; /* 防止句子过长撑破布局 */

  .quote-text {
    color: var(--el-text-color-regular);
    font-style: italic; /* 增加一点文学气息的斜体 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .quote-from {
    color: var(--el-text-color-secondary);
    margin-left: 6px;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* ========================
   🌟 汇率模块专属样式
======================== */
.bg-success-light {
  background: var(--el-color-success-light-9);
  html.dark & {
    background: rgba(103, 194, 58, 0.15);
  }
}

.clickable-widget {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
  padding: 4px 8px;
  border-radius: 8px;
  margin-left: -8px;

  &:hover {
    background: var(--el-fill-color-light);
    transform: translateY(-1px);
    html.dark & {
      background: #1a1a1a;
    }
  }
  &:active {
    transform: translateY(1px);
    opacity: 0.8;
  }
}

.exchange-calculator {
  .ex-header {
    background: var(--el-fill-color-light);
    padding: 12px 16px;
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    html.dark & {
      background: #1a1a1a;
      border-bottom-color: rgba(255, 255, 255, 0.05);
    }
  }

  .ex-body {
    padding: 16px;

    .currency-selectors {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .ex-result {
      background: var(--el-color-primary-light-9);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      color: var(--el-color-primary);

      html.dark & {
        background: rgba(64, 158, 255, 0.1);
      }

      .symbol {
        font-size: 14px;
        margin-right: 8px;
        opacity: 0.8;
      }
      .amount {
        font-size: 24px;
        font-weight: bold;
        font-variant-numeric: tabular-nums;
        font-family: 'Inter', 'SF Mono', monospace;
      }
    }
  }
}
/* =====================================================================
   🚀 风格联动：精准响应全局 MenuStyle 切换 (Brilliant vs Breeze)
   ===================================================================== */

/* --- 风格 A：实心高亮风 (Brilliant) --- */
html[data-menu-style='brilliant'] {
  .el-card {
    border-radius: 8px;
  }

  /* 万年历高亮选中态：实心粗暴方块 */
  .date-cell-inner.is-selected {
    background-color: var(--el-color-primary) !important;
    border: none !important;

    .solar-day,
    .lunar-day {
      color: #ffffff !important;
    }
    .memo-dot {
      background: #ffffff !important;
    }
  }

  /* 计算器硬朗按键 */
  .calc-keyboard .key-btn {
    border-radius: 4px;
    box-shadow: none;
  }
}

/* --- 风格 B：柔和呼吸风 (Breeze) --- */
html[data-menu-style='breeze'] {
  .el-card {
    border-color: var(--el-border-color-extra-light);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
  }

  /* 万年历呼吸选中态：复古金框暖底 */
  .date-cell-inner.is-selected {
    background-color: #fff9f0 !important;
    border: 2px solid #f59e0b !important;

    html.dark & {
      background-color: rgba(245, 158, 11, 0.1) !important;
      border-color: #d97706 !important;
    }
  }
}
</style>

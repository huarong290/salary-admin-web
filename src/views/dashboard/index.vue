<!--src/views/dashboard/index.vue-->

<template>
  <div class="app-container dashboard-container">
    <el-row :gutter="24" class="dashboard-row">
      <el-col :xs="24" :md="15" :lg="15" class="flex-col">
        <el-card
          class="dashboard-card calendar-card"
          :body-style="{ padding: '0px', flex: 1, display: 'flex', flexDirection: 'column' }"
        >
          <template #header>
            <div class="card-header">
              <span class="title">
                <div class="icon-wrapper">
                  <el-icon><Calendar /></el-icon>
                </div>
                工作与日历
              </span>
              <div class="calendar-controls">
                <el-date-picker
                  v-model="currentDate"
                  type="month"
                  placeholder="选择年月"
                  :clearable="false"
                  size="default"
                  class="custom-datepicker"
                />
                <el-button-group class="custom-btn-group">
                  <el-button @click="changeMonth(-1)">
                    <el-icon><ArrowLeft /></el-icon>
                  </el-button>
                  <el-button class="today-btn" @click="goToToday">今天</el-button>
                  <el-button @click="changeMonth(1)">
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <div class="calendar-body-wrapper">
            <el-calendar v-model="currentDate">
              <template #date-cell="{ data }">
                <div class="custom-date-cell" :class="{ 'is-today': data.isToday }">
                  <div
                    v-if="getLunarInfo(data.day).badge"
                    class="holiday-badge"
                    :class="getLunarInfo(data.day).badge === '休' ? 'badge-rest' : 'badge-work'"
                  >
                    {{ getLunarInfo(data.day).badge }}
                  </div>
                  <div class="solar-day amount-font">{{ data.day.split('-')[2] }}</div>
                  <div
                    class="lunar-day"
                    :class="{ 'is-holiday': getLunarInfo(data.day).isRedHoliday }"
                  >
                    {{ getLunarInfo(data.day).text }}
                  </div>
                </div>
              </template>
            </el-calendar>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="9" :lg="9" class="flex-col">
        <el-card
          class="dashboard-card calculator-card"
          :body-style="{ padding: '0px', flex: 1, display: 'flex', flexDirection: 'column' }"
        >
          <template #header>
            <div class="card-header">
              <span class="title">
                <div class="icon-wrapper bg-warning">
                  <el-icon><Monitor /></el-icon>
                </div>
                财务辅助计算
              </span>
            </div>
          </template>

          <div class="calculator-center-box">
            <div class="calculator-wrapper">
              <div class="calc-screen">
                <div class="calc-history amount-font">{{ historyExpression }}</div>
                <div class="calc-current amount-font" :class="{ 'error-text': isError }">
                  {{ calcDisplay || '0' }}
                </div>
              </div>

              <div class="calc-keypad">
                <el-button class="calc-btn func-btn" @click="clearAll">AC</el-button>
                <el-button class="calc-btn func-btn" @click="deleteChar">DEL</el-button>
                <el-button class="calc-btn func-btn" @click="appendOperator('%')">%</el-button>
                <el-button class="calc-btn op-btn" @click="appendOperator('/')">÷</el-button>

                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('7')"
                  >7</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('8')"
                  >8</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('9')"
                  >9</el-button
                >
                <el-button class="calc-btn op-btn" @click="appendOperator('*')">×</el-button>

                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('4')"
                  >4</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('5')"
                  >5</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('6')"
                  >6</el-button
                >
                <el-button class="calc-btn op-btn" @click="appendOperator('-')">-</el-button>

                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('1')"
                  >1</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('2')"
                  >2</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('3')"
                  >3</el-button
                >
                <el-button class="calc-btn op-btn" @click="appendOperator('+')">+</el-button>

                <el-button class="calc-btn num-btn zero-btn amount-font" @click="appendNumber('0')"
                  >0</el-button
                >
                <el-button class="calc-btn num-btn amount-font" @click="appendNumber('.')"
                  >.</el-button
                >
                <el-button class="calc-btn equal-btn" @click="calculateResult">=</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Calendar, Monitor, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import { Solar, HolidayUtil } from 'lunar-javascript';

// ==========================================
// 📅 万年历逻辑
// ==========================================
const currentDate = ref(new Date());

const changeMonth = (offset: number) => {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() + offset);
  currentDate.value = date;
};

const goToToday = () => {
  currentDate.value = new Date();
};

const lunarCache = new Map<string, { text: string; isRedHoliday: boolean; badge: string }>();

const getLunarInfo = (dateStr: string) => {
  if (lunarCache.has(dateStr)) return lunarCache.get(dateStr)!;

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    let text = '';
    let isRedHoliday = false;
    let badge = '';

    const statutoryHoliday = HolidayUtil.getHoliday(year, month, day);
    if (statutoryHoliday) {
      badge = statutoryHoliday.isWork() ? '班' : '休';
    }

    const lunarFestivals = lunar.getFestivals();
    const solarFestivals = solar.getFestivals();
    const jieQi = lunar.getJieQi();

    if (lunarFestivals.length > 0) {
      text = lunarFestivals[0];
      isRedHoliday = true;
    } else if (solarFestivals.length > 0) {
      text = solarFestivals[0];
      if (['元旦节', '劳动节', '国庆节', '妇女节', '青年节', '儿童节', '建军节'].includes(text)) {
        isRedHoliday = true;
      }
    } else if (jieQi) {
      text = jieQi;
      isRedHoliday = true;
    } else if (lunar.getDay() === 1) {
      text = lunar.getMonthInChinese() + '月';
    } else {
      text = lunar.getDayInChinese();
    }

    if (badge === '休') isRedHoliday = true;

    const result = { text, isRedHoliday, badge };
    lunarCache.set(dateStr, result);
    return result;
  } catch (e) {
    // 🌟 修复 ESLint: 将异常打印，消除变量 e 未使用警告
    console.warn('农历推算跳过:', e);
    return { text: '', isRedHoliday: false, badge: '' };
  }
};

// ==========================================
// 🧮 计算器逻辑
// ==========================================
const calcDisplay = ref('');
const historyExpression = ref('');
const isFinished = ref(false);
const isError = ref(false);

const isOperator = (char: string) => ['+', '-', '*', '/', '%'].includes(char);

const appendNumber = (num: string) => {
  if (isError.value) clearAll();
  if (isFinished.value) {
    calcDisplay.value = num;
    isFinished.value = false;
  } else {
    if (num === '.' && calcDisplay.value.includes('.')) {
      // 🌟 修复 ESLint: 使用 RegExp 构造函数完美消除"无用的正则转义"错误
      const parts = calcDisplay.value.split(new RegExp('[-+*/]'));
      if (parts[parts.length - 1]?.includes('.')) return;
    }
    if (calcDisplay.value === '0' && num !== '.') {
      calcDisplay.value = num;
    } else {
      calcDisplay.value += num;
    }
  }
};

const appendOperator = (op: string) => {
  if (isError.value) clearAll();
  if (!calcDisplay.value) return;

  isFinished.value = false;
  const lastChar = calcDisplay.value.slice(-1);

  if (isOperator(lastChar)) {
    calcDisplay.value = calcDisplay.value.slice(0, -1) + op;
  } else {
    calcDisplay.value += op;
  }
};

const clearAll = () => {
  calcDisplay.value = '';
  historyExpression.value = '';
  isFinished.value = false;
  isError.value = false;
};

const deleteChar = () => {
  if (isError.value || isFinished.value) {
    clearAll();
  } else {
    calcDisplay.value = calcDisplay.value.slice(0, -1);
  }
};

const calculateResult = () => {
  if (!calcDisplay.value || isError.value) return;

  const lastChar = calcDisplay.value.slice(-1);
  if (isOperator(lastChar)) {
    calcDisplay.value = calcDisplay.value.slice(0, -1);
  }

  try {
    historyExpression.value = calcDisplay.value.replace(/\*/g, '×').replace(/\//g, '÷') + ' =';
    if (/[^0-9+\-*/.%.\s]/.test(calcDisplay.value)) throw new Error('Invalid Expression');

    let result = new Function('return ' + calcDisplay.value)();
    if (!isFinite(result) || isNaN(result)) throw new Error('Math Error');

    result = Math.round(result * 100000000) / 100000000;
    calcDisplay.value = String(result);
    isFinished.value = true;
  } catch (e) {
    // 🌟 修复 ESLint: 将异常打印，消除变量 e 未使用警告
    console.warn('计算器解析异常:', e);
    calcDisplay.value = '错误';
    isError.value = true;
    isFinished.value = true;
  }
};
</script>

<style scoped lang="scss">
/* ==========================================
   🌐 总体布局 & 弥散阴影重塑层次
========================================== */
.dashboard-container {
  padding: 24px;
  background-color: var(--salary-bg-page); /* 页面底色加深一点点，凸显白卡片 */
}

.dashboard-row {
  height: calc(100vh - 100px);
  min-height: 700px; /* 防止屏幕太小时被极度挤压 */
}

.flex-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 🌟 卡片高级留白与阴影 */
.dashboard-card {
  border: none;
  border-radius: 16px; /* 更大的圆角 */
  background: #ffffff;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.04); /* 弥散阴影 */
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08); /* 悬浮加深层次 */
  }

  :deep(.el-card__header) {
    border-bottom: 1px solid var(--el-border-color-extra-light);
    padding: 20px 24px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px; /* 标题加粗加大 */
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--el-text-color-primary);

    /* 🌟 标题前的彩色 Icon 徽标，增加活跃感 */
    .icon-wrapper {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;

      &.bg-warning {
        background-color: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }
    }
  }
}

/* 🌟 头部组件美化 */
.calendar-controls {
  display: flex;
  align-items: center;
  gap: 16px;

  .custom-datepicker {
    width: 140px;
    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
    }
  }

  .custom-btn-group {
    .el-button {
      border-radius: 8px;
      border-color: var(--el-border-color-lighter);
      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
    .today-btn {
      font-weight: bold;
      color: var(--el-text-color-regular);
    }
  }
}

/* ==========================================
   📅 日历精调 (高级留白)
========================================== */
.calendar-body-wrapper {
  flex: 1;
  padding: 0 12px 12px; /* 增加四周呼吸感 */
  display: flex;
  flex-direction: column;
}

.calendar-card {
  :deep(.el-calendar) {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: transparent;
  }

  :deep(.el-calendar__header) {
    display: none;
  }

  :deep(.el-calendar__body) {
    flex: 1;
    padding: 0;

    .el-calendar-table {
      height: 100%;
      thead th {
        padding: 16px 0; /* 表头拉开高度 */
        color: var(--el-text-color-secondary);
        font-weight: 600;
        font-size: 15px;
      }
      td {
        border-bottom: 1px solid var(--el-border-color-extra-light);
        border-right: 1px solid var(--el-border-color-extra-light);
        transition: all 0.2s;
        padding: 4px; /* 让格子内部不要太挤 */

        &:hover {
          background-color: var(--el-fill-color-light);
        }
        &.prev,
        &.next {
          opacity: 0.25;
          background-color: transparent;
        }
      }
      /* 去除最外圈多余边框 */
      tr:last-child td {
        border-bottom: none;
      }
      td:last-child {
        border-right: none;
      }
    }
  }

  .custom-date-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    min-height: 85px; /* 🌟 核心：强制拉高格子高度，告别压扁感 */
    position: relative;
    border-radius: 8px; /* 内部加点圆角，hover时更好看 */

    .holiday-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 11px;
      width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      border-radius: 4px; /* 更柔和的角标 */
      font-weight: bold;
    }
    .badge-rest {
      color: #fff;
      background-color: var(--el-color-danger);
      box-shadow: 0 2px 6px rgba(var(--el-color-danger-rgb), 0.3);
    }
    .badge-work {
      color: #fff;
      background-color: var(--el-text-color-secondary);
    }

    .solar-day {
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .lunar-day {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 6px;
      font-family: '楷体', 'KaiTi', serif;

      &.is-holiday {
        color: var(--el-color-danger);
        font-weight: 600;
      }
    }

    &.is-today {
      .solar-day {
        color: #fff;
        background-color: var(--el-color-primary);
        width: 36px;
        height: 36px;
        line-height: 36px;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
      }
      .lunar-day {
        color: var(--el-color-primary);
        font-weight: bold;
      }
    }
  }
}

/* ==========================================
   🧮 财务计算器 (Soft UI / 拟真深度)
========================================== */
.calculator-center-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fc; /* 🌟 极简淡灰蓝底色，平衡左侧白板 */
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  padding: 30px;
}

.calculator-wrapper {
  width: 100%;
  max-width: 360px;
  background-color: #ffffff;
  border-radius: 24px;
  padding: 28px 24px;
  /* 🌟 Soft UI 核心阴影：左上亮光 + 右下暗影，模拟真实立体设备 */
  box-shadow:
    12px 12px 30px rgba(0, 0, 0, 0.06),
    -12px -12px 30px rgba(255, 255, 255, 0.8),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.calc-screen {
  background-color: #f0f3f8; /* 屏幕底色微暗 */
  border-radius: 12px;
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  min-height: 110px; /* 拉开屏幕空间 */
  margin-bottom: 24px;
  /* 🌟 内阴影，做出屏幕凹陷效果 */
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--el-border-color-lighter);

  .calc-history {
    font-size: 15px;
    color: var(--el-text-color-placeholder);
    min-height: 22px;
    margin-bottom: 8px;
  }

  .calc-current {
    font-size: 46px; /* 更大气 */
    font-weight: 500;
    color: #2c3e50;
    word-break: break-all;
    text-align: right;
    line-height: 1;
    letter-spacing: -1px;

    &.error-text {
      color: var(--el-color-danger);
    }
  }
}

.calc-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px; /* 拉大按钮间距，消除局促感 */

  .calc-btn {
    margin: 0;
    height: 60px; /* 按钮饱满 */
    border-radius: 16px; /* 苹果风圆角矩形 */
    font-size: 22px;
    border: none;
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    /* 给按钮加一点极轻微的阴影，让它鼓起来 */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);

    &:active {
      transform: scale(0.92) translateY(2px);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.02);
    }
  }

  .func-btn {
    background-color: #e4e7ed;
    color: var(--el-text-color-primary);
    font-size: 20px;
    &:hover {
      background-color: #dcdfe6;
    }
  }

  .num-btn {
    background-color: #ffffff;
    border: 1px solid var(--el-border-color-extra-light);
    color: var(--el-text-color-primary);
    font-weight: 500;
    &:hover {
      background-color: #f5f7fa;
    }
  }

  .op-btn {
    background-color: var(--el-color-warning-light-8);
    color: var(--el-color-warning);
    font-weight: 600;
    font-size: 26px;
    &:hover {
      background-color: var(--el-color-warning-light-7);
    }
  }

  .zero-btn {
    grid-column: span 2;
    text-align: left;
    padding-left: 28px;
  }

  .equal-btn {
    background-color: var(--el-color-primary);
    color: #fff;
    font-size: 28px;
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
    &:hover {
      background-color: var(--el-color-primary-light-3);
    }
    &:active {
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}
</style>

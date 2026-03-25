<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="full-height-row">
      <el-col :xs="24" :md="14" class="left-col">
        <el-card shadow="hover" class="calendar-card" body-class="calendar-card-body">
          <el-calendar v-model="currentDate">
            <template #header>
              <div class="custom-calendar-header">
                <span class="title">
                  <el-icon class="header-icon"><Calendar /></el-icon>
                  工作与日程
                </span>
                <div class="actions">
                  <el-date-picker
                    v-model="currentDate"
                    type="month"
                    size="small"
                    :clearable="false"
                    class="month-picker"
                  />
                  <el-button-group size="small">
                    <el-button @click="changeMonth(-1)">‹ 上月</el-button>
                    <el-button type="primary" plain @click="goToday">今天</el-button>
                    <el-button @click="changeMonth(1)">下月 ›</el-button>
                  </el-button-group>
                </div>
              </div>
            </template>

            <template #date-cell="{ data }">
              <div
                class="date-cell-inner"
                :class="{ today: data.isToday, selected: data.day === selectedDate }"
                @click="selectDate(data.day)"
              >
                <div
                  v-if="getLunarInfo(data.day).badge"
                  class="holiday-badge"
                  :class="getLunarInfo(data.day).badge === '休' ? 'is-rest' : 'is-work'"
                >
                  {{ getLunarInfo(data.day).badge }}
                </div>

                <div class="solar-day">{{ data.day.split('-')[2] }}</div>
                <div class="lunar-day" :class="{ 'is-red': getLunarInfo(data.day).isRedHoliday }">
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
              <span class="title"
                ><el-icon><Notebook /></el-icon> {{ selectedDate }} 备忘录</span
              >
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
              <span class="title"
                ><el-icon><Operation /></el-icon> 财务极客计算器</span
              >
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
              <span class="notepad-title"
                ><el-icon><EditPen /></el-icon> 计算结果暂存区</span
              >
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
import { ref } from 'vue';
import { Solar, HolidayUtil } from 'lunar-javascript';
import { Calendar, Operation, DocumentAdd, EditPen, Notebook } from '@element-plus/icons-vue';

// ================= 日期与日历逻辑 =================
const currentDate = ref(new Date());
const selectedDate = ref(formatDate(new Date()));

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const changeMonth = (n: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + n);
  currentDate.value = d;
};

const goToday = () => {
  const d = new Date();
  currentDate.value = d;
  selectedDate.value = formatDate(d);
};

// ================= 日历备忘录逻辑 =================
const memoMap = ref<Record<string, string>>({});
const currentMemo = ref('');

const loadMemo = () => {
  const data = localStorage.getItem('salaryMemoMap');
  if (data) memoMap.value = JSON.parse(data);
};
const selectDate = (day: string) => {
  selectedDate.value = day;
  currentMemo.value = memoMap.value[day] || '';
};
const saveMemo = () => {
  memoMap.value[selectedDate.value] = currentMemo.value;
  localStorage.setItem('salaryMemoMap', JSON.stringify(memoMap.value));
};
loadMemo();
selectDate(selectedDate.value);

// ================= 农历与节假日逻辑 =================
const cache = new Map();
const getLunarInfo = (dateStr: string) => {
  if (cache.has(dateStr)) return cache.get(dateStr);

  const [y, m, d] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();

  let text: string;
  let isRedHoliday = false;
  let badge = '';

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

  const r = { text, isRedHoliday, badge };
  cache.set(dateStr, r);
  return r;
};

// ================= 计算器与记事本逻辑 =================
const display = ref('');
const history = ref('');
const calcNotes = ref('');

const loadNotes = () => {
  const saved = localStorage.getItem('salaryCalcNotes');
  if (saved) calcNotes.value = saved;
};
loadNotes();

const saveNotesToLocal = () => {
  localStorage.setItem('salaryCalcNotes', calcNotes.value);
};

const num = (n: string) => (display.value += n);
const op = (o: string) => (display.value += o);
const clear = () => {
  display.value = '';
  history.value = '';
};
const del = () => (display.value = display.value.slice(0, -1));

const calc = () => {
  try {
    history.value = display.value + ' =';
    display.value = String(Function('return ' + display.value)());
  } catch {
    display.value = '错误';
  }
};

const recordToNote = () => {
  if (!display.value || display.value === '错误') return;
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const formula = history.value ? `${history.value.replace('=', '')} = ` : '';
  const entry = `[${time}] ${formula}${display.value}\n`;
  calcNotes.value += entry;
  saveNotesToLocal();
};

const clearNotes = () => {
  calcNotes.value = '';
  saveNotesToLocal();
};
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 16px;
  height: calc(100vh - 84px); /* 适配布局高度 */
  overflow-y: auto;
}

/* ===== 布局结构 ===== */
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

/* ===== 📅 日历定制优化 ===== */
.calendar-card {
  flex: 1;
}

/* 完美接管原生 header */
.custom-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .title {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
    .header-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }
  }
  .actions {
    display: flex;
    align-items: center;
  }
  .month-picker {
    width: 130px;
    margin-right: 12px;
  }
}

/* 清理日历内部边距 */
:deep(.el-calendar__body) {
  padding: 0 16px 16px;
}
:deep(.el-calendar-table .el-calendar-day) {
  height: 60px !important; /* 强制瘦身 */
  padding: 0;
}

.date-cell-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 2px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
  &.selected {
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  }

  .solar-day {
    font-weight: 600;
    font-size: 15px;
    color: var(--el-text-color-primary);
  }

  .lunar-day {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
    &.is-red {
      color: var(--el-color-danger);
    }
  }

  .holiday-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 4px;
    color: #fff;
    transform: scale(0.8);
    &.is-rest {
      background-color: var(--el-color-danger);
    }
    &.is-work {
      background-color: var(--el-color-info);
    }
  }

  .memo-dot {
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
  }
}

/* ===== 🧮 计算器与记事本核心重构 ===== */
.calculator-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.calc-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.calculator-core {
  background: var(--el-fill-color-extra-light);
  border-radius: 12px;
  padding: 16px;
}

.calc-screen {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  text-align: right;

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

  .calc-result {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }
}

/* 🌟 最核心的 Grid 修复：使用绝对纯净的网格系统 */
.calc-keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;

  .key-btn {
    box-sizing: border-box;
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.15s,
      transform 0.1s;
    font-family: inherit;

    &:active {
      transform: scale(0.95);
    }
  }

  .key-zero {
    grid-column: 1 / 3; /* 跨两列 */
  }

  .key-num {
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .key-op {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 22px;
    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }

  .key-func {
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    font-size: 16px;
    &:hover {
      background: var(--el-fill-color-darker);
    }
  }

  .key-eq {
    background: var(--el-color-primary);
    color: #fff;
    &:hover {
      opacity: 0.9;
    }
  }
}

/* ===== 📝 文本域定制 ===== */
.notepad-area {
  flex: 1;
  display: flex;
  flex-direction: column;

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
}

/* 适配原生和暗黑的输入框 */
.mac-textarea {
  flex: 1;
  :deep(textarea) {
    height: 100%;
    background-color: var(--el-fill-color-blank);
    font-family: monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 12px;
    border-radius: 8px;
    border-color: var(--el-border-color-lighter);

    &:focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }
  }
}
</style>

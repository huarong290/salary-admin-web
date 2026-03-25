<template>
  <div class="dashboard-container">
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
                    <el-button plain class="ym-label">{{ year }}年</el-button>
                    <el-button @click="changeYear(1)">»</el-button>
                  </el-button-group>

                  <el-button-group size="small" class="nav-group" style="margin: 0 10px">
                    <el-button @click="changeMonth(-1)">‹</el-button>
                    <el-button plain class="ym-label">{{ month }}月</el-button>
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
import { ref } from 'vue';
import { Solar, HolidayUtil } from 'lunar-javascript';
import { Calendar, Operation, DocumentAdd, EditPen, Notebook } from '@element-plus/icons-vue';

// ================= 日期与日历逻辑 =================
const currentDate = ref(new Date());
const selectedDate = ref(formatDate(new Date()));
const year = ref(new Date().getFullYear());
const month = ref(new Date().getMonth() + 1);

const syncYM = () => {
  year.value = currentDate.value.getFullYear();
  month.value = currentDate.value.getMonth() + 1;
};

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const changeYear = (n: number) => {
  const d = new Date(currentDate.value);
  d.setFullYear(d.getFullYear() + n);
  currentDate.value = d;
  syncYM();
};

const changeMonth = (n: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + n);
  currentDate.value = d;
  syncYM();
};

const goToday = () => {
  const d = new Date();
  currentDate.value = d;
  selectedDate.value = formatDate(d);
  syncYM();
};

// 初始化同步
syncYM();

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

  // 🌟 彻底消灭 "This assigned value is not used" 警告
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
  height: calc(100vh - 84px);
  overflow-y: auto;
}

/* ========================
   🌟 卡片系统（统一质感）
======================== */
.el-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: all 0.25s ease;

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  }

  /* 🌙 暗黑重构（核心提升） */
  html.dark & {
    background: #0f0f10;
    border: 1px solid rgba(255, 255, 255, 0.06);

    &:hover {
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
    }
  }
}

/* ===== 布局 ===== */
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

/* ========================
   📅 万年历深度定制
======================== */
.calendar-card {
  flex: 1;
}

/* 接管头部栏 */
/*放开原生头部，重置边距，将布局权交给我们的自定义栏 */
:deep(.el-calendar__header) {
  display: block !important;
  padding: 12px 16px 8px !important;
  border-bottom: 1px solid var(--el-border-color-lighter) !important;

  /* 暗黑模式边框适配 */
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

/* 表头：一二三四五六日 */
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
  height: 64px !important; /* 黄金比例高度 */
  padding: 0;
  border: none;
}
:deep(.el-calendar-table td) {
  border: 1px solid var(--el-border-color-extra-light);
  html.dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
}

/* 🌟 单元格核心设计 */
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

  /* 选中态：经典万年历橘黄边框 */
  &.is-selected {
    background-color: #fff9f0 !important;
    border: 2px solid #f59e0b !important;

    html.dark & {
      background-color: rgba(245, 158, 11, 0.1) !important;
      border-color: #d97706 !important;
    }
  }

  /* 今天：主色调加强 */
  &.is-today .solar-day {
    color: var(--el-color-primary) !important;
    font-weight: 800;
    font-size: 18px;
  }

  /* 阳历数字 */
  .solar-day {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    html.dark & {
      color: #e5eaf3;
    }
  }

  /* 周末逻辑：阳历标红 */
  &.is-weekend .solar-day {
    color: var(--el-color-danger);
  }

  /* 农历文字 */
  .lunar-day {
    font-size: 11px;
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.5px;
    html.dark & {
      color: #a3a6ad;
    }

    /* 节气/节日标红 */
    &.is-festival {
      color: var(--el-color-danger) !important;
      font-weight: 600;
    }
  }

  /* 经典万年历角标 */
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

/* ========================
   🧮 计算器与记事本
======================== */
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

/* 🌟 极客计算器键盘 Grid */
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
      background: rgba(64, 158, 255, 0.15);
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

/* ========================
   📝 记事本区域
======================== */
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
</style>

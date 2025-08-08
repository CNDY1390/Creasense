<template>
  <div class="dashboard-view">
    <!-- <header class="header">
      <div></div>
      <div class="page-title item-headline">{{ t("dashboard.title") }}</div>
      <div></div>
    </header> -->

    <section class="dashboard-content">
      <!-- 用户信息头部 -->
      <div class="user-header">
        <ion-avatar class="user-avatar">
          <img :src="userInfo?.avatar" :alt="t('profile.personalInfo.name')" />
        </ion-avatar>
        <div class="greeting">
          <span class="hello">{{ getGreeting() }}</span>
          <div class="user-name item-body">{{ userInfo?.name }}</div>
        </div>
        <div class="header-actions">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <i class="fa-solid fa-bell notification-icon"></i>
        </div>
      </div>

      <!-- 变化趋势标题 -->
      <div class="section-header">
        <div class="item-title">{{ t("dashboard.trends.title") }}</div>
        <span class="view-all">{{ t("dashboard.trends.viewAll") }}</span>
      </div>

      <!-- 趋势图表卡片 -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="period-selector">
            <button
              v-for="period in chartPeriods"
              :key="period.value"
              :class="['period-btn', { active: selectedPeriod === period.value }]"
              @click="selectPeriod(period.value)"
            >
              {{ t(`dashboard.trends.periods.${period.value}`) }}
            </button>
          </div>

          <!-- 日期导航（仅daily模式显示） -->
          <div v-if="selectedPeriod === 'daily'" class="date-navigation">
            <button
              class="nav-btn"
              :class="{ 'nav-btn-disabled': isAtOldestData }"
              @click="navigateDate('prev')"
              :disabled="isAtOldestData"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="date-range" @click="openDatePicker">{{ getDateRangeText() }}</span>
            <button
              class="nav-btn"
              :class="{ 'nav-btn-disabled': isAtLatestData }"
              @click="navigateDate('next')"
              :disabled="isAtLatestData"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="chart-container">
          <div v-if="isChartLoading" class="chart-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>加载图表数据中...</p>
          </div>
          <canvas v-else ref="chartCanvas" width="300" height="200"></canvas>
        </div>
      </div>

      <!-- 健康状态卡片组 -->
      <div class="health-cards">
        <!-- 肌酐水平卡片 -->
        <div
          class="card metric-card"
          :class="{ 'no-data-card': !hasValidData }"
          @click="!hasValidData && switchToDevices()"
        >
          <div class="metric-status">
            <span class="status-text">{{ t("dashboard.healthStatus.currentLevel") }}</span>
            <span class="status-level item-title" :class="mergedHealthStatus?.creatinine?.level">
              {{
                mergedHealthStatus?.creatinine?.level === "unknown" ||
                !mergedHealthStatus?.creatinine?.level
                  ? t("dashboard.healthStatus.noData")
                  : t(`dashboard.healthStatus.${mergedHealthStatus.creatinine.level}`)
              }}
            </span>
          </div>
          <div class="metric-circle">
            <div class="progress-ring">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                style="display: block; position: relative"
              >
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color: #f4d03f; stop-opacity: 1" />
                    <stop offset="50%" style="stop-color: #f39c12; stop-opacity: 1" />
                    <stop offset="100%" style="stop-color: #e67e22; stop-opacity: 1" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="45" fill="none" stroke="transparent" stroke-width="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="url(#progressGradient)"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                  transform="rotate(-90 60 60)"
                  class="progress-stroke"
                />
              </svg>
              <div class="circle-content">
                <div class="percentage item-title">
                  {{ mergedHealthStatus?.creatinine?.percentage }}%
                </div>
              </div>
            </div>
            <div class="current-value">
              <span class="label"
                >{{ t("dashboard.healthStatus.currentValue")
                }}<span class="value"
                  >{{ mergedHealthStatus?.creatinine?.value
                  }}{{ showCreatinineUnit ? " μmol/L" : "" }}</span
                ></span
              >
            </div>
          </div>
          <!-- 无数据时的连接提示 -->
          <div v-if="!hasValidData" class="connect-hint">
            <i class="fa-solid fa-microchip"></i>
            <span>{{ t("dashboard.noData.connectDevice") }}</span>
          </div>
        </div>

        <!-- 患病概率卡片 -->
        <div class="card risk-card">
          <div class="item-body">{{ t("dashboard.healthStatus.diseaseProbability") }}</div>
          <div class="risk-display">
            <div class="risk-percentage item-title">---%</div>
            <div class="risk-advice">
              <div class="item-body">{{ t("dashboard.healthStatus.personalizedAdvice") }}</div>
              <p>{{ t("dashboard.healthStatus.keepHealthy") }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 日期选择弹窗 -->
    <div v-if="showDatePicker" class="date-picker-overlay" @click="cancelDateSelection">
      <div class="date-picker-modal" @click.stop>
        <div class="date-picker-header">
          <div class="item-body">选择日期范围</div>
          <button class="close-btn" @click="cancelDateSelection">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="date-picker-content">
          <!-- 最新数据日期提示 -->
          <div class="latest-data-info">
            <i class="fa-solid fa-info-circle"></i>
            <span
              >最新数据日期:
              {{
                getLatestDataDate().toLocaleDateString(getDateLocale(getCurrentAppLanguage()))
              }}</span
            >
          </div>

          <!-- 模式选择 -->
          <div class="mode-selector">
            <label class="mode-option">
              <input type="radio" v-model="datePickerMode" value="range" name="dateMode" />
              <span>开始日期 - 结束日期</span>
            </label>
            <label class="mode-option">
              <input type="radio" v-model="datePickerMode" value="days" name="dateMode" />
              <span>跨天数</span>
            </label>
          </div>

          <!-- 日期范围模式 -->
          <div v-if="datePickerMode === 'range'" class="date-inputs">
            <div class="input-group">
              <label>开始日期</label>
              <input
                type="date"
                v-model="startDate"
                class="date-input"
                :max="getLatestDataDate().toISOString().split('T')[0]"
              />
            </div>
            <div class="input-group">
              <label>结束日期</label>
              <input
                type="date"
                v-model="endDate"
                class="date-input"
                :max="getLatestDataDate().toISOString().split('T')[0]"
              />
            </div>
          </div>

          <!-- 跨天数模式 -->
          <div v-if="datePickerMode === 'days'" class="days-input">
            <div class="input-group">
              <label>跨天数</label>
              <input type="number" v-model="customDays" min="1" max="30" class="number-input" />
            </div>
          </div>
        </div>

        <div class="date-picker-actions">
          <button class="btn btn-secondary" @click="cancelDateSelection">取消</button>
          <button class="btn btn-primary" @click="applyDateSelection">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { IonAvatar } from "@ionic/vue";

import { Chart, registerables } from "chart.js";
import { localDataManager } from "@/services/LocalDataManager";

import { getDataForPeriod } from "@/utils/chartDataUtils";
import type { UserData, HealthStatus, ChartData } from "@/types/app";
import { useI18n, getCurrentAppLanguage } from "@/composables/useI18n";
import { getDateLocale } from "@/composables/locales-config";
import { useTextSelection } from "@/composables/useTextSelection";
import { getCurrentCreatinine, clearCreatinine } from "@/utils/globalCreatinine";

// 初始化i18n
const { t } = useI18n();

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return t("dashboard.greeting.goodNight");
  if (hour < 12) return t("dashboard.greeting.goodMorning");
  if (hour < 18) return t("dashboard.greeting.goodAfternoon");
  return t("dashboard.greeting.goodEvening");
};

// 初始化文字选择管理
const { isInitialized: textSelectionInitialized } = useTextSelection();

// 初始化全局肌酐变量

Chart.register(...registerables);

const router = useRouter();
const chartCanvas = ref<HTMLCanvasElement>();
let chartInstance: Chart | null = null;

const userInfo = ref<UserData>();
const healthStatus = ref<HealthStatus>();
const chartData = ref<ChartData>();

const isChartLoading = ref(false);

// 图表时间选择
const selectedPeriod = ref("daily");
const chartPeriods = computed(() => [
  { label: t("dashboard.trends.periods.daily"), value: "daily" },
  { label: t("dashboard.trends.periods.weekly"), value: "weekly" },
  { label: t("dashboard.trends.periods.monthly"), value: "monthly" },
]);

// 日期范围控制（仅用于daily模式）
const currentDate = ref(new Date());
const dateRangeDays = ref(7); // 显示7天的数据

// 获取最新数据日期
const getLatestDataDate = (): Date => {
  const rawData = chartData.value?.rawData || [];
  if (rawData.length === 0) {
    console.log("[Dashboard] 没有数据，使用当前日期");
    return new Date();
  }

  // 找到最新的数据日期
  const dataDates = rawData.map((point) => new Date(point.time));
  const latestDate = new Date(Math.max(...dataDates.map((d) => d.getTime())));

  console.log("[Dashboard] 最新数据日期:", latestDate.toISOString());
  return latestDate;
};

// 日期选择弹窗状态
const showDatePicker = ref(false);
const datePickerMode = ref<"range" | "days">("range"); // range: 开始-结束日期, days: 跨天数
const startDate = ref(new Date());
const endDate = ref(new Date());
const customDays = ref(7);

// 计算是否到达最旧数据
const isAtOldestData = computed(() => {
  if (selectedPeriod.value !== "daily") return false;
  const availableSegments = getAvailableDateSegments();
  if (availableSegments.length === 0) return false;

  // 如果当前日期是第一个可用段，则认为到达最旧数据
  return (
    currentDate.value.toISOString().split("T")[0] ===
    availableSegments[0].toISOString().split("T")[0]
  );
});

// 计算是否到达最新数据
const isAtLatestData = computed(() => {
  if (selectedPeriod.value !== "daily") return false;
  const availableSegments = getAvailableDateSegments();
  if (availableSegments.length === 0) return false;

  // 如果当前日期是最后一个可用段，则认为到达最新数据
  return (
    currentDate.value.toISOString().split("T")[0] ===
    availableSegments[availableSegments.length - 1].toISOString().split("T")[0]
  );
});

const selectPeriod = async (period: string) => {
  // 如果点击的是当前已选中的周期，则不执行任何操作
  if (selectedPeriod.value === period) {
    console.log("[Dashboard] 当前已选中该周期，跳过刷新:", period);
    return;
  }

  selectedPeriod.value = period;
  console.log("[Dashboard] 切换到时间周期:", period);

  // 根据选择的时间周期更新图表
  await createChart();
};

// 获取可用的日期段（以数据段为基准）
const getAvailableDateSegments = () => {
  const rawData = chartData.value?.rawData || [];
  if (rawData.length === 0) return [];

  // 按日期分组数据
  const dateGroups = new Map<string, Date>();
  rawData.forEach((point) => {
    const date = new Date(point.time);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, date);
    }
  });

  // 转换为数组并排序
  const availableDates = Array.from(dateGroups.values()).sort((a, b) => a.getTime() - b.getTime());

  // 按 dateRangeDays 分组
  const segments = [];
  for (let i = 0; i <= availableDates.length - dateRangeDays.value; i++) {
    segments.push(availableDates[i + dateRangeDays.value - 1]); // 使用结束日期
  }

  return segments;
};

// 日期导航函数
const navigateDate = async (direction: "prev" | "next") => {
  if (selectedPeriod.value !== "daily") return;

  const availableSegments = getAvailableDateSegments();
  if (availableSegments.length === 0) return;

  // 找到当前日期在可用段中的位置
  const currentIndex = availableSegments.findIndex(
    (segment) =>
      segment.toISOString().split("T")[0] === currentDate.value.toISOString().split("T")[0]
  );

  if (currentIndex === -1) {
    // 如果当前日期不在可用段中，使用最新段
    currentDate.value = availableSegments[availableSegments.length - 1];
    await createChart();
    return;
  }

  // 计算新位置
  const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

  // 检查边界
  if (newIndex < 0 || newIndex >= availableSegments.length) {
    console.log(`[Dashboard] 尝试导航到边界之外，已阻止: ${direction}`);
    return;
  }

  currentDate.value = availableSegments[newIndex];
  console.log(`[Dashboard] 导航日期: ${direction}, 新日期: ${currentDate.value.toISOString()}`);
  await createChart();
};

// 格式化日期范围显示
const getDateRangeText = () => {
  if (selectedPeriod.value !== "daily") return "";

  const endDate = new Date(currentDate.value);
  const startDate = new Date(currentDate.value);
  startDate.setDate(endDate.getDate() - dateRangeDays.value + 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(getDateLocale(getCurrentAppLanguage()), {
      month: "short",
      day: "numeric",
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// 打开日期选择弹窗
const openDatePicker = () => {
  if (selectedPeriod.value !== "daily") return;

  // 获取最新数据日期
  const latestDataDate = getLatestDataDate();

  // 初始化弹窗数据
  const endDateTemp = new Date(currentDate.value);
  const startDateTemp = new Date(currentDate.value);
  startDateTemp.setDate(endDateTemp.getDate() - dateRangeDays.value + 1);

  startDate.value = startDateTemp;
  endDate.value = endDateTemp;
  customDays.value = dateRangeDays.value;
  datePickerMode.value = "range";
  showDatePicker.value = true;

  console.log("[Dashboard] 打开日期选择器，最新数据日期:", latestDataDate.toISOString());
};

// 应用日期选择
const applyDateSelection = async () => {
  const latestDataDate = getLatestDataDate();

  if (datePickerMode.value === "range") {
    // 使用开始和结束日期
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    // 确保结束日期不超过最新数据日期
    if (end > latestDataDate) {
      console.log("[Dashboard] 结束日期超过最新数据日期，已调整");
      end.setTime(latestDataDate.getTime());
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 0) {
      dateRangeDays.value = daysDiff;
      currentDate.value = end;
    }
  } else {
    // 使用跨天数
    dateRangeDays.value = customDays.value;
    // 确保当前日期不超过最新数据日期
    if (currentDate.value > latestDataDate) {
      currentDate.value = new Date(latestDataDate);
    }
  }

  showDatePicker.value = false;
  console.log("[Dashboard] 应用日期选择:", {
    mode: datePickerMode.value,
    days: dateRangeDays.value,
    currentDate: currentDate.value.toISOString(),
  });
  await createChart();
};

// 取消日期选择
const cancelDateSelection = () => {
  showDatePicker.value = false;
};

const circumference = computed(() => 2 * Math.PI * 45);
const dashOffset = computed(() => {
  const percentage = mergedHealthStatus.value?.creatinine?.percentage
    ? mergedHealthStatus.value.creatinine.percentage / 100
    : 0;
  return circumference.value - percentage * circumference.value;
});

// 肌酐单位显示控制
const showCreatinineUnit = computed(() => {
  const userSettings = userInfo.value?.settings?.showCreatinineUnit;
  console.log(
    "[Dashboard] showCreatinineUnit computed:",
    userSettings,
    "userInfo.settings:",
    userInfo.value?.settings
  );
  return userSettings;
});

// 合并本地数据和全局肌酐数据
const mergedHealthStatus = computed(() => {
  const localStatus = healthStatus.value;
  const globalCreatinine = getCurrentCreatinine();

  // 如果有全局肌酐数据，优先使用
  if (globalCreatinine && globalCreatinine.value !== null) {
    console.log("[Dashboard] 使用全局肌酐数据:", globalCreatinine);
    return {
      ...localStatus,
      creatinine: {
        value: globalCreatinine.value,
        unit: globalCreatinine.unit,
        level: getCreatinineLevel(globalCreatinine.value),
        percentage: calculatePercentage(globalCreatinine.value),
        timestamp: new Date(globalCreatinine.timestamp).toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // 否则使用本地数据
  console.log("[Dashboard] 使用本地肌酐数据");
  return localStatus;
});

// 获取肌酐水平等级
const getCreatinineLevel = (value: number): string => {
  if (value <= 0) return "unknown";
  if (value < 60) return "low";
  if (value <= 120) return "normal";
  if (value <= 200) return "high";
  return "critical";
};

// 计算肌酐百分比
const calculatePercentage = (value: number): number => {
  if (value <= 0) return 0;
  // 基于正常范围60-120计算百分比
  const maxValue = 200;
  return Math.min((value / maxValue) * 100, 100);
};

// 检查是否有有效数据
const hasValidData = computed(() => {
  const status = mergedHealthStatus.value;
  if (!status?.creatinine) return false;

  // 检查是否有有效的肌酐数据
  const creatinine = status.creatinine;
  return creatinine.value > 0 && creatinine.level !== "unknown";
});

// 切换到设备tab
const switchToDevices = () => {
  console.log("[Dashboard] 切换到设备tab");
  // 使用事件总线或直接操作tab
  window.dispatchEvent(
    new CustomEvent("switch-tab", {
      detail: { tab: "devices" },
    })
  );
};

const createChart = async () => {
  if (!chartCanvas.value) return;

  isChartLoading.value = true;

  try {
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = chartCanvas.value.getContext("2d");
    if (!ctx) return;

    // 根据选择的时间周期获取数据
    // console.log("[Dashboard] 当前图表数据:", chartData.value);
    // console.log("[Dashboard] 选择的周期:", selectedPeriod.value);

    let data: Array<{ time?: string; date?: string; month?: string; value: number }>;

    if (selectedPeriod.value === "daily") {
      // daily模式使用日期范围过滤
      const endDate = new Date(currentDate.value);
      const startDate = new Date(currentDate.value);
      startDate.setDate(endDate.getDate() - dateRangeDays.value + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // console.log(
      //   "[Dashboard] Daily模式日期范围:",
      //   startDate.toISOString(),
      //   "到",
      //   endDate.toISOString()
      // );

      // 过滤指定日期范围的数据
      const rawData = chartData.value?.rawData || [];
      const filteredData = rawData.filter((point) => {
        const pointTime = new Date(point.time);
        return pointTime >= startDate && pointTime <= endDate;
      });

      data = filteredData.map((point) => ({
        time: point.time,
        value: point.value,
      }));
    } else {
      // 其他模式使用原有逻辑
      if (chartData.value) {
        data = getDataForPeriod(chartData.value, selectedPeriod.value as "weekly" | "monthly");
      } else {
        data = [];
      }
    }

    // console.log("[Dashboard] 计算得到的数据:", data);

    let labels: string[] = [];

    switch (selectedPeriod.value) {
      case "daily":
        labels = data.map((item) => {
          if (!item.time) {
            console.error("[Dashboard] daily模式下缺少time字段:", item);
            throw new Error("daily模式下缺少time字段");
          }
          const time = new Date(item.time);
          return time.toLocaleTimeString(getDateLocale(getCurrentAppLanguage()), {
            hour: "2-digit",
            minute: "2-digit",
          });
        });
        break;
      case "weekly":
        labels = data.map((item) => {
          if (!item.date) {
            console.error("[Dashboard] weekly模式下缺少date字段:", item);
            throw new Error("weekly模式下缺少date字段");
          }
          const date = new Date(item.date);
          return date.toLocaleDateString(getDateLocale(getCurrentAppLanguage()), {
            month: "short",
            day: "numeric",
          });
        });
        break;
      case "monthly":
        labels = data.map((item) => {
          console.log("[Dashboard] Monthly item:", item);
          if (!item.month) {
            console.error("[Dashboard] monthly模式下缺少month字段:", item);
            throw new Error("monthly模式下缺少month字段");
          }
          const [year, month] = item.month.split("-");
          console.log("[Dashboard] Parsed year/month:", year, month);
          return `${year}年${month}月`;
        });
        break;
      default:
        labels = data.map((item) => {
          if (!item.time) {
            console.error("[Dashboard] default模式下缺少time字段:", item);
            throw new Error("default模式下缺少time字段");
          }
          const time = new Date(item.time);
          return time.toLocaleTimeString(getDateLocale(getCurrentAppLanguage()), {
            hour: "2-digit",
            minute: "2-digit",
          });
        });
    }

    if (data.length === 0) {
      console.warn("[Dashboard] 没有可用的图表数据");
      return;
    }

    // 计算纵坐标的自动范围
    const values = data.map((item) => item.value);

    // 处理数据为空的情况
    let yMin: number;
    let yMax: number;

    if (values.length === 0) {
      console.warn("[Dashboard] 没有数据点，使用默认范围");
      yMin = 0;
      yMax = 100;
    } else {
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue;

      // 设置合理的纵坐标范围，确保有足够的显示空间
      const padding = Math.max(valueRange * 0.1, 1); // 至少1的padding
      yMin = Math.max(0, minValue - padding); // 最小值不小于0
      yMax = maxValue + padding;
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: t("dashboard.charts.creatinine_level"),
            data: data.map((item) => item.value),
            borderColor: "#e6a23c",
            backgroundColor: "rgba(230, 162, 60, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#e6a23c",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        font: {
          family: "-apple-system",
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "-apple-system",
                size: 13,
                weight: 500,
              },
              color: "#333333",
            },
          },
          y: {
            display: true,
            min: yMin,
            max: yMax,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              font: {
                family: "-apple-system",
                size: 13,
                weight: 500,
              },
              color: "#333333",
              callback: function (tickValue: string | number) {
                return tickValue;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("[Dashboard] 创建图表失败:", error);
  } finally {
    isChartLoading.value = false;
  }
};

const loadData = async () => {
  try {
    console.log("[Dashboard] 开始加载数据");

    const result = await localDataManager.loadData();
    if (result.success && result.data) {
      // 只在setup时设置数据，后续只能读取本地数据
      userInfo.value = result.data.user;
      healthStatus.value = result.data.healthStatus;
      // 设置图表数据，即使为空也要设置
      chartData.value = result.data.chartData || { rawData: [] };

      // 设置当前日期为最新可用段
      const availableSegments = getAvailableDateSegments();
      if (availableSegments.length > 0) {
        currentDate.value = availableSegments[availableSegments.length - 1];
      } else {
        currentDate.value = getLatestDataDate();
      }

      console.log("[Dashboard] 数据加载成功");
      if (!userInfo.value) {
        console.error("[Dashboard] userInfo 为空");
        throw new Error("用户信息未加载");
      }
      if (!userInfo.value.settings) {
        console.warn("[Dashboard] userInfo.settings 未定义");
        // return;
      }
      console.log("[Dashboard] userInfo.settings:", userInfo.value.settings);

      await nextTick();
      await createChart();
    } else {
      console.log("[Dashboard] 无本地数据，跳转到设置页面");
      router.push("/setup");
    }
  } catch (error) {
    console.error("[Dashboard] 加载数据失败:", error);
    router.push("/setup");
  }
};

onMounted(async () => {
  console.log("[Dashboard] 组件已挂载");
  await loadData();

  // 监听健康数据更新事件
  window.addEventListener("health-data-updated", (event: Event) => {
    const customEvent = event as CustomEvent;
    const newData = customEvent.detail;
    // console.log("[Dashboard] 收到健康数据更新:", newData);

    // 更新本地状态
    healthStatus.value = newData.healthStatus;
    if (newData.chartData) {
      chartData.value = newData.chartData;
    }

    // 如果是断开状态，确保显示"没有数据，要连接设备"
    if (newData.isDisconnected) {
      console.log("[Dashboard] 检测到断开状态，显示'没有数据，要连接设备'");
      // 清除全局肌酐值
      clearCreatinine();

      // 确保圆环和数字显示为"没有数据"状态
      // healthStatus.value 已经被设置为 value: 0, level: 'unknown'

      // 强制设置健康状态为无数据状态
      healthStatus.value = {
        creatinine: {
          value: 0,
          unit: "mg/dL",
          level: "unknown",
          percentage: 0,
          timestamp: null,
        },
        illnessProbability: 0,
        lastUpdated: new Date().toISOString(),
      };

      console.log("[Dashboard] 已设置无数据状态:", healthStatus.value);
    } else {
      console.log("[Dashboard] 收到检测数据，显示实时值");
    }

    // 重新创建图表
    createChart();
  });

  // 等待文字选择管理初始化完成
  if (textSelectionInitialized.value) {
    console.log("[Dashboard] 文字选择管理已初始化");
  }
});

// 监听肌酐单位显示设置变化，重新创建图表
watch(showCreatinineUnit, async () => {
  console.log("[Dashboard] 肌酐单位显示设置已改变:", showCreatinineUnit.value);
  await createChart();
});
</script>

<style scoped>
/* ===== 仪表板内容区域 ===== */
.dashboard-content {
  padding: 0; /* 无内边距 */
}

/* ===== 用户头部样式 ===== */
.user-header {
  background: #fff; /* 白色背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 6px 12px; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  margin-bottom: 16px; /* 底部外边距 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
}

/* ===== 用户头像样式 ===== */
.user-avatar {
  width: 70px; /* 宽度 */
  height: 70px; /* 高度 */
  margin-right: 15px; /* 右侧外边距 */
}

/* ===== 用户头像图片样式 ===== */
.user-avatar img {
  width: 100%; /* 占满容器宽度 */
  height: 100%; /* 占满容器高度 */
  object-fit: cover; /* 保持比例填充 */
  border-radius: var(--border-radius-circle); /* 圆形 */
}

/* ===== 问候语区域样式 ===== */
.greeting {
  flex: 1; /* 占据剩余空间 */
}

/* ===== 问候语文字样式 ===== */
.hello {
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #666; /* 次要文字颜色 */
  display: block; /* 块级显示 */
  /* margin-bottom: 0px; */
}

/* ===== 用户名字样式 ===== */
.user-name {
  margin: 0; /* 移除外边距 */
  font: -apple-system-body; /* 苹果系统正文字体 */
  /* font-weight: 600;                半粗体 */
  color: #333; /* 主要文字颜色 */
}

/* ===== 头部操作按钮区域 ===== */
.header-actions {
  display: flex; /* 弹性布局 */
  gap: 15px; /* 元素间距 */
}

/* ===== 搜索和通知图标样式 ===== */
.search-icon,
.notification-icon {
  font-size: 18px; /* 图标大小 */
  color: #666; /* 次要文字颜色 */
  cursor: pointer; /* 手型光标 */
  padding: 10px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  transition: background-color 0.3s ease; /* 背景色过渡 */
}

/* ===== 区域标题样式 ===== */
.section-header {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  /* margin-bottom: 12px;             底部外边距 */
}

/* ===== 区域标题文字样式 ===== */
.section-header .item-title {
  margin: 0; /* 移除外边距 */
  /* font-weight: 600;                半粗体 */
  color: #333; /* 主要文字颜色 */
}

/* ===== 查看全部链接样式 ===== */
.view-all {
  color: #2196f3; /* 蓝色文字 */
  font: -apple-system-body; /* 苹果系统正文字体 */
  font-weight: bold;
  cursor: pointer; /* 手型光标 */
  text-decoration: none; /* 无下划线 */
}

/* ===== 健康卡片组样式 ===== */
.health-cards {
  display: flex; /* 弹性布局 */
  gap: 20px; /* 元素间距 */
  margin-bottom: 30px; /* 底部外边距 */
  width: 100%; /* 占满宽度 */
}

/* ===== 肌酐水平卡片样式 ===== */
.metric-card {
  background: linear-gradient(135deg, #fdf6e3 0%, #fef9e7 100%); /* 浅黄色渐变背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 20px; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  justify-content: center; /* 垂直居中 */
  min-height: 200px; /* 最小高度 */
  align-items: center; /* 水平居中 */
  border: 1px solid rgba(230, 162, 60, 0.1); /* 边框 */
  flex: 1; /* 平分宽度 */
  min-width: 0; /* 允许收缩 */
}

/* ===== 指标状态样式 ===== */
.metric-status {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 20px; /* 底部外边距 */
  width: 100%; /* 占满宽度 */
  min-width: 0; /* 允许收缩 */
}

/* ===== 状态文字样式 ===== */
.status-text {
  font: -apple-system-body; /* 苹果系统正文字体 */
  color: #666; /* 次要文字颜色 */
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许收缩 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 文字省略号 */
  white-space: nowrap; /* 不换行 */
}

/* ===== 状态级别样式 ===== */
.status-level {
  padding: 6px 12px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  /* font-weight: 530;                字体粗细 */
  flex-shrink: 0; /* 不允许收缩 */
  white-space: nowrap; /* 不换行 */
}

/* ===== 正常状态样式 ===== */
.status-level.normal {
  background-color: #e8f5e8; /* 浅绿色背景 */
  color: #4caf50; /* 绿色文字 */
}

/* ===== 警告状态样式 ===== */
.status-level.warning {
  background-color: #fff3e0; /* 浅橙色背景 */
  color: #ff9800; /* 橙色文字 */
}

/* ===== 危险状态样式 ===== */
.status-level.danger {
  background-color: #ffebee; /* 浅红色背景 */
  color: #f44336; /* 红色文字 */
}

/* ===== 指标圆圈样式 ===== */
.metric-circle {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 20px; /* 元素间距 */
  flex-direction: column; /* 垂直排列 */
  justify-content: center; /* 垂直居中 */
}

/* ===== 进度环样式 ===== */
.progress-ring {
  position: relative; /* 相对定位 */
  /* width: 120px;
  height: 120px; */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  margin: 0 auto; /* 水平居中 */
  overflow: visible; /* 显示溢出 */
}

/* ===== 圆圈内容样式 ===== */
.circle-content {
  position: absolute; /* 绝对定位 */
  top: 50%; /* 顶部50% */
  left: 50%; /* 左侧50% */
  transform: translate(-50%, -50%); /* 居中变换 */
  text-align: center; /* 文字居中 */
  width: 100%; /* 占满宽度 */
  height: 100%; /* 占满高度 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  pointer-events: none; /* 禁用鼠标事件 */
  z-index: 1; /* 层级 */
}

/* ===== 百分比样式 ===== */
.percentage {
  color: #f39c12;
  line-height: 1;
  margin: 0; /* 移除外边距 */
  padding: 0; /* 移除内边距 */
  text-align: center; /* 文字居中 */
  white-space: nowrap; /* 不换行 */
}

/* ===== 当前值样式 ===== */
.current-value {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  text-align: center; /* 文字居中 */
}

/* ===== 当前值标签样式 ===== */
.current-value .label {
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #666; /* 次要文字颜色 */
  margin-bottom: 5px; /* 底部外边距 */
}

/* ===== 当前值数值样式 ===== */
.current-value .value {
  font: -apple-system-body; /* 苹果系统正文字体 */
  /* font-weight: 600;                半粗体 */
  color: #f39c12; /* 橙色文字 */
  line-height: 1.2; /* 行高 */
  margin-left: 8px; /* 左侧外边距 */
}

/* ===== 患病概率卡片样式 ===== */
.risk-card {
  background: linear-gradient(135deg, #f3e5f5 0%, #f8f4ff 100%); /* 浅紫色渐变背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 20px; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影 */
  border: 1px solid rgba(156, 39, 176, 0.1); /* 边框 */
  flex: 1; /* 平分宽度 */
  min-width: 0; /* 允许收缩 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  -webkit-font-smoothing: antialiased; /* iOS 字体平滑 */
  -moz-osx-font-smoothing: grayscale; /* macOS 字体平滑 */
  text-rendering: optimizeLegibility; /* 优化文字渲染 */
}

/* ===== 风险显示样式 ===== */
.risk-display {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 20px; /* 元素间距 */
  flex: 1; /* 占据剩余空间 */
  min-width: 0; /* 允许收缩 */
}

/* ===== 风险百分比样式 ===== */
.risk-percentage {
  color: #9c27b0; /* 紫色文字 */
  text-align: center; /* 文字居中 */
}

/* ===== 风险建议文字样式 ===== */
.risk-advice p {
  margin: 0; /* 移除外边距 */
  line-height: 1.5; /* 行高 */
  color: #666; /* 次要文字颜色 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 文字省略号 */
  display: -webkit-box; /* WebKit 盒子 */
  -webkit-line-clamp: 2; /* 最多显示2行 */
  line-clamp: 2; /* 标准属性 */
  -webkit-box-orient: vertical; /* 垂直排列 */
  word-break: break-word; /* 允许单词换行 */
  -webkit-font-smoothing: antialiased; /* iOS 字体平滑 */
  -moz-osx-font-smoothing: grayscale; /* macOS 字体平滑 */
  text-rendering: optimizeLegibility; /* 优化文字渲染 */
}

/* ===== 指标头部样式 ===== */
.metric-header {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 20px; /* 底部外边距 */
}

/* ===== 指标头部标题样式 ===== */
.metric-header .item-body {
  margin: 0; /* 移除外边距 */
  /* font-weight: 600;                半粗体 */
  color: #333; /* 主要文字颜色 */
}

/* ===== 指标显示样式 ===== */
.metric-display {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
}

/* ===== 指标数值样式 ===== */
.metric-value {
  font: -apple-system-title1; /* 苹果系统标题1字体 */
  /* font-weight: bold;               粗体 */
  color: #333; /* 主要文字颜色 */
}

/* ===== 单位样式 ===== */
.unit {
  font: -apple-system-subheadline; /* 苹果系统副标题字体 */
  color: #666; /* 次要文字颜色 */
  margin-left: 8px; /* 左侧外边距 */
}

/* ===== 图表区域样式 ===== */
.chart-section {
  background: #fff; /* 白色背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 20px; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  margin-bottom: 20px; /* 底部外边距 */
}

/* ===== 图表头部样式 ===== */
.chart-header {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 15px; /* 元素间距 */
  margin-bottom: 20px; /* 底部外边距 */
}

/* ===== 周期选择器样式 ===== */
.period-selector {
  display: flex; /* 弹性布局 */
  gap: 10px; /* 元素间距 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

/* ===== 日期导航样式 ===== */
.date-navigation {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 0px; /* 无间距 */
  background: var(--bg-card); /* 浅灰色背景 */
  padding: 0px 0px; /* 无内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  min-width: 180px; /* 最小宽度 */
  justify-content: center; /* 水平居中 */
  height: 36px; /* 固定高度 */
  margin: 0 auto; /* 水平居中 */
}

/* ===== 导航按钮样式 ===== */
.nav-btn {
  background: none; /* 无背景 */
  border: none; /* 无边框 */
  color: #666; /* 次要文字颜色 */
  cursor: pointer; /* 手型光标 */
  padding: 16px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  transition: all 0.3s ease; /* 过渡动画 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  /* width: 24px; */
  height: 24px; /* 固定高度 */
}

/* ===== 导航按钮禁用状态 ===== */
.nav-btn:disabled {
  opacity: 0.5; /* 透明度 */
  cursor: not-allowed; /* 禁用光标 */
}

/* ===== 到达最旧数据时的导航按钮样式 ===== */
.nav-btn-disabled {
  color: #e74c3c; /* 有质感的红色 */
  cursor: not-allowed; /* 禁用光标 */
  opacity: 0.8; /* 适中的透明度 */
  background: rgba(231, 76, 60, 0.1); /* 淡红色背景 */
}

/* ===== 日期范围显示样式 ===== */
.date-range {
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #666; /* 次要文字颜色 */
  /* font-weight: 500;                中等粗细 */
  min-width: 140px; /* 最小宽度 */
  text-align: center; /* 文字居中 */
  cursor: pointer; /* 手型光标 */
  padding: 4px 10px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  transition: background-color 0.3s ease; /* 背景色过渡 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  height: 24px; /* 固定高度 */
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 文字省略号 */
}

/* ===== 日期选择弹窗样式 ===== */
/* 遮罩层 */
.date-picker-overlay {
  position: fixed; /* 固定定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色背景 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  z-index: 1000; /* 层级 */
}

/* ===== 日期选择器模态框样式 ===== */
.date-picker-modal {
  background: white; /* 白色背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 20px; /* 内边距 */
  width: 90%; /* 宽度90% */
  max-width: 400px; /* 最大宽度 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* 阴影 */
}

/* ===== 日期选择器头部样式 ===== */
.date-picker-header {
  display: flex; /* 弹性布局 */
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 20px; /* 底部外边距 */
  border-bottom: 1px solid #eee; /* 底部边框 */
}

/* ===== 日期选择器头部标题 ===== */
.date-picker-header .item-body {
  margin: 0; /* 移除外边距 */
  color: #333; /* 主要文字颜色 */
}

/* ===== 关闭按钮样式 ===== */
.close-btn {
  background: none; /* 无背景 */
  border: none; /* 无边框 */
  color: #666; /* 次要文字颜色 */
  cursor: pointer; /* 手型光标 */
  padding: 8px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  transition: background-color 0.3s ease; /* 背景色过渡 */
}

/* ===== 日期选择器内容区域 ===== */
.date-picker-content {
  margin-bottom: 20px; /* 底部外边距 */
}

/* ===== 最新数据信息样式 ===== */
.latest-data-info {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px; /* 元素间距 */
  padding: 12px; /* 内边距 */
  background-color: #e3f2fd; /* 浅蓝色背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  margin-bottom: 15px; /* 底部外边距 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #1976d2; /* 蓝色文字 */
}

/* ===== 最新数据信息图标 ===== */
.latest-data-info i {
  color: #2196f3; /* 蓝色图标 */
}

/* ===== 模式选择器样式 ===== */
.mode-selector {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 12px; /* 元素间距 */
  margin-bottom: 20px; /* 底部外边距 */
}

/* ===== 模式选项样式 ===== */
.mode-option {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 10px; /* 元素间距 */
  cursor: pointer; /* 手型光标 */
  padding: 8px; /* 内边距 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  transition: background-color 0.3s ease; /* 背景色过渡 */
}

/* ===== 模式选项单选框 ===== */
.mode-option input[type="radio"] {
  margin: 0; /* 移除外边距 */
}

/* ===== 日期输入组样式 ===== */
.date-inputs,
.days-input {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 15px; /* 元素间距 */
}

/* ===== 输入组样式 ===== */
.input-group {
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  gap: 5px; /* 元素间距 */
}

/* ===== 输入组标签 ===== */
.input-group label {
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #666; /* 次要文字颜色 */
  /* font-weight: 500;                中等粗细 */
}

/* ===== 日期和数字输入框 ===== */
.date-input,
.number-input {
  padding: 10px; /* 内边距 */
  border: 1px solid #ddd; /* 边框 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  font: -apple-system-body; /* 苹果系统正文字体 */
  transition: border-color 0.3s ease; /* 边框色过渡 */
}

/* ===== 输入框焦点状态 ===== */
.date-input:focus,
.number-input:focus {
  outline: none; /* 移除轮廓 */
  border-color: #2196f3; /* 焦点边框色 */
}

/* ===== 日期选择器操作按钮组 ===== */
.date-picker-actions {
  display: flex; /* 弹性布局 */
  gap: 10px; /* 元素间距 */
  justify-content: flex-end; /* 右对齐 */
}

/* ===== 通用按钮样式 ===== */
.btn {
  padding: 10px 20px; /* 内边距 */
  border: none; /* 无边框 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  font: -apple-system-body; /* 苹果系统正文字体 */
  /* font-weight: 500;                中等粗细 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* ===== 主要按钮样式 ===== */
.btn-primary {
  background: #2196f3; /* 蓝色背景 */
  color: white; /* 白色文字 */
}

/* ===== 周期按钮样式 ===== */
.period-btn {
  padding: 8px 16px; /* 内边距 */
  border: 1px solid #ddd; /* 边框 */
  background: #fff; /* 白色背景 */
  color: #666; /* 次要文字颜色 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  cursor: pointer; /* 手型光标 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  transition: all 0.3s ease; /* 过渡动画 */
  height: 36px; /* 固定高度 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
}

/* ===== 周期按钮激活状态 ===== */
.period-btn.active {
  background: #2196f3; /* 蓝色背景 */
  color: #fff; /* 白色文字 */
  border-color: #2196f3; /* 蓝色边框 */
}

/* ===== 图表容器样式 ===== */
.chart-container {
  position: relative; /* 相对定位 */
  height: 300px; /* 固定高度 */
  width: 100%; /* 占满宽度 */
}

/* ===== 图表加载状态 ===== */
.chart-loading {
  position: absolute; /* 绝对定位 */
  top: 50%; /* 顶部50% */
  left: 50%; /* 左侧50% */
  transform: translate(-50%, -50%); /* 居中变换 */
  color: #666; /* 次要文字颜色 */
  font: -apple-system-body; /* 苹果系统正文字体 */
}

/* ===== 无数据卡片样式 ===== */
.no-data-card {
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
  position: relative; /* 相对定位 */
  overflow: hidden; /* 隐藏溢出 */
}

.no-data-card:active {
  transform: translateY(0); /* 点击时回到原位 */
}

/* ===== 连接提示样式 ===== */
.connect-hint {
  position: absolute; /* 绝对定位 */
  bottom: 0; /* 底部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); /* 蓝色渐变背景 */
  color: white; /* 白色文字 */
  padding: 8px 12px; /* 内边距 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 6px; /* 元素间距 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  /* font-weight: 600;                半粗体 */
  border-radius: 0 0 var(--border-radius-small) var(--border-radius-small); /* 底部圆角 */
}

.connect-hint i {
  font-size: 12px; /* 图标大小 */
}
</style>

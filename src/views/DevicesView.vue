<template>
  <div class="devices-view">
    <header class="header">
      <div></div>
      <div class="page-title item-headline">{{ t("devices.title") }}</div>
      <div></div>
    </header>

    <section class="devices-content">
      <div style="height: 10px"></div>

      <!-- 肌酐检测设备 -->
      <div class="device-category">
        <div class="item-title">{{ t("devices.creatinine_device") }}</div>
        <div class="device-card creatinine-device">
          <div class="device-info">
            <div class="device-icon">
              <i class="fa-solid fa-microchip"></i>
            </div>
            <div class="device-details">
              <div class="item-body">{{ t("devices.device_model") }}</div>
              <div class="item-footnote">{{ t("devices.model") }}</div>
              <div class="item-footnote" :class="connectionStatusClass">
                {{ connectionStatusText }}
              </div>
            </div>
          </div>
          <div style="margin-top: 1em; text-align: right">
            <button
              @click="handleBluetoothAction"
              :disabled="isScanning || isDisconnecting"
              class="scan-button"
              :class="{
                scanning: isScanning,
                disconnecting: isDisconnecting,
                connected: connectionStatusClass === 'connected',
              }"
            >
              {{ getButtonText() }}
            </button>
          </div>

          <!-- 蓝牙调试日志输出框 -->
          <div v-if="showDebugLog" style="margin-top: 1em">
            <textarea
              ref="bleLog"
              readonly
              class="ble-log-textarea"
              v-model="logContent"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 设备设置 -->
      <div class="device-category">
        <div class="item-title">{{ t("devices.settings.title") }}</div>
        <!-- 调试模式开关 -->
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="item-body">{{ t("devices.settings.debugMode") }}</div>
            </div>
            <button
              class="ios-toggle-button"
              :class="{ active: showDebugLog }"
              @click="
                showDebugLog = !showDebugLog;
                handleDebugSwitchChange();
              "
            >
              <span class="toggle-handle"></span>
            </button>
          </div>
        </div>
        <!-- 自动连接 -->
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="item-body">{{ t("devices.settings.auto_connect") }}</div>
            </div>
            <button
              class="ios-toggle-button"
              :class="{ active: autoConnect }"
              @click="
                autoConnect = !autoConnect;
                handleAutoConnectChange();
              "
            >
              <span class="toggle-handle"></span>
            </button>
          </div>
        </div>

        <!-- 连接提醒 -->
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="item-body">{{ t("devices.settings.connection_notify") }}</div>
            </div>
            <button
              class="ios-toggle-button"
              :class="{ active: connectionNotify }"
              @click="
                connectionNotify = !connectionNotify;
                handleConnectionNotifyChange();
              "
            >
              <span class="toggle-handle"></span>
            </button>
          </div>
        </div>

        <!-- 肌酐单位显示开关 -->
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="item-body">{{ t("devices.settings.show_creatinine_unit") }}</div>
            </div>
            <button
              class="ios-toggle-button"
              :class="{ active: showCreatinineUnit }"
              @click="
                showCreatinineUnit = !showCreatinineUnit;
                handleCreatinineUnitChange();
              "
            >
              <span class="toggle-handle"></span>
            </button>
          </div>
        </div>
        <div class="setting-footnote">
          {{ t("devices.settings.show_creatinine_unit_desc") }}
        </div>

        <!-- 测量频率设置 -->
        <div class="setting-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="item-body">{{ t("devices.settings.frequency_title") }}</div>
            </div>
            <button class="transparent-button" @click="showFrequencyPicker = true">
              <span>{{ currentFrequencyText }}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div class="setting-footnote">
          {{ t("devices.settings.frequency_current") }}{{ currentFrequencyText }}
        </div>

        <!-- 频率选择器弹出层 -->
        <div
          v-if="showFrequencyPicker"
          class="frequency-picker-overlay"
          @click="showFrequencyPicker = false"
        >
          <div class="frequency-picker" @click.stop>
            <div class="picker-header">
              <div class="item-body">{{ t("devices.settings.frequency_picker_title") }}</div>
              <button class="close-button" @click="showFrequencyPicker = false">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
            <div class="picker-options">
              <button
                v-for="(text, index) in frequencyOptions"
                :key="index"
                class="picker-option"
                :class="{ active: frequencyValue === index }"
                @click="selectFrequency(index)"
              >
                {{ text }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 帮助信息 -->
      <div class="device-category">
        <div class="item-title">{{ t("devices.settings.help_title") }}</div>
        <div class="help-list">
          <div class="help-item" @click="showHelp('connection')">
            <div class="help-icon">
              <i class="fa-solid fa-link fa-gradient-icon"></i>
            </div>
            <div class="help-content">
              <div class="item-body">{{ t("devices.settings.connection_help") }}</div>
              <div class="item-footnote">{{ t("devices.settings.connection_help_desc") }}</div>
            </div>
            <div class="help-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          <div class="help-item" @click="showHelp('calibration')">
            <div class="help-icon">
              <i class="fa-solid fa-gear"></i>
            </div>
            <div class="help-content">
              <div class="item-body">{{ t("devices.settings.calibration_help") }}</div>
              <div class="item-footnote">{{ t("devices.settings.calibration_help_desc") }}</div>
            </div>
            <div class="help-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          <div class="help-item" @click="showHelp('maintenance')">
            <div class="help-icon">
              <i class="fa-solid fa-screwdriver-wrench"></i>
            </div>
            <div class="help-content">
              <div class="item-body">{{ t("devices.settings.maintenance_help") }}</div>
              <div class="item-footnote">{{ t("devices.settings.maintenance_help_desc") }}</div>
            </div>
            <div class="help-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          <div class="help-item" @click="showHelp('faq')">
            <div class="help-icon">
              <i class="fa-solid fa-circle-question"></i>
            </div>
            <div class="help-content">
              <div class="item-body">{{ t("devices.settings.faq_help") }}</div>
              <div class="item-footnote">{{ t("devices.settings.faq_help_desc") }}</div>
            </div>
            <div class="help-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>

          <div class="help-item developer-mode-item" @click="handleDeveloperModeClick">
            <div class="help-icon">
              <i class="fa-solid fa-code"></i>
            </div>
            <div class="help-content">
              <div class="item-body">{{ developerButtonText }}</div>
              <div class="item-footnote">连点5次进入 - 校准、发送、接收等功能</div>
            </div>
            <div class="help-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 设备历史记录 -->
      <div class="device-category">
        <div class="item-title">{{ t("devices.settings.history_title") }}</div>

        <div class="history-list">
          <div v-for="(item, index) in connectionHistory" :key="index" class="history-item">
            <div class="history-time">{{ item.time }}</div>
            <div class="history-action">{{ item.action }}</div>
            <div class="history-status" :class="item.status">{{ item.statusIcon }}</div>
          </div>
        </div>
      </div>

      <!-- Apple 系统字体测试区域 -->
      <div v-if="showDebugLog" class="device-category">
        <div class="item-title">Apple 系统字体测试</div>
        <div class="font-test-container">
          <div class="font-test-item">
            <span class="font-label">Large Title:</span>
            <span class="font-sample apple-font-large-title"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Title 1:</span>
            <span class="font-sample apple-font-title-one"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Title 2:</span>
            <span class="font-sample apple-font-title-two"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Title 3:</span>
            <span class="font-sample apple-font-title-three"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Headline:</span>
            <span class="font-sample apple-font-headline"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Body:</span>
            <span class="font-sample apple-font-body"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Callout:</span>
            <span class="font-sample apple-font-callout"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Subheadline:</span>
            <span class="font-sample apple-font-subheadline"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Footnote:</span>
            <span class="font-sample apple-font-footnote"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Caption 1:</span>
            <span class="font-sample apple-font-caption-one"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
          <div class="font-test-item">
            <span class="font-label">Caption 2:</span>
            <span class="font-sample apple-font-caption-two"
              >The quick brown fox 测试设备测试设备测试设备测试设备</span
            >
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n, getCurrentAppLanguage } from "@/composables/useI18n";
import { getDateLocale } from "@/composables/locales-config";
import { bleDeviceManager, BleState, LogLevel } from "@/services/BleDeviceManager";
import { localDataManager } from "@/services/LocalDataManager";
import { useTextSelection } from "@/composables/useTextSelection";

// 蓝牙原始数据接口 - 保留所有原始数据
interface BluetoothData {
  value?: string; // Base64 编码的数据
  buffer?: ArrayBuffer; // 原始缓冲区数据
  hex?: string; // 十六进制字符串
  raw?: Uint8Array; // 原始字节数组
  timestamp?: number; // 接收时间戳
  deviceId?: string; // 设备ID
  service?: string; // 服务UUID
  characteristic?: string; // 特征UUID
  [key: string]: unknown; // 允许其他未知字段
}

const { t } = useI18n();

// 初始化文字选择管理
const { isInitialized: textSelectionInitialized } = useTextSelection();

// 响应式数据
const isScanning = ref(false);
const isDisconnecting = ref(false);
const showDebugLog = ref(false);
const autoConnect = ref(true);
const connectionNotify = ref(true);
const showCreatinineUnit = ref(false);
const frequencyValue = ref(0);
const showFrequencyPicker = ref(false);
const logContent = ref("");
const connectionHistory = ref<
  Array<{ time: string; action: string; status: string; statusIcon: string }>
>([]);
const currentBleState = ref<BleState>(BleState.IDLE); // 添加响应式的蓝牙状态

// 开发者模式相关
const developerClickCount = ref(0);
const developerClickTimer = ref<number | null>(null);
const developerButtonText = ref("开发者模式");

// 事件监听器引用
let bluetoothDataListener: ((event: Event) => void) | null = null;

// 频率选项计算属性
// 频率选项键值
const frequencyKeys = [
  "devices.settings.frequency_values.5_minutes",
  "devices.settings.frequency_values.15_minutes",
  "devices.settings.frequency_values.1_hour",
  "devices.settings.frequency_values.3_hours",
  "devices.settings.frequency_values.6_hours",
];

const frequencyOptions = computed(() => frequencyKeys.map((key) => t(key)));

// 计算属性
const connectionStatusClass = computed(() => {
  const state = currentBleState.value;
  if (state === BleState.CONNECTED) return "connected";
  if (state === BleState.CONNECTING || state === BleState.SCANNING) return "connecting";
  return "disconnected";
});

const connectionStatusText = computed(() => {
  const state = currentBleState.value;
  switch (state) {
    case BleState.CONNECTED:
      return t("devices.status.connected");
    case BleState.CONNECTING:
      return t("devices.actions.connecting");
    case BleState.SCANNING:
      return t("devices.actions.scanning");
    case BleState.INITIALIZING:
      return "Initializing...";
    case BleState.DISCONNECTING:
      return t("devices.actions.disconnecting");
    default:
      return t("devices.status.disconnected");
  }
});

const currentFrequencyText = computed(() => {
  return t(frequencyKeys[frequencyValue.value]);
});

// 方法
const handleBluetoothAction = async () => {
  const state = currentBleState.value;

  if (state === BleState.CONNECTED) {
    // 已连接状态 - 断开连接
    await handleDisconnect();
  } else {
    // 未连接状态 - 扫描连接
    await handleBluetoothScan();
  }
};

const handleDisconnect = async () => {
  if (isDisconnecting.value) return;

  isDisconnecting.value = true;
  updateBleState(); // 更新状态显示
  addLog(LogLevel.INFO, t("devices.actions.disconnecting"));

  try {
    await bleDeviceManager.disconnect();
    addLog(LogLevel.INFO, t("devices.settings.device_disconnected"));
    addConnectionHistory(t("devices.settings.device_disconnected"), "success");
  } catch (error) {
    addLog(LogLevel.ERROR, `断开连接失败: ${error}`);
    addConnectionHistory(`断开连接失败: ${error}`, "error");
  } finally {
    isDisconnecting.value = false;
    updateBleState(); // 更新状态显示
  }
};

const handleBluetoothScan = async () => {
  if (isScanning.value) return;

  isScanning.value = true;
  updateBleState(); // 更新状态显示
  addLog(LogLevel.INFO, t("devices.settings.scan_start"));

  try {
    await bleDeviceManager.connectToDevice((success: boolean, message: string) => {
      addLog(LogLevel.INFO, `连接结果: ${success ? "成功" : "失败"} - ${message}`);
      if (success) {
        addConnectionHistory(t("devices.settings.connection_success"), "success");
      } else {
        addConnectionHistory(`连接失败: ${message}`, "error");
      }
      updateBleState(); // 更新状态显示
    });
  } catch (error) {
    addLog(LogLevel.ERROR, `扫描过程中发生错误: ${error}`);
    addConnectionHistory(t("devices.settings.scan_failed"), "error");
  } finally {
    isScanning.value = false;
    updateBleState(); // 更新状态显示
  }
};

const getButtonText = () => {
  const state = currentBleState.value;

  if (isDisconnecting.value) {
    return t("devices.actions.disconnecting");
  }

  if (state === BleState.CONNECTED) {
    return t("devices.actions.disconnect");
  }

  if (isScanning.value) {
    return t("devices.actions.scanning");
  }

  return t("devices.actions.scan_bluetooth");
};

// 更新蓝牙状态
const updateBleState = () => {
  currentBleState.value = bleDeviceManager.getCurrentState();
  console.log("[DevicesView] 蓝牙状态已更新:", currentBleState.value);
};

const handleDebugSwitchChange = async () => {
  // 保存调试模式设置
  try {
    await localDataManager.setField("settings.softwareSettings.isdebug", showDebugLog.value);
    console.log("调试模式设置已保存:", showDebugLog.value);
  } catch (error) {
    console.error("保存调试模式设置失败:", error);
  }

  if (showDebugLog.value) {
    // 设置日志回调
    bleDeviceManager.setLogCallback((level, message) => {
      addLog(level, message);
    });
  } else {
    // 清除日志
    logContent.value = "";
    bleDeviceManager.setLogCallback(() => {});
  }
};

// 选择频率
const selectFrequency = async (index: number) => {
  frequencyValue.value = index;
  showFrequencyPicker.value = false;

  // 保存频率设置
  try {
    await localDataManager.setField(
      "settings.softwareSettings.detectFrequency",
      frequencyValue.value
    );
    console.log("测量频率设置已保存:", frequencyValue.value);
  } catch (error) {
    console.error("保存测量频率设置失败:", error);
  }
};

// 设置频率（用于未来扩展）
// const setFrequency = (value: number) => {
//   frequencyValue.value = value
//   handleFrequencyChange()
// }

const handleAutoConnectChange = async () => {
  try {
    await localDataManager.setField("settings.softwareSettings.autoConnect", autoConnect.value);
    console.log("自动连接设置已保存:", autoConnect.value);
  } catch (error) {
    console.error("保存自动连接设置失败:", error);
  }
};

const handleConnectionNotifyChange = async () => {
  try {
    await localDataManager.setField(
      "settings.softwareSettings.connectionNotify",
      connectionNotify.value
    );
    console.log("连接提醒设置已保存:", connectionNotify.value);
  } catch (error) {
    console.error("保存连接提醒设置失败:", error);
  }
};

const handleCreatinineUnitChange = async () => {
  try {
    await localDataManager.setField("user.settings.showCreatinineUnit", showCreatinineUnit.value);
    console.log("肌酐单位显示设置已保存:", showCreatinineUnit.value);
  } catch (error) {
    console.error("保存肌酐单位显示设置失败:", error);
  }
};

const addLog = (level: LogLevel, message: string) => {
  const timestamp = new Date().toLocaleTimeString(getDateLocale(getCurrentAppLanguage()), {
    hour12: false,
  });
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  logContent.value += logMessage;

  // 自动滚动到底部
  setTimeout(() => {
    const textarea = document.querySelector(".ble-log-textarea") as HTMLTextAreaElement;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, 100);
};

const addConnectionHistory = (action: string, status: "success" | "warning" | "error") => {
  const statusIcon = status === "success" ? "✓" : status === "warning" ? "!" : "✗";
  const time = new Date().toLocaleString(getDateLocale(getCurrentAppLanguage()), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  connectionHistory.value.unshift({
    time,
    action,
    status,
    statusIcon,
  });

  // 限制历史记录数量
  if (connectionHistory.value.length > 10) {
    connectionHistory.value = connectionHistory.value.slice(0, 10);
  }
};

// 开发者模式相关函数
const handleDeveloperModeClick = () => {
  console.log("[DevicesView] 开发者模式被点击，当前点击次数:", developerClickCount.value + 1);

  developerClickCount.value += 1;

  // 清除之前的定时器
  if (developerClickTimer.value) {
    clearTimeout(developerClickTimer.value);
  }

  // 第4次点击时显示提示文字
  if (developerClickCount.value === 4) {
    console.log("[DevicesView] 第4次点击，显示提示文字");
    developerButtonText.value = "再次点击进入开发者模式";
  }

  // 第5次点击时进入开发者模式
  if (developerClickCount.value >= 5) {
    console.log("[DevicesView] 第5次点击，进入开发者模式");
    enterDeveloperMode();
    return;
  }

  // 设置重置定时器（2秒后重置点击次数和文字）
  developerClickTimer.value = setTimeout(() => {
    console.log("[DevicesView] 重置开发者模式点击次数和文字");
    developerClickCount.value = 0;
    developerButtonText.value = "开发者模式";
    developerClickTimer.value = null;
  }, 2000);
};

const enterDeveloperMode = () => {
  console.log("[DevicesView] 进入开发者模式");
  developerClickCount.value = 0;
  developerButtonText.value = "开发者模式";
  if (developerClickTimer.value) {
    clearTimeout(developerClickTimer.value);
    developerClickTimer.value = null;
  }

  // 触发自定义事件通知TabsLayout进入开发者模式
  window.dispatchEvent(new CustomEvent("enter-developer-mode"));
};

// 处理蓝牙数据 - 保留所有原始数据
const handleBluetoothData = async (data: unknown) => {
  // 减少日志输出，避免性能问题
  console.log("[DevicesView] 处理蓝牙数据");

  try {
    // 将原始 ReadResult 转换为我们的 BluetoothData 格式
    const rawResult = data as Record<string, unknown>;
    const bluetoothData: BluetoothData = {
      value: rawResult.value ? String(rawResult.value) : undefined,
      buffer: (rawResult.value as { buffer?: ArrayBuffer })?.buffer,
      hex: rawResult.value
        ? Array.from(new Uint8Array((rawResult.value as { buffer?: ArrayBuffer })?.buffer || []))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        : undefined,
      raw: rawResult.value
        ? new Uint8Array((rawResult.value as { buffer?: ArrayBuffer })?.buffer || [])
        : undefined,
      timestamp: Date.now(),
      deviceId: typeof rawResult.deviceId === "string" ? rawResult.deviceId : undefined,
      service: typeof rawResult.service === "string" ? rawResult.service : undefined,
      characteristic:
        typeof rawResult.characteristic === "string" ? rawResult.characteristic : undefined,
    };

    // 只记录关键信息，避免过多日志输出
    console.log(
      "[DevicesView] 数据类型:",
      typeof bluetoothData.value,
      "长度:",
      bluetoothData.hex?.length
    );

    // 保存原始数据到本地（包含完整信息）
    const newChartData = {
      time: new Date().toISOString(),
      value: 0, // 暂时设为0，等待后续数据解析逻辑
      rawData: {
        base64: bluetoothData.value,
        hex: bluetoothData.hex,
        deviceId: bluetoothData.deviceId,
        service: bluetoothData.service,
        characteristic: bluetoothData.characteristic,
        timestamp: bluetoothData.timestamp,
      },
    };

    // 获取现有图表数据并添加新数据点
    const currentData =
      (await localDataManager.getField<Array<{ time: string; value: number; rawData?: unknown }>>(
        "chartData.rawData"
      )) || [];
    const updatedData = [...currentData, newChartData];

    // 保存图表数据到本地
    await localDataManager.setField("chartData.rawData", updatedData);

    console.log("[DevicesView] 包含原始数据的图表数据已保存到本地");

    // 触发图表数据更新事件（不包含健康状态，由Dashboard从全局变量获取）
    window.dispatchEvent(
      new CustomEvent("health-data-updated", {
        detail: {
          chartData: { rawData: updatedData },
          timestamp: new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("[DevicesView] 处理蓝牙数据失败:", error);
  }
};

const showHelp = (type: string) => {
  let message = "";
  switch (type) {
    case "connection":
      message = t("devices.help.connection_steps");
      break;
    case "calibration":
      message = t("devices.help.calibration_guide");
      break;
    case "maintenance":
      message = t("devices.help.maintenance_guide");
      break;
    case "faq":
      message = t("devices.help.faq_content");
      break;
  }
  alert(message);
};

// 加载设置
const loadSettings = async () => {
  try {
    const dataResult = await localDataManager.loadData();
    if (!dataResult.success) {
      console.error("[DevicesView] errorerror 加载数据失败:", dataResult.error);
      return;
    }
    if (!dataResult.data) {
      console.error("[DevicesView] errorerror 数据为空");
      return;
    }

    // 加载肌酐单位显示设置 - 从user.settings中读取
    if (
      dataResult.data.user &&
      dataResult.data.user.settings &&
      dataResult.data.user.settings.showCreatinineUnit !== undefined
    ) {
      showCreatinineUnit.value = dataResult.data.user.settings.showCreatinineUnit;
    }

    // 加载其他设置 - 从settings.softwareSettings中读取
    if (dataResult.data.settings && dataResult.data.settings.softwareSettings) {
      const settings = dataResult.data.settings.softwareSettings;

      // 加载调试模式设置
      if (typeof settings.isdebug === "boolean") {
        showDebugLog.value = settings.isdebug;
      }

      // 加载自动连接设置
      if (typeof settings.autoConnect === "boolean") {
        autoConnect.value = settings.autoConnect;
      }

      // 加载连接提醒设置
      if (typeof settings.connectionNotify === "boolean") {
        connectionNotify.value = settings.connectionNotify;
      }

      // 加载测量频率设置
      if (typeof settings.detectFrequency === "number") {
        frequencyValue.value = settings.detectFrequency;
      }
    }

    console.log("设备设置已加载:", {
      isdebug: showDebugLog.value,
      autoConnect: autoConnect.value,
      connectionNotify: connectionNotify.value,
      showCreatinineUnit: showCreatinineUnit.value,
      detectFrequency: frequencyValue.value,
    });
  } catch (error) {
    console.error("[DevicesView] errorerror 加载设备设置失败:", error);
  }
};

// 生命周期
onMounted(async () => {
  // 初始化蓝牙状态
  updateBleState();

  // 加载设置
  await loadSettings();

  // 节流函数 - 限制函数调用频率
  const throttle = <T extends (...args: unknown[]) => void>(func: T, delay: number): T => {
    let lastCall = 0;
    return ((...args: unknown[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    }) as T;
  };

  // 创建节流处理的蓝牙数据处理函数 - 500ms间隔，避免高频UI更新导致卡死
  const throttledBluetoothDataHandler = throttle((data: unknown) => {
    console.log("[DevicesView] 蓝牙原始数据 (已节流):", data);
    addLog(LogLevel.INFO, `data: ${JSON.stringify(data)}`);
    addConnectionHistory(t("devices.settings.data_received"), "success");
    updateBleState(); // 更新状态显示

    // 处理蓝牙数据并触发事件
    handleBluetoothData(data);
  }, 500); // 500毫秒节流间隔

  // 初始化蓝牙设备管理器 - 使用节流处理避免卡死
  bleDeviceManager.setDataCallback(throttledBluetoothDataHandler);

  // 监听日志中的断开关键字
  const checkLogForDisconnect = () => {
    const logText = logContent.value;
    const disconnectKeywords = ["设备连接已断开", "蓝牙扫描已停止", "清理完成"];

    // 检查是否包含断开关键字
    const hasDisconnectKeyword = disconnectKeywords.some((keyword) => logText.includes(keyword));

    if (hasDisconnectKeyword) {
      addLog(LogLevel.INFO, t("devices.settings.disconnect_detected"));
      updateBleState(); // 更新状态显示
      // 触发事件通知 Dashboard 清空当前显示
      window.dispatchEvent(
        new CustomEvent("health-data-updated", {
          detail: {
            healthStatus: {
              creatinine: {
                value: 0,
                unit: "µmol/L",
                level: "unknown",
                percentage: 0,
                timestamp: "",
              },
              illnessProbability: 0,
              lastUpdated: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  };

  // 创建节流版本的检测函数 - 1秒检测一次
  const throttledCheckLogForDisconnect = throttle(checkLogForDisconnect, 1000);

  // 监听日志内容变化 - 使用节流版本
  watch(logContent, () => {
    throttledCheckLogForDisconnect();
  });

  // 如果开启调试模式，设置日志回调
  if (showDebugLog.value) {
    bleDeviceManager.setLogCallback((level, message) => {
      addLog(level, message);
    });
  }

  // 监听蓝牙数据接收事件
  bluetoothDataListener = (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log("[DevicesView] 蓝牙事件原始数据:", customEvent.detail);
    const { data, healthStatus, timestamp } = customEvent.detail;
    addLog(LogLevel.INFO, `[实时数据] 肌酐值: ${data.value} ${data.unit}`);
    addLog(LogLevel.INFO, `[实时数据] 健康状态: ${healthStatus.creatinine.level}`);
    addLog(LogLevel.INFO, `[实时数据] 时间戳: ${timestamp}`);
    addConnectionHistory(t("devices.settings.data_updated"), "success");
  };
  window.addEventListener("bluetooth-data-received", bluetoothDataListener);

  // 等待文字选择管理初始化完成
  if (textSelectionInitialized.value) {
    console.log("[DevicesView] 文字选择管理已初始化");
  }
});

onUnmounted(() => {
  // 清理资源
  bleDeviceManager.setDataCallback(() => {});
  bleDeviceManager.setLogCallback(() => {});

  // 移除事件监听器
  if (bluetoothDataListener) {
    window.removeEventListener("bluetooth-data-received", bluetoothDataListener);
  }

  // 清理开发者模式定时器
  if (developerClickTimer.value) {
    clearTimeout(developerClickTimer.value);
    developerClickTimer.value = null;
  }
});
</script>

<style scoped>
/* ===== 设备分类样式 ===== */
.device-category {
  margin-bottom: 32px; /* iOS 原生间距 */
}

/* ===== 设备分类标题样式 ===== */
.device-category .item-title {
  margin-bottom: 8px; /* iOS 原生间距 */
}

/* ===== 设备卡片样式 ===== */
.device-card {
  background: linear-gradient(135deg, #e9f5ff 0%, #ddf0ff 50%, #c6e5ff 100%); /* 浅蓝色渐变背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  padding: 20px; /* 内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
}

/* ===== 设备信息样式 ===== */
.device-info {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 15px; /* 元素间距 */
}

/* ===== 设备图标样式 ===== */
.device-icon {
  width: 70px; /* iOS 原生尺寸 */
  height: 70px; /* iOS 原生尺寸 */
  background: #2196f3; /* iOS 原生蓝色 */
  border-radius: 8px; /* 圆角 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  color: white; /* 白色文字 */
  font-size: 36px; /* iOS 原生图标大小 */
}

/* ===== 设备详情样式 ===== */
.device-details .item-body {
  margin: 0; /* 移除外边距 */
}

/* ===== 设备状态文字 ===== */
.device-status {
  text-align: right; /* 右对齐 */
}

/* ===== 状态文字样式 ===== */
.status-text {
  display: block; /* 块级显示 */
  font-size: 14px; /* 字体大小 */
  color: #e74c3c; /* 红色文字 */
  /* font-weight: 500;                中等粗细 */
}

/* ===== 扫描按钮样式 ===== */
.scan-button {
  background: #2196f3; /* 蓝色背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  padding: 12px 24px; /* 内边距 */
  border-radius: 8px; /* 圆角 */
  font-size: 16px; /* 字体大小 */
  /* font-weight: 500;                中等粗细 */
  cursor: pointer; /* 手型光标 */
  transition: background-color 0.3s ease; /* 背景色过渡 */
}

/* ===== 扫描按钮禁用状态 ===== */
.scan-button:disabled {
  background: #c7c7cc; /* iOS 原生禁用色 */
  cursor: not-allowed; /* 禁用光标 */
}

/* ===== 扫描按钮扫描中状态 ===== */
.scan-button.scanning {
  background: #ff9500; /* iOS 原生橙色 */
}

/* ===== 扫描按钮已连接状态 ===== */
.scan-button.connected {
  background: #34c759; /* iOS 原生绿色 */
}

/* ===== 扫描按钮断开中状态 ===== */
.scan-button.disconnecting {
  background: #ff3b30; /* iOS 原生红色 */
}

/* ===== BLE日志文本框样式 ===== */
.ble-log-textarea {
  width: 100%; /* 占满宽度 */
  height: 200px; /* 固定高度 */
  box-sizing: border-box; /* 盒模型包含padding和border */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  font-family: "SF Mono", "Menlo", "Monaco", "Courier New", monospace; /* 等宽字体 */
  color: #333; /* 主要文字颜色 */
  background: #fff; /* 白色背景 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  border: 1px solid #ccc; /* 边框 */
  padding: 12px; /* 内边距 */
  resize: vertical; /* 只允许垂直调整大小 */
}

/* ===== 设置卡片样式 ===== */
.setting-card {
  background: #ffffff; /* 现代 iOS 白色背景 */
  border-radius: var(--border-radius-medium); /* 现代 iOS 圆角 */
  /* margin: 12px;                   现代 iOS 外边距 */
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  overflow: hidden; /* 隐藏溢出 */
  border: none; /* 移除边框 */
}

/* ===== 设置信息描述 ===== */
.setting-info p {
  margin: 0; /* 移除外边距 */
  color: #8e8e93; /* iOS 原生次要文字颜色 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
}

/* ===== 设置脚注样式 ===== */
.setting-footnote {
  padding: 0 0rem 1rem 1rem; /* 现代 iOS 内边距，与卡片对齐 */
  color: #8e8e93; /* 现代 iOS 次要文字颜色 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  line-height: 1; /* 行高 */
  /* background: transparent;         透明背景 */
}

/* ===== 设置项样式 ===== */
.setting-item {
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 两端对齐 */
  padding: 0.6rem 1rem;
}

/* ===== iOS风格开关按钮样式 ===== */
.ios-toggle-button {
  position: relative; /* 相对定位 */
  display: inline-block; /* 行内块级显示 */
  width: 2.8rem; /* iOS 原生宽度 */
  height: 1.6rem; /* iOS 原生高度 */
  background-color: #e9e9ea; /* iOS 原生灰色背景 */
  border-radius: 0.8rem; /* iOS 原生圆角 */
  cursor: pointer; /* 手型光标 */
  transition: 0.3s; /* iOS 原生过渡动画 */
  border: none; /* 无边框 */
  padding: 0; /* 无内边距 */
}

/* ===== 开关激活状态 ===== */
.ios-toggle-button.active {
  background-color: #34c759; /* iOS 原生绿色 */
}

/* ===== 开关滑块样式 ===== */
.toggle-handle {
  position: absolute; /* 绝对定位 */
  top: 0.1rem; /* iOS 原生顶部位置 */
  left: 0.1rem; /* iOS 原生左侧位置 */
  width: 1.4rem; /* iOS 原生宽度 */
  height: 1.4rem; /* iOS 原生高度 */
  background-color: white; /* 白色背景 */
  border-radius: 50%; /* 圆形 */
  transition: 0.3s; /* iOS 原生过渡动画 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* iOS 原生阴影 */
}

/* ===== 开关激活状态下的滑块位置 ===== */
.ios-toggle-button.active .toggle-handle {
  transform: translateX(1.2rem); /* iOS 原生移动距离 */
}

/* ===== 开关组件样式 ===== */
.switch {
  position: relative; /* 相对定位 */
  display: inline-block; /* 行内块级显示 */
  width: 50px; /* 宽度 */
  height: 24px; /* 高度 */
}

/* ===== 开关隐藏原始输入框 ===== */
.switch input {
  opacity: 0; /* 完全透明 */
  width: 0; /* 宽度为0 */
  height: 0; /* 高度为0 */
}

/* ===== 开关滑块样式 ===== */
.slider {
  position: absolute; /* 绝对定位 */
  cursor: pointer; /* 手型光标 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background-color: #ccc; /* 灰色背景 */
  transition: 0.4s; /* 过渡动画 */
  border-radius: var(--border-radius-large); /* 大圆角 */
}

/* ===== 开关滑块圆形指示器 ===== */
.slider:before {
  position: absolute; /* 绝对定位 */
  content: ""; /* 空内容 */
  height: 18px; /* 高度 */
  width: 18px; /* 宽度 */
  left: 3px; /* 左侧位置 */
  bottom: 3px; /* 底部位置 */
  background-color: white; /* 白色背景 */
  transition: 0.4s; /* 过渡动画 */
  border-radius: var(--border-radius-circle); /* 圆形 */
}

/* ===== 开关激活状态 ===== */
input:checked + .slider {
  background-color: #2196f3; /* 蓝色背景 */
}

/* ===== 开关激活状态下的滑块位置 ===== */
input:checked + .slider:before {
  transform: translateX(26px); /* 向右移动 */
}

/* 频率选择器样式（用于未来扩展） */

.help-list {
  background: #fff;
  border-radius: var(--border-radius-small);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.help-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-bottom: 1px solid #e5e5ea;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.help-item:last-child {
  border-bottom: none;
}

.help-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #4a4a4a;
  /* text-shadow:
    0.5px 0.5px 0px #ffffff,
    -0.5px -0.5px 0px #666666; */
  /* font-weight: 300; */
}

.help-content {
  flex: 1;
}

.help-content p {
  margin: 0;
  color: #666;
  font: -apple-system-footnote;
}

/* 透明按钮 */
.transparent-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  color: #007aff;
  border: 1px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  padding: 8px 12px;
  font: -apple-system-body;
  /* font-weight: 530; */
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.transparent-button:active {
  background: #e5e5ea;
}

.transparent-button i {
  font-size: 12px;
  margin-left: 8px;
  opacity: 0.6;
}

/* 频率选择器弹出层 */
.frequency-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.frequency-picker {
  background: white;
  border-radius: var(--border-radius-small);
  padding: 20px;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e5ea;
}

.picker-header .item-body {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.2s ease;
}

.picker-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-option {
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: var(--border-radius-small);
  font: -apple-system-body;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.picker-option.active {
  background: #34c759;
  color: white;
}

.transparent-button {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #007aff;
  font: -apple-system-body;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.2s ease;
}

.help-arrow {
  color: #7d7d7d;
  /* font-size: 30px; */
  /* font-weight: bold; */
}

.history-list {
  background: #fff;
  border-radius: var(--border-radius-small);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-time {
  color: #666;
  font: -apple-system-caption1;
  width: 160px;
}

.history-action {
  flex: 1;
  color: #333;
  font: -apple-system-caption1;
}

.history-status {
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-circle);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  /* font-weight: bold; */
}

.history-status.success {
  background-color: #4caf50;
  color: white;
}

.history-status.warning {
  background-color: #ff9800;
  color: white;
}

.history-status.error {
  background-color: #f44336;
  color: white;
}

/* ===== Apple 系统字体测试区域样式 ===== */
.font-test-container {
  background: #fff;
  border-radius: var(--border-radius-small);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.font-test-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.font-test-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.font-label {
  min-width: 120px;
  color: #666;
  font: -apple-system-caption1;
  /* font-weight: 500; */
}

.font-sample {
  flex: 1;
  color: #333;
}

/* Apple 系统字体样式 - 最佳实践 */
.apple-font-large-title {
  font: -apple-system-large-title;
}

.apple-font-title-one {
  font: -apple-system-title1;
}

.apple-font-title-two {
  font: -apple-system-title2;
}

.apple-font-title-three {
  font: -apple-system-title3;
}

.apple-font-headline {
  font: -apple-system-headline;
}

.apple-font-body {
  font: -apple-system-body;
}

.apple-font-callout {
  font: -apple-system-callout;
}

.apple-font-subheadline {
  font: -apple-system-subheadline;
}

.apple-font-footnote {
  font: -apple-system-footnote;
}

.apple-font-caption-one {
  font: -apple-system-caption1;
}

.apple-font-caption-two {
  font: -apple-system-caption2;
}

/* ===== 开发者模式特殊样式 ===== */
.developer-mode-item {
  border: 2px dashed #007aff;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
}

.developer-mode-item .help-icon {
  color: #007aff;
}

.developer-mode-item .item-body {
  color: #007aff;
  /* font-weight: 600; */
}

.developer-mode-item .item-footnote {
  color: #5856d6;
  font-style: italic;
}
</style>

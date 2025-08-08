<template>
  <div class="developer-view">
    <header class="header">
      <div></div>
      <div class="page-title item-headline">开发者模式</div>
      <div></div>
    </header>

    <section class="developer-content">
      <div style="height: 10px"></div>

      <!-- 数据发送功能 -->
      <div class="developer-category">
        <!-- <div class="item-title">数据发送</div> -->
        <div class="developer-card">
          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">读取特征值（似乎是最后发出去的值）</div>
              <div class="item-footnote">读取当前特征值（似乎是最后发出去的值）</div>
            </div>
            <button
              class="developer-button info"
              @click="readCharacteristic"
            >
              读取
            </button>
          </div>

          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">发送测试数据</div>
              <div class="item-footnote">发送200字节的随机字符串</div>
            </div>
            <button class="developer-button success" @click="sendTestData">
              发送测试
            </button>
          </div>

          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">自定义数据</div>
              <div class="item-footnote">发送自定义文本数据</div>
            </div>
          </div>
            <div class="custom-data-container">
              <input
                v-model="customDataInput"
                type="text"
                placeholder="输入要发送的数据"
                class="custom-data-input"
                @keypress.enter="sendCustomData"
              />
              <button
                class="developer-button success"
                @click="sendCustomData"
              >
                发送
              </button>
          </div>

          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">十六进制数据</div>
              <div class="item-footnote">发送十六进制数据 (如: 01 02 03)</div>
            </div>
          </div>
          <div class="custom-data-container">
            <input
              v-model="hexDataInput"
              type="text"
              placeholder="输入十六进制数据"
              class="custom-data-input"
              @keypress.enter="sendHexData"
            />
            <button class="developer-button info" @click="sendHexData">
              发送HEX
            </button>
          </div>
        </div>
      </div>

      <!-- 数据接收功能 -->
      <div class="developer-category">
        <div class="item-title">数据接收</div>
        <div class="developer-card">
          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">实时数据监控</div>
              <div class="item-footnote">监控设备发送的实时数据</div>
            </div>
            <button
              class="developer-button"
              :class="{ active: isMonitoring }"
              @click="toggleDataMonitoring"
            >
              {{ isMonitoring ? "停止监控" : "开始监控" }}
            </button>
          </div>

          <!-- 接收到的数据显示 -->
          <div v-if="receivedData.length > 0" class="received-data-container">
            <div class="received-data-title">接收到的数据:</div>
            <div class="received-data-list">
              <div v-for="(data, index) in receivedData" :key="index" class="received-data-item">
                <div class="data-timestamp">{{ data.timestamp }}</div>
                <div class="data-content">{{ data.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>



      <!-- 实时数据解析 -->
      <div class="developer-category">

        <div class="developer-card">
          <div class="developer-item full-width">
            <div class="developer-info">
              <div class="item-body">实时数据解析</div>
                          </div>
            <button
              class="developer-button"
              :class="{ active: isParsingRealtime }"
              @click="toggleRealtimeParsing"
            >
              {{ isParsingRealtime ? "停止解析" : "开始解析" }}
            </button>
          </div>

          <!-- 实时解析数据显示 -->
          <div v-if="realtimeParseData.length > 0" class="realtime-data-container">
            <div class="realtime-data-title">实时解析结果:</div>
            <div class="realtime-data-list">
              <div
                v-for="(data, index) in realtimeParseData"
                :key="index"
                class="realtime-data-item"
                :class="{ success: data.type === 'success', error: data.type === 'error' }"
              >
                <div class="data-timestamp">{{ data.timestamp }}</div>
                <div class="data-status">{{ data.type.toUpperCase() }}</div>
                <div class="data-content">{{ data.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 协议管理 -->
      <div class="developer-category">
        <div class="item-title">协议管理</div>
        <div class="developer-card">
          <!-- 文件选择功能 -->
          <div class="file-upload-section">
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              @change="handleFileSelect"
              style="display: none"
            />
            <button class="developer-button" @click="selectFile">
              选择JSON文件
            </button>
            <div v-if="selectedFileName" class="selected-file">
              <p><strong>已选择:</strong> {{ selectedFileName }}</p>
              <button class="developer-button" @click="loadSelectedFile">
                加载文件
              </button>
            </div>
          </div>

          <!-- 当前协议状态 -->
          <div class="status-section">
            <div class="status-item">
              <span class="status-label">加载状态:</span>
              <span :class="['status-value', isLoaded ? 'success' : 'error']">
                {{ isLoaded ? '已加载' : '未加载' }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">当前协议:</span>
              <span class="status-value" :class="{ success: currentProtocolName, error: !currentProtocolName }">
                {{ currentProtocolName || '未设置' }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">已加载协议:</span>
              <span class="status-value">{{ loadedProtocols.length > 0 ? `${loadedProtocols.length}个协议` : '无' }}</span>
            </div>
          </div>

          <!-- 协议文件列表 -->
          <div v-if="loadedProtocols.length > 0" class="protocol-list">
            <div v-for="protocol in loadedProtocols" :key="protocol.protocol.protocolLength" class="protocol-item">
              <div class="protocol-header">
                <div class="protocol-info">
                  <h3>{{ protocol.protocol.protocolLength }}字节协议</h3>
                  <div class="protocol-details">
                    <span class="protocol-length">长度: {{ protocol.protocol.protocolLength }} 字节</span>
                    <span class="protocol-fields">字段数: {{ Object.keys(protocol.protocol.flags).filter(key => protocol.protocol.flags[key].type).length }}</span>
                    <span class="protocol-filename" v-if="protocol.fileName">文件名: {{ protocol.fileName }}</span>
                    <span class="protocol-path" v-if="protocol.path">路径: {{ protocol.path }}</span>
                  </div>
                </div>
                <div class="protocol-actions">
                  <button class="developer-button" @click="viewProtocolDetails(protocol)">
                    详情
                  </button>
                  <button class="developer-button success" @click="setCurrentProtocol(protocol)">
                    设为当前
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="errorMessage" class="error-message">
            <p>{{ errorMessage }}</p>
          </div>

          <!-- 空状态 -->
          <div v-if="!isLoaded && !errorMessage" class="empty-state">
            <p>点击刷新按钮加载协议文件</p>
          </div>
        </div>
      </div>

      <!-- 协议详情模态框 -->
      <div v-if="showProtocolDetails" class="modal-overlay" @click="showProtocolDetails = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>协议详情</h3>
            <button class="modal-close" @click="showProtocolDetails = false">×</button>
          </div>
          <div class="modal-body" v-if="selectedProtocol">
            <div class="protocol-details">
              <h4>{{ selectedProtocol.protocol.protocolLength }}字节协议</h4>
              <p><strong>协议长度:</strong> {{ selectedProtocol.protocol.protocolLength }} 字节</p>
              <p><strong>标志位数量:</strong> {{ Object.keys(selectedProtocol.protocol.flags).length }}</p>
              <p v-if="selectedProtocol.fileName"><strong>文件名:</strong> {{ selectedProtocol.fileName }}</p>
              <p v-if="selectedProtocol.path"><strong>文件路径:</strong> {{ selectedProtocol.path }}</p>

              <div class="flags-section">
                <h4>标志位定义</h4>
                <div class="flag-list">
                  <div v-for="(flag, key) in selectedProtocol.protocol.flags" :key="key" class="flag-item">
                    <div class="flag-name">{{ key }}</div>
                    <div class="flag-details" v-if="flag.type">
                      <span class="flag-type">类型: {{ flag.type }}</span>
                    </div>
                    <div class="flag-unused" v-else>
                      <span class="flag-status">未使用</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- 校准功能 -->
      <div class="developer-category">
        <div class="item-title">设备校准</div>
        <div class="developer-card">
          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">零点校准（未开发）</div>
              <div class="item-footnote">校准传感器零点值</div>
            </div>
            <button class="developer-button" @click="performZeroCalibration">执行校准</button>
          </div>

          <div class="developer-item">
            <div class="developer-info">
              <div class="item-body">满量程校准（未开发）</div>
              <div class="item-footnote">校准传感器满量程值</div>
            </div>
            <button class="developer-button" @click="performFullScaleCalibration">执行校准</button>
          </div>
        </div>
      </div>

      <!-- 开发者日志 -->
      <div class="developer-category">
        <div class="item-title">开发者日志</div>
        <div class="developer-card">
          <textarea
            ref="developerLog"
            readonly
            class="developer-log-textarea"
            v-model="logContent"
            placeholder="开发者操作日志将在这里显示..."
          ></textarea>
          <div class="log-controls">
            <button class="developer-button" @click="clearLogs">清空日志</button>
            <button class="developer-button" @click="exportLogs">导出日志</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { bleDeviceManager } from "@/services/BleDeviceManager";
import { parseDataPacket, formatParsedResult } from "@/utils/parser";
import { BleClient, numbersToDataView } from "@capacitor-community/bluetooth-le";
import { DynamicProtocolManager } from '@/utils/dynamicProtocol';
import type { ProtocolFileInfo, ProtocolDefinition } from '@/utils/dynamicProtocol';

// BLE相关常量
const CREASENSE_SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
const CREASENSE_DATA_CHARACTERISTIC = "0000fff1-0000-1000-8000-00805f9b34fb";

// 响应式数据
const customDataInput = ref("");
const hexDataInput = ref("");
const isMonitoring = ref(false);
const receivedData = ref<Array<{ timestamp: string; content: string }>>([]);
const logContent = ref("");


// 实时解析相关
const isParsingRealtime = ref(false);
const realtimeParseData = ref<
  Array<{
    timestamp: string;
    type: string;
    content: string;
  }>
>([]);

// 协议管理相关
const isLoaded = ref(false);
const currentProtocolName = ref('');
const loadedProtocols = ref<ProtocolFileInfo[]>([]);
const errorMessage = ref('');
const showProtocolDetails = ref(false);
const selectedProtocol = ref<ProtocolFileInfo | null>(null);

// 文件选择相关
const fileInput = ref<HTMLInputElement>();
const selectedFileName = ref('');
const selectedFileContent = ref<string>('');



// 事件监听器引用
let bluetoothDataListener: ((event: Event) => void) | null = null;

// 生成随机字符串
const generateRandomString = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 发送测试数据
const sendTestData = async () => {
  addLog("发送测试数据...");
  try {
    const testData = generateRandomString(200);
    addLog(`发送200字节随机数据: ${testData.substring(0, 50)}...`);

    const connectedDevice = bleDeviceManager.getConnectedDevice();
    if (!connectedDevice) {
      addLog("[SEND_ERROR] 没有连接的设备，请先连接设备");
      return;
    }

    const dataArray = new TextEncoder().encode(testData);
    const dataView = new DataView(dataArray.buffer);

    await BleClient.write(
      connectedDevice.deviceId,
      CREASENSE_SERVICE,
      CREASENSE_DATA_CHARACTERISTIC,
      dataView
    );

    addLog("测试数据发送成功");
  } catch (error) {
    addLog(`发送测试数据失败: ${error}`);
  }
};

// 发送自定义数据
const sendCustomData = async () => {
  if (!customDataInput.value.trim()) {
    addLog("请输入要发送的数据");
    return;
  }

  addLog(`发送自定义数据: ${customDataInput.value}`);
  try {
    const connectedDevice = bleDeviceManager.getConnectedDevice();
    if (!connectedDevice) {
      addLog("[SEND_ERROR] 没有连接的设备，请先连接设备");
      return;
    }

    const dataArray = new TextEncoder().encode(customDataInput.value);
    const dataView = new DataView(dataArray.buffer);

    await BleClient.write(
      connectedDevice.deviceId,
      CREASENSE_SERVICE,
      CREASENSE_DATA_CHARACTERISTIC,
      dataView
    );

    addLog("自定义数据发送成功");
    customDataInput.value = "";
  } catch (error) {
    addLog(`发送自定义数据失败: ${error}`);
  }
};

// 发送十六进制数据
const sendHexData = async () => {
  if (!hexDataInput.value.trim()) {
    addLog("请输入十六进制数据");
    return;
  }

  try {
    const hexString = hexDataInput.value.trim();
    const hexArray = hexString.split(/\s+/).map((hex) => parseInt(hex, 16));

    if (hexArray.some(isNaN)) {
      addLog("十六进制格式错误，请使用空格分隔，如: 01 02 03");
      return;
    }

    const connectedDevice = bleDeviceManager.getConnectedDevice();
    if (!connectedDevice) {
      addLog("[SEND_ERROR] 没有连接的设备，请先连接设备");
      return;
    }

    const dataView = numbersToDataView(hexArray);

    addLog(`准备发送十六进制数据: ${hexString}`);

    await BleClient.write(
      connectedDevice.deviceId,
      CREASENSE_SERVICE,
      CREASENSE_DATA_CHARACTERISTIC,
      dataView
    );

    addLog(`十六进制数据发送成功: ${hexString}`);
    hexDataInput.value = "";
  } catch (error) {
    addLog(`发送十六进制数据失败: ${error}`);
  }
};

// 读取特征值（似乎是最后发出去的值）
const readCharacteristic = async () => {
  addLog("[READ_CHARACTERISTIC] 开始读取特征值（似乎是最后发出去的值）");

  const connectedDevice = bleDeviceManager.getConnectedDevice();
  if (!connectedDevice) {
    addLog("[READ_ERROR] 没有连接的设备，请先连接设备");
    return;
  }

  try {
    const result = await BleClient.read(
      connectedDevice.deviceId,
      CREASENSE_SERVICE,
      CREASENSE_DATA_CHARACTERISTIC
    );

    if (result) {
      const uint8Array = new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
      const hexString = Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ");
      const asciiString = String.fromCharCode.apply(null, Array.from(uint8Array));

      addLog(`[READ_SUCCESS] 读取成功 - 十六进制: ${hexString}`);
      addLog(`[READ_SUCCESS] 读取成功 - ASCII: ${asciiString}`);
    } else {
      addLog("[READ_SUCCESS] 读取成功但无数据");
    }
  } catch (error) {
    addLog(`[READ_ERROR] 读取特征值（似乎是最后发出去的值）失败: ${error}`);
  }
};

// 添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const logMessage = `[${timestamp}] ${message}\n`;
  logContent.value += logMessage;

  // 自动滚动到底部
  setTimeout(() => {
    const textarea = document.querySelector(".developer-log-textarea") as HTMLTextAreaElement;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, 100);
};

// 实时解析功能
const toggleRealtimeParsing = () => {
  isParsingRealtime.value = !isParsingRealtime.value;
  if (isParsingRealtime.value) {
    addLog("开始实时数据解析监控...");
    startRealtimeParsing();
  } else {
    addLog("停止实时数据解析监控");
    stopRealtimeParsing();
  }
};

let realtimeDataListener: ((hexString: string) => void) | null = null;

const startRealtimeParsing = () => {
  // 设置蓝牙设备数据监听器
  realtimeDataListener = (hexString: string) => {
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });

    if (hexString) {
      console.log(
        `[DeveloperView] DEBUG - 收到数据: ${hexString.substring(0, 32)}... (长度: ${
          hexString.length
        })`
      );

      // 直接使用解析器解析数据
      const result = parseDataPacket(hexString);

      // 如果解析失败且是长度不足错误，记录详细信息
      if (result.type === "error") {
        console.log(`[DeveloperView] DEBUG - ${result.message}`);
      }
      console.log(`[DeveloperView] DEBUG - 解析结果类型: ${result.type}`);

      const content = formatParsedResult(result);
      console.log(`[DeveloperView] DEBUG - 解析结果: ${content}`);

      realtimeParseData.value.unshift({
        timestamp,
        type: result.type,
        content,
      });

      // 限制显示数量
      if (realtimeParseData.value.length > 50) {
        realtimeParseData.value = realtimeParseData.value.slice(0, 50);
      }
    } else {
      console.log(`[DeveloperView] DEBUG - 数据格式异常: 空的hexString`);
    }
  };

  bleDeviceManager.setDataCallback(realtimeDataListener);
};

const stopRealtimeParsing = () => {
  if (realtimeDataListener) {
    bleDeviceManager.setDataCallback(undefined);
    realtimeDataListener = null;
  }
};

// 校准功能
const performZeroCalibration = async () => {
  addLog("开始执行零点校准...");
  try {
    // 这里添加实际的零点校准逻辑
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟校准过程
    addLog("零点校准完成");
  } catch (error) {
    addLog(`零点校准失败: ${error}`);
  }
};

const performFullScaleCalibration = async () => {
  addLog("开始执行满量程校准...");
  try {
    // 这里添加实际的满量程校准逻辑
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟校准过程
    addLog("满量程校准完成");
  } catch (error) {
    addLog(`满量程校准失败: ${error}`);
  }
};

// 数据接收功能
const toggleDataMonitoring = () => {
  isMonitoring.value = !isMonitoring.value;

  if (isMonitoring.value) {
    addLog("开始数据监控...");
    // 设置数据监控逻辑
    bleDeviceManager.setLogCallback((level, message) => {
      addLog(`[${level}] ${message}`);
    });
  } else {
    addLog("停止数据监控");
    bleDeviceManager.setLogCallback(() => {});
  }
};

// 日志管理
const clearLogs = () => {
  logContent.value = "";
  receivedData.value = [];
  addLog("日志已清空");
};

const exportLogs = () => {
  const blob = new Blob([logContent.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `developer-logs-${new Date().toISOString().slice(0, 19)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  addLog("日志已导出");
};

// 协议管理相关函数

// 文件选择功能
const selectFile = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    addLog(`[ProtocolManager] 选择文件: ${file.name} (${file.size} 字节)`);

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      errorMessage.value = '请选择JSON格式的文件';
      addLog('[ProtocolManager] ERROR - 文件格式不支持，请选择JSON文件');
      return;
    }

    selectedFileName.value = file.name;
    addLog(`[ProtocolManager] DEBUG - 文件名已设置: ${selectedFileName.value}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      selectedFileContent.value = content;
      addLog(`[ProtocolManager] DEBUG - 文件读取成功: ${file.name}`);
      addLog(`[ProtocolManager] DEBUG - 文件内容长度: ${content.length} 字符`);
      addLog(`[ProtocolManager] DEBUG - 文件内容预览: ${content.substring(0, 100)}...`);
    };
    reader.onerror = (error) => {
      errorMessage.value = '文件读取失败';
      addLog(`[ProtocolManager] ERROR - 文件读取失败: ${error}`);
    };
    reader.readAsText(file);
  } else {
    addLog('[ProtocolManager] DEBUG - 没有选择文件');
  }
};

// 加载选择的文件
const loadSelectedFile = async () => {
  try {
    addLog('[ProtocolManager] 开始加载自定义协议文件...');

    if (!selectedFileContent.value) {
      errorMessage.value = '没有选择文件';
      addLog('[ProtocolManager] ERROR - 没有选择文件内容');
      return;
    }

    addLog(`[ProtocolManager] DEBUG - 文件内容长度: ${selectedFileContent.value.length} 字符`);
    addLog(`[ProtocolManager] DEBUG - 文件内容预览: ${selectedFileContent.value.substring(0, 200)}...`);

    // 解析JSON
    let protocol: ProtocolDefinition;
    try {
      protocol = JSON.parse(selectedFileContent.value) as ProtocolDefinition;
      addLog(`[ProtocolManager] DEBUG - JSON解析成功，协议长度: ${protocol.protocolLength}`);
      addLog(`[ProtocolManager] DEBUG - 标志位数量: ${Object.keys(protocol.flags).length}`);
    } catch (parseError) {
      addLog(`[ProtocolManager] ERROR - JSON解析失败: ${parseError}`);
      errorMessage.value = `JSON解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
      return;
    }

    // 验证协议定义
    const dynamicManager = DynamicProtocolManager.getInstance();
    try {
      dynamicManager.validateProtocolDefinition(protocol);
      addLog('[ProtocolManager] DEBUG - 协议验证通过');
    } catch (validationError) {
      addLog(`[ProtocolManager] ERROR - 协议验证失败: ${validationError}`);
      errorMessage.value = `协议验证失败: ${validationError instanceof Error ? validationError.message : String(validationError)}`;
      return;
    }

    // 组合协议定义和文件信息
    const protocolWithFileInfo: ProtocolFileInfo = {
      fileName: selectedFileName.value,
      path: `自定义文件: ${selectedFileName.value}`,
      protocol: protocol
    };

    addLog(`[ProtocolManager] DEBUG - 创建协议文件信息: ${protocolWithFileInfo.fileName}`);

    // 添加到协议管理器
    try {
      dynamicManager.addCustomProtocol(protocolWithFileInfo);
      addLog('[ProtocolManager] DEBUG - 协议已添加到管理器');
    } catch (addError) {
      addLog(`[ProtocolManager] ERROR - 添加协议到管理器失败: ${addError}`);
      errorMessage.value = `添加协议失败: ${addError instanceof Error ? addError.message : String(addError)}`;
      return;
    }

    // 设置为当前协议
    try {
      dynamicManager.setCurrentProtocol(protocolWithFileInfo);
      addLog('[ProtocolManager] DEBUG - 协议已设置为当前协议');
    } catch (setError) {
      addLog(`[ProtocolManager] ERROR - 设置当前协议失败: ${setError}`);
      errorMessage.value = `设置当前协议失败: ${setError instanceof Error ? setError.message : String(setError)}`;
      return;
    }

    // 更新显示状态
    currentProtocolName.value = `${protocolWithFileInfo.protocol.protocolLength}字节协议`;
    selectedProtocol.value = protocolWithFileInfo;

    // 刷新协议列表显示
    try {
      const loadedProtocolsArray = dynamicManager.getLoadedProtocols();
      loadedProtocols.value = loadedProtocolsArray;
      addLog(`[ProtocolManager] DEBUG - 协议列表已更新，当前协议数量: ${loadedProtocolsArray.length}`);
    } catch (refreshError) {
      addLog(`[ProtocolManager] ERROR - 刷新协议列表失败: ${refreshError}`);
    }

    errorMessage.value = '';
    addLog('[ProtocolManager] ✅ 自定义协议文件加载成功');
  } catch (error) {
    console.error('[ProtocolManager] 自定义协议文件加载失败:', error);
    addLog(`[ProtocolManager] ERROR - 加载失败: ${error}`);
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
};

// 自动加载协议配置
const loadProtocols = async () => {
  try {
    addLog('[ProtocolManager] 开始加载协议配置...');
    errorMessage.value = '';

    const dynamicManager = DynamicProtocolManager.getInstance();
    await dynamicManager.loadProtocols();

    isLoaded.value = dynamicManager.isProtocolsLoaded();
    const loadedProtocolsArray = dynamicManager.getLoadedProtocols();

    loadedProtocols.value = loadedProtocolsArray;

    // 更新当前协议名称
    const currentProtocol = dynamicManager.getCurrentProtocol();
    currentProtocolName.value = currentProtocol ? `${currentProtocol.protocol.protocolLength}字节协议` : '';

    addLog(`[ProtocolManager] ✅ 协议配置加载成功，已加载 ${loadedProtocolsArray.length} 个协议`);
    if (currentProtocol) {
      addLog(`[ProtocolManager] DEBUG - 当前协议: ${currentProtocol.protocol.protocolLength}字节协议`);
    } else {
      addLog(`[ProtocolManager] DEBUG - 当前未设置协议`);
    }
  } catch (error) {
    console.error('[ProtocolManager] 协议配置加载失败:', error);
    addLog(`[ProtocolManager] ERROR - 协议配置加载失败: ${error}`);
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
};

// 设置当前协议
const setCurrentProtocol = async (protocol: ProtocolFileInfo) => {
  try {
    addLog(`[ProtocolManager] 开始设置当前协议: ${protocol.protocol.protocolLength}字节协议`);
    addLog(`[ProtocolManager] DEBUG - 协议文件名: ${protocol.fileName}`);
    addLog(`[ProtocolManager] DEBUG - 协议路径: ${protocol.path}`);

    const dynamicManager = DynamicProtocolManager.getInstance();
    dynamicManager.setCurrentProtocol(protocol);

    currentProtocolName.value = `${protocol.protocol.protocolLength}字节协议`;
    addLog(`[ProtocolManager] ✅ 设置当前协议成功: ${protocol.protocol.protocolLength}字节协议`);
  } catch (error) {
    console.error(`[ProtocolManager] 设置当前协议失败: ${protocol.protocol.protocolLength}字节协议`, error);
    addLog(`[ProtocolManager] ERROR - 设置当前协议失败: ${error}`);
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
};

// 查看协议详情
const viewProtocolDetails = async (protocol: ProtocolFileInfo) => {
  try {
    selectedProtocol.value = protocol;
    showProtocolDetails.value = true;
  } catch (error) {
    console.error(`[ProtocolManager] 显示协议详情失败: ${protocol.protocol.protocolLength}字节协议`, error);
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }
};





// 生命周期
onMounted(() => {
  addLog("开发者模式已激活");

  // 加载协议配置
  loadProtocols();

  // 监听蓝牙数据接收事件
  bluetoothDataListener = (event: Event) => {
    if (!isMonitoring.value) return;

    const customEvent = event as CustomEvent;
    const { data } = customEvent.detail;

    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    receivedData.value.unshift({
      timestamp,
      content: JSON.stringify(data, null, 2),
    });

    // 限制显示的数据条数
    if (receivedData.value.length > 50) {
      receivedData.value = receivedData.value.slice(0, 50);
    }

    addLog(`接收到数据: ${JSON.stringify(data)}`);
  };

  window.addEventListener("bluetooth-data-received", bluetoothDataListener);
});

onUnmounted(() => {
  // 清理资源
  if (bluetoothDataListener) {
    window.removeEventListener("bluetooth-data-received", bluetoothDataListener);
  }

  // 停止实时解析监控
  if (isParsingRealtime.value) {
    stopRealtimeParsing();
  }

  // 停止监控
  bleDeviceManager.setLogCallback(() => {});

  addLog("开发者模式已退出");
});
</script>

<style scoped>
.developer-category {
  margin-bottom: 24px;
}

.item-title {
  font-size: 16px;
  /* font-weight: 600; */
  color: var(--text-primary);
  margin-bottom: 12px;
}

.developer-card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--card-shadow);
}

.developer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--separator-color);
}

.developer-item:last-child {
  border-bottom: none;
}

.developer-item.full-width {
  flex-direction: column;
  align-items: flex-start;
}

.developer-item.full-width .developer-button {
  margin-top: 8px;
  width: 100%;
}

.developer-info {
  flex: 1;
}

.item-body {
  font-size: 16px;
  /* font-weight: 500; */
  color: var(--text-primary);
  margin-bottom: 4px;
}

.item-footnote {
  font-size: 14px;
  color: var(--text-secondary);
}

.developer-button {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  /* font-weight: 500; */
  cursor: pointer;
  transition: all 0.2s ease;
}

.developer-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.developer-button.danger {
  background: #ff3b30;
}

.developer-button.warning {
  background: #ff9500;
}

.developer-button.info {
  background: #007aff;
}

.developer-button.success {
  background: #34c759;
}

.developer-button.active {
  background: var(--danger-color);
}

.custom-data-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 16px 0;
  width: 100%;
}

.custom-data-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--separator-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--input-background);
  color: var(--text-primary);
}

.custom-data-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.data-history-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--separator-color);
}

.data-history-title {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.data-history-list {
  max-height: 200px;
  overflow-y: auto;
  background: var(--background-color);
  border-radius: 6px;
  padding: 8px;
}

.data-history-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--separator-color);
}

.data-history-item:last-child {
  border-bottom: none;
}

.data-history-item .data-timestamp {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.data-history-item .data-hex {
  font-size: 12px;
  color: #007aff;
  font-family: monospace;
  margin-bottom: 2px;
}

.data-history-item .data-ascii {
  font-size: 12px;
  color: #34c759;
  font-family: monospace;
}

.received-data-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--separator-color);
}

.received-data-title {
  font-size: 14px;
  /* font-weight: 600; */
  color: var(--text-primary);
  margin-bottom: 8px;
}

.received-data-list {
  max-height: 200px;
  overflow-y: auto;
  background: var(--background-color);
  border-radius: 6px;
  padding: 8px;
}

.received-data-item {
  padding: 6px 0;
  border-bottom: 1px solid var(--separator-color);
}

.received-data-item:last-child {
  border-bottom: none;
}

.data-timestamp {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.data-content {
  font-size: 13px;
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
}

/* 实时解析数据样式 */
.realtime-data-container {
  margin-top: 12px;
}

.realtime-data-title {
  font-size: 14px;
  /* font-weight: 600; */
  color: var(--text-primary);
  margin-bottom: 8px;
}

.realtime-data-list {
  max-height: 300px;
  overflow-y: auto;
  background: var(--background-color);
  border-radius: 6px;
  padding: 8px;
}

.realtime-data-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--separator-color);
}

.realtime-data-item:last-child {
  border-bottom: none;
}

.realtime-data-item.success .data-status {
  background: #34c759;
  color: white;
}

.realtime-data-item.error .data-status {
  background: #ff3b30;
  color: white;
}

.realtime-data-item .data-timestamp {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 60px;
}

.realtime-data-item .data-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--separator-color);
  color: var(--text-primary);
  min-width: 50px;
  text-align: center;
  /* font-weight: 600; */
}

.realtime-data-item .data-content {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary);
  font-family: monospace;
}

.developer-log-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid var(--separator-color);
  border-radius: 8px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
  background: var(--background-color);
  color: var(--text-primary);
  resize: vertical;
  white-space: pre-wrap;
}

.developer-log-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.log-controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

.protocol-controls {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

/* CSS变量（如果没有在全局样式中定义） */
:root {
  --background-color: var(--bg--secondary);
  --card-background: #ffffff;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --text-primary: #333333;
  --text-secondary: #666666;
  --separator-color: #e5e5e7;
  --primary-color: #007aff;
  --primary-color-hover: #005ecb;
  --danger-color: #ff3b30;
  --input-background: #ffffff;
}

/* 协议管理样式 */
.file-upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.selected-file {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.selected-file p {
  margin: 0 0 0.5rem 0;
}

.status-section {
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-label {
  font-weight: 500;
}

.status-value {
  font-weight: 600;
}

.status-value.success {
  color: #34c759;
}

.status-value.error {
  color: #ff3b30;
}

.protocol-list {
  margin-top: 1rem;
}

.protocol-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--separator-color);
  border-radius: 8px;
  background: var(--background-color);
}

.protocol-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.protocol-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
}

.protocol-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.protocol-length,
.protocol-fields,
.protocol-filename,
.protocol-path {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.protocol-filename {
  color: #34c759;
  font-weight: 500;
}

.protocol-path {
  color: var(--primary-color);
  font-size: 0.8rem;
  word-break: break-all;
}

.protocol-actions {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  color: #c62828;
}

.empty-state {
  margin-top: 1rem;
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
}

/* 模态框样式 */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90%;
  max-height: 80%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--separator-color);
}

.modal-header h3 {
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
}

.flags-section {
  margin-top: 1rem;
}

.flags-section h4 {
  margin: 1rem 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.flag-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.flag-item {
  padding: 0.75rem;
  background: var(--background-color);
  border-radius: 4px;
}

.flag-name {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.flag-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.flag-type {
  background: var(--primary-color);
  color: white;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
}

.flag-unused {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.flag-status {
  background: var(--text-secondary);
  color: white;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
}
</style>

import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { clearCreatinine } from '../utils/globalCreatinine';
import { isNativePlatform } from '../utils/capacitor';
import { getCurrentAppLanguage } from '../composables/useI18n';
import { getDateLocale } from '../composables/locales-config';
import { DynamicProtocolManager } from '../utils/dynamicProtocol';

const TARGET_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const TARGET_CHARACTERISTIC_UUID = "0000fff1-0000-1000-8000-00805f9b34fb";
const SCAN_TIMEOUT_MS = 15000;

export enum BleState {
  IDLE = "IDLE",
  INITIALIZING = "INITIALIZING",
  SCANNING = "SCANNING",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
}

// --- 设备信息接口 ---
export interface BleDevice {
  deviceId: string;
  name?: string;
  rssi?: number;
}


// --- 回调函数类型 ---
export type BleCallback = (success: boolean, message: string) => void;
export type DataCallback = (hexString: string) => void;

// --- 日志级别 ---
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class BleDeviceManager {
  private currentState: BleState = BleState.IDLE;
  private connectedDevice: BleDevice | null = null;
  // private scanListener: { remove(): Promise<void> } | null = null;
  private dataCallback: DataCallback | null = null;
  private logCallback: ((level: LogLevel, message: string) => void) | null = null;
  private dataCounter = 0;

  constructor() {
    // 初始化默认日志回调
    this.logCallback = (level: LogLevel, message: string) => {
      console.log(`[${level}] ${message}`);
    };

    this.log(LogLevel.INFO, 'BleDeviceManager 初始化完成');
  }

  private parseCreasenseData(value: DataView): string {
    if (!(value instanceof DataView)) {
      const error = new Error(`Invalid data type: expected DataView, got ${typeof value}`);
      this.log(LogLevel.ERROR, `[DATA_PARSE_ERROR] ${error.message}`);
      throw error;
    }

    this.dataCounter++;
    const uint8Array = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const hexString = Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');


    const dynamicManager = DynamicProtocolManager.getInstance();
    const currentProtocol = dynamicManager.getCurrentProtocol();
    if (!currentProtocol) {
      this.log(LogLevel.ERROR, `[DATA_LENGTH_ERROR] currentProtocol is null`);
      return '';
    }
    if ( hexString.length < currentProtocol.protocol.protocolLength*2) {
      this.log(LogLevel.ERROR, `[DATA_LENGTH_ERROR] 数据包长度不足，当前协议: ${currentProtocol.protocol.protocolLength}字节，数据包: ${hexString.length /2}字节，丢弃数据包`);
      return ''; // 返回空字符串表示丢弃数据包
    }

    this.log(LogLevel.DEBUG, `[DATA_PARSED] 解析数据: ${hexString.substring(0, 32)}... (长度: ${hexString.length})`);

    return hexString;
  }

  // --- 日志系统 ---
  private log(level: LogLevel, message: string, stateOverride?: BleState) {
    const stateStr = stateOverride || this.currentState;
    const timestamp = new Date().toLocaleTimeString(getDateLocale(getCurrentAppLanguage()), { hour12: false });
    const logMessage = `[${timestamp}] [State: ${stateStr}] ${message}`;

    console.log(logMessage);

    if (this.logCallback) {
      this.logCallback(level, logMessage);
    }
  }

  // 设置日志回调
  public setLogCallback(callback: (level: LogLevel, message: string) => void) {
    this.logCallback = callback;
  }

  private setState(newState: BleState) {
    if (this.currentState !== newState) {
      this.log(LogLevel.INFO, `[STATE_CHANGE] ${this.currentState} -> ${newState}`, this.currentState);
      this.currentState = newState;
    }
  }

  public getCurrentState(): BleState {
    return this.currentState;
  }

  // --- 清理函数 ---
  private async cleanupAndReset(): Promise<void> {
    this.log(LogLevel.INFO, '[CLEANUP] 开始清理所有BLE资源...');

    // 检查Capacitor环境
    if (!isNativePlatform()) {
      this.log(LogLevel.WARN, '[CLEANUP] 非原生平台，跳过蓝牙清理');
      this.setState(BleState.IDLE);
      return;
    }
    await this.stopNotifications();
    try {
      if (this.connectedDevice) {
        this.setState(BleState.DISCONNECTING);
        await BleClient.disconnect(this.connectedDevice.deviceId);
        this.log(LogLevel.INFO, '[CLEANUP] 设备连接已断开');
        this.connectedDevice = null;
      }
      await BleClient.stopLEScan();
      this.log(LogLevel.INFO, '[CLEANUP] 蓝牙扫描已停止');
    } catch (error) {
      this.log(LogLevel.ERROR, `[CLEANUP_ERROR] 清理过程中发生错误: ${error}`);
    } finally {
      clearCreatinine();
      this.setState(BleState.IDLE);
    }
  }

  // --- 启动通知监听函数 ---
  private async startNotifications(): Promise<void> {
    try {
      if (!this.connectedDevice) {
        this.log(LogLevel.ERROR, '[NOTIFICATION] 无连接设备，无法启动通知监听');
        throw new Error('无连接设备');
      }
      this.log(LogLevel.INFO, '[NOTIFICATION] 开始启动通知监听...');
      await BleClient.startNotifications(
        this.connectedDevice.deviceId,
        TARGET_SERVICE_UUID,
        TARGET_CHARACTERISTIC_UUID,
        (value) => {
          this.log(LogLevel.DEBUG, `[DATA_RECEIVED] 收到通知数据: ${value}`);
          try {
            const parsedData = this.parseCreasenseData(value);
            // 只有当解析结果不为空时才调用上层回调
            if (parsedData && this.dataCallback) {
              this.dataCallback(parsedData);
            } else if (!parsedData) {
              this.log(LogLevel.DEBUG, `[DATA_DISCARDED] 数据包已被丢弃（长度不足）`);
            } else {
              this.log(LogLevel.ERROR, `[DATA_CALLBACK_ERROR] 数据回调未设置`);
            }
          } catch (error) {
            this.log(LogLevel.ERROR, `[DATA_PARSE_ERROR] 解析通知数据失败: ${error}`);
          }
        }
      );
      this.log(LogLevel.INFO, '[NOTIFICATION] 通知监听启动成功');
    } catch (error) {
      this.log(LogLevel.ERROR, `[NOTIFICATION] 启动通知监听失败: ${error}`);
      throw error;
    }
  }

  // --- 停止通知监听函数 ---
  private async stopNotifications(): Promise<void> {
    try {
      if (!this.connectedDevice) {
        this.log(LogLevel.WARN, '[NOTIFICATION] 无连接设备，跳过停止通知监听');
        return;
      }
      await BleClient.stopNotifications(
        this.connectedDevice.deviceId,
        TARGET_SERVICE_UUID,
        TARGET_CHARACTERISTIC_UUID
      );
      this.log(LogLevel.INFO, '[NOTIFICATION] 通知监听已停止');
    } catch (error) {
      this.log(LogLevel.ERROR, `[NOTIFICATION] 停止通知监听失败: ${error}`);
    }
  }


  // --- 支持回调的扫描连接流程 ---
  public async connectToDevice(callback: BleCallback): Promise<void> {
    this.log(LogLevel.INFO, '--- [API] connectToDevice 调用 ---');
    if (this.currentState !== BleState.IDLE) {
      this.log(LogLevel.WARN, `[API] 当前状态为${this.currentState}，无法发起新连接`);
      callback(false, '蓝牙状态忙，无法发起新连接');
      return;
    }
    // 不重新清理，直接进入连接流程
    if (!isNativePlatform()) {
      this.log(LogLevel.ERROR, '[FATAL] 非原生平台，蓝牙功能不可用');
      callback(false, '非原生平台，蓝牙功能不可用');
      return;
    }

    try {
      this.setState(BleState.INITIALIZING);
      this.log(LogLevel.INFO, '[INIT] 开始初始化蓝牙插件...');

      await BleClient.initialize();
      this.log(LogLevel.INFO, '[INIT_SUCCESS] 蓝牙初始化成功');

      this.setState(BleState.SCANNING);
      this.log(LogLevel.INFO, `[SCAN_START] 开始扫描服务: ${TARGET_SERVICE_UUID}`);

      let found = false;
      const scanTimeoutId = setTimeout(() => {
        if (!found) {
          this.log(LogLevel.ERROR, '[SCAN_FAIL] 扫描超时！');
          BleClient.stopLEScan();
          this.cleanupAndReset();
          callback(false, '扫描超时，未找到设备');
        }
      }, SCAN_TIMEOUT_MS);

      await BleClient.requestLEScan(
        { services: [TARGET_SERVICE_UUID] },
        async (result: { device: BleDevice; uuids?: string[] }) => {
          this.log(LogLevel.DEBUG, `[SCAN_RESULT] 收到扫描结果: ${JSON.stringify(result)}`);
          if (result.uuids && result.uuids.includes(TARGET_SERVICE_UUID)) {
            found = true;
            clearTimeout(scanTimeoutId);
            this.log(LogLevel.INFO, `[SCAN_SUCCESS] 找到目标UUID设备: ${result.device.name}`);
            await BleClient.stopLEScan();
            try {
              this.setState(BleState.CONNECTING);
              this.log(LogLevel.INFO, `[CONNECT_START] 准备连接到 ${result.device.name} (${result.device.deviceId})`);

              await BleClient.connect(result.device.deviceId, (deviceId) => {
                this.log(LogLevel.INFO, `[CONNECT_SUCCESS] 设备 ${deviceId} 连接成功`);
              });

              this.setState(BleState.CONNECTED);
              this.connectedDevice = result.device;
              this.log(LogLevel.INFO, '[CONNECT_SUCCESS] 连接成功!');

              await this.startNotifications();
              callback(true, '连接成功');
            } catch (error) {
              this.log(LogLevel.ERROR, `[FAIL] 连接失败: ${error}`);
              await this.cleanupAndReset();
              callback(false, error instanceof Error ? error.message : '连接失败');
            }
          } else {
            this.log(LogLevel.DEBUG, `[SCAN_FILTER] 设备UUID未匹配: ${result.uuids}`);
          }
        }
      );
    } catch (error) {
      this.log(LogLevel.ERROR, `[FATAL_ERROR] 流程中发生致命错误: ${error}`);
      await this.cleanupAndReset();
      callback(false, error instanceof Error ? error.message : '初始化失败');
    }
  }

  // --- 设置数据回调 ---
  public setDataCallback(callback: DataCallback | null | undefined): void {
    this.dataCallback = callback || null;
  }

  // --- 断开连接 ---
  public async disconnect(): Promise<void> {
    this.log(LogLevel.INFO, '[DISCONNECT] 手动断开连接');
    await this.cleanupAndReset();
  }

  // --- 获取连接状态 ---
  public isConnected(): boolean {
    return this.currentState === BleState.CONNECTED;
  }

  // --- 获取已连接设备信息 ---
  public getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  // --- 读取特征值（似乎是最后发出去的值） ---
  public async readCharacteristic(): Promise<string> {
    if (!this.connectedDevice) {
      const error = new Error('无连接设备，无法读取特征值（似乎是最后发出去的值）');
      this.log(LogLevel.ERROR, `[READ_CHARACTERISTIC_ERROR] ${error.message}`);
      throw error;
    }

    this.log(LogLevel.INFO, '[READ_CHARACTERISTIC] 开始读取特征值（似乎是最后发出去的值）');

    const result = await BleClient.read(
      this.connectedDevice.deviceId,
      TARGET_SERVICE_UUID,
      TARGET_CHARACTERISTIC_UUID
    );

    const parsedData = this.parseCreasenseData(result);
    this.log(LogLevel.INFO, `[READ_SUCCESS] 读取成功 - HEX: ${parsedData}`);

    return parsedData;
  }

  // --- 写入数据 ---
  public async writeData(data: string): Promise<void> {
    if (!this.connectedDevice) {
      const error = new Error('无连接设备，无法写入数据');
      this.log(LogLevel.ERROR, `[WRITE_DATA_ERROR] ${error.message}`);
      throw error;
    }

    this.log(LogLevel.INFO, `[WRITE_DATA] 准备写入数据: ${data}`);

    // Convert string to DataView
    const dataArray = new TextEncoder().encode(data);
    const dataView = new DataView(dataArray.buffer);

    await BleClient.write(
      this.connectedDevice.deviceId,
      TARGET_SERVICE_UUID,
      TARGET_CHARACTERISTIC_UUID,
      dataView
    );

    this.log(LogLevel.INFO, `[WRITE_SUCCESS] 数据写入成功: ${data}`);
  }

  // --- 写入十六进制数据 ---
  public async writeHexData(hexString: string): Promise<void> {
    if (!this.connectedDevice) {
      const error = new Error('无连接设备，无法写入十六进制数据');
      this.log(LogLevel.ERROR, `[WRITE_HEX_ERROR] ${error.message}`);
      throw error;
    }

    const hexArray = hexString.split(/\s+/).map(hex => parseInt(hex, 16));

    if (hexArray.some(isNaN)) {
      const error = new Error('十六进制格式错误，请使用空格分隔，如: 01 02 03');
      this.log(LogLevel.ERROR, `[WRITE_HEX_ERROR] ${error.message}`);
      throw error;
    }

    const dataView = numbersToDataView(hexArray);

    this.log(LogLevel.INFO, `[WRITE_HEX] 准备写入十六进制数据: ${hexString}`);

    await BleClient.write(
      this.connectedDevice.deviceId,
      TARGET_SERVICE_UUID,
      TARGET_CHARACTERISTIC_UUID,
      dataView
    );

    this.log(LogLevel.INFO, `[WRITE_HEX_SUCCESS] 十六进制数据写入成功: ${hexString}`);
  }
}

// 创建单例实例
export const bleDeviceManager = new BleDeviceManager();

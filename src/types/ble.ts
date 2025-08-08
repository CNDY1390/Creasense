// 蓝牙相关类型定义

// 蓝牙状态枚举
export enum BleState {
  IDLE = "IDLE",
  INITIALIZING = "INITIALIZING",
  SCANNING = "SCANNING",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
}

// 蓝牙设备信息
export interface BleDevice {
  deviceId: string;
  name?: string;
  rssi?: number;
}

// 肌酐数据
export interface CreatinineData {
  type: 'creatinine';
  value: number | null;
  unit: string;
  ts: number;
}

// 回调函数类型
export type BleCallback = (success: boolean, message: string) => void;
export type DataCallback = (data: CreatinineData) => void;

// 日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 蓝牙配置
export interface BleConfig {
  targetServiceUuid: string;
  targetCharacteristicUuid: string;
  scanTimeoutMs: number;
  connectTimeoutMs: number;
  pollingIntervalMs: number;
  showConnectDebug: boolean;
}

// 蓝牙管理器状态
export interface BleManagerState {
  state: BleState;
  device: BleDevice | null;
  lastData: CreatinineData | null;
  error: string | null;
}

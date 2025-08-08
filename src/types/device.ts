// types/device.ts

// 基础数据包结构，支持标志位扩展
export interface MeasurementData {
  flags: number; // 标志位字节
  [key: string]: number; // 动态字段，根据协议定义动态添加
}





// 数据包解析结果的联合类型
export type DecodedPacket =
  | { type: 'success'; data: MeasurementData }
  | { type: 'error'; message: string };

// 设备连接状态
export interface DeviceStatus {
  isConnected: boolean;
  deviceId?: string;
  lastDataReceived?: number;
  signalStrength?: number;
}

// 数据包统计信息
export interface PacketStats {
  totalReceived: number;
  successfullyParsed: number;
  errorCount: number;
  unknownVersionCount: number;
  lastResetTime: number;
}

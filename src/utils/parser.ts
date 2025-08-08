// utils/parser.ts

import type { DecodedPacket } from '@/types/device';
import { DynamicProtocolManager } from './dynamicProtocol';

export function parseDataPacket(hexString: string): DecodedPacket {
  try {
    const dynamicManager = DynamicProtocolManager.getInstance();
    if (!dynamicManager.isProtocolsLoaded()) {
      console.error('[Parser] DEBUG - 动态协议未加载，无法解析数据');
      return { type: 'error', message: '协议未加载，请先加载协议配置' };
    }
    return dynamicManager.parsePacket(hexString);
  } catch (error) {
    console.error('[Parser] DEBUG - 动态协议解析失败:', error);
    return { type: 'error', message: `数据包解析异常: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function validatePacketIntegrity(hexString: string, protocolLength?: number): boolean {
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();
  if (protocolLength !== undefined) {

    const requiredHexLength = protocolLength * 2; // 每个字节对应2个十六进制字符
    if (cleanHex.length < requiredHexLength) {
      return false;
    }
  }else{console.error('[Parser] ERROR - 验证数据包完整性111', protocolLength);}
  if (!/^[0-9a-f]+$/.test(cleanHex)) {
    return false;
  }
  return true;
}



/**
 * 格式化解析结果为可读字符串
 * 根据动态协议系统动态格式化，支持所有协议定义的字段
 * @param result 解析结果
 * @returns 格式化的字符串
 */
export function formatParsedResult(result: DecodedPacket): string {
  if (result.type === 'success') {
    const data = result.data;
    const parts: string[] = [];
    const dynamicManager = DynamicProtocolManager.getInstance();
    const currentProtocol = dynamicManager.getCurrentProtocol();
    if (!currentProtocol) {
      console.error('[Parser] 格式化失败：未设置当前协议');
      return '格式化失败：未设置当前协议';
    }
    const flags = data.flags;
    console.log(`[Parser] 格式化数据包，标志位: 0b${flags.toString(2).padStart(8, '0')} (0x${flags.toString(16).padStart(2, '0')})`);
    for (let bit = 0; bit < 8; bit++) {
      const flagMask = 1 << bit;
      const isFlagSet = (flags & flagMask) !== 0;
      if (!isFlagSet) {
        continue;
      }
      const bitKey = `bit${bit}`;
      const fieldDef = currentProtocol.protocol.flags[bitKey];
      if (!fieldDef || Object.keys(fieldDef).length === 0 || !fieldDef.name) {
        console.log(`[Parser] 位${bit}字段未定义，跳过格式化`);
        continue;
      }
      const fieldName = fieldDef.name;
      const fieldValue = data[fieldName];
      if (fieldValue === undefined) {
        console.error(`[Parser] 字段 ${fieldName} 值未定义`);
        continue;
      }
      let formattedValue: string;
      switch (fieldName.toLowerCase()) {
        case 'batteryvoltage':
        case 'battery_voltage':
        case 'battery':
          formattedValue = `${(fieldValue * 0.001).toFixed(3)}V`;
          break;
        case 'current':
          formattedValue = `${(fieldValue * 0.0001).toFixed(4)}nA`;
          break;
        case 'creatinine':
          formattedValue = `${fieldValue}mg/dL`;
          break;
        case 'timestamp':
        case 'time':
          formattedValue = `${fieldValue}`;
          break;
        case 'sensorstatus':
        case 'sensor_status':
        case 'status':
          formattedValue = `${fieldValue}`;
          break;
        default:
          // 对于未知字段，直接显示数值
          formattedValue = `${fieldValue}`;
      }

      parts.push(`${fieldName}: ${formattedValue}`);
      console.log(`[Parser] 格式化字段 ${fieldName}: ${formattedValue}`);
    }

    if (parts.length === 0) {
      console.warn('[Parser] 未找到任何可格式化的字段');
      return '数据包无有效字段';
    }

    return parts.join(', ');
  } else if (result.type === 'error') {
    return `错误: ${result.message}`;
  }

  return '未知解析结果';
}

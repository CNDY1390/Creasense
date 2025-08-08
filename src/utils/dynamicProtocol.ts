// utils/dynamicProtocol.ts

import type { DecodedPacket, MeasurementData } from '@/types/device';
import { getAllProtocolPaths } from '@/composables/protocol-config';


export interface FlagField {
  name: string;
  type: 'uint8' | 'uint16' | 'uint32' | 'uint32_le' | 'float32' | 'float32_le' | 'uint16_le';
}

export interface ProtocolDefinition {
  protocolLength: number;
  flags: Record<string, FlagField>;
}

// 协议文件信息 - 包含协议定义和文件信息
export interface ProtocolFileInfo {
  path: string;
  fileName: string;
  protocol: ProtocolDefinition;
}

// 动态协议管理器 - 单例模式
export class DynamicProtocolManager {
  private static instance: DynamicProtocolManager;
  private protocols: Map<number, ProtocolFileInfo> = new Map(); // key是protocolLength
  private currentProtocol: ProtocolFileInfo | null = null; // 当前使用的协议
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): DynamicProtocolManager {
    if (!DynamicProtocolManager.instance) {
      DynamicProtocolManager.instance = new DynamicProtocolManager();
    }
    return DynamicProtocolManager.instance;
  }

  /**
   * 检查协议是否已加载
   */
  public isProtocolsLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 扫描并加载所有协议文件 - 合并扫描和加载功能
   */
  public async loadProtocols(): Promise<void> {
    try {
      console.log('[DynamicProtocol] 开始扫描并加载协议文件...');

      // 清空现有协议
      this.protocols.clear();

      // 直接扫描并加载协议文件
      try {
        const protocolPaths = getAllProtocolPaths();
        for (const path of protocolPaths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              const protocol = await this.loadSingleProtocol(path);
              this.protocols.set(protocol.protocol.protocolLength, protocol);
              console.log(`[DynamicProtocol] ✅ 成功加载协议文件: ${protocol.fileName} (${protocol.protocol.protocolLength}字节)`);
            }
          } catch (error) {
            console.error(`[DynamicProtocol] ❌ 加载协议文件失败: ${path}`, error);
          }
        }
      } catch (error) {
        console.error('[DynamicProtocol] 扫描协议文件失败:', error);
      }

      this.isLoaded = true;
      if (this.protocols.size > 0) {
        const protocolLengths = Array.from(this.protocols.keys()).join(', ');
        console.log(`[DynamicProtocol] ✅ 协议加载完成，共加载 ${this.protocols.size} 个协议，长度列表: [${protocolLengths}]`);

      } else {
        console.log(`[DynamicProtocol] ⚠️ 协议加载完成，但未成功加载任何协议`);
      }

    } catch (error) {
      console.error('[DynamicProtocol] 加载协议配置失败:', error);
      throw error;
    }
  }

  /**
   * 验证协议定义格式
   */
  public validateProtocolDefinition(protocol: ProtocolDefinition): void {
    console.log(`[DynamicProtocol] DEBUG - 开始验证协议定义...`);
    console.log(`[DynamicProtocol] DEBUG - 协议对象:`, protocol);

    if (!protocol.protocolLength) {
      console.error(`[DynamicProtocol] ERROR - 协议缺少protocolLength字段，协议对象:`, protocol);
      throw new Error('协议缺少protocolLength字段');
    }

    if (!protocol.flags) {
      console.error(`[DynamicProtocol] ERROR - 协议缺少flags字段，协议对象:`, protocol);
      throw new Error('协议缺少flags字段');
    }

    // 验证协议长度
    if (protocol.protocolLength <= 0) {
      throw new Error(`协议长度无效: ${protocol.protocolLength}`);
    }

    // 验证标志位定义
    for (const [bitKey, flag] of Object.entries(protocol.flags)) {
      // 验证位键格式
      if (!bitKey.startsWith('bit') || isNaN(parseInt(bitKey.substring(3)))) {
        throw new Error(`标志位键格式错误: ${bitKey}`);
      }

      // 验证位索引范围
      const bitIndex = parseInt(bitKey.substring(3));
      if (bitIndex < 0 || bitIndex > 7) {
        throw new Error(`标志位索引超出范围: ${bitIndex}`);
      }

      // 验证字段定义 - 空对象表示该位未使用，跳过验证
      if (flag) {
        if (Object.keys(flag).length > 0) {
          if (!flag.name || !flag.type) {
            console.error(`[DynamicProtocol] ERROR - 标志位 ${bitKey} 定义不完整，缺少name或type`);
            throw new Error(`标志位 ${bitKey} 定义不完整，缺少name或type`);
          }

          // 验证字段类型
          const validTypes = ['uint8', 'uint16', 'uint32', 'uint32_le', 'float32', 'float32_le', 'uint16_le'];
          if (!validTypes.includes(flag.type)) {
            console.error(`[DynamicProtocol] ERROR - 标志位 ${bitKey} 类型不支持: ${flag.type}`);
            throw new Error(`标志位 ${bitKey} 类型不支持: ${flag.type}`);
          }

          console.log(`[DynamicProtocol] DEBUG - 标志位 ${bitKey} 验证通过: ${flag.name} (${flag.type})`);
        } else {
          console.log(`[DynamicProtocol] DEBUG - 标志位 ${bitKey} 未使用（空对象）`);
        }
      } else {
        console.error(`[DynamicProtocol] ERROR - 标志位 ${bitKey} 为null或undefined`);
        throw new Error(`标志位 ${bitKey} 为null或undefined`);
      }
    }

    // 验证协议长度与字段定义的兼容性
    let totalFieldSize = 1; // 标志位占用1字节
    for (const [, flag] of Object.entries(protocol.flags)) {
      if (flag && flag.type) {
        totalFieldSize += this.getFieldSize(flag.type);
      }
    }

    if (totalFieldSize > protocol.protocolLength) {
      throw new Error(`字段总大小 ${totalFieldSize} 超过协议长度 ${protocol.protocolLength}`);
    }
  }

  /**
   * 加载单个协议文件
   */
  public async loadSingleProtocol(path: string): Promise<ProtocolFileInfo> {

    const response = await fetch(path);


    const responseText = await response.text();

    if (!responseText.trim()) {
      throw new Error('协议文件内容为空');
    }

    let protocol: ProtocolDefinition;
    try {
      protocol = JSON.parse(responseText);
      console.log(`[DynamicProtocol] DEBUG - JSON解析成功，协议长度: ${protocol.protocolLength}`);
    } catch (parseError) {
      console.error(`[DynamicProtocol] DEBUG - JSON解析失败:`, parseError);
      throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // 使用集中验证函数
    this.validateProtocolDefinition(protocol);
    console.log(`[DynamicProtocol] DEBUG - 协议验证通过`);

    // 组合协议定义和文件信息
    const protocolFileInfo: ProtocolFileInfo = {
      path: path,
      fileName: path.split('/').pop()?.replace('.json', '') || '',
      protocol: protocol
    };

    return protocolFileInfo;
  }

  /**
   * 设置当前使用的协议
   */
  public setCurrentProtocol(protocol: ProtocolFileInfo): void {
    this.currentProtocol = protocol;
    console.log(`[DynamicProtocol] 设置当前协议: ${protocol.protocol.protocolLength}字节协议`);
  }

  /**
   * 添加自定义协议到协议列表
   */
  public addCustomProtocol(protocol: ProtocolFileInfo): void {
    console.log(`[DynamicProtocol] 添加自定义协议: ${protocol.fileName} (${protocol.protocol.protocolLength}字节)`);
    this.protocols.set(protocol.protocol.protocolLength, protocol);
    console.log(`[DynamicProtocol] 当前协议列表大小: ${this.protocols.size}`);
  }

  /**
   * 获取当前使用的协议
   */
  public getCurrentProtocol(): ProtocolFileInfo | null {
    return this.currentProtocol;
  }

  /**
   * 根据协议长度获取协议定义
   */
  public getProtocol(protocolLength: number): ProtocolFileInfo | undefined {
    return this.protocols.get(protocolLength);
  }


  /**
   * 获取所有已加载的协议
   */
  public getLoadedProtocols(): ProtocolFileInfo[] {
    return Array.from(this.protocols.values());
  }

  /**
   * 根据协议定义解析数据包 - 统一解析入口
   */
  public parsePacket(hexString: string): DecodedPacket {
    try {
      // 1. 清理和初步校验
      const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();

      console.log(`[DynamicProtocol] DEBUG - 原始hex数据: ${cleanHex}`);

      // 2. 检查当前协议
      if (!this.currentProtocol) {
        return { type: 'error', message: '未设置当前协议' };
      }

      // 3. 数据包格式验证
      const validationResult = this.validatePacketFormat(cleanHex);
      if (!validationResult.success) {
        return validationResult.error;
      }

      const { validHex } = validationResult.data;
      const matchedProtocol = this.currentProtocol;

      // 3. 转换为字节数组
      const uint8Array = new Uint8Array(validHex.length / 2);
      for (let i = 0; i < validHex.length; i += 2) {
        uint8Array[i / 2] = parseInt(validHex.substr(i, 2), 16);
      }

      // 4. 创建DataView
      const view = new DataView(uint8Array.buffer);

      // 5. 基于标志位动态解析字段
      const availableBytes = view.byteLength;
      console.log(`[DynamicProtocol] DEBUG - 开始解析协议，可用字节数: ${availableBytes}`);

      const debugBytes = [];
      for (let i = 0; i < Math.min(16, availableBytes); i++) {
        debugBytes.push(`${i}: 0x${view.getUint8(i).toString(16).padStart(2, '0')}`);
      }
      console.log(`[DynamicProtocol] DEBUG - 前${Math.min(16, availableBytes)}字节详情: ${debugBytes.join(', ')}`);

      // 读取标志位
      const flags = view.getUint8(0);
      console.log(`[DynamicProtocol] DEBUG - 标志位: 0b${flags.toString(2).padStart(8, '0')} (0x${flags.toString(16).padStart(2, '0')})`);

      // 数据包完整性验证
      this.validatePacketData(view, matchedProtocol.protocol, flags);

      // 动态解析字段
      const parsedData: Record<string, number> = {};
      let offset = 1; // 从第2个字节开始（第1个字节是标志位）

      // 遍历所有标志位
      for (let bit = 0; bit < 8; bit++) {
        const flagMask = 1 << bit;
        const isFlagSet = (flags & flagMask) !== 0;

        if (!isFlagSet) {
          console.error(`[DynamicProtocol] ERROR - 位${bit}未设置，标志位: 0b${flags.toString(2).padStart(8, '0')}`);
          continue;
        }

        const bitKey = `bit${bit}`;
        const fieldDef = matchedProtocol.protocol.flags[bitKey];

        // 检查字段定义是否完整（非空对象且有name和type）
        if (!fieldDef || Object.keys(fieldDef).length === 0 || !fieldDef.type || !fieldDef.name) {
          console.log(`[DynamicProtocol] DEBUG - 位${bit}字段未定义或为空，跳过解析`);
          continue;
        }

        // 读取字段值
        const value = this.readFieldValue(view, offset, fieldDef.type);

        // 使用协议中定义的name
        const fieldName = fieldDef.name;
        parsedData[fieldName] = value;

        console.log(`[DynamicProtocol] DEBUG - 位${bit} (${fieldName}): ${value} (${fieldDef.type})`);
        offset += this.getFieldSize(fieldDef.type);
      }

      // 动态构建返回数据
      const data: MeasurementData = {
        flags: flags,
        ...parsedData // 直接展开解析的数据
      };

      // 检测未解析的字段
      for (let bit = 0; bit < 8; bit++) {
        const flagMask = 1 << bit;
        const isFlagSet = (flags & flagMask) !== 0;
        const bitKey = `bit${bit}`;
        const fieldDef = matchedProtocol.protocol.flags[bitKey];

        // 只有当字段定义完整且标志位设置时才检查解析
        if (isFlagSet && fieldDef && Object.keys(fieldDef).length > 0 && fieldDef.type && fieldDef.name && parsedData[fieldDef.name] === undefined) {
          console.error(`[DynamicProtocol] ERROR - 位${bit}数据未解析，标志位=${flags.toString(2).padStart(8, '0')}`);
          throw new Error(`位${bit}数据解析失败`);
        }
      }

      // 输出结构化解析结果
      console.log(`[DynamicProtocol] DEBUG - 数据结构解析:`);
      console.log(`[DynamicProtocol] DEBUG - 协议长度=${matchedProtocol.protocol.protocolLength}, 标志位=0b${flags.toString(2).padStart(8, '0')}`);

      // 动态打印所有解析的字段
      for (const [fieldName, value] of Object.entries(parsedData)) {
        console.log(`[DynamicProtocol] DEBUG - ${fieldName}: ${value}`);
      }

      return { type: 'success', data };

    } catch (error) {
      return { type: 'error', message: `数据包解析异常: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * 验证数据包格式和协议匹配
   */
  private validatePacketFormat(cleanHex: string): { success: true; data: { validHex: string } } | { success: false; error: DecodedPacket } {
    // 数据包格式验证
    if (!/^[0-9a-f]+$/.test(cleanHex)) {
      return { success: false, error: { type: 'error', message: '数据包包含非法字符' } };
    }

    if (cleanHex.length === 0) {
      return { success: false, error: { type: 'error', message: '数据包为空' } };
    }

    // 截取协议要求长度的数据
    const validHex = cleanHex.substring(0, this.currentProtocol!.protocol.protocolLength * 2);

    return { success: true, data: { validHex } };
  }



  /**
   * 验证数据包完整性
   */
  private validatePacketData(view: DataView, protocol: ProtocolDefinition, flags: number): void {
    const availableBytes = view.byteLength;
    let offset = 1; // 从第2个字节开始（第1个字节是标志位）

    // 遍历所有标志位
    for (let bit = 0; bit < 8; bit++) {
      const flagMask = 1 << bit;
      const isFlagSet = (flags & flagMask) !== 0;

      if (!isFlagSet) {
        continue;
      }

      const bitKey = `bit${bit}`;
      const fieldDef = protocol.flags[bitKey];

      if (!fieldDef || !fieldDef.type || !fieldDef.name) {
        throw new Error(`位${bit}字段定义不完整`);
      }

      // 检查是否有足够的数据
      const fieldSize = this.getFieldSize(fieldDef.type);
      if (offset + fieldSize > availableBytes) {
        throw new Error(`数据包长度不足，无法解析位${bit}字段，偏移: ${offset}, 字段大小: ${fieldSize}, 可用字节: ${availableBytes}`);
      }

      offset += fieldSize;
    }
  }

  /**
   * 根据字段类型获取字段大小
   */
  private getFieldSize(type: string): number {
    switch (type) {
      case 'uint8':
        return 1;
      case 'uint16':
      case 'uint16_le':
        return 2;
      case 'uint32':
      case 'uint32_le':
      case 'float32':
      case 'float32_le':
        return 4;
      default:
        return 1;
    }
  }

  /**
   * 读取字段值
   */
  private readFieldValue(view: DataView, offset: number, type: string): number {
    switch (type) {
      case 'uint8':
        return view.getUint8(offset);
      case 'uint16':
        return view.getUint16(offset);
      case 'uint16_le':
        return view.getUint16(offset, true); // 小端序
      case 'uint32':
        return view.getUint32(offset);
      case 'uint32_le':
        return view.getUint32(offset, true); // 小端序
      case 'float32':
        return view.getFloat32(offset);
      case 'float32_le':
        return view.getFloat32(offset, true); // 小端序
      default:
        throw new Error(`不支持的字段类型: ${type}`);
    }
  }








}

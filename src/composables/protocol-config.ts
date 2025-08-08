/**
 * 自动生成的协议配置文件
 * 请勿手动编辑此文件，运行 npm run generate-protocols 重新生成
 * 生成时间: 2025-08-07T11:50:04.446Z
 */

// 支持的协议类型定义
export type SupportedProtocol = "v1" | "v2"

// 协议文件列表
export const protocolFiles: readonly string[] = [
  "v1.json",
  "v2.json"
]

// 协议文件路径映射
export const protocolPaths: Record<SupportedProtocol, string> = {
  "v1": "/data/protocol/v1.json",
  "v2": "/data/protocol/v2.json"
}

// 默认协议
export const defaultProtocol: SupportedProtocol = "v1"

// 支持的协议列表
export const supportedProtocols = Object.keys(protocolPaths) as SupportedProtocol[]

// 获取协议文件路径
export function getProtocolPath(protocol: SupportedProtocol): string {
  return protocolPaths[protocol]
}

// 获取所有协议文件路径
export function getAllProtocolPaths(): string[] {
  return Object.values(protocolPaths)
}

#!/usr/bin/env node

/**
 * 构建时协议配置生成脚本
 * 自动扫描 public/data/protocol 目录下的协议文件，生成类型定义和配置
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 项目根目录
const rootDir = path.resolve(__dirname, '..')
const protocolsDir = path.join(rootDir, 'public/data/protocol')
const outputFile = path.join(rootDir, 'src/composables/protocol-config.ts')

function generateProtocolConfig() {
  try {
    console.log('[generate-protocols] 开始生成协议配置...')

    // 读取协议文件目录
    if (!fs.existsSync(protocolsDir)) {
      console.error(`[generate-protocols] 协议目录不存在: ${protocolsDir}`)
      process.exit(1)
    }

    // 扫描所有 .json 文件
    const files = fs.readdirSync(protocolsDir)
    const protocolFiles = files.filter(file => file.endsWith('.json'))

    if (protocolFiles.length === 0) {
      console.error('[generate-protocols] 未找到任何协议文件')
      process.exit(1)
    }

    // 提取协议文件名（从文件名）
    const availableProtocols = protocolFiles.map(file => file.replace('.json', ''))
    console.log(`[generate-protocols] 发现协议文件: ${availableProtocols.join(', ')}`)

    // 生成 TypeScript 配置文件
    const protocolList = availableProtocols.map(protocol => `"${protocol}"`).join(' | ')

    // 生成协议文件列表
    const protocolFilesList = availableProtocols
      .map(protocol => `  "${protocol}.json"`)
      .join(',\n')

    // 动态确定默认协议：按文件名排序，选择第一个
    const sortedProtocols = [...availableProtocols].sort()
    const defaultProtocol = sortedProtocols[0]

    const configContent = `/**
 * 自动生成的协议配置文件
 * 请勿手动编辑此文件，运行 npm run generate-protocols 重新生成
 * 生成时间: ${new Date().toISOString()}
 */

// 支持的协议类型定义
export type SupportedProtocol = ${protocolList}

// 协议文件列表
export const protocolFiles: readonly string[] = [
${protocolFilesList}
]

// 协议文件路径映射
export const protocolPaths: Record<SupportedProtocol, string> = {
${availableProtocols.map(protocol => `  "${protocol}": "/data/protocol/${protocol}.json"`).join(',\n')}
}

// 默认协议
export const defaultProtocol: SupportedProtocol = "${defaultProtocol}"

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
`

    // 写入配置文件
    fs.writeFileSync(outputFile, configContent, 'utf8')
    console.log(`[generate-protocols] 配置文件已生成: ${outputFile}`)
    console.log(`[generate-protocols] 共生成 ${availableProtocols.length} 个协议配置`)
    console.log(`[generate-protocols] 默认协议: ${defaultProtocol}`)

  } catch (error) {
    console.error('[generate-protocols] 生成配置失败:', error)
    process.exit(1)
  }
}

// 运行生成脚本
generateProtocolConfig()

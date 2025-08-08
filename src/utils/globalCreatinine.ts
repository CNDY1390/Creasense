// 全局肌酐值存储
export interface CreatinineValue {
  value: number | null;
  unit: string;
  timestamp: number;
}

// 全局变量
let currentCreatinine: CreatinineValue | null = null;

// 更新肌酐值
export function updateCreatinine(value: number, unit: string, timestamp: number) {
  console.log(`[GlobalCreatinine] 更新肌酐值: ${value} ${unit}, 时间戳: ${timestamp}`);
  currentCreatinine = {
    value,
    unit,
    timestamp
  };
}

// 清除肌酐值
export function clearCreatinine() {
  console.log('[GlobalCreatinine] 清除肌酐值');
  currentCreatinine = null;
}

// 获取当前肌酐值
export function getCurrentCreatinine(): CreatinineValue | null {
  return currentCreatinine;
}

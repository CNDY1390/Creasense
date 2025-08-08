export interface UserData {
  id?: string;
  name: string
  age?: number
  gender: string
  genderOther?: string
  preferredName?: string
  birthday?: string
  height?: string
  weight?: string
  bloodType?: string
  bloodTypeOther?: string
  contactInfo?: {
    countryCode?: string
    phoneNumber?: string
    email?: string
    address?: string
  }
  medicalInfo?: {
    allergies?: string
    conditions?: string
    medications?: string
  }
  emergencyContact?: {
    name?: string
    relation?: string
    countryCode?: string
    phoneNumber?: string
  }
  avatar: string
  settings?: {
    showCreatinineUnit: boolean
    enableBiometric: boolean
  }
}

export interface HealthStatus {
  creatinine: {
    value: number
    unit: string
    level: 'normal' | 'warning' | 'danger' | 'unknown'
    percentage: number
    timestamp: string | null
  }
  illnessProbability: number
  lastUpdated: string
}

export interface RawDataPoint {
  time: string
  value: number
}

export interface ChartData {
  rawData: RawDataPoint[]
}

export interface PersonalData {
  user: UserData
  version: string
  createdAt: string
  updatedAt: string
  lastModified: string
}

export interface HealthData {
  healthStatus: HealthStatus
  chartData: ChartData
  version: string
  createdAt: string
  updatedAt: string
  lastModified: string
}

export interface SoftwareSettings {
  showCreatinineUnit?: boolean
  isdebug?: boolean
  autoConnect?: boolean
  connectionNotify?: boolean
  detectFrequency?: number
}

export interface AppSettings {
  softwareSettings: SoftwareSettings
}

export interface AppData {
  user: UserData
  healthStatus?: HealthStatus
  chartData?: ChartData
  settings?: AppSettings
  version: string
  createdAt: string
  updatedAt: string
  lastModified: string
}

export interface DataManagerResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  isFirstLaunch?: boolean
}

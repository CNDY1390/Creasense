<template>
  <div class="profile-view" :class="{ 'is-editing': isEditing }">
    <section class="profile-content">


    <header class="header">
      <div class="header-left-actions">
        <button v-if="isEditing" @click="saveProfile" class="save-btn">
          {{ $t("common.save") }}
        </button>
      </div>
      <div class="page-title item-headline">{{ $t("profile.title") }}</div>
      <div class="header-actions">
        <button @click="toggleEdit" class="edit-btn">
          {{ isEditing ? $t("common.cancel") : $t("common.edit") }}
        </button>
      </div>
    </header>



      <div class="profile-content">
      <!-- 用户头像和基本信息 -->
      <section class="profile-header">
        <div class="profile-info">
          <div class="avatar-section">
            <div class="profile-avatar">
              <img :src="userInfo?.avatar" alt="用户头像" class="medium-avatar" />
              <button v-if="isEditing" class="change-avatar-btn" @click="changeAvatar">
                <i class="fa-solid fa-images fa-gradient-icon"></i>
              </button>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                multiple="false"
                style="display: none"
                @change="handleAvatarChange"
              />
            </div>
          </div>
          <div class="user-info-section">
            <div class="user-name">
              <div class="item-body">{{ userInfo?.name }}</div>
              <p class="user-id">ID: #{{ userInfo?.id }}</p>
            </div>
          </div>
          <div class="medical-card-section">
            <div
              class="medical-card-icon"
              :class="{ 'medical-card-active': isMedicalCardActive }"
              @click="toggleMedicalCard"
            >
              <i
                class="fa-solid fa-id-card fa-gradient-icon"
                :class="{ 'medical-card-active': isMedicalCardActive }"
              ></i>
            </div>
            <div v-if="showMedicalCardTip" class="medical-card-tip">再次点击打开紧急医疗卡</div>
          </div>
        </div>
      </section>

      <!-- 个人详细信息 -->
      <section class="profile-details">
        <!-- 基本信息 -->
        <div class="detail-group">
          <div class="title-with-icon">
            <i class="fa-solid fa-user fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.personalInfo.basicInfo") }}</div>
          </div>
          <div v-if="userInfo">
            <div class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.name") }}</label>
                <input type="text" v-model="userInfo.name" :disabled="!isEditing" />
              </div>
            </div>
            <div class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.gender") }}</label>
                <select v-model="userInfo.gender" :disabled="!isEditing" @change="onGenderChange">
                  <option value="female">
                    {{ $t("profile.personalInfo.genderOptions.female") }}
                  </option>
                  <option value="male">{{ $t("profile.personalInfo.genderOptions.male") }}</option>
                  <option value="non-binary">
                    {{ $t("profile.personalInfo.genderOptions.nonBinary") }}
                  </option>
                  <option value="trans-male">
                    {{ $t("profile.personalInfo.genderOptions.transMale") }}
                  </option>
                  <option value="trans-female">
                    {{ $t("profile.personalInfo.genderOptions.transFemale") }}
                  </option>
                  <option value="prefer-not-to-say">
                    {{ $t("profile.personalInfo.genderOptions.preferNotToSay") }}
                  </option>
                  <option value="other">
                    {{ $t("profile.personalInfo.genderOptions.other") }}
                  </option>
                </select>
              </div>
              <div v-if="userInfo.gender === 'other' && isEditing" class="detail-item">
                <div class="input-wrapper">
                  <label>{{ $t("profile.personalInfo.genderOtherLabel") }}</label>
                  <input
                    type="text"
                    v-model="userInfo.genderOther"
                    :placeholder="$t('profile.personalInfo.genderOtherPlaceholder')"
                    maxlength="20"
                  />
                </div>
              </div>
            </div>
            <div class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.preferredName") }}</label>
                <input
                  type="text"
                  v-model="userInfo.preferredName"
                  :placeholder="$t('profile.personalInfo.preferredNamePlaceholder')"
                  maxlength="20"
                  :disabled="!isEditing"
                />
              </div>
            </div>
            <div class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.age") }}</label>
                <input
                  type="text"
                  :value="userInfo?.age ? userInfo.age.toString() : ''"
                  :placeholder="isEditing ? '点击选择生日' : userInfo?.age ? '' : '未设置'"
                  :disabled="!isEditing"
                  @click="openBirthdayPicker"
                  :class="{ clickable: isEditing }"
                />
              </div>
              <input
                v-if="isEditing"
                type="date"
                v-model="userInfo.birthday"
                style="display: none"
              />
            </div>
          </div>
        </div>

        <!-- 身体指标 -->
        <div
          class="detail-group privacy-protected"
          :class="{ unlocked: unlockedFields.has('bodyMetrics') }"
          data-field="bodyMetrics"
        >
          <div class="title-with-icon">
            <i class="fa-solid fa-person fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.personalInfo.bodyMetrics") }}</div>
          </div>
          <div class="privacy-content">
            <div class="privacy-overlay">
              <div class="unlock-button" @click="unlockPrivacyData('bodyMetrics')">
                <i class="fa-solid fa-lock"></i> {{ $t("common.viewInfo") }}
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.height") }}</label>
                <input type="text" v-model="userInfo.height" :disabled="!isEditing" />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.weight") }}</label>
                <input type="text" v-model="userInfo.weight" :disabled="!isEditing" />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.bloodType") }}</label>
                <select
                  v-model="userInfo.bloodType"
                  :disabled="!isEditing"
                  @change="onBloodTypeChange"
                >
                  <option value="" disabled>
                    {{ $t("profile.personalInfo.selectBloodType") }}
                  </option>
                  <option value="A">{{ $t("profile.personalInfo.bloodTypeOptions.A") }}</option>
                  <option value="B">{{ $t("profile.personalInfo.bloodTypeOptions.B") }}</option>
                  <option value="AB">{{ $t("profile.personalInfo.bloodTypeOptions.AB") }}</option>
                  <option value="O">{{ $t("profile.personalInfo.bloodTypeOptions.O") }}</option>
                  <option value="other">
                    {{ $t("profile.personalInfo.bloodTypeOptions.other") }}
                  </option>
                </select>
              </div>
              <div v-if="userInfo.bloodType === 'other' && isEditing" class="detail-item">
                <div class="input-wrapper">
                  <label>血型详情</label>
                  <input
                    type="text"
                    v-model="userInfo.bloodTypeOther"
                    placeholder="请输入您的血型"
                    maxlength="20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 联系信息 -->
        <div
          class="detail-group privacy-protected"
          :class="{ unlocked: unlockedFields.has('contactInfo') }"
          data-field="contactInfo"
        >
          <div class="title-with-icon">
            <i class="fa-solid fa-phone fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.personalInfo.contactInfo") }}</div>
          </div>
          <div class="privacy-content">
            <div class="privacy-overlay">
              <div class="unlock-button" @click="unlockPrivacyData('contactInfo')">
                <i class="fa-solid fa-lock"></i> {{ $t("common.viewInfo") }}
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.phone") }}</label>
                <input
                  type="tel"
                  :value="userInfo.contactInfo?.phoneNumber"
                  @input="updateContactInfo('phoneNumber', $event)"
                  :disabled="!isEditing"
                />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.email") }}</label>
                <input
                  type="email"
                  :value="userInfo.contactInfo?.email"
                  @input="updateContactInfo('email', $event)"
                  :disabled="!isEditing"
                />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.address") }}</label>
                <textarea
                  :value="userInfo.contactInfo?.address"
                  @input="updateContactInfo('address', $event)"
                  :disabled="!isEditing"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 医疗信息 -->
        <div
          class="detail-group privacy-protected"
          :class="{ unlocked: unlockedFields.has('medicalInfo') }"
          data-field="medicalInfo"
        >
          <div class="title-with-icon">
            <i class="fa-solid fa-briefcase-medical fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.personalInfo.medicalInfo") }}</div>
          </div>
          <div class="privacy-content">
            <div class="privacy-overlay">
              <div class="unlock-button" @click="unlockPrivacyData('medicalInfo')">
                <i class="fa-solid fa-lock"></i> {{ $t("common.viewInfo") }}
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.allergies") }}</label>
                <textarea
                  :value="userInfo.medicalInfo?.allergies"
                  @input="updateMedicalInfo('allergies', $event)"
                  :disabled="!isEditing"
                ></textarea>
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.conditions") }}</label>
                <textarea
                  :value="userInfo.medicalInfo?.conditions"
                  @input="updateMedicalInfo('conditions', $event)"
                  :disabled="!isEditing"
                ></textarea>
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.medications") }}</label>
                <textarea
                  :value="userInfo.medicalInfo?.medications"
                  @input="updateMedicalInfo('medications', $event)"
                  :disabled="!isEditing"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 紧急联系人 -->
        <div
          class="detail-group privacy-protected"
          :class="{ unlocked: unlockedFields.has('emergencyContact') }"
          data-field="emergencyContact"
        >
          <div class="title-with-icon">
            <i class="fa-solid fa-users fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.personalInfo.emergencyContact") }}</div>
          </div>
          <div class="privacy-content">
            <div class="privacy-overlay">
              <div class="unlock-button" @click="unlockPrivacyData('emergencyContact')">
                <i class="fa-solid fa-lock"></i> {{ $t("common.viewInfo") }}
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.emergencyName") }}</label>
                <input
                  type="text"
                  :value="userInfo.emergencyContact?.name"
                  @input="updateEmergencyContact('name', $event)"
                  :disabled="!isEditing"
                />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.emergencyRelation") }}</label>
                <input
                  type="text"
                  :value="userInfo.emergencyContact?.relation"
                  @input="updateEmergencyContact('relation', $event)"
                  :disabled="!isEditing"
                />
              </div>
            </div>
            <div v-if="userInfo" class="detail-item">
              <div class="input-wrapper">
                <label>{{ $t("profile.personalInfo.emergencyPhone") }}</label>
                <input
                  type="tel"
                  :value="userInfo.emergencyContact?.phoneNumber"
                  @input="updateEmergencyContact('phoneNumber', $event)"
                  :disabled="!isEditing"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 数据管理区域 -->
        <div class="detail-group data-management">
          <div class="title-with-icon vertical-layout">
            <i class="fa-solid fa-trash fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.dataManagement.title") }}</div>
            <div class="detail-item">
              <button class="clear-data-btn" @click="confirmClearData">
                <i class="fa-solid fa-trash fa-gradient-icon"></i>
                {{ $t("profile.dataManagement.clearAllData") }}
              </button>
              <p class="clear-data-warning">
                {{ $t("profile.dataManagement.clearConfirmMessage") }}
              </p>
            </div>
          </div>
        </div>

        <!-- 语言设置区域 -->
        <div class="detail-group language-settings">
          <div class="title-with-icon vertical-layout">
            <i class="fa-solid fa-language fa-gradient-icon"></i>
            <div class="item-title">{{ $t("profile.settings.language") }}</div>
            <div class="detail-item">
              <div class="language-options">
                <button
                  class="language-option"
                  @click="navigateToLanguageSettings"
                  :disabled="isChangingLanguage"
                >
                  <i class="fa-solid fa-language"></i>
                  {{ currentLanguageDisplay }}
                  <i class="fa-solid fa-cog settings-icon"></i>
                </button>

                <!-- 浏览器环境下的语言选择框 -->
                <div v-if="!isNativePlatformVal" class="language-selector">
                  <label class="selector-label">选择语言：</label>
                  <select
                    v-model="selectedLanguage"
                    @change="changeLanguageDirect"
                    :disabled="isChangingLanguage"
                    class="language-select"
                  >
                    <option value="zh-Hans">简体中文</option>
                    <option value="zh-Hant">繁體中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </div>
              </div>
              <p class="language-note">{{ $t("profile.settings.languageNote") }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 生日选择弹窗 -->
      <div v-if="showBirthdayModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="title-with-icon">
              <i class="fa-solid fa-calendar-days fa-gradient-icon"></i>
              <div class="item-title">{{ $t("profile.personalInfo.selectBirthday") }}</div>
            </div>
            <span class="close" @click="closeBirthdayModal">
              <i class="fa-solid fa-xmark fa-gradient-icon"></i>
            </span>
          </div>
          <div class="modal-body">
            <div class="birthday-picker-container">
              <label class="birthday-label">选择您的出生日期</label>
              <div class="date-input-container">
                <input
                  type="date"
                  v-model="tempBirthday"
                  :max="getTodayDate()"
                  @change="updateBirthdayFromPicker"
                  class="birthday-input"
                />
              </div>
              <div v-if="tempBirthday" class="selected-date">
                选择的日期: {{ formatBirthday(tempBirthday) }}
                <div class="age-preview">年龄: {{ calculateAge(tempBirthday) }}岁</div>
              </div>
              <div v-else class="birthday-hint">请选择您的出生日期，系统将自动计算年龄</div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="confirmBirthdayChange" class="confirm-btn">
              {{ $t("common.confirm") }}
            </button>
            <button @click="closeBirthdayModal" class="cancel-btn">
              {{ $t("common.cancel") }}
            </button>
          </div>
        </div>
      </div>
      </div>

    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n, generateLanguageDisplayText, getCurrentAppLanguage } from "@/composables/useI18n";
import { supportedLocales } from "@/composables/locales-config";
import { localDataManager } from "@/services/LocalDataManager";
import { biometricAuth } from "@/services/BiometricAuth";
import { isNativePlatform } from "@/utils/capacitor";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import type { UserData } from "@/types/app";


const i18n = useI18n();
const { t: $t } = i18n;
const router = useRouter();

const isNativePlatformVal = ref(false);

// 响应式数据
const isEditing = ref(false);
const showBirthdayModal = ref(false);
const tempBirthday = ref<string | undefined>("");
const unlockedFields = ref(new Set<string>());
const avatarInput = ref<HTMLInputElement>();
const isMedicalCardActive = ref(false);
const showMedicalCardTip = ref(false);

// 语言切换相关
const currentLanguage = ref<(typeof supportedLocales)[number]>(getCurrentAppLanguage());
const selectedLanguage = ref<(typeof supportedLocales)[number]>(getCurrentAppLanguage());
const isChangingLanguage = ref(false);

// 当前语言显示文本
const currentLanguageDisplay = ref("");

// 更新语言显示文本
const updateLanguageDisplay = async () => {
  try {
    const displayText = await generateLanguageDisplayText();
    currentLanguageDisplay.value = displayText;
    console.log("[ProfileView] 语言显示文本已更新:", displayText);
  } catch (error) {
    console.error("[ProfileView] 更新语言显示文本失败:", error);
    currentLanguageDisplay.value = "error";
  }
};

// 用户信息
const userInfo = ref<UserData>();

// 原始数据备份
let originalData: UserData | null = null;

// 生物识别验证时间
let biometricAuthTime: number | null = null;
const AUTH_TIMEOUT = 30000; // 30秒超时

// 检查验证是否仍在有效期内
const isAuthenticationValid = () => {
  if (!biometricAuthTime) return false;
  const now = Date.now();
  return now - biometricAuthTime < AUTH_TIMEOUT;
};

// 检查特定字段是否需要重新验证
const needsAuthentication = (fieldName: string) => {
  if (unlockedFields.value.has(fieldName)) {
    return false;
  }
  return !isAuthenticationValid();
};

// 解锁隐私数据
const unlockPrivacyData = async (fieldName: string) => {
  console.log(`[ProfileView] 开始解锁字段: ${fieldName}`);

  if (!needsAuthentication(fieldName)) {
    unlockField(fieldName);
    return;
  }

  try {
    const authResult = await biometricAuth.performBiometricAuth(
      {
        title: $t("profile.settings.biometricPermissionAlertTitle"),
        subtitle: $t("profile.settings.biometricPermissionRequired"),
        description: $t("profile.settings.biometricPermissionCheck"),
        reason: $t("profile.settings.biometricPermissionRequired"),
      },
      $t("profile.settings.biometricPermissionAlertTitle"),
      $t("profile.settings.biometricPermissionAlertMessage")
    );

    if (authResult.success) {
      biometricAuthTime = Date.now();
      unlockField(fieldName);
      console.log(`[ProfileView] 生物识别验证成功，字段 ${fieldName} 已解锁`);
    } else {
      console.error(`[ProfileView] 生物识别验证失败: ${authResult.error}`);
      // 验证失败时不解锁字段
    }
  } catch (error) {
    console.error(`[ProfileView] 生物识别验证异常:`, error);
    // 验证异常时不解锁字段
  }
};

// 解锁字段
const unlockField = (fieldName: string) => {
  unlockedFields.value.add(fieldName);
  console.log(`✅ 字段 ${fieldName} 已解锁`);

  // 添加解锁动画效果
  const protectedElement = document.querySelector(`[data-field="${fieldName}"]`);
  if (protectedElement) {
    // 简单添加unlocked类，让CSS transition生效
    protectedElement.classList.add("unlocked");
    console.log("🔓 已添加unlocked类");
  }
};

// 锁定所有隐私字段
const lockAllPrivacyFields = () => {
  unlockedFields.value.clear();
  biometricAuthTime = null;
  console.log("🔒 所有隐私字段已重新锁定");
};

// 切换编辑模式
const toggleEdit = () => {
  if (isEditing.value) {
    cancelEdit();
  } else {
    startEdit();
  }
};

// 开始编辑
const startEdit = () => {
  if (userInfo.value) {
    originalData = JSON.parse(JSON.stringify(userInfo.value));
  }
  isEditing.value = true;
  console.log("开始编辑模式");
};

// 取消编辑
const cancelEdit = () => {
  if (originalData && userInfo.value) {
    Object.assign(userInfo.value, originalData);
  }
  isEditing.value = false;
  lockAllPrivacyFields();
  console.log("取消编辑");
};

// 保存个人资料
const saveProfile = async () => {
  try {
    // 计算年龄
    if (userInfo.value?.birthday) {
      userInfo.value.age = calculateAge(userInfo.value.birthday);
    }

    // 保存到本地数据
    await localDataManager.setField("user", userInfo.value);
    console.log("个人资料已保存");

    isEditing.value = false;
    lockAllPrivacyFields();
  } catch (error) {
    console.error("保存个人资料失败:", error);
  }
};

// 性别变化处理
const onGenderChange = () => {
  if (userInfo.value && userInfo.value.gender !== "other") {
    userInfo.value.genderOther = "";
  }
};

// 血型变化处理
const onBloodTypeChange = () => {
  if (userInfo.value && userInfo.value.bloodType !== "other") {
    userInfo.value.bloodTypeOther = "";
  }
};

// 更新联系信息
const updateContactInfo = (field: string, event: Event) => {
  if (!userInfo.value) return;
  if (!userInfo.value.contactInfo) {
    userInfo.value.contactInfo = {};
  }
  const target = event.target as HTMLInputElement;
  (userInfo.value.contactInfo as Record<string, string>)[field] = target.value;
};

// 更新医疗信息
const updateMedicalInfo = (field: string, event: Event) => {
  if (!userInfo.value) return;
  if (!userInfo.value.medicalInfo) {
    userInfo.value.medicalInfo = {};
  }
  const target = event.target as HTMLInputElement;
  (userInfo.value.medicalInfo as Record<string, string>)[field] = target.value;
};

// 更新紧急联系人信息
const updateEmergencyContact = (field: string, event: Event) => {
  if (!userInfo.value) return;
  if (!userInfo.value.emergencyContact) {
    userInfo.value.emergencyContact = {};
  }
  const target = event.target as HTMLInputElement;
  (userInfo.value.emergencyContact as Record<string, string>)[field] = target.value;
};

// 打开生日选择器
const openBirthdayPicker = () => {
  if (!isEditing.value) return;
  tempBirthday.value = userInfo.value?.birthday;
  showBirthdayModal.value = true;
  console.log("🎂 打开生日选择器");
};

// 关闭生日选择器
const closeBirthdayModal = () => {
  showBirthdayModal.value = false;
};

// 更新生日
const updateBirthdayFromPicker = () => {
  if (userInfo.value) userInfo.value.birthday = tempBirthday.value;
  console.log(`📅 临时生日已更新: ${tempBirthday.value}`);

  // 验证日期
  if (tempBirthday.value) {
    const age = calculateAge(tempBirthday.value);
    if (age <= 0) {
      console.warn("⚠️ 选择的日期无效或在未来");
    }
  }
};

// 确认生日变化
const confirmBirthdayChange = () => {
  if (userInfo.value && userInfo.value.birthday) {
    userInfo.value.age = calculateAge(userInfo.value.birthday);
    console.log(`🎂 生日已更新: ${userInfo.value.birthday}, 年龄: ${userInfo.value.age}`);
  }
  closeBirthdayModal();
};

// 计算年龄
const calculateAge = (birthday: string): number => {
  if (!birthday) return 0;

  const birthDate = new Date(birthday);
  const today = new Date();

  // 检查日期是否有效
  if (isNaN(birthDate.getTime())) {
    console.error("❌ 无效的生日日期:", birthday);
    return 0;
  }

  // 检查日期是否在未来
  if (birthDate > today) {
    console.error("❌ 生日日期不能在未来:", birthday);
    return 0;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

// 格式化生日显示
const formatBirthday = (birthday: string): string => {
  if (!birthday) return "";

  const date = new Date(birthday);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
};

// 获取今天的日期字符串
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 更换头像
const changeAvatar = () => {
  try {
    // 检查是否在原生平台
    if (isNativePlatformVal.value) {
      console.log("[ProfileView] 原生平台，尝试直接打开相册");
      // 在原生平台，创建专门针对相册的input
      triggerGallerySelector();
    } else {
      console.log("[ProfileView] Web平台，使用文件选择器");
      triggerFileSelector();
    }
  } catch (error) {
    console.error("[ProfileView] 更换头像失败:", error);
  }
};

// 触发文件选择器
const triggerFileSelector = () => {
  try {
    if (!avatarInput.value) {
      console.error("[ProfileView] 文件选择器引用不存在");
      return;
    }

    // 重置input值，确保可以重复选择同一文件
    avatarInput.value.value = "";

    // 设置超时保护
    const timeoutId = setTimeout(() => {
      console.log("[ProfileView] 文件选择器超时，可能用户取消了选择");
    }, 30000);

    // 监听change事件来清除超时
    const handleChange = () => {
      clearTimeout(timeoutId);
      avatarInput.value?.removeEventListener("change", handleChange);
    };

    avatarInput.value.addEventListener("change", handleChange, { once: true });

    // 触发点击
    avatarInput.value.click();
    console.log("[ProfileView] 文件选择器已触发");
  } catch (error) {
    console.error("[ProfileView] 触发文件选择器失败:", error);
    alert("无法打开文件选择器，请重试");
  }
};

// 处理Camera API返回的照片
const handleCameraPhoto = async (photo: {
  webPath?: string;
  path?: string;
  format: string;
  saved: boolean;
}) => {
  const startTime = Date.now();
  console.log("[ProfileView] 📷 开始处理Camera API照片");

  try {
    const imagePath = photo.webPath || photo.path;
    if (!imagePath) {
      console.error("[ProfileView] 无效的图片路径");
      return;
    }

    console.log("[ProfileView] 照片信息:", {
      path: imagePath,
      format: photo.format,
      saved: photo.saved,
    });

    // 在原生平台，我们需要读取文件并转换为blob
    if (isNativePlatformVal.value) {
      // 使用fetch读取文件
      const response = await fetch(imagePath);
      const blob = await response.blob();

      console.log("[ProfileView] 文件信息:", {
        type: blob.type,
        size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
      });

      // 检查文件大小（限制为 10MB）
      if (blob.size > 10 * 1024 * 1024) {
        console.error("[ProfileView] ❌ 文件过大:", `${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        alert("图片文件过大，请选择小于10MB的图片");
        return;
      }

      // 转换blob为base64用于显示
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        console.log("[ProfileView] ✅ 图片转换完成");

        // 更新用户头像
        if (userInfo.value) {
          userInfo.value.avatar = base64String;
          console.log("[ProfileView] ✅ 头像已更新");
        }

        const endTime = Date.now();
        console.log(`[ProfileView] 📷 头像更换完成，耗时: ${endTime - startTime}ms`);
      };

      reader.onerror = () => {
        console.error("[ProfileView] ❌ 图片读取失败");
        alert("图片处理失败，请重试");
      };

      reader.readAsDataURL(blob);
    } else {
      // Web平台直接使用路径
      if (userInfo.value) {
        userInfo.value.avatar = imagePath;
        console.log("[ProfileView] ✅ 头像已更新");
      }

      const endTime = Date.now();
      console.log(`[ProfileView] 📷 头像更换完成，耗时: ${endTime - startTime}ms`);
    }
  } catch (error) {
    console.error("[ProfileView] ❌ 处理Camera照片失败:", error);
    alert("图片处理失败，请重试");
  }
};

// 专门针对移动端相册的选择器 - 使用Capacitor Camera API
const triggerGallerySelector = async () => {
  try {
    console.log("[ProfileView] 使用Capacitor Camera API打开相册");
    const photo = await Camera.getPhoto({
      source: CameraSource.Photos, // 仅打开系统相册，不会弹出摄像头
      resultType: CameraResultType.Uri, // 返回文件URI
      quality: 90, // 图片质量
      allowEditing: false, // 不允许编辑
      width: 1024, // 最大宽度
      height: 1024, // 最大高度
    });
    console.log("[ProfileView] 相册选择成功:", photo);
    // 处理选择的图片
    console.log("[ProfileView] 📷 处理相册选择的图片 webpath:", photo.webPath, "path:", photo.path);
    if (photo.webPath || photo.path) {
      await handleCameraPhoto(photo);
    } else {
      console.error("[ProfileView] 未获取到有效的图片路径");
    }
  } catch (error) {
    console.error("[ProfileView] Capacitor Camera API失败:", error);
    // console.log('[ProfileView] 降级使用HTML文件选择器');
    // triggerFileSelector();
  }
};

// 处理头像文件选择
const handleAvatarChange = async (event: Event) => {
  const startTime = Date.now();
  console.log("[ProfileView] 📁 开始处理头像文件选择");

  try {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
      console.log("[ProfileView] 没有选择文件");
      return;
    }
    const file = target.files[0];
    console.log("[ProfileView] 选择的文件:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    if (!file) {
      console.log("[ProfileView] 没有选择文件");
      return;
    }

    console.log("[ProfileView] 选择的文件:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      console.error("[ProfileView] ❌ 文件类型错误:", file.type);
      alert("请选择图片文件");
      return;
    }

    // 检查文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("[ProfileView] ❌ 文件过大:", `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      alert(`图片文件过大，请选择小于10MB的图片`);
      return;
    }

    // 创建超时Promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("文件读取超时"));
      }, 15000); // 15秒超时
    });

    // 创建文件读取Promise
    const readFilePromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            const result = e.target.result as string;
            console.log("[ProfileView] 📷 文件读取完成，数据长度:", result.length);
            resolve(result);
          } else {
            reject(new Error("读取结果为空"));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("文件读取失败"));
      };

      reader.onabort = () => {
        reject(new Error("文件读取被中断"));
      };

      // 开始读取文件
      reader.readAsDataURL(file);
    });

    // 使用Promise.race来处理超时
    const result = await Promise.race([readFilePromise, timeoutPromise]);

    // 更新头像
    if (userInfo.value) {
      userInfo.value.avatar = result;
      console.log("[ProfileView] ✅ 头像已更新，处理时间:", `${Date.now() - startTime}ms`);
    }
  } catch (error) {
    console.error("[ProfileView] 处理头像文件失败:", error);
    alert("头像更新失败，请重试");
  } finally {
    // 清理input值，允许重复选择同一文件
    const target = event.target as HTMLInputElement;
    if (target) {
      target.value = "";
    }
    console.log("[ProfileView] 头像处理完成，总时间:", `${Date.now() - startTime}ms`);
  }
};

// 切换医疗急救卡状态
const toggleMedicalCard = () => {
  if (!isMedicalCardActive.value) {
    // 第一次点击：激活状态并显示提示
    isMedicalCardActive.value = true;
    showMedicalCardTip.value = true;
    console.log("医疗急救卡已激活，显示提示");

    // 2秒后自动恢复原状
    setTimeout(() => {
      isMedicalCardActive.value = false;
      showMedicalCardTip.value = false;
      console.log("医疗急救卡自动恢复原状");
    }, 2000);
  } else {
    // 第二次点击：显示alert弹窗
    alert(
      "紧急医疗卡功能\n\n这里是紧急医疗卡的详细信息，包含用户的医疗信息、过敏史、紧急联系人等重要信息。\n\n在紧急情况下，医护人员可以通过此卡片快速了解患者的基本医疗状况。"
    );
    console.log("显示紧急医疗卡弹窗");

    // 关闭后回到常规状态
    isMedicalCardActive.value = false;
    showMedicalCardTip.value = false;
  }
};

// 确认清空数据
const confirmClearData = async () => {
  if (confirm("确定要清空所有本地数据吗？此操作不可撤销！")) {
    try {
      await localDataManager.clearAllData();
      console.log("所有数据已清空");
      // 删除数据后跳转到设置页面
      router.push("/setup");
    } catch (error) {
      console.error("清空数据失败:", error);
    }
  }
};

// 跳转到语言设置
const navigateToLanguageSettings = async () => {
  isChangingLanguage.value = true;

  try {
    console.log("[ProfileView] 跳转到语言设置");

    if (isNativePlatformVal.value) {
      // 原生平台：跳转到系统设置
      await navigateToAppSettings();
    } else {
      // Web 平台：显示手动操作提示
      alert("请手动打开系统设置 > 通用 > 语言与地区");
    }
  } catch (error) {
    console.error("跳转到语言设置失败:", error);
  } finally {
    isChangingLanguage.value = false;
  }
};

// 直接切换语言（Web 环境）
const changeLanguageDirect = async () => {
  if (selectedLanguage.value === currentLanguage.value) {
    return; // 没有变化
  }

  isChangingLanguage.value = true;

  try {
    console.log(
      `[ProfileView] 直接切换语言: ${currentLanguage.value} -> ${selectedLanguage.value}`
    );

    // 更新当前语言
    currentLanguage.value = selectedLanguage.value;

    // 使用自定义 useI18n 切换语言
    await i18n.changeLocale(selectedLanguage.value);

    // 更新语言显示文本
    await updateLanguageDisplay();

    console.log(`[ProfileView] 语言切换完成: ${selectedLanguage.value}`);
  } catch (error) {
    console.error("直接切换语言失败:", error);
    // 恢复原值
    selectedLanguage.value = currentLanguage.value;
  } finally {
    isChangingLanguage.value = false;
  }
};

// 跳转到应用设置
const navigateToAppSettings = async () => {
  try {
    console.log("[ProfileView] 正在跳转到应用的系统设置页面...");

    if (!isNativePlatformVal.value) {
      console.log("[ProfileView] Web平台，显示手动跳转提示");
      alert("请手动打开系统设置 > 通用 > 语言与地区");
      return;
    }

    // 在原生平台上使用 capacitor-native-settings 插件
    console.log("[ProfileView] 原生平台，使用 capacitor-native-settings 插件");

    try {
      const { NativeSettings, IOSSettings } = await import("capacitor-native-settings");

      // 打开应用设置页面
      await NativeSettings.openIOS({
        option: IOSSettings.App,
      });

      console.log("[ProfileView] 成功跳转到应用设置页面");
    } catch (pluginError) {
      console.error("[ProfileView] capacitor-native-settings 插件调用失败:", pluginError);

      // 备用方案：使用 window.open
      try {
        console.log("[ProfileView] 尝试备用方案：window.open");
        const settingsUrl = "App-Prefs:root=General&path=INTERNATIONAL";
        window.open(settingsUrl, "_blank");
        console.log("[ProfileView] 使用 window.open 打开系统设置");
      } catch (windowError) {
        console.log("[ProfileView] window.open 也失败，显示手动操作提示:", windowError);
        alert('请手动打开系统设置 > 通用 > 语言与地区，或选择"设置" > "通用" > "语言与地区"');
      }
    }
  } catch (error) {
    console.error("[ProfileView] 跳转到系统设置失败:", error);
    alert("跳转失败，请手动打开系统设置 > 通用 > 语言与地区");
  }
};

// 加载个人资料数据
const loadProfileData = async () => {
  try {
    const dataResult = await localDataManager.loadData();
    if (!dataResult.success) {
      console.error("[ProfileView] errorerror 加载数据失败:", dataResult.error);
      return;
    }
    if (!dataResult.data) {
      console.error("[ProfileView] errorerror 数据为空");
      return;
    }
    if (!dataResult.data.user) {
      console.error("[ProfileView] errorerror 用户数据为空");
      return;
    }

    // 只在setup时设置数据，后续只能读取本地数据
    userInfo.value = dataResult.data.user;

    // 如果有生日信息，自动计算年龄
    if (userInfo.value.birthday && !userInfo.value.age) {
      userInfo.value.age = calculateAge(userInfo.value.birthday);
      console.log(`🎂 自动计算年龄: ${userInfo.value.age}岁`);
    }
  } catch (error) {
    console.error("[ProfileView] errorerror 加载个人资料数据失败:", error);
  }
};

// 生命周期
onMounted(async () => {
  await loadProfileData();

  isNativePlatformVal.value = isNativePlatform();

  // 初始化语言设置
  try {
    console.log("[ProfileView] 开始初始化语言设置");

    // 设置当前语言
    currentLanguage.value = i18n.locale.value;
    selectedLanguage.value = i18n.locale.value;

    // 更新语言显示文本
    await updateLanguageDisplay();

    console.log("[ProfileView] 当前语言已设置为:", currentLanguage.value);
    console.log("[ProfileView] 选择语言已设置为:", selectedLanguage.value);
  } catch (error) {
    console.error("[ProfileView] 初始化语言设置失败:", error);
    currentLanguage.value = "zh-Hans";
    currentLanguageDisplay.value = "简体中文";
  }
});

// 组件卸载时清理资源
onUnmounted(() => {
  console.log("[ProfileView] 组件卸载，清理资源");

  // 清理文件输入框事件监听器
  if (avatarInput.value) {
    avatarInput.value.removeEventListener("change", handleAvatarChange);
  }

  // 清理任何可能的定时器
  // 注意：这里如果有其他定时器也应该清理
});
</script>

<style scoped>
/* 优化触摸体验 */
.save-btn,
.edit-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--border-radius-small);
  font: -apple-system-body;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.save-btn {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  color: white;
}

.edit-btn {
  background: transparent;
  color: #007aff;
  border: none;
  box-shadow: none;
}

.page-title {
  font: -apple-system-title1;
  color: #1a1a1a;
  margin: 0;
  text-align: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  z-index: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.header-actions .header-left-actions {
  display: flex;
  gap: 12px;
}

.header-left-actions {
  margin-right: auto;
}

.header-actions {
  margin-left: auto;
}

.profile-content {
  padding: 0;
}

.profile-header {
  margin-bottom: 2.5rem;
  padding: 1.5rem 1.25rem;
  background: white;
  border-radius: var(--border-radius-medium);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.user-info-section {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.medical-card-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  position: relative;
}

.profile-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0.125rem;
  background: linear-gradient(90deg, #34c759 0%, #30d158 100%);
}

.profile-avatar {
  position: relative;
  display: inline-block;
  /* padding: 8px; */
}

.medium-avatar {
  width: 5rem;
  height: 5rem;
  border-radius: var(--border-radius-circle);
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.change-avatar-btn {
  position: absolute;
  bottom: -12px;
  right: -12px;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--border-radius-circle);
  background: linear-gradient(135deg, #007aff 0%, #0056d6 100%);
  border: 2px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.change-avatar-btn:active {
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.medical-card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--border-radius-small);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.medical-card-tip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-small);
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 1000;
  margin-top: 0.5rem;
  animation: tipFadeIn 0.3s ease-in-out;
}

.medical-card-tip::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid rgba(0, 0, 0, 0.8);
}

@keyframes tipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.medical-card-icon i {
  font-size: 1rem;
  color: #6c757d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.medical-card-icon.medical-card-active i {
  color: #ff3b30;
}

/* 医疗急救卡激活状态 */
.medical-card-active {
  transform: scale(1.1);
}

/* 当图标处于激活状态时，容器的样式 */
.medical-card-icon.medical-card-active {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-color: #ff3b30;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.user-name .item-body {
  margin: 0 0 6px 0;
  color: #1a1a1a;
  background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-id {
  margin: 0;
  color: #8e8e93;
  font: -apple-system-footnote;
  /* font-weight: 500; */
}

.profile-details {
  background: white;
  border-radius: var(--border-radius-medium);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.profile-details::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0.0625rem;
  background: linear-gradient(90deg, transparent, #e5e5ea, transparent);
}

.detail-group {
  border-bottom: 1px solid var(--bg--secondary);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-group:last-child {
  border-bottom: none;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.375rem 0.875rem 1.375rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
}

.title-with-icon::after {
  content: "";
  position: absolute;
  /* bottom: 0; */
  /* left: 24px; */
  /* right: 24px; */
  /* height: 1px; */
  background: linear-gradient(90deg, transparent, #e5e5ea, transparent);
}

.title-with-icon i {
  font-size: 1rem;
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  width: 1.5rem;
  text-align: center;
}

.detail-item {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--bg--secondary);
  /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
  /* min-height: 3.5rem; */
  display: flex;
  align-items: center;
}

.detail-item:last-child {
  border-bottom: none;
}

/* ===== 输入框包装器样式 ===== */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.5rem;
  gap: 1rem; /* 强制左右间距，防止重叠 */
}

.input-wrapper label {
  flex: 0 0 auto; /* 内容决定宽度，不伸缩 */
  max-width: 9rem; /* Apple风格：设置最大宽度防止过长 */
  color: var(--apple-text-primary); /* 左侧标签：使用CSS变量 */
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 超长显示省略号 */
  background: transparent;
}

.detail-item input,
.detail-item select,
.detail-item textarea {
  flex: 1 1 auto; /* 占据剩余所有空间 */
  padding: 0rem 0.5rem;
  text-align: right;
  border: 2px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  color: var(--apple-text-secondary); /* 右侧用户内容：使用CSS变量 */
  box-sizing: border-box;
  min-width: 0; /* 允许缩小，配合省略号 */
  white-space: nowrap; /* 单行显示 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 右侧内容过长时显示省略号 */
}

/* textarea 特殊处理：允许多行 */
.detail-item textarea {
  white-space: normal; /* 允许换行 */
  overflow-y: auto; /* 垂直滚动 */
  text-overflow: initial; /* 不使用省略号 */
  resize: vertical; /* 只允许垂直调整大小 */
  min-height: 3rem; /* 最小高度 */
}

.detail-item input:focus,
.detail-item select:focus,
.detail-item textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.detail-item input:disabled,
.detail-item select:disabled,
.detail-item textarea:disabled {
  background: transparent;
  cursor: default;
  border: none;
  padding: 0rem 0.5rem;
  opacity: 1;
  color: var(--apple-text-secondary); /* 禁用状态：使用CSS变量 */
  /* 保持省略号效果 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* textarea 禁用状态特殊处理 */
.detail-item textarea:disabled {
  white-space: normal;
  overflow-y: auto;
  text-overflow: initial;
}

/* ===== 非编辑状态时隐藏边框 ===== */
.profile-view:not(.is-editing) .detail-item input:disabled,
.profile-view:not(.is-editing) .detail-item select:disabled,
.profile-view:not(.is-editing) .detail-item textarea:disabled {
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--apple-text-secondary); /* 非编辑状态：使用CSS变量 */
}

/* ===== 选择框特殊样式 ===== */
.detail-item select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23007aff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  padding-right: 2rem;
}

.detail-item select:disabled {
  background-image: none;
  padding-right: 0;
}

/* ===== 编辑状态下的特殊样式 ===== */
.profile-view.is-editing .detail-item {
  background: #ffffff;
}

/* ===== 非编辑状态的内容样式 ===== */
/* .profile-view:not(.is-editing) .detail-item input:disabled,
.profile-view:not(.is-editing) .detail-item select:disabled,
.profile-view:not(.is-editing) .detail-item textarea:disabled {
  font-weight: ;
} */

/* ===== 空值显示样式 ===== */
/* .detail-item input:disabled:placeholder-shown,
.detail-item select:disabled:invalid,
.detail-item textarea:disabled:placeholder-shown {
  color: ;
  font-weight: ;
} */

/* ===== 年龄输入框在编辑状态下的样式 ===== */
.detail-item input.clickable {
  cursor: pointer;
  background: #ffffff;
  color: #1a1a1a;
  border-color: #007aff;
  opacity: 1;
}

/* ===== 详情项文本域样式 ===== */
.detail-item textarea {
  min-height: 2rem;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  text-align: right;
}

.detail-item textarea:disabled {
  min-height: auto;
}

/* ===== 隐私保护容器 ===== */
.privacy-protected {
  position: relative; /* 相对定位 */
  overflow: hidden; /* 隐藏溢出 */
}

/* ===== 隐私信息特殊处理 ===== */
/* 禁用隐私信息的选择功能，防止意外复制 */
.privacy-content {
  position: relative; /* 相对定位 */
  z-index: 1; /* 层级 */
  /* 禁用隐私信息选择 */
  -webkit-user-select: none; /* Safari/Chrome 禁用选择 */
  -moz-user-select: none; /* Firefox 禁用选择 */
  -ms-user-select: none; /* IE/Edge 禁用选择 */
  user-select: none; /* 标准属性禁用选择 */
}

/* ===== 隐私内容中的表单元素 ===== */
/* 允许表单元素内的文字选择，但禁用外部选择 */
.privacy-content input,
.privacy-content select,
.privacy-content textarea {
  -webkit-user-select: text; /* Safari/Chrome 允许选择 */
  -moz-user-select: text; /* Firefox 允许选择 */
  -ms-user-select: text; /* IE/Edge 允许选择 */
  user-select: text; /* 标准属性允许选择 */
}

/* ===== 用户ID和敏感信息 ===== */
/* 防止敏感信息被意外选择 */
.user-id {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  /* 触摸优化样式已移至 App.vue 全局样式 */
}

/* ===== 隐私遮罩层样式 ===== */
.privacy-overlay {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  background: rgba(255, 255, 255, 0.7); /* 半透明白色背景 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  backdrop-filter: blur(5px); /* 背景模糊效果 */
  -webkit-backdrop-filter: blur(5px); /* Safari 背景模糊 */
  z-index: 10; /* 层级 */
  border-radius: var(--border-radius-medium); /* 中圆角 */
  cursor: pointer; /* 手型光标 */
  transition: all 0.3s ease; /* 过渡动画 */
}

/* ===== 隐私保护样式系统 ===== */

/* ===== 1. 隐私内容容器，作为遮罩的定位父级 ===== */
.privacy-content {
  position: relative; /* 相对定位 */
}

/* ===== 2. 遮罩层，精确覆盖在 privacy-content 之上 ===== */
.privacy-overlay {
  position: absolute; /* 绝对定位 */
  top: 0; /* 顶部对齐 */
  left: 0; /* 左侧对齐 */
  right: 0; /* 右侧对齐 */
  bottom: 0; /* 底部对齐 */
  z-index: 10; /* 层级 */

  background: rgba(255, 255, 255, 0.7); /* 半透明白色背景 */
  backdrop-filter: blur(5px); /* 背景模糊效果 */
  -webkit-backdrop-filter: blur(5px); /* Safari 背景模糊 */

  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */

  cursor: pointer; /* 手型光标 */
  transition: opacity 0.3s ease, transform 0.3s ease; /* 过渡动画 */
}

/* ===== 3. 解锁时的动画效果 ===== */
/* 当父级 .privacy-protected 有 .unlocked 类时，隐藏遮罩 */
.privacy-protected.unlocked .privacy-overlay {
  opacity: 0; /* 完全透明 */
  pointer-events: none; /* 隐藏后不可点击 */
  transform: scale(1.05); /* 添加一点缩放动画 */
}

/* ===== 解锁按钮样式 ===== */
.unlock-button {
  padding: 0.5rem 1rem; /* 内边距 */
  background: rgba(0, 122, 255, 0.15); /* 半透明蓝色背景 */
  border: 2px solid rgba(0, 122, 255, 0.4); /* 蓝色边框 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  color: #007aff; /* 蓝色文字 */
  font: -apple-system-body; /* 苹果系统正文字体 */
  /* font-weight: 600;                半粗体 */
  cursor: pointer; /* 手型光标 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 0.625rem; /* 元素间距 */
  transition: all 0.2s ease; /* 过渡动画 */
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2); /* 阴影 */
  position: relative; /* 相对定位 */
  overflow: hidden; /* 隐藏溢出 */
  z-index: 1; /* 层级 */
  user-select: none; /* 禁用选择 */
}

/* ===== 解锁按钮图标 ===== */
.unlock-button i {
  font-size: 1rem; /* 图标大小 */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 变换动画 */
}

/* ===== 数据管理区域样式 ===== */
.data-management {
  background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%); /* 浅红色渐变背景 */
}

.data-management .title-with-icon {
  background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%); /* 浅红色渐变背景 */
}

/* ===== 语言设置区域样式 ===== */
.language-settings {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); /* 浅蓝色渐变背景 */
}

.language-settings .title-with-icon {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); /* 浅蓝色渐变背景 */
}

/* ===== 语言设置说明 ===== */
.language-note {
  margin: 0.5rem 0 0 0; /* 顶部外边距 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #8e8e93; /* 次要文字颜色 */
  /* font-weight: 500;                中等粗细 */
}

/* ===== 垂直布局样式 ===== */
.title-with-icon.vertical-layout {
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平居中 */
  text-align: center; /* 文字居中 */
  gap: 1rem; /* 元素间距 */
  padding: 1.5rem; /* 增加内边距 */
}

.title-with-icon.vertical-layout i {
  font-size: 1.25rem; /* 增大图标尺寸 */
}

.title-with-icon.vertical-layout .item-title {
  margin-bottom: 1rem; /* 标题底部外边距 */
}

.title-with-icon.vertical-layout .detail-item {
  width: 100%; /* 占满宽度 */
  flex-direction: column; /* 垂直排列内容 */
  padding: 0; /* 移除内边距 */
  border-bottom: none; /* 移除底部边框 */
}

/* ===== 清除数据按钮样式 ===== */
.clear-data-btn {
  width: 100%; /* 占满宽度 */
  padding: 0.5rem; /* 内边距 */
  background: linear-gradient(135deg, #ff3b30 0%, #dc2626 100%); /* 红色渐变背景 */
  color: white; /* 白色文字 */
  border: none; /* 无边框 */
  border-radius: var(--border-radius-small); /* 小圆角 */
  /* font: -apple-system-body;        苹果系统正文字体 */
  /* font-weight: 600;                半粗体 */
  /* cursor: pointer;                 手型光标 */
  display: flex; /* 弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 1rem; /* 元素间距 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 过渡动画 */
  box-shadow: 0 8px 24px rgba(255, 59, 48, 0.3); /* 阴影 */
  position: relative; /* 相对定位 */
  overflow: hidden; /* 隐藏溢出 */
}

/* ===== 清除数据按钮激活状态 ===== */
.clear-data-btn:active {
  transform: scale(0.98); /* 轻微缩小 */
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.3); /* 减弱阴影 */
}

/* ===== 清除数据警告文字 ===== */
.clear-data-warning {
  margin: 0.75rem 0 0 0; /* 顶部外边距 */
  font: -apple-system-footnote; /* 苹果系统脚注字体 */
  color: #dc2626; /* 红色文字 */
  text-align: center;
  /* font-weight: 500; */
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 防止模态框内容被选中 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(10px);
  }
}

.modal-content {
  background: white;
  border-radius: var(--border-radius-large);
  width: 90%;
  max-width: 25rem;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 允许模态框内的表单元素选择 */
  -webkit-user-select: auto;
  -moz-user-select: auto;
  -ms-user-select: auto;
  user-select: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--bg--secondary);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.modal-header .title-with-icon {
  background: none;
  padding: 0;
}

.modal-header .title-with-icon::after {
  display: none;
}

.close {
  cursor: pointer;
  font-size: 1rem;
  color: #8e8e93;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-small);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.modal-body input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 生日选择器样式 */
.birthday-picker-container {
  text-align: center;
}

.birthday-label {
  display: block;
  margin-bottom: 1rem;
  /* font-weight: 600; */
  color: #1a1a1a;
  font-size: 1rem;
}

.date-input-container {
  position: relative;
}

.birthday-input {
  flex: 1;
  padding: 1rem 1.25rem;
  border: 2px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  text-align: center;
}

.birthday-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.selected-date {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  border: 1px solid #007aff;
  border-radius: var(--border-radius-small);
  color: #007aff;
  /* font-weight: 600; */
  font-size: 0.875rem;
}

.age-preview {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #34c759;
  /* font-weight: 500; */
}

.birthday-hint {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e9ecef;
  border-radius: var(--border-radius-small);
  color: #6c757d;
  font-size: 0.875rem;
  text-align: center;
}

/* 语言选项样式 */
.language-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* margin-top: 0.5rem; */
  width: 100%;
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 两端对齐，图标和文字分布 */
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 2px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  background: white;
  /* color: #1a1a1a; */
  /* font-weight: 500; */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.language-option.active {
  border-color: #007aff;
  background: linear-gradient(135deg, #007aff 0%, #0056cc 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.language-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.language-option i {
  font-size: 1.125rem;
  width: 1.25rem;
  text-align: center;
}

.settings-icon {
  margin-left: auto;
  color: #007aff;
  font-size: 1rem;
}

/* 语言选择器样式 */
.language-selector {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e5e5ea;
  border-radius: var(--border-radius-small);
}

.selector-label {
  display: block;
  margin-bottom: 0.5rem;
  /* font-weight: 600; */
  color: #1a1a1a;
  font-size: 0.875rem;
}

.language-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e5ea;
  border-radius: var(--border-radius-small);
  background: white;
  font-size: 1rem;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.language-select:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.language-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.custom-language-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* margin-top: 0.5rem; */
  /* padding-left: 1rem; */
  border-left: 2px solid #e5e5ea;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
}

.modal-footer button {
  flex: 1;
  padding: 1rem 1.25rem;
  border: none;
  border-radius: var(--border-radius-small);
  /* font-weight: 600; */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-footer .confirm-btn {
  background: linear-gradient(135deg, #007aff 0%, #0056d6 100%);
  color: white;
}

.modal-footer .cancel-btn {
  background: linear-gradient(135deg, var(--bg--secondary) 0%, #e5e5ea 100%);
  color: #1a1a1a;
}

/* 解锁状态 - 使用transition而不是animation */
.privacy-protected.unlocked .privacy-overlay {
  opacity: 0;
  pointer-events: none;
  transform: scale(1.1);
}
</style>

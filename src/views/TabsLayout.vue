<template>
  <div class="tabs-view">
    <!-- 主要内容区域 -->
    <div class="tab-content">
      <router-view />
    </div>

    <!-- 底部导航栏 -->
    <div class="custom-tab-bar">
      <div
        class="tab-button"
        :class="{ 'tab-selected': isActiveTab('/tabs/dashboard') }"
        @click="navigateTo('/tabs/dashboard')"
      >
        <i class="fa-solid fa-chart-line"></i>
        <span class="tab-label">{{ t("navigation.tabs.dashboard") }}</span>
      </div>

      <div
        class="tab-button"
        :class="{ 'tab-selected': isActiveTab('/tabs/devices') }"
        @click="navigateTo('/tabs/devices')"
      >
        <i class="fa-solid fa-microchip"></i>
        <span class="tab-label">{{ t("navigation.tabs.devices") }}</span>
      </div>

      <div
        class="tab-button"
        :class="{ 'tab-selected': isActiveTab('/tabs/profile') }"
        @click="navigateTo('/tabs/profile')"
      >
        <i class="fa-solid fa-user"></i>
        <span class="tab-label">{{ t("navigation.tabs.profile") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { onMounted, onUnmounted } from "vue";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const navigateTo = (path: string) => {
  router.push(path);
};

const isActiveTab = (path: string) => {
  return route.path === path;
};

// 监听开发者模式进入事件
const handleEnterDeveloperMode = () => {
  router.push("/tabs/developer");
};

// 监听tab切换事件
const handleTabSwitch = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { tab } = customEvent.detail;

  // console.log("[TabsLayout] 收到tab切换事件:", tab);

  switch (tab) {
    case "devices":
      router.push("/tabs/devices");
      break;
    case "dashboard":
      router.push("/tabs/dashboard");
      break;
    case "profile":
      router.push("/tabs/profile");
      break;
    default:
      console.warn("[TabsLayout] 未知的tab:", tab);
  }
};

onMounted(() => {
  window.addEventListener("switch-tab", handleTabSwitch);
  window.addEventListener("enter-developer-mode", handleEnterDeveloperMode);
  // 给 body 添加 tabs-view 类名，排除安全区域 padding-top
  // document.body.classList.add('tabs-view');
});

onUnmounted(() => {
  window.removeEventListener("switch-tab", handleTabSwitch);
  window.removeEventListener("enter-developer-mode", handleEnterDeveloperMode);
  // 移除 tabs-view 类名
  // document.body.classList.remove('tabs-view');
});
</script>

<style scoped>
.tabs-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* overflow: hidden; 防止整体滚动 */
  /* padding-bottom: var(--safe-area-inset-bottom); 确保内容不被底部指示器遮挡 */
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

.custom-tab-bar {
  background: #ffffff;
  border-radius: var(--border-radius-medium) var(--border-radius-medium) 0 0;
  position: fixed;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  max-width: 600px;
  z-index: 1000;
  display: flex;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  /* 抬高固定导航栏的内部内容，防止被底部的小黑条（Home Indicator）遮挡 */
  /* padding-bottom: var(--safe-area-inset-bottom); */
}

.tab-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  cursor: pointer;
  color: #8e8e93;
  transition: color 0.2s ease;
}

.tab-button i {
  font-size: 18px;
  margin-bottom: 4px;
}

.tab-button.tab-selected {
  color: #3b82f6;
}

.tab-label {
  font: -apple-system-caption1;
  text-align: center;
  font-size: 0.75rem;
  font-weight: bold;
}
</style>

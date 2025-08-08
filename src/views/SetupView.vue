<template>
  <div class="setup-view">
    <header class="header">
      <div></div>
      <div class="page-title item-headline">{{ t("setup.title") }}</div>
      <div></div>
    </header>

    <section class="setup-content">
      <div class="setup-container">
        <div class="setup-header">
          <div class="item-title">{{ t("setup.welcome.title") }}</div>
          <p>{{ t("setup.welcome.subtitle") }}</p>
        </div>

        <div class="setup-options">
          <div
            class="setup-card"
            :class="{ disabled: hasExistingData }"
            @click="hasExistingData ? null : initializeWithEmptyData"
          >
            <div class="card-icon">
              <i class="fa-solid fa-user-plus"></i>
            </div>
            <div class="item-body">{{ t("setup.options.freshStart.title") }}</div>
            <p>
              {{
                hasExistingData
                  ? t("setup.options.freshStart.disabledDescription")
                  : t("setup.options.freshStart.description")
              }}
            </p>
          </div>

          <div class="setup-card" @click="initializeWithDebugData">
            <div class="card-icon">
              <i class="fa-solid fa-flask"></i>
            </div>
            <div class="item-body">{{ t("setup.options.testData.title") }}</div>
            <p>{{ t("setup.options.testData.description") }}</p>
          </div>

          <div class="setup-card" @click="clearAllData">
            <div class="card-icon">
              <i class="fa-solid fa-trash"></i>
            </div>
            <div class="item-body">{{ t("setup.options.clearData.title") }}</div>
            <p>{{ t("setup.options.clearData.description") }}</p>
          </div>
        </div>

        <div class="setup-info">
          <div class="item-body">{{ t("setup.description.title") }}</div>
          <ul>
            <li>{{ t("setup.description.freshStart") }}</li>
            <li>{{ t("setup.description.testData") }}</li>
            <li>{{ t("setup.description.saveNote") }}</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
// Ionic components removed - using custom layout
import { useRouter } from "vue-router";
import { localDataManager } from "@/services/LocalDataManager";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const router = useRouter();
const hasExistingData = ref(false);

const checkExistingData = async () => {
  try {
    const result = await localDataManager.loadData();
    hasExistingData.value = result.success && result.data !== undefined;
    console.log("[Setup] 检查现有数据:", hasExistingData.value);
  } catch (error) {
    console.error("[Setup] 检查现有数据失败:", error);
    hasExistingData.value = false;
  }
};

const initializeWithEmptyData = async () => {
  if (hasExistingData.value) {
    console.log("[Setup] 已有数据，跳过空数据初始化");
    return;
  }

  try {
    console.log("[Setup] 初始化空数据");
    await localDataManager.initializeWithEmptyData();
    console.log("[Setup] 空数据初始化成功");
    router.push("/tabs/dashboard");
  } catch (error) {
    console.error("[Setup] 初始化空数据失败:", error);
  }
};

const initializeWithDebugData = async () => {
  try {
    console.log("[Setup] 初始化调试数据");
    await localDataManager.initializeWithDebugData();
    console.log("[Setup] 调试数据初始化成功");
    router.push("/tabs/dashboard");
  } catch (error) {
    console.error("[Setup] 初始化调试数据失败:", error);
  }
};

const clearAllData = async () => {
  try {
    console.log("[Setup] 清空所有数据");
    await localDataManager.clearAllData();
    console.log("[Setup] 数据清空成功");
    hasExistingData.value = false;
    // 刷新页面以重新开始
    window.location.reload();
  } catch (error) {
    console.error("[Setup] 清空数据失败:", error);
  }
};

onMounted(async () => {
  console.log("[Setup] 设置页面已挂载");
  await checkExistingData();
});
</script>

<style scoped>
.setup-container {
  padding: 0;
  max-width: none;
  margin: 0;
}

.setup-header {
  text-align: center;
  margin-bottom: 30px;
}

.setup-header .item-title {
  color: #333;
  margin-bottom: 10px;
}

.setup-header p {
  color: #666;
  font: -apple-system-body;
}

.setup-options {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.setup-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: var(--border-radius-small);
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.setup-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.card-icon {
  text-align: center;
  margin-bottom: 15px;
}

.card-icon i {
  font-size: 2.5rem;
  color: #3b82f6;
}

.setup-card .item-body {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.setup-card p {
  text-align: center;
  color: #666;
  font: -apple-system-body;
  line-height: 1.5;
}

.setup-info {
  background: #f8fafc;
  border-radius: var(--border-radius-small);
  padding: 20px;
}

.setup-info .item-body {
  color: #333;
  margin-bottom: 15px;
  /* font-weight: 600; */
}

.setup-info ul {
  color: #666;
  font: -apple-system-body;
  line-height: 1.6;
}

.setup-info li {
  margin-bottom: 8px;
}
</style>

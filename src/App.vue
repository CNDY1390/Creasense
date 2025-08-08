<template>
  <ion-app>
    <router-view />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp } from "@ionic/vue";
</script>

<style>
/* ===== 应用根容器样式 ===== */
#app {
  height: 100vh;                   /* 视口高度 */
  width: 100vw;                    /* 视口宽度 */
  overflow-y: auto;                /* 允许垂直滚动 */
  overflow-x: hidden;              /* 禁止水平滚动 */
  position: relative;              /* 相对定位 */
  box-sizing: border-box;          /* 盒模型包含padding和border */
  margin: 0;                       /* 移除外边距 */
  top: 0;                          /* 顶部对齐 */
  left: 0;                         /* 左侧对齐 */
  display: flex;                   /* 使用弹性布局 */
  flex-direction: column;          /* 垂直排列 */
  justify-content: flex-start;     /* 内容从顶部开始 */
  background: var(--bg-secondary);  /*使用统一的背景色 */
  /* padding: 1rem;                   内边距 */
}

/* ===== 全局触摸和交互控制样式 ===== */
/* 统一管理所有触摸相关的样式，避免重复定义 */
html,
body,
#app,
.dashboard-view,
.profile-view,
.devices-view,
.setup-view,
.tab-content,
button,
.page-title,
.device-icon,
.scan-button,
.header-actions i,
.search-icon,
.notification-icon,
.header-actions button,
.change-avatar-btn,
.unlock-button,
.clear-data-btn,
.modal-header .close,
.modal-footer button,
.title-with-icon, .item-title, .item-headline, .item-body, .item-footnote,
.fa-gradient-icon,
.help-icon,
.help-arrow,
.transparent-button i,
.picker-option,
.close-button,
.tab-button,
.tab-button i,
.tab-label {
  /* 禁用双击缩放和触摸相关功能 */
  -webkit-touch-callout: none;     /* 禁用长按菜单 */
  -webkit-tap-highlight-color: transparent; /* 禁用点击高亮 */
  -webkit-user-select: none;       /* 禁用文本选择 */
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  touch-action: manipulation;      /* 禁用双击缩放，但保留点击和滚动 */
}

/* ===== 全局滚动条隐藏样式 ===== */
/* 统一隐藏所有滚动条 */
html,
body,
#app,
.dashboard-view,
.profile-view,
.devices-view,
.setup-view,
.tab-content {
  /* 隐藏滚动条 */
  scrollbar-width: none;           /* Firefox */
  -ms-overflow-style: none;        /* IE and Edge */
}

/* 隐藏Webkit浏览器的滚动条 */
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar,
.dashboard-view::-webkit-scrollbar,
.profile-view::-webkit-scrollbar,
.devices-view::-webkit-scrollbar,
.setup-view::-webkit-scrollbar,
.tab-content::-webkit-scrollbar {
  display: none;
}
</style>

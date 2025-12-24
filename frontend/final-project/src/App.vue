<script setup>
import { RouterView, useRoute } from 'vue-router'
import { onMounted, ref, nextTick } from 'vue'

const route = useRoute()
const isLoading = ref(false)

// 动态加载 Google Fonts
onMounted(() => {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
})

// 获取路由切换动画名称
function getTransitionName(to) {
  // 登录相关页面使用渐隐动画
  if (['Login', 'Register'].includes(to.name)) {
    return 'fade'
  }
  
  // 详情页面使用侧滑动画
  if (to.name === 'WebPageDetail') {
    return 'slide-left'
  }
  
  // 添加网页页面使用上滑动画
  if (to.name === 'AddWebPage') {
    return 'slide-up'
  }
  
  // 默认使用渐隐动画
  return 'fade'
}

// 动画生命周期钉子
function onBeforeEnter() {
  document.body.style.overflow = 'hidden'
}

function onEnter() {
  nextTick(() => {
    document.body.style.overflow = ''
  })
}

function onLeave() {
  // 可以在这里添加页面离开时的逼辑
}
</script>

<template>
  <div id="app">
    <!-- 页面切换动画 -->
    <RouterView v-slot="{ Component, route }">
      <Transition 
        :name="getTransitionName(route)"
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <KeepAlive :include="['DashboardView', 'WebPagesView', 'ReportsView']">
          <component :is="Component" :key="route.fullPath" />
        </KeepAlive>
      </Transition>
    </RouterView>
    
    <!-- 全局加载指示器 -->
    <div class="global-loading" v-if="isLoading">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局 CSS 变量定义 - 现代化设计系统 */
:root {
  /* 主色调系统 */
  --primary-color: #6366f1;
  --primary-light: #8b5cf6;
  --primary-dark: #4f46e5;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-gradient-hover: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  
  /* 功能色彩 */
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #06b6d4;
  
  /* 中性色系统 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* 背景色系统 - 蓝色主题 */
  --bg-primary: #f8faff;
  --bg-secondary: #f1f5ff;
  --bg-tertiary: #e6eeff;
  --bg-dark: #1e293b;
  --bg-card: rgba(248, 250, 255, 0.8);
  --bg-overlay: rgba(30, 41, 59, 0.5);
  --bg-gradient-light: linear-gradient(135deg, #f8faff 0%, #e6f2ff 100%);
  --bg-gradient-card: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  
  /* 文字颜色系统 */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  --text-white: #ffffff;
  
  /* 边框和分割线 */
  --border-color: #d1d9ff;
  --border-light: #e6eeff;
  --divider: #d1d9ff;
  --border-accent: rgba(99, 102, 241, 0.2);
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-colored: 0 10px 15px -3px rgba(99, 102, 241, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.05);
  
  /* 边框圆角 */
  --radius-sm: 0.375rem;
  --radius-base: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
  
  /* 间距系统 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-base: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  
  /* 字体系统 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  
  /* 字体大小 */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  
  /* 行高 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* 动画时长 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  
  /* 动画缓动函数 */
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* 全局重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

*::before,
*::after {
  box-sizing: border-box;
}

html {
  line-height: var(--leading-normal);
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
  font-family: var(--font-family-sans);
  font-feature-settings: normal;
  font-variation-settings: normal;
}

body {
  font-family: var(--font-family-sans);
  background: var(--bg-gradient-light);
  color: var(--text-primary);
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  min-height: 100vh;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
  transition: background var(--duration-normal) var(--ease-out);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 主应用容器 */
#app {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 页面切换动画 */
/* 渐隐动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all var(--duration-slow) var(--ease-out);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 左滑动画 (详情页) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all var(--duration-slow) var(--ease-out);
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 上滑动画 (添加页面) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--duration-slow) var(--ease-out);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 全局加载指示器 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 微交互效果 */
.micro-interaction {
  transition: all var(--duration-fast) var(--ease-out);
}

.micro-interaction:hover {
  transform: scale(1.02);
}

.micro-interaction:active {
  transform: scale(0.98);
}

.ripple-effect {
  position: relative;
  overflow: hidden;
}

.ripple-effect::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.ripple-effect:active::after {
  width: 200px;
  height: 200px;
}

/* 悬停提示效果 */
.tooltip-hover {
  position: relative;
}

.tooltip-hover::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--gray-800);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-normal) var(--ease-out);
  z-index: 1000;
}

.tooltip-hover::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  border: 4px solid transparent;
  border-top-color: var(--gray-800);
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

.tooltip-hover:hover::before,
.tooltip-hover:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

/* 通用工具类 */
.glass-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.gradient-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hover-lift {
  transition: transform var(--duration-normal) var(--ease-out);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.interactive {
  transition: all var(--duration-normal) var(--ease-out);
}

.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* 响应式断点 */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Element Plus 主题定制 */
.el-button--primary {
  background: var(--primary-gradient) !important;
  border: none !important;
  box-shadow: var(--shadow-colored) !important;
  transition: all var(--duration-normal) var(--ease-out) !important;
}

.el-button--primary:hover {
  background: var(--primary-gradient-hover) !important;
  transform: translateY(-1px) !important;
  box-shadow: var(--shadow-lg) !important;
}

.el-card {
  border-radius: var(--radius-lg) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: var(--shadow-base) !important;
}

.el-input__wrapper {
  border-radius: var(--radius-base) !important;
}

.el-tag {
  border-radius: var(--radius-sm) !important;
}
</style>

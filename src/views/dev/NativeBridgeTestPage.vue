<script setup lang="ts">
import { computed, ref } from 'vue';
import PaymentOverlay from '@/components/common/PaymentOverlay.vue';
import {
  A0019PermissionGetType,
  checkPermission,
  closeWebView,
  getDeviceIdentifiers,
  getNativeBridgeName,
  hideGlobalLoading,
  isA0019Native,
  logoutApp,
  openNewWebView,
  openSystemSettings,
  requestA0019Purchase,
  requestAppStoreReview,
  setBadge,
  triggerHaptic,
} from '@/utils/native/A0019Bridge';

type LogLevel = 'info' | 'success' | 'error';

interface LogItem {
  id: number;
  level: LogLevel;
  text: string;
}

const logs = ref<LogItem[]>([]);
const badge = ref(1);
const hapticLevel = ref<0 | 1 | 2 | 3>(1);
const hapticCount = ref(1);
const newWebUrl = ref('');
const productId = ref('');
const orderNum = ref(`test_${Date.now()}`);
const showMockApplePayPanel = ref(false);
const currentPath = window.location.pathname;

const bridgeName = computed(() => getNativeBridgeName());
const nativeReady = computed(() => isA0019Native());

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function addLog(level: LogLevel, text: string, value?: unknown) {
  const suffix = value === undefined ? '' : `\n${stringify(value)}`;
  logs.value.unshift({
    id: Date.now() + Math.random(),
    level,
    text: `${new Date().toLocaleTimeString()} ${text}${suffix}`,
  });
  logs.value = logs.value.slice(0, 30);
}

async function withTimeout<T>(label: string, task: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function runSync(label: string, action: () => void) {
  try {
    action();
    addLog('success', `${label} 已发送`);
  } catch (error) {
    addLog('error', `${label} 失败`, error instanceof Error ? error.message : error);
  }
}

async function runAsync<T>(label: string, action: () => Promise<T>) {
  try {
    addLog('info', `${label} 请求中...`);
    const result = await withTimeout(label, action());
    addLog('success', `${label} 回调成功`, result);
  } catch (error) {
    addLog('error', `${label} 失败`, error instanceof Error ? error.message : error);
  }
}

function testOpenNewWebView() {
  const target = newWebUrl.value.trim() || window.location.href;
  runSync('type 1 打开新 WebView', () => openNewWebView(target, 1));
}

function testPurchase() {
  const code = productId.value.trim();
  if (!code) {
    addLog('error', 'type 2 内购需要先填写 Apple 商品 ID');
    return;
  }
  runSync('type 2 发起内购', () => requestA0019Purchase(code, orderNum.value.trim()));
}

const permissionItems = [
  { label: '通知', type: A0019PermissionGetType.Notification },
  { label: '相机', type: A0019PermissionGetType.Camera },
  { label: '相册', type: A0019PermissionGetType.PhotoLibrary },
  { label: '麦克风', type: A0019PermissionGetType.Microphone },
] as const;
</script>

<template>
  <main class="native-test-page">
    <header class="header">
      <div>
        <p class="eyebrow">Local Dev</p>
        <h1>Native Bridge Test</h1>
      </div>
      <span :class="['status', nativeReady ? 'status-on' : 'status-off']">
        {{ nativeReady ? 'Bridge Ready' : 'Browser Mode' }}
      </span>
    </header>

    <section class="panel">
      <div class="meta-row">
        <span>Bridge</span>
        <strong>{{ bridgeName }}</strong>
      </div>
      <div class="meta-row">
        <span>URL</span>
        <strong>{{ currentPath }}</strong>
      </div>
    </section>

    <section class="panel">
      <h2>页面与会话</h2>
      <div class="grid">
        <button type="button" @click="runSync('type 11 隐藏 Loading', hideGlobalLoading)">隐藏 Loading</button>
        <button type="button" @click="testOpenNewWebView">打开新 WebView</button>
        <button type="button" class="danger" @click="runSync('type 0 关闭 WebView', closeWebView)">关闭当前页</button>
        <button type="button" class="danger" @click="runSync('type 3 登出', logoutApp)">原生登出</button>
      </div>
      <input v-model="newWebUrl" type="text" placeholder="新 WebView URL，留空默认当前页面" />
    </section>

    <section class="panel">
      <h2>权限</h2>
      <div class="grid">
        <button
          v-for="item in permissionItems"
          :key="item.type"
          type="button"
          @click="runAsync(`type 8 检查${item.label}权限`, () => checkPermission(item.type))"
        >
          {{ item.label }}
        </button>
        <button type="button" @click="runSync('type 9 打开系统设置', openSystemSettings)">打开设置</button>
      </div>
    </section>

    <section class="panel">
      <h2>设备与系统</h2>
      <div class="grid">
        <button type="button" @click="runAsync('type 12 获取设备标识', getDeviceIdentifiers)">设备标识</button>
        <button type="button" @click="runSync('type 10 评价弹窗', requestAppStoreReview)">评价弹窗</button>
      </div>
    </section>

    <section class="panel">
      <h2>角标与震动</h2>
      <div class="inline-controls">
        <label>
          角标
          <input v-model.number="badge" type="number" min="0" max="99" />
        </label>
        <button type="button" @click="runSync('type 4 设置角标', () => setBadge(badge))">设置</button>
      </div>
      <div class="inline-controls">
        <label>
          震感
          <select v-model.number="hapticLevel">
            <option :value="0">默认</option>
            <option :value="1">轻</option>
            <option :value="2">中</option>
            <option :value="3">重</option>
          </select>
        </label>
        <label>
          次数
          <input v-model.number="hapticCount" type="number" min="1" max="5" />
        </label>
        <button type="button" @click="runSync('type 5 触觉反馈', () => triggerHaptic(hapticLevel, hapticCount))">
          触发
        </button>
      </div>
    </section>

    <section class="panel">
      <h2>内购</h2>
      <input v-model="productId" type="text" placeholder="Apple 商品 ID" />
      <input v-model="orderNum" type="text" placeholder="业务订单号" />
      <div class="grid single-row">
        <button type="button" @click="testPurchase">发起内购</button>
        <button type="button" class="dark-preview" @click="showMockApplePayPanel = true">模拟支付面板</button>
      </div>
    </section>

    <PaymentOverlay
      v-if="showMockApplePayPanel"
      apple-pay-mock
      apple-pay-mock-price="$49.99"
      :on-close="() => { showMockApplePayPanel = false }"
    />

    <section class="panel logs">
      <div class="log-header">
        <h2>回调日志</h2>
        <button type="button" class="ghost" @click="logs = []">清空</button>
      </div>
      <pre v-if="logs.length === 0">暂无日志</pre>
      <pre v-for="log in logs" :key="log.id" :class="log.level">{{ log.text }}</pre>
    </section>
  </main>
</template>

<style scoped>
.native-test-page {
  min-height: 100%;
  overflow-y: auto;
  padding: calc(16px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
  background: #111111;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #8ddfca;
  font-size: 12px;
  font-weight: 700;
}

h1,
h2 {
  margin: 0;
  letter-spacing: 0;
}

h1 {
  font-size: 24px;
  line-height: 30px;
}

h2 {
  margin-bottom: 12px;
  font-size: 16px;
  line-height: 22px;
}

.status {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.status-on {
  background: rgba(44, 207, 143, 0.16);
  color: #71e6b4;
}

.status-off {
  background: rgba(255, 190, 88, 0.16);
  color: #ffd08a;
}

.panel {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #1c1c1c;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.meta-row strong {
  min-width: 0;
  color: #ffffff;
  text-align: right;
  word-break: break-all;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.single-row {
  margin-top: 10px;
}

button,
input,
select {
  min-height: 42px;
  border-radius: 8px;
  font: inherit;
}

button {
  border: 0;
  background: #2d7ff9;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

button:active {
  transform: scale(0.98);
}

button.danger {
  background: #c64646;
}

button.dark-preview {
  background: linear-gradient(180deg, #4a414f, #2f2b34);
}

button.ghost {
  min-height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

input,
select {
  width: 100%;
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #111111;
  color: #ffffff;
  padding: 0 12px;
  box-sizing: border-box;
}

.inline-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;
  margin-top: 10px;
}

.inline-controls label {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
}

.inline-controls label + label {
  min-width: 84px;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.log-header h2 {
  margin-bottom: 0;
}

pre {
  margin: 8px 0 0;
  padding: 10px;
  overflow-x: auto;
  border-radius: 8px;
  background: #101010;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}

pre.success {
  color: #7ae1b1;
}

pre.error {
  color: #ff8d8d;
}

@media (min-width: 700px) {
  .native-test-page {
    max-width: 720px;
    margin: 0 auto;
  }

  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>

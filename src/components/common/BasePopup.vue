<script setup lang="ts">
import { Popup as VanPopup } from 'vant';

/**
 * BasePopup.vue
 * 全局统一的弹窗基础容器，封装了 Vant Popup 的样式规范
 */

const props = defineProps<{
  show: boolean;
  position?: 'bottom' | 'center' | 'top' | 'left' | 'right';
  round?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'closed'): void;
}>();
</script>

<template>
  <VanPopup
    :show="props.show"
    @update:show="emit('update:show', $event)"
    @closed="emit('closed')"
    :position="props.position || 'bottom'"
    :round="props.round !== false"
    class="base-popup-container"
    :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
  >
    <div class="popup-wrapper">
        <slot></slot>
    </div>
  </VanPopup>
</template>

<style scoped>
.base-popup-container {
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  background-color: #fff;
}

/* 当 position="center" 时，使用全圆角 */
.base-popup-container.van-popup--center {
  border-radius: 24px;
}

.popup-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    /* 适配移动端安全区域 */
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}
</style>

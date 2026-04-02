<script setup lang="ts">
import { Popup as VanPopup } from 'vant';
import { computed } from 'vue';

/**
 * BasePopup.vue
 * Global popup base container wrapping Vant Popup
 */

const props = defineProps<{
  show: boolean;
  position?: 'bottom' | 'center' | 'top' | 'left' | 'right';
  round?: boolean;
  closeOnClickOverlay?: boolean;
  customStyle?: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'closed'): void;
}>();

const popupStyle = computed(() => ({
  ...(props.customStyle || {}),
}));

const isRound = computed(() => props.round !== false);
</script>

<template>
  <VanPopup
    :show="props.show"
    @update:show="emit('update:show', $event)"
    @closed="emit('closed')"
    :position="props.position || 'bottom'"
    :round="isRound"
    :close-on-click-overlay="props.closeOnClickOverlay"
    class="base-popup-container"
    :class="{ 'no-round': !isRound }"
    :style="popupStyle"
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
}

/* When round=false, remove all border-radius for full-screen modal */
.base-popup-container.no-round {
  border-radius: 0;
}

/* When position="center", use full round corners */
.base-popup-container.van-popup--center {
  border-radius: 24px;
}

.popup-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}
</style>

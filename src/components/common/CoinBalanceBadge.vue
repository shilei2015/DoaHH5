<script setup lang="ts">
import { computed } from 'vue';
import coinIcon from '@/assets/coin_icon.png';

export interface CoinBalanceBadgeConfig {
  showAdd?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  maxWidth?: string;
}

const props = withDefaults(defineProps<{
  coins: string | number;
  config?: CoinBalanceBadgeConfig;
}>(), {
  config: () => ({}),
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const badgeConfig = computed(() => ({
  showAdd: props.config.showAdd ?? false,
  interactive: props.config.interactive ?? false,
  ariaLabel: props.config.ariaLabel ?? 'Coin balance',
  maxWidth: props.config.maxWidth ?? 'min(58vw, 180px)',
}));

const rootTag = computed(() => (badgeConfig.value.interactive ? 'button' : 'div'));

const handleClick = (event: MouseEvent) => {
  if (!badgeConfig.value.interactive) return;
  emit('click', event);
};
</script>

<template>
  <component
    :is="rootTag"
    class="coin-balance-badge"
    :class="{ 'is-interactive': badgeConfig.interactive, 'has-add': badgeConfig.showAdd }"
    :type="badgeConfig.interactive ? 'button' : undefined"
    :aria-label="badgeConfig.interactive ? badgeConfig.ariaLabel : undefined"
    :style="{ '--coin-balance-max-width': badgeConfig.maxWidth }"
    @click="handleClick"
  >
    <span class="coin-icon-wrap">
      <img :src="coinIcon" class="coin-icon" alt="" />
    </span>
    <span class="coins-total">{{ coins }}</span>
    <span v-if="badgeConfig.showAdd" class="coin-add-icon" aria-hidden="true"></span>
  </component>
</template>

<style scoped>
.coin-balance-badge {
  width: auto;
  max-width: var(--coin-balance-max-width);
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #ffde09;
  padding: 4px 9px 4px 5px;
  border-radius: 16px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.coin-balance-badge.is-interactive {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.coin-balance-badge.has-add {
  padding-right: 4px;
}

.coin-icon-wrap {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex: 0 0 22px;
}

.coin-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.coins-total {
  min-width: 0;
  max-width: 110px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Display", "Segoe UI", sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: #ffde09;
  white-space: nowrap;
}

.coin-add-icon {
  position: relative;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  border: 1.5px solid #ffde09;
  border-radius: 50%;
  box-sizing: border-box;
}

.coin-add-icon::before,
.coin-add-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8.8px;
  height: 1.8px;
  border-radius: 999px;
  background: #ffde09;
  transform: translate(-50%, -50%);
}

.coin-add-icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
}
</style>

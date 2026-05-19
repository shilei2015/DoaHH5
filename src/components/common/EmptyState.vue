<script setup lang="ts">
import { computed } from 'vue';
import emptyIcon from '@/assets/message-list-empty.svg';

type EmptyStateType = 'empty' | 'network';

const props = withDefaults(defineProps<{
    type?: EmptyStateType;
    title?: string;
    description?: string;
    actionText?: string;
    showAction?: boolean;
}>(), {
    type: 'empty'
});

const emit = defineEmits<{
    (e: 'retry'): void;
}>();

const displayTitle = computed(() => {
    if (props.title !== undefined) return props.title;
    return props.type === 'network' ? 'Oh oh！' : '';
});

const displayDescription = computed(() => {
    if (props.description !== undefined) return props.description;
    return props.type === 'network'
        ? 'Network error, please check your network connection and try again.'
        : '';
});

const displayActionText = computed(() => {
    if (props.actionText !== undefined) return props.actionText;
    return props.type === 'network' ? 'Try again' : '';
});

const shouldShowAction = computed(() => {
    const fallback = props.type === 'network';
    return (props.showAction ?? fallback) && displayActionText.value.length > 0;
});
</script>

<template>
    <div class="empty-state" :class="`empty-state--${props.type}`">
        <div v-if="props.type === 'network'" class="network-illustration" aria-hidden="true">
            <div class="network-ufo">
                <div class="network-ufo-dome"></div>
                <div class="network-ufo-body">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div class="network-beam">
                <div class="network-wifi"></div>
            </div>
        </div>

        <img v-else :src="emptyIcon" alt="" class="empty-illustration" />

        <div v-if="displayTitle || displayDescription" class="empty-copy">
            <p v-if="displayTitle" class="empty-title">{{ displayTitle }}</p>
            <p v-if="displayDescription" class="empty-description">{{ displayDescription }}</p>
        </div>

        <button v-if="shouldShowAction" class="empty-action" type="button" @click="emit('retry')">
            {{ displayActionText }}
        </button>
    </div>
</template>

<style scoped>
.empty-state {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px calc(40px + env(safe-area-inset-bottom, 0px));
    box-sizing: border-box;
    color: var(--app-text-primary, #ffffff);
    text-align: center;
}

.empty-state--empty {
    gap: 0;
}

.empty-state--network {
    justify-content: flex-start;
    padding-top: calc(214px + env(safe-area-inset-top, 0px));
}

.empty-illustration {
    width: 140px;
    height: 140px;
    object-fit: contain;
    display: block;
}

.network-illustration {
    position: relative;
    width: 200px;
    height: 200px;
    flex: 0 0 auto;
    margin-bottom: 40px;
}

.network-ufo {
    position: absolute;
    left: 50%;
    top: 22px;
    width: 178px;
    height: 92px;
    transform: translateX(-50%);
}

.network-ufo-dome {
    position: absolute;
    left: 50%;
    top: 0;
    width: 70px;
    height: 42px;
    transform: translateX(-50%);
    border-radius: 42px 42px 12px 12px;
    background: linear-gradient(180deg, #a9ff37 0%, #6ee52f 100%);
}

.network-ufo-dome::after {
    content: "";
    position: absolute;
    left: 50%;
    top: -18px;
    width: 12px;
    height: 12px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: #76ee36;
    box-shadow: 0 10px 0 -4px #76ee36;
}

.network-ufo-body {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 74px;
    border-radius: 50%;
    background: linear-gradient(180deg, #b8ff3f 0%, #82f433 100%);
    box-shadow: 0 18px 30px rgba(101, 217, 65, 0.22);
}

.network-ufo-body::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 30px;
    width: 90px;
    height: 42px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: rgba(26, 26, 26, 0.32);
    border: 1px dashed rgba(255, 255, 255, 0.25);
}

.network-ufo-body span {
    position: absolute;
    top: 30px;
    width: 18px;
    height: 9px;
    border-radius: 50%;
    background: #1a1a1a;
    transform: rotate(-20deg);
}

.network-ufo-body span:nth-child(1) {
    left: 20px;
}

.network-ufo-body span:nth-child(2) {
    left: 64px;
}

.network-ufo-body span:nth-child(3) {
    right: 20px;
    transform: rotate(20deg);
}

.network-beam {
    position: absolute;
    left: 50%;
    top: 104px;
    width: 116px;
    height: 90px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, rgba(101, 217, 65, 0.45) 0%, rgba(101, 217, 65, 0) 100%);
    clip-path: polygon(26% 0, 74% 0, 100% 100%, 0 100%);
}

.network-wifi {
    position: absolute;
    left: 50%;
    top: 22px;
    width: 42px;
    height: 42px;
    transform: translateX(-50%);
}

.network-wifi::before,
.network-wifi::after {
    content: "";
    position: absolute;
    left: 50%;
    border: 4px solid var(--app-accent, #65d941);
    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;
    border-radius: 50%;
    transform: translateX(-50%);
}

.network-wifi::before {
    top: 0;
    width: 42px;
    height: 42px;
}

.network-wifi::after {
    top: 12px;
    width: 26px;
    height: 26px;
}

.network-wifi {
    background:
        radial-gradient(circle at 50% 32px, var(--app-accent, #65d941) 0 4px, transparent 5px);
}

.empty-copy {
    width: min(272px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.empty-title {
    margin: 0;
    color: var(--app-text-primary, #ffffff);
    font-size: 17px;
    font-weight: 800;
    line-height: 22px;
}

.empty-description {
    margin: 0;
    color: var(--app-text-muted, #808080);
    font-size: 15px;
    font-weight: 510;
    line-height: 24px;
}

.empty-action {
    width: 172px;
    height: 52px;
    margin-top: 26px;
    border-radius: 26px;
    background: var(--app-accent-gradient, linear-gradient(135deg, #c7ff30 0%, #65d941 100%));
    color: var(--app-text-inverse, #1a1a1a);
    font-size: 17px;
    font-weight: 800;
    line-height: 52px;
    text-align: center;
    cursor: pointer;
}

.empty-action:active {
    transform: scale(0.98);
}
</style>

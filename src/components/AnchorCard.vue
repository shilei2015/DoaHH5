<script setup lang="ts">
import { computed } from 'vue';
import { AnchorInfoModel } from './appModels/AnchorInfoModel';
import { getFlagEmoji, getAge } from '@/utils/tools';
import MOMORTC from '@/utils/MOMORTC';

const props = defineProps<{
    anchor: AnchorInfoModel;
}>();

const statusText = computed(() => {
    switch (props.anchor.OnlineState) {
        case '1': return 'Online';
        case '2': return 'Busy';
        case '0': return 'Offline';
        default: return '';
    }
});

const statusColors = computed(() => {
    switch (props.anchor.OnlineState) {
        case '1': return { text: '#5ee413', dot: '#5ee413' };
        case '2': return { text: '#ff8000', dot: '#ff8000' };
        case '0': return { text: '#d8d8d8', dot: '#d8d8d8' };
        default: return { text: '#fff', dot: '#fff' };
    }
});

const clickCall = () => {
    MOMORTC.startAnchorCall(props.anchor.UserId)
}
</script>

<template>
    <div class="anchor-card" @click="$router.push({ path: '/anchorProfile', query: { id: anchor.UserId } })">
        <div class="avatar-wrapper">
            <img :src="anchor.HeadImage" alt="avatar" class="anchor-avatar" />
            <div class="image-gradient"></div>

            <div class="card-header">
                <div class="status-badge">
                    <div class="status-dot" :style="{ backgroundColor: statusColors.dot }"></div>
                    <span class="status-text" :style="{ color: statusColors.text }">{{ statusText }}</span>
                </div>
            </div>

            <div class="info-area">
                <img v-if="anchor.IsHotGirls === '1'" src="@/assets/discover/hot_badge.png" class="hot-badge-img"
                    alt="HOT" />
                <img v-else-if="anchor.IsNewGirls === '1'" src="@/assets/discover/new_badge.png" class="hot-badge-img"
                    alt="NEW" />
                <div class="name-age">{{ anchor.Nickname }}, {{ getAge(anchor.Birthday) }}</div>
                <div class="country-info">
                    <span class="flag">{{ getFlagEmoji(anchor.CountryCode) }}</span>
                    <span class="country-name">{{ anchor.Country }}</span>
                </div>
            </div>

            <button class="call-btn" @click.stop="clickCall">
                <img src="@/assets/discover/call_btn.svg" alt="Call" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.anchor-card {
    position: relative;
    width: 100%;
    min-width: 0;
    border-radius: 0;
    overflow: hidden;
    background-color: #242424;
    display: flex;
    flex-direction: column;
    align-self: start;
    box-shadow: none;
}

/* 用 padding 比例盒代替纯 aspect-ratio，避免部分 WebView 在 grid/flex 下高度塌成 0 */
.avatar-wrapper {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: calc(100% * 260 / 187);
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 0;
}

.anchor-avatar {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.image-gradient {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.58) 100%);
    z-index: 1;
    pointer-events: none;
}

.card-header {
    position: absolute;
    top: 8px;
    left: 8px;
    right: auto;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    z-index: 2;
}

.hot-badge-img {
    height: 22px;
    width: auto;
    object-fit: contain;
}

.tag-badge {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 11px;
    height: 22px;
    font-size: 11px;
    font-weight: 800;
    font-style: italic;
    color: white;
}

.new-tag {
    background: linear-gradient(90deg, #1ad0ff 0%, #27fece 100%);
}

.tag-icon {
    margin-right: 4px;
    font-size: 10px;
}

.status-badge {
    display: flex;
    align-items: center;
    height: 22px;
    background-color: rgba(0, 0, 0, 0.42);
    padding: 3px 6px;
    border-radius: 11px;
    gap: 4px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-text {
    font-family: "Avenir Next", "Trebuchet MS", sans-serif;
    font-size: 12px;
    font-weight: 590;
    line-height: 16px;
}

.info-area {
    position: absolute;
    left: 10px;
    right: 64px;
    bottom: 12px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
}

.name-age {
    font-family: "Avenir Next", "Trebuchet MS", sans-serif;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
    /* 截断过长文字，避免压住右侧按钮 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.country-info {
    display: flex;
    align-items: center;
    gap: 4px;
}

.flag {
    position: relative;
    top: 2px;
    font-size: 14px;
    line-height: 1;
}

.country-name {
    font-family: "Avenir Next", "Trebuchet MS", sans-serif;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

/* 根据 Figma 跨界居中悬停的按钮设计 */
.call-btn {
    position: absolute;
    right: 8px;
    bottom: 10px;
    width: 48px;
    aspect-ratio: 1 / 1;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    z-index: 10;
    transition: transform 0.2s ease;
}

.call-btn:active {
    transform: scale(0.95);
}

.call-btn img {
    width: 100%;
    height: 100%;
    display: block;
}
</style>

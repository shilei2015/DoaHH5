<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCallStore } from '@/stores/callStore';
import { AnchorInfoModel } from './appModels/AnchorInfoModel';
import { getFlagEmoji, getAge, secureUrl } from '@/utils/tools';
import MOMORTC from '@/utils/MOMORTC';

const props = defineProps<{
    anchor: AnchorInfoModel;
}>();

const router = useRouter();
const callStore = useCallStore();

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
        case '1': return { text: '#76f337', dot: '#76f337' };
        case '2': return { text: '#ffa339', dot: '#ffa339' };
        case '0': return { text: '#d8d8d8', dot: '#d8d8d8' };
        default: return { text: '#ffffff', dot: '#ffffff' };
    }
});

const clickCall = () => {
    MOMORTC.startAnchorCall(props.anchor.UserId)
}
</script>

<template>
    <div class="anchor-card" @click="$router.push({ path: '/anchorProfile', query: { id: anchor.UserId } })">
        <!-- 上半部分头像 -->
        <div class="avatar-wrapper">
            <img :src="anchor.HeadImage" alt="avatar" class="anchor-avatar" />

            <!-- 顶部标签与状态 -->
            <div class="card-header">
                <img v-if="anchor.IsHotGirls === '1'" src="@/assets/discover/hot_badge.png" class="hot-badge-img"
                    alt="HOT" />
                <img v-else-if="anchor.IsNewGirls === '1'" src="@/assets/discover/new_badge.png" class="hot-badge-img"
                    alt="NEW" />
                <div v-else class="empty-tag"></div>

                <div class="status-badge">
                    <div class="status-dot" :style="{ backgroundColor: statusColors.dot }"></div>
                    <span class="status-text" :style="{ color: statusColors.text }">{{ statusText }}</span>
                </div>
            </div>
        </div>

        <!-- 下半部分白色信息区 -->
        <div class="info-area">
            <div class="name-age">{{ anchor.Nickname }}, {{ getAge(anchor.Birthday) }}</div>
            <div class="country-info">
                <span class="flag">{{ getFlagEmoji(anchor.CountryCode) }}</span>
                <span class="country-name">{{ anchor.Country }}</span>
            </div>
        </div>

        <!-- 跨界悬浮的呼叫按钮 -->
        <button class="call-btn" @click.stop="clickCall">
            <img src="@/assets/discover/call_btn.svg" alt="Call" />
        </button>
    </div>
</template>

<style scoped>
.anchor-card {
    position: relative;
    width: 100%;
    min-width: 0;
    border-radius: 8px;
    overflow: hidden;
    background:
        linear-gradient(145deg, #1a1a1a 0%, #404040 50%, #1a1a1a 100%);
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
    padding-bottom: calc(100% * 248 / 184);
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 8px 8px 0 0;
    background:
        linear-gradient(145deg, #1a1a1a 0%, #404040 50%, #1a1a1a 100%);
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

.avatar-wrapper::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%);
    pointer-events: none;
}

.card-header {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
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
    width: 4px;
    height: 4px;
    border-radius: 50%;
}

.status-text {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    font-weight: 590;
    line-height: 16px;
}

.info-area {
    min-height: 62px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 12px;
    gap: 2px;
    background: rgba(26, 26, 26, 0.96);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.name-age {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: var(--app-text-primary, #ffffff);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    /* 截断过长文字，避免压住右侧按钮 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 75%;
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: var(--app-text-muted, #808080);
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80%;
}

/* 根据 Figma 跨界居中悬停的按钮设计 */
.call-btn {
    position: absolute;
    right: 8px;
    bottom: 32px;
    /* 完美垂直居中于交界线 */
    width: 60px;
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

<script setup lang="ts">
import { ref } from 'vue';
import HUD from '../HUD';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import { secureUrl } from '@/utils/tools';

/**
 * EvaluateCallModal.vue
 * 视频通话后的评价弹窗
 */

interface Props {
    targetAvatar: string;
    targetName: string;
    callDuration: string;
    targetUserId: string;
    liveId: string
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'confirm']);

// 评分状态，默认为 5 分（最后一个表情）
const selectedRating = ref(5);

const ratings = [
    { value: 1, icon: new URL('../../assets/call/evaluate/rate_1_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/call/evaluate/rate_1_sel.svg', import.meta.url).href },
    { value: 2, icon: new URL('../../assets/call/evaluate/rate_2_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/call/evaluate/rate_2_sel.svg', import.meta.url).href },
    { value: 3, icon: new URL('../../assets/call/evaluate/rate_3_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/call/evaluate/rate_3_sel.svg', import.meta.url).href },
    { value: 4, icon: new URL('../../assets/call/evaluate/rate_4_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/call/evaluate/rate_4_sel.svg', import.meta.url).href },
    { value: 5, icon: new URL('../../assets/call/evaluate/rate_5_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/call/evaluate/rate_5_sel.svg', import.meta.url).href },
];

const onClose = () => {
    emit('close');
};

const onSubmit = async () => {
    HUD.showLoading()
    const params = {
        UserId: props.targetUserId,
        LiveId: props.liveId,
        Score: selectedRating.value
    }
    const res = await post(API.how_user, params)
    HUD.hideLoading()
    if (res.code == "0") {
        // Success
    } else {
        HUD.showToast(res.data?.Toast)
    }
    emit('close');
};

const selectRating = (value: number) => {
    selectedRating.value = value;
};
</script>

<template>
    <div class="evaluate-modal">
        <!-- Close Button -->
        <!-- <button class="close-btn" @click="onClose">
            <img src="../../assets/call/evaluate/close.svg" alt="close" />
        </button> -->

        <!-- Content Area -->
        <div class="modal-content">
            <h3 class="title">Please evaluate this video call ?</h3>

            <!-- User Profile -->
            <div class="user-info">
                <div class="avatar-container">
                    <img :src="secureUrl(props.targetAvatar)" class="avatar" alt="avatar" />
                </div>
                <div class="user-details">
                    <p class="name">{{ props.targetName }}</p>
                    <p class="duration">{{ props.callDuration }}</p>
                </div>
            </div>

            <!-- Rating Area -->
            <div class="rating-container">
                <div class="rating-strip">
                    <div v-for="item in ratings" :key="item.value" class="rating-item"
                        :class="{ 'is-selected': selectedRating === item.value }" @click="selectRating(item.value)">
                        <img :src="item.value == selectedRating ? item.selectedIcon : item.icon" class="rating-icon" />
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <button class="submit-btn" @click="onSubmit">
                Submit
            </button>
        </div>
    </div>
</template>

<style scoped>
.evaluate-modal {
    width: 320px;
    background: #ffffff;
    border-radius: 24px;
    padding: 32px 24px 24px;
    position: relative;
    box-sizing: border-box;
}

.close-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    background: transparent;
    border: none;
    padding: 8px;
    cursor: pointer;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn img {
    width: 14px;
    height: 14px;
}

.modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.title {
    font-size: 18px;
    font-weight: 700;
    color: #000000;
    text-align: center;
    line-height: 26px;
    margin: 0 0 20px 0;
    padding: 0 10px;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.avatar-wrapper {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 12px;
}

.avatar {
    width: 62px;
    height: 62px;
    border-radius: 31px;
    object-fit: cover;
}

.user-details {
    text-align: center;
}

.name {
    font-size: 14px;
    font-weight: 500;
    color: #2b2b2b;
    margin: 0 0 4px 0;
}

.duration {
    font-size: 14px;
    color: #afb1b3;
    margin: 0;
}

.rating-container {
    width: 100%;
    background: #f5f6f7;
    border-radius: 16px;
    padding: 12px;
    margin-bottom: 32px;
    box-sizing: border-box;
}

.rating-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.rating-item {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s;
}

.rating-item:active {
    transform: scale(0.9);
}

.rating-icon {
    width: 40px;
    height: 40px;
    opacity: 0.3;
    /* Unselected state is greyed out/faint */
}

/* Selected state: fully colorful and has a highlight background if needed, 
   but according to figma it seems only one is "active" at a time with its natural color */
.rating-item.is-selected .rating-icon {
    opacity: 1;
}

/* If figma design shows some glow or background for selected one, we can add it here.
   Looking at the screenshot, the 4th icon is orange/yellow while others are muted. */

.submit-btn {
    width: 100%;
    height: 52px;
    border-radius: 26px;
    border: none;
    background: linear-gradient(155.57deg, #FED627 14.81%, #FF1AD0 85.19%);
    color: #ffffff;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
}

.submit-btn:active {
    opacity: 0.8;
}
</style>

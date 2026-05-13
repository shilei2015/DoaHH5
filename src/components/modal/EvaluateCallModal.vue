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
    { value: 1, icon: new URL('../../assets/rate_1_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/rate_1_sel.svg', import.meta.url).href },
    { value: 2, icon: new URL('../../assets/rate_2_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/rate_2_sel.svg', import.meta.url).href },
    { value: 3, icon: new URL('../../assets/rate_3_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/rate_3_sel.svg', import.meta.url).href },
    { value: 4, icon: new URL('../../assets/rate_4_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/rate_4_sel.svg', import.meta.url).href },
    { value: 5, icon: new URL('../../assets/rate_5_nor.svg', import.meta.url).href, selectedIcon: new URL('../../assets/rate_5_sel.svg', import.meta.url).href },
];

const onClose = () => {
    emit('close');
};

const onSubmit = async () => {
    HUD.showLoading()
    const params = {
        UserId: props.targetUserId,
        RelationId: props.liveId,
        Score: selectedRating.value.toString()
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
            <img src="../../assets/unused-images/close.svg" alt="close" />
        </button> -->

        <!-- Content Area -->
        <div class="modal-content">
            <h3 class="title">What do you think of her?</h3>

            <!-- User Profile -->
            <div class="user-info">
                <div class="avatar-container">
                    <img :src="props.targetAvatar" class="avatar" alt="avatar" />
                </div>
                <div class="user-details">
                    <p class="name">{{ props.targetName }}</p>
                    <p class="duration">{{ props.callDuration }}</p>
                </div>
            </div>

            <!-- Rating Area -->
            <div class="rating-container">
                <div class="rating-strip">
                    <button v-for="item in ratings" :key="item.value" class="rating-item"
                        :class="{ 'is-selected': selectedRating === item.value }" @click="selectRating(item.value)">
                        <svg viewBox="0 0 40 40" aria-hidden="true" class="rating-icon"
                            :class="{ active: item.value <= selectedRating }">
                            <path
                                d="m20 4.2 4.7 9.6 10.6 1.5-7.7 7.5 1.8 10.6-9.4-5-9.4 5 1.8-10.6-7.7-7.5 10.6-1.5L20 4.2Z"
                                fill="currentColor" />
                        </svg>
                    </button>
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
    width: 310px;
    background: #1a1a1a;
    border-radius: 24px;
    padding: 20px;
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
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    text-align: center;
    line-height: 26px;
    margin: 0 0 24px 0;
    padding: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
}

.avatar-wrapper {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 12px;
}

.avatar {
    width: 100px;
    height: 100px;
    border-radius: 50px;
    object-fit: cover;
    margin-bottom: 12px;
}

.user-details {
    text-align: center;
}

.name {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 4px 0;
}

.duration {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
}

.rating-container {
    width: 100%;
    background: transparent;
    border-radius: 0;
    padding: 0;
    margin-bottom: 28px;
    box-sizing: border-box;
}

.rating-strip {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
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
    border: none;
    background: transparent;
    padding: 0;
}

.rating-item:active {
    transform: scale(0.9);
}

.rating-icon {
    width: 40px;
    height: 40px;
    color: #292929;
}

.rating-icon.active {
    color: #ffde30;
}

.submit-btn {
    width: 100%;
    height: 52px;
    border-radius: 18px;
    border: none;
    background: linear-gradient(100deg, #c8f24e 0%, #78eb3f 100%);
    color: #1a1a1a;
    font-size: 17px;
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

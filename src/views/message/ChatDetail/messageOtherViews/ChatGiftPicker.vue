<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon as VanIcon } from 'vant';
import type { ChatGiftModel } from '@/utils/msg/ChatGiftModel';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';
import { showFullScreenAnimation } from '@/utils/tools/animationService';

/**
 * ChatGiftPicker.vue
 * 纯礼物选择业务面板，不再包含嵌套弹窗容器，专为全局 Modal 设计
 */

const props = defineProps<{
    coins: string | number;
}>();

const gifts = ref<ChatGiftModel[]>([]);

const emit = defineEmits<{
    (e: 'send', gift: ChatGiftModel): void;
    (e: 'recharge'): void;
    (e: 'close'): void; // 用于主动关闭弹窗
}>();

const selectedGiftId = ref<string | null>(null);

const selectGift = (gift: ChatGiftModel) => {
    selectedGiftId.value = gift.GiftId;
    onSendGift()
};

const onSendGift = () => {
    const gift = gifts.value.find(g => g.GiftId === selectedGiftId.value);
    if (gift) {
        emit('send', gift);
        emit('close')
    }
};

const loadGifts = async () => {
    const res = await post(API.list_gif);
    if (res.code === "0" && res.data.List) {
        gifts.value = res.data.List;
    }
}

onMounted(() => {
    loadGifts();
})

</script>

<template>
    <div class="gift-picker-container">
        <!-- Header -->
        <div class="gift-header">
            <div class="close-btn" @click="emit('close')">
                <VanIcon name="cross" size="18" />
            </div>
            <div class="title">Gift</div>
            <div class="balance-container" @click="emit('recharge')">
                <img src="@/assets/profile/diamond_icon.svg" class="diamond-icon" alt="diamond" />
                <span class="coins-total">{{ props.coins }}</span>
                <div class="add-btn">+</div>
            </div>
        </div>

        <!-- Content -->
        <div class="gift-list-scroll">
            <div class="gift-grid">
                <div v-for="gift in gifts" :key="gift.GiftId" class="gift-item"
                    :class="{ 'selected': selectedGiftId === gift.GiftId }" @click="selectGift(gift)">
                    <div class="gift-img-wrap">
                        <!-- <AnimationPlayer src="/test.zz" :loop="true" /> -->
                        <img :src="gift.Image" class="gift-img" alt="gift" />
                    </div>
                    <div class="gift-info">
                        <img src="@/assets/profile/diamond_icon.svg" class="price-icon" alt="price" />
                        <span class="gift-price">{{ gift.Coins }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.gift-picker-container {
    /* height: 60vh; */
    /* 设定相对屏幕高度 */
    display: flex;
    flex-direction: column;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.gift-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    position: relative;
}

.close-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
}

.title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
}

.balance-container {
    display: flex;
    align-items: center;
    background-color: #FFF0F5;
    padding: 4px 8px;
    padding-right: 4px;
    border-radius: 100px;
    gap: 4px;
}

.diamond-icon {
    width: 16px;
    height: 16px;
}

.coins-total {
    font-size: 14px;
    font-weight: 600;
    color: #FF5290;
    margin-right: 4px;
}

.add-btn {
    width: 20px;
    height: 20px;
    background: #FF5290;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    line-height: 1;
}

.gift-list-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 15px 12px;
}

.gift-grid {
    display: grid;
    grid-template-rows: repeat(2, 138px);
    grid-auto-flow: column;
    grid-auto-columns: 100px;
    gap: 8px;
}

.gift-item {
    height: 138px;
    width: 100px;
    background-color: #F8F8F8;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.gift-item.selected {
    background-color: #FFF0F5;
    border-color: #FF5290;
}

.gift-img-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    overflow: hidden;
}

.gift-img {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
}

.gift-info {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 2px 8px;
    border-radius: 100px;
    margin-top: 4px;
}

.gift-item.selected .gift-info {
    background-color: rgba(255, 82, 144, 0.1);
}

.price-icon {
    width: 12px;
    height: 12px;
}

.gift-price {
    font-size: 12px;
    font-weight: 600;
    color: #666;
}

.gift-item.selected .gift-price {
    color: #FF5290;
}

.gift-footer {
    padding: 16px 20px;
    box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.05);
}

.send-btn {
    width: 100%;
    height: 48px;
    background: linear-gradient(90deg, #FF76A8 0%, #FF5290 100%);
    color: white;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 82, 144, 0.3);
}

.send-btn.disabled {
    opacity: 0.5;
    background: #CCC;
    box-shadow: none;
    pointer-events: none;
}
</style>

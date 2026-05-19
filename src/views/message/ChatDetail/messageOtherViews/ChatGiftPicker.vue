<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon as VanIcon } from 'vant';
import type { ChatGiftModel } from '@/utils/msg/ChatGiftModel';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';
import CoinBalanceBadge from '@/components/common/CoinBalanceBadge.vue';
import { showFullScreenAnimation } from '@/utils/tools/animationService';
import { showCoinShop } from '@/utils/tools/shopService';
import { useUserStore } from '@/stores/userStore';

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
    (e: 'close'): void; // 用于主动关闭弹窗
}>();

const selectedGiftId = ref<string | null>(null);

const selectGift = (gift: ChatGiftModel) => {
    selectedGiftId.value = gift.GiftId;
    onSendGift()
};

const onSendGift = () => {
    const gift = gifts.value.find(g => g.GiftId === selectedGiftId.value);
    const userInfo = useUserStore().userInfo
    if (gift && userInfo) {
        if (Number(gift.Coins) <= Number(userInfo?.Coins)) {
            emit('send', gift);
            emit('close')
        } else {
            showCoinShop()
        }
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
            <CoinBalanceBadge
                :coins="props.coins"
                :config="{ showAdd: true, interactive: true, ariaLabel: 'Open coin shop' }"
                @click="showCoinShop()"
            />
            <div class="close-btn" @click="emit('close')">
                <VanIcon name="cross" size="24" />
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
                        <img src="@/assets/coin_icon.png" class="price-icon" alt="" />
                        <span class="gift-price">{{ gift.Coins }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.gift-picker-container {
    width: 100vw;
    height: min(429px, 62vh);
    display: flex;
    flex-direction: column;
    background: #1A1A1A;
    border-radius: 24px 24px 0 0;
    padding-bottom: calc(34px + env(safe-area-inset-bottom));
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.gift-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 10px;
    position: relative;
    flex-shrink: 0;
}

.close-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
}

.gift-list-scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 20px 19px 0;
}

.gift-grid {
    display: grid;
    grid-template-rows: repeat(2, 133px);
    grid-auto-flow: column;
    grid-auto-columns: 106px;
    gap: 10px 8px;
}

.gift-item {
    height: 133px;
    width: 106px;
    background-color: transparent;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.gift-item.selected {
    background-color: rgba(255, 222, 9, 0.08);
    border-color: rgba(255, 222, 9, 0.75);
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
    max-width: 80px;
    max-height: 80px;
    object-fit: contain;
}

.gift-info {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: transparent;
    padding: 0;
    border-radius: 100px;
    margin-top: 6px;
}

.gift-item.selected .gift-info {
    background-color: transparent;
}

.price-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
}

.gift-price {
    font-size: 14px;
    line-height: 17px;
    font-weight: 500;
    color: #FFDE09;
}

.gift-item.selected .gift-price {
    color: #FFDE09;
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

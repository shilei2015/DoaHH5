<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import type { UserInfoModel } from '../appModels/UserInfoModel';
import { getFlagEmoji } from '@/utils/tools';
import { Loading as VanLoading } from 'vant';
import HUD from '../HUD';

const props = defineProps<{
    targetUserId: string
}>();

const emit = defineEmits(['close', 'success']);

const loading = ref(true);
const anchorData = ref<UserInfoModel | null>(null);

const fetchAnchorInfo = async () => {
    loading.value = true;
    try {
        const res = await post(API.user_info, { UserId: props.targetUserId });
        if (res.code === "0" && res.data) {
            anchorData.value = res.data.Anchor
        }
    } catch (error) {
        console.error("Fetch anchor info failed:", error);
    } finally {
        loading.value = false;
    }
};

const handleCancel = () => {
    emit('close');
};

const handleConfirm = async () => {
    HUD.showLoading()
    const res = await post(API.user_block, {
        UserId: props.targetUserId
    })
    HUD.hideLoading()
    if (res.code == "0") {
        HUD.showToast("Success!")
        emit('success');
        emit('close');
    }
};

onMounted(() => {
    fetchAnchorInfo();
});
</script>

<template>
    <div class="block-confirm-modal">
        <div class="modal-header">
            <h2 class="title">Block</h2>
            <div class="close-icon" @click="handleCancel">×</div>
        </div>

        <p class="confirm-text">Do you want to add the current user to the blacklist ?</p>

        <!-- Loading / Data Card Container -->
        <div class="info-container">
            <div v-if="loading" class="loading-box">
                <!-- 显式使用局部注册的组件 -->
                <VanLoading color="#A8F54A" size="24px" />
            </div>

            <div v-else-if="anchorData" class="user-card">
                <img :src="anchorData.HeadImage" class="avatar" />
                <div class="info">
                    <div class="name">{{ anchorData.Nickname }}</div>
                    <div class="country-line">
                        <span v-if="anchorData.CountryCode" class="flag">{{ getFlagEmoji(anchorData.CountryCode || '') }}</span>
                        <span class="country-name">{{ anchorData.Country }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <div class="btn btn-cancel" @click="handleCancel">Cancel</div>
            <div class="btn btn-confirm" @click="handleConfirm">Yes</div>
        </div>
    </div>
</template>

<style scoped>
.block-confirm-modal {
    width: 100vw;
    background: #1A1A1A;
    border-radius: 24px 24px 0 0;
    padding: 20px 20px calc(49px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.modal-header {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    margin-bottom: 18px;
}

.title {
    font-size: 17px;
    line-height: 26px;
    font-weight: 700;
    color: #FFFFFF;
}

.close-icon {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    font-size: 32px;
    line-height: 22px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
}

.confirm-text {
    width: 100%;
    font-size: 15px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    line-height: 24px;
    margin-bottom: 20px;
    padding: 0;
}

.info-container {
    width: 100%;
    min-height: 183px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
}

.loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.user-card {
    width: 100%;
    min-height: 183px;
    background: #212121;
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin: 0 0 12px;
    background-color: #292929;
}

.name {
    font-size: 15px;
    line-height: 18px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 4px;
    text-align: center;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.info {
    width: 100%;
    overflow: hidden;
}

.country-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.flag {
    font-size: 14px;
    line-height: 17px;
}

.country-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
}

.modal-footer {
    width: 100%;
    display: flex;
    gap: 12px;
}

.btn {
    flex: 1;
    height: 52px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
}

.btn-cancel {
    background: #292929;
    color: #FFFFFF;
}

.btn-confirm {
    background: linear-gradient(90deg, #C8F24E 0%, #78EB3F 100%);
    color: #1A1A1A;
}

.btn:active {
    opacity: 0.8;
}
</style>

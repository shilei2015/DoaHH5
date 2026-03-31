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
                <VanLoading color="#FF7634" size="24px" />
            </div>

            <div v-else-if="anchorData" class="user-card">
                <img :src="anchorData.HeadImage" class="avatar" />
                <div class="info">
                    <div class="name">{{ anchorData.Nickname }}</div>
                    <div class="country-line">
                        <img v-if="anchorData.CountryCode" :src="getFlagEmoji(anchorData.CountryCode || '')"
                            class="flag" />
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
    width: 335px;
    background: #FFFFFF;
    border-radius: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.modal-header {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}

.title {
    font-size: 20px;
    font-weight: 700;
    color: #333333;
}

.close-icon {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    color: #CCCCCC;
    cursor: pointer;
}

.confirm-text {
    font-size: 16px;
    color: #999999;
    text-align: center;
    line-height: 24px;
    margin-bottom: 24px;
    padding: 0 10px;
}

.info-container {
    width: 100%;
    min-height: 108px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
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
    background: #FFFFFF;
    border: 1px solid #EEEEEE;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
}

.avatar {
    width: 74px;
    height: 74px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 16px;
    background-color: #F8F8F8;
}

.name {
    font-size: 18px;
    font-weight: 700;
    color: #333333;
    margin-bottom: 4px;
    text-align: left;
}

.info {
    flex: 1;
    overflow: hidden;
}

.country-line {
    display: flex;
    align-items: center;
    gap: 6px;
}

.flag {
    width: 20px;
    height: 14px;
    object-fit: contain;
}

.country-name {
    font-size: 14px;
    color: #999999;
}

.modal-footer {
    width: 100%;
    display: flex;
    gap: 12px;
}

.btn {
    flex: 1;
    height: 52px;
    border-radius: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
}

.btn-cancel {
    background: #F5F5F5;
    color: #333333;
}

.btn-confirm {
    background: linear-gradient(to right, #FFD034, #FF7634, #FF00CC);
    color: #FFFFFF;
    box-shadow: 0 4px 15px rgba(255, 118, 52, 0.3);
}

.btn:active {
    opacity: 0.8;
}
</style>

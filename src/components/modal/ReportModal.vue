<script setup lang="ts">
import { ref } from 'vue';
import HUD from '../HUD';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';

const props = defineProps<{
    targetUserId?: string;
}>();

const emit = defineEmits(['close', 'success']);

const content = ref('');

const handleCancel = () => {
    emit('close');
};

const handleSubmit = async () => {
    if (!content.value.trim()) return;
    HUD.showLoading()
    const res = await post(API.user_report, {
        Content: content.value.trim(),
        UserId: props.targetUserId
    })
    HUD.hideLoading()

    if (res.code == "0") {
        HUD.showToast("We've received your report and will process it within 24 hours.")
        emit('success');
        emit('close');
    }
};
</script>

<template>
    <div class="report-modal">
        <div class="modal-header">
            <h2 class="title">Report</h2>
            <div class="close-icon" @click="handleCancel">×</div>
        </div>

        <div class="input-area">
            <textarea v-model="content" class="report-textarea"
                placeholder="Please enter details of your report"></textarea>
        </div>

        <div class="modal-footer">
            <div class="btn btn-cancel" @click="handleCancel">Cancel</div>
            <div class="btn btn-submit" @click="handleSubmit">Submit</div>
        </div>
    </div>
</template>

<style scoped>
.report-modal {
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
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
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

.input-area {
    width: 100%;
    margin-bottom: 30px;
}

.report-textarea {
    width: 100%;
    height: 188px;
    background: #212121;
    border-radius: 20px;
    border: none;
    padding: 16px;
    font-size: 15px;
    line-height: 22px;
    font-weight: 500;
    color: #FFFFFF;
    resize: none;
    outline: none;
}

.report-textarea::placeholder {
    color: rgba(255, 255, 255, 0.2);
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
    transition: opacity 0.2s;
}

.btn:active {
    opacity: 0.8;
}

.btn-cancel {
    background: #292929;
    color: #FFFFFF;
}

.btn-submit {
    background: linear-gradient(90deg, #C8F24E 0%, #78EB3F 100%);
    color: #1A1A1A;
}
</style>

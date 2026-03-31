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
    margin-bottom: 24px;
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

.input-area {
    width: 100%;
    margin-bottom: 30px;
}

.report-textarea {
    width: 100%;
    height: 180px;
    background: #F8F8F8;
    border-radius: 16px;
    border: 1px solid #EEEEEE;
    padding: 16px;
    font-size: 15px;
    color: #333333;
    resize: none;
    outline: none;
}

.report-textarea::placeholder {
    color: #BBBBBB;
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
    transition: opacity 0.2s;
}

.btn:active {
    opacity: 0.8;
}

.btn-cancel {
    background: #F5F5F5;
    color: #333333;
}

.btn-submit {
    background: linear-gradient(to right, #FFD034, #FF7634, #FF00CC);
    color: #FFFFFF;
    box-shadow: 0 4px 15px rgba(255, 118, 52, 0.3);
}
</style>

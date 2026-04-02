<script setup lang="ts">
/**
 * ExitCallConfirmModal.vue
 * 退出通话确认弹窗
 */
const emit = defineEmits(['close', 'confirm']);

const onCancel = () => {
    emit('close');
};

const onConfirm = () => {
    emit('confirm');
    emit('close');
};
</script>

<template>
    <div class="exit-modal">
        <!-- Close Icon -->
        <button class="close-icon-btn" @click="onCancel">
            <img src="@/assets/profile/close_icon.svg" alt="close" />
        </button>

        <!-- Content -->
        <div class="modal-content">
            <h3 class="title">Exit the Video Call</h3>
            <p class="description">Are you sure you want to exit video call?</p>
        </div>

        <!-- Actions -->
        <div class="action-row">
            <button class="btn btn-yes font-bold" @click="onConfirm">
                Yes
            </button>
            <button class="btn btn-cancel font-bold" @click="onCancel">
                Cancel
            </button>
        </div>
    </div>
</template>

<style scoped>
.exit-modal {
    width: 320px;
    background: white;
    border-radius: 24px;
    padding: 32px 24px 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.close-icon-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-icon-btn img {
    width: 14px;
    height: 14px;
    filter: invert(0.6);
}

.modal-content {
    text-align: center;
    margin-bottom: 24px;
}

.title {
    font-size: 18px;
    font-weight: 700;
    color: #000;
    margin: 0 0 12px 0;
}

.description {
    font-size: 14px;
    color: #808080;
    line-height: 1.5;
    margin: 0;
}

.action-row {
    display: flex;
    gap: 12px;
    width: 100%;
}

.btn {
    flex: 1;
    height: 52px;
    border-radius: 26px;
    border: none;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
}

.btn:active {
    opacity: 0.8;
}

.btn-yes {
    background-color: #f2f1f4;
    color: #000;
}

.btn-cancel {
    background: linear-gradient(136.89deg, #FED627 14.81%, #FF1AD0 85.19%);
    color: white;
}

.font-bold {
    font-weight: 700;
}
</style>

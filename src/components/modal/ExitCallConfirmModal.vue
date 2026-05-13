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
            <img src="@/assets/close_icon.svg" alt="close" />
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
    width: 310px;
    background: #1a1a1a;
    border-radius: 24px;
    padding: 36px 20px 20px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.close-icon-btn {
    position: absolute;
    top: 12px;
    right: 12px;
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
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
    opacity: 0.35;
}

.modal-content {
    text-align: center;
    margin-bottom: 30px;
}

.title {
    font-size: 17px;
    line-height: 26px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 12px 0;
}

.description {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 24px;
    margin: 0;
    max-width: 230px;
}

.action-row {
    display: flex;
    gap: 12px;
    width: 100%;
}

.btn {
    flex: 1;
    height: 52px;
    border-radius: 18px;
    border: none;
    font-size: 17px;
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
    background-color: #292929;
    color: #fff;
}

.btn-cancel {
    background: linear-gradient(100deg, #c8f24e 0%, #78eb3f 100%);
    color: #1a1a1a;
}

.font-bold {
    font-weight: 700;
}
</style>

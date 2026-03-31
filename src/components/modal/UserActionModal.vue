<script setup lang="ts">
const emit = defineEmits(['close', 'blacklist', 'report']);

const handleBlacklist = () => {
    emit('blacklist');
    emit('close');
};

const handleReport = () => {
    emit('report');
    emit('close');
};

const handleCancel = () => {
    emit('close');
};
</script>

<template>
    <div class="user-action-sheet">
        <div class="action-group">
            <div class="action-item" @click="handleBlacklist">Blacklist</div>
            <div class="action-item" @click="handleReport">Report</div>
        </div>
        <div class="cancel-group">
            <div class="action-item cancel" @click="handleCancel">Cancel</div>
        </div>
    </div>
</template>

<style scoped>
.user-action-sheet {
    width: 100%;
    background-color: transparent;
    padding: 0 16px 34px; /* 底部预留安全区 */
}

.action-group, .cancel-group {
    background-color: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
}

.action-group {
    margin-bottom: 8px;
}

.action-item {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    background-color: #FFFFFF;
    border-bottom: 1px solid #F5F5F5;
}

.action-item:last-child {
    border-bottom: none;
}

.action-item:active {
    background-color: #F9F9F9;
}

.action-item.cancel {
    color: #999999;
}
</style>

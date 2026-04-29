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
    background-color: #1A1A1A;
    border-radius: 24px 24px 0 0;
    padding: 20px 20px calc(49px + env(safe-area-inset-bottom));
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif;
}

.action-group,
.cancel-group {
    background-color: transparent;
    border-radius: 20px;
    overflow: hidden;
}

.action-group {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.action-item {
    height: 59px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    line-height: 20px;
    font-weight: 600;
    color: #FFFFFF;
    background-color: #212121;
    border-radius: 20px;
}

.action-item:last-child {
    border-bottom: none;
}

.action-item:active {
    background-color: #292929;
}

.action-item.cancel {
    color: #FFFFFF;
}
</style>

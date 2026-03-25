<script setup lang="ts">
import type { LHMessage } from '@/utils/msg/MessageModel';
import { formatTimestamp } from '@/utils/tools';

const props = defineProps<{
    timestamp: number;
}>();
</script>

<template>
    <div class="timeView">
        <span class="timeLabel">
            {{ formatTimestamp(timestamp * 1000, 'YYYY-MM-DD HH:mm') }}
        </span>
    </div>
</template>

<style scoped>
.timeView {
    display: flex;
    justify-content: center;
    padding: 0px 20px 20px 20px;
    width: 100%;
}

.timeLabel {
    color: #999;
    font-size: 11px;
    padding: 2px 10px;
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>
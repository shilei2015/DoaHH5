<script setup lang="ts">
import { getChatRecordManager } from '@/utils/msg/ChatRecordManager'
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { LHMsgChat } from '@/utils/msg/ChatModel'
import { formatTimestamp } from '@/utils/tools'
import { NET_CONFIG } from '@/utils/net/config'

const router = useRouter()
const chatManager = getChatRecordManager()

const onClearAll = async () => {
    // 这里的 Clear All 通常建议是“全部标记为已读”
    await chatManager.resetAllUnread()
}

const onDelete = async (chat: LHMsgChat) => {
    await chatManager.removeRecord(chat, true)
}

const onClickChat = async (chat: LHMsgChat) => {
    console.log('onClickChat', chat)
    // 进入聊天前清除未读
    await chatManager.resetUnread(chat.chatId)
    // 跳转详情且传递必要的参数
    router.push({
        name: "messageDetail",
        query: {
            userId: chat.userId
        }
    })
}

const chatList = computed(() => {
    return [...chatManager.chatList.value].sort((a, b) => {
        const isASys = a.userId === NET_CONFIG.ID
        const isBSys = b.userId === NET_CONFIG.ID
        if (isASys && !isBSys) return -1
        if (!isASys && isBSys) return 1
        return 0
    })
})

onMounted(async () => {
    await chatManager.initialize();
})

</script>

<template>
    <div class="message-page">
        <!-- Header区 -->
        <header class="header">
            <h1 class="title">Messages</h1>
            <button class="clear-btn" @click="onClearAll">
                <img src="@/assets/message/msg-list-clear-unread.svg" alt="">
                <span class="clear-text">Clear All</span>
            </button>
        </header>

        <!-- 列表区 -->
        <main class="list-wrapper">
            <van-swipe-cell v-for="chat in chatList" :key="chat.chatId" class="message-item-wrapper">
                <div class="message-item" @click="onClickChat(chat)">
                    <!-- 头像区 -->
                    <div class="avatar-area">
                        <img class="avatar" :src="chat.user?.HeadImage" />
                        <!-- <div v-if="chat.user?.OnlineState" class="status-dot online"></div> -->
                    </div>

                    <!-- 内容区 -->
                    <div class="content-area">
                        <div class="content-top">
                            <span class="user-name">{{ chat.user?.Nickname || 'User' }}</span>
                            <span class="time-text">{{ formatTimestamp(chat.lastTime * 1000, 'MM.DD HH:mm') }}</span>
                        </div>
                        <div class="content-bottom">
                            <p class="msg-preview">{{ chat.lastText }}</p>
                            <div v-if="chat.unreadCount > 0" class="unread-badge"
                                :class="{ 'badge-more': chat.unreadCount >= 99 }">
                                {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右滑显示的删除按钮选项 -->
                <template #right>
                    <div class="delete-btn-wrapper">
                        <button class="delete-btn" @click="onDelete(chat)">
                            <van-icon name="delete-o" size="24" color="#fff" />
                        </button>
                    </div>
                </template>
            </van-swipe-cell>
            <!-- 底部预留 Tabbar 空间 -->
            <div class="bottom-placeholder"></div>
        </main>
    </div>
</template>

<style scoped>
.message-page {
    background-color: #f2f1f4;
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    font-family: 'SF Pro', 'Helvetica Neue', Arial, sans-serif;
    position: relative;
    /* Top gradient from the Figma design background */
    background: linear-gradient(180deg, #ffe0ec 0%, #f2f1f4 20%, #f2f1f4 100%);
    overflow: hidden;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: calc(20px + env(safe-area-inset-top)) 20px 20px;
    /* Offset for mobile status bar */
}

.title {
    font-size: 26px;
    font-weight: 800;
    font-style: italic;
    font-family: 'Alibaba Sans', 'SF Pro', sans-serif;
    margin: 0;
    color: #000;
}

.clear-btn {
    background: rgba(255, 255, 255, 0.6);
    border: none;
    border-radius: 16px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.clear-text {
    font-size: 14px;
    font-weight: 510;
    color: #000;
}

.icon-clear {
    display: block;
}

/* White rounded container for the list */
.list-wrapper {
    flex: 1;
    background-color: #ffffff;
    border-radius: 24px 24px 0 0;
    overflow-y: auto;
    padding-top: 15px;
}

.message-item-wrapper {
    width: 100%;
}

.message-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background-color: #ffffff;
}

.avatar-area {
    position: relative;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    margin-right: 12px;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background-color: #e5e5e5;
}

.status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #ffffff;
}

.online {
    background-color: #34d728;
}

.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
    /* Figma subtle divider */
    padding-bottom: 12px;
}

.message-item-wrapper:last-child .content-area {
    border-bottom: none;
}

.content-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
}

.time-text {
    font-size: 12px;
    color: #b3b3b3;
    font-weight: 510;
}

.content-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.msg-preview {
    margin: 0;
    font-size: 14px;
    color: #808080;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    flex: 1;
}

.unread-badge {
    background-color: #ff4d4f;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.badge-more {
    padding: 0 6px;
}

/* Delete button interaction styling for Vant swipe-to-delete */
.delete-btn-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 12px;
    padding-right: 20px;
}

.delete-btn {
    width: 52px;
    height: 52px;
    background-color: #ff4d4f;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-shadow: 0 4px 10px rgba(255, 77, 79, 0.2);
}

.bottom-placeholder {
    height: 100px;
    width: 100%;
}
</style>
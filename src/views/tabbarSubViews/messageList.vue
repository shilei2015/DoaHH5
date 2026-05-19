<script setup lang="ts">
import { getChatRecordManager } from '@/utils/msg/ChatRecordManager'
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { LHMsgChat } from '@/utils/msg/ChatModel'
import { formatTimestamp } from '@/utils/tools'
import { NET_CONFIG } from '@/utils/net/config'
import { useUserStore } from '@/stores/userStore'
import * as DB from '@/utils/msg/DBService'
import maleAvatar from '@/assets/maleAvatar.png'
import femaleAvatar from '@/assets/femaleAvatar.png'
import sessionEmptyIcon from '@/assets/message-list-empty.svg'

const router = useRouter()
const chatManager = getChatRecordManager()
const userStore = useUserStore()

const getChatAvatarSrc = (chat: LHMsgChat) => chat.user?.HeadImage?.trim() || ''

const handleAvatarError = (event: Event, chat: LHMsgChat) => {
    const img = event.target as HTMLImageElement | null
    if (!img) return

    const fallbackSrc = chat.user?.Gender === '1' ? maleAvatar : femaleAvatar
    if (!fallbackSrc || img.src === fallbackSrc) return

    img.src = fallbackSrc
}

const hydrateMissingChatUsers = async () => {
    const chats = [...chatManager.chatList.value]
    let hasUpdates = false

    for (const chat of chats) {
        const alreadyHasAvatar = Boolean(chat.user?.HeadImage?.trim())
        if (alreadyHasAvatar || !chat.userId || chat.userId === NET_CONFIG.ID) {
            continue
        }

        const user = await userStore.getUserInfoById(chat.userId)
        if (!user) continue

        chat.user = user as any
        await DB.insertUser(user as any)
        await DB.upsertChatRecord(chat)
        hasUpdates = true
    }

    if (hasUpdates) {
        await chatManager.chatRecordChange()
    }
}

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
    await hydrateMissingChatUsers();
})

</script>

<template>
    <div class="message-page">
        <!-- Header区 -->
        <header class="header">
            <h1 class="title">Messages</h1>
            <button class="clear-btn" @click="onClearAll">
                <img src="@/assets/msg-list-clear-unread.svg" alt="">
                <span class="clear-text">Clear All</span>
            </button>
        </header>

        <!-- 列表区 -->
        <main class="list-wrapper">
            <template v-if="chatList.length">
                <div class="chat-list">
                    <van-swipe-cell v-for="chat in chatList" :key="chat.chatId" class="message-item-wrapper">
                        <div class="message-item" @click="onClickChat(chat)">
                            <!-- 头像区 -->
                            <div class="avatar-area">
                                <img class="avatar" :src="getChatAvatarSrc(chat)" @error="handleAvatarError($event, chat)" />
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
                </div>
            </template>

            <div v-else class="empty-view">
                <img :src="sessionEmptyIcon" alt="" class="empty-illustration" />
            </div>
        </main>
    </div>
</template>

<style scoped>
.message-page {
    background-color: #1a1a1a;
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    font-family: "Avenir Next", "Trebuchet MS", sans-serif;
    position: relative;
    background: #1a1a1a;
    overflow: hidden;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 56px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 20px 12px;
    flex-shrink: 0;
}

.title {
    font-size: 28px;
    font-weight: 900;
    font-family: Georgia, "Times New Roman", serif;
    margin: 0;
    color: #fff;
    line-height: 32px;
}

.clear-btn {
    background: #292929;
    border: none;
    border-radius: 18px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.clear-text {
    font-size: 14px;
    font-weight: 510;
    color: rgba(255, 255, 255, 0.6);
}

.clear-btn img {
    opacity: 0.6;
    filter: brightness(0) invert(1);
}

.icon-clear {
    display: block;
}

/* White rounded container for the list */
.list-wrapper {
    flex: 1;
    background-color: #1a1a1a;
    border-radius: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    -webkit-overflow-scrolling: touch;
}

.chat-list {
    width: 100%;
    padding-bottom: var(--app-tabbar-content-offset, 88px);
}

.message-item-wrapper {
    width: 100%;
}

.message-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background-color: #1a1a1a;
}

.avatar-area {
    position: relative;
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    margin-right: 12px;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: #303030;
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
    border-bottom: none;
    padding-bottom: 0;
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
    color: #fff;
}

.time-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
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
    color: rgba(255, 255, 255, 0.6);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    flex: 1;
}

.unread-badge {
    background-color: #ff3c4b;
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
    padding-left: 18px;
    padding-right: 20px;
    background: #1a1a1a;
}

.delete-btn {
    width: 78px;
    height: 78px;
    background-color: #ff3c4b;
    border-radius: 20px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-shadow: none;
}

.empty-view {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 24px var(--app-tabbar-content-offset, 88px);
    box-sizing: border-box;
}

.empty-illustration {
    width: 140px;
    height: 140px;
    object-fit: contain;
    display: block;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

interface Message {
    id: number
    name: string
    avatar: string
    time: string
    previewText: string
    unread: number
    isOnline: boolean
    isSystem?: boolean
}

const mockList = ref<Message[]>([
    {
        id: 1,
        name: 'AppName',
        avatar: 'http://localhost:3845/assets/dfddb16dc2affcf02c60df18ea4949cf1f2ec921.png',
        time: '16:23',
        previewText: 'This is a system message',
        unread: 2,
        isOnline: false,
        isSystem: true
    },
    {
        id: 2,
        name: 'jimmy',
        avatar: 'http://localhost:3845/assets/52e50bd1f0a6f8e12efbd541e6bf735bbaf1a585.png',
        time: '01.12 16:23',
        previewText: 'Hello. Nice to meet you Hello. Nic...',
        unread: 99,
        isOnline: true
    },
    {
        id: 3,
        name: 'jimmy',
        avatar: 'http://localhost:3845/assets/abc06e1c08a727603cd5aae8a8ccaea0bc345181.png',
        time: '01.12 16:23',
        previewText: 'Hello. Nice to meet you Hello. Nic...',
        unread: 9,
        isOnline: false
    },
    {
        id: 4,
        name: 'jimmy',
        avatar: 'http://localhost:3845/assets/3366119f805883418aefe774a7f19dd880d2b8b0.png',
        time: '01.12 16:23',
        previewText: 'Hello. Nice to meet you Hello. Nice to ...',
        unread: 0,
        isOnline: true
    },
    {
        id: 5,
        name: 'jimmy',
        avatar: 'http://localhost:3845/assets/3618bab534e88de8645d5d6aef74e2048725df77.png',
        time: '01.12 16:23',
        previewText: 'Hello. Nice to meet you Hello. Nice to ...',
        unread: 0,
        isOnline: false
    }
])

const router = useRouter()

const onClearAll = () => {
    mockList.value = []
}

const onDelete = (id: number) => {
    mockList.value = mockList.value.filter(item => item.id !== id)
}

const onClickChat = (msg: Message) => {
    console.log('onClickChat', msg)
    router.push({ name: "messageDetail" })
}
</script>

<template>
    <div class="message-page">
        <!-- Header区 -->
        <header class="header">
            <h1 class="title">Messages</h1>
            <button class="clear-btn" @click="onClearAll">
                <svg class="icon-clear" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 16H17V20C17 21.1046 16.1046 22 15 22H9C7.89543 22 7 21.1046 7 20V16Z" fill="#000" />
                    <path d="M12 2V16" stroke="#000" stroke-width="2" stroke-linecap="round" />
                    <path d="M8 8V12" stroke="#000" stroke-width="2" stroke-linecap="round" />
                    <path d="M16 8V12" stroke="#000" stroke-width="2" stroke-linecap="round" />
                    <path d="M4 14H20" stroke="#000" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span class="clear-text">Clear All</span>
            </button>
        </header>

        <!-- 列表区 -->
        <main class="list-wrapper">
            <van-swipe-cell v-for="msg in mockList" :key="msg.id" class="message-item-wrapper">
                <div class="message-item" @click="onClickChat(msg)">
                    <!-- 头像区 -->
                    <div class="avatar-area">
                        <img class="avatar" :src="msg.avatar" alt="avatar" />
                        <div v-if="msg.isOnline" class="status-dot online"></div>
                        <!-- 如果还需要其他状态圆点，可借助 css class 动态渲染 -->
                    </div>

                    <!-- 内容区 -->
                    <div class="content-area">
                        <div class="content-top">
                            <span class="user-name">{{ msg.name }}</span>
                            <span class="time-text">{{ msg.time }}</span>
                        </div>
                        <div class="content-bottom">
                            <p class="msg-preview">{{ msg.previewText }}</p>
                            <div v-if="msg.unread > 0" class="unread-badge" :class="{ 'badge-more': msg.unread >= 99 }">
                                {{ msg.unread > 99 ? '99+' : msg.unread }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右滑显示的删除按钮选项 -->
                <template #right>
                    <div class="delete-btn-wrapper">
                        <button class="delete-btn" @click="onDelete(msg.id)">
                            <van-icon name="delete-o" size="24" color="#fff" />
                        </button>
                    </div>
                </template>
            </van-swipe-cell>
        </main>
    </div>
</template>

<style scoped>
.message-page {
    background-color: #f2f1f4;
    min-height: 100vh;
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
    padding: 56px 20px 20px;
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
    padding-bottom: 90px;
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
</style>
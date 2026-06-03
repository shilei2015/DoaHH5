import { ref, type Ref } from 'vue';
import type { LHMessage, LHMessageUser } from './MessageModel';
import {
    MessageType,
    MessageSendStatus,
    createTextMessage,
    createImageMessage,
    createGifMessage,
    createTimeTagMessage,
    createUUID,
    generateSessionId,
    chatRecordLastText,
} from './MessageModel';
import type { LHMsgChat } from './ChatModel';
import * as DB from './DBService';
import { getChatRecordManager } from './ChatRecordManager';
import { post } from '@/utils/net/request';
import { API } from '@/utils/net/api';
import { ossUploadService } from '@/utils/net/OSSUploadService';
import { useUserStore } from '@/stores/userStore';

type MessageEventType =
    | 'willSave'
    | 'received'
    | 'sendSuccess'
    | 'sendFail'
    | 'loadRecord';

type MessageEventCallback = (message: LHMessage, extra?: unknown) => void;

// 3 minutes in seconds — time gap threshold for inserting time tags
const TIME_TAG_INTERVAL = 3 * 60;

/**
 * MessageManager composable — manages message CRUD, send/receive, and event dispatch.
 * Mirrors Swift MessageManager + MessageDelegate pattern using Vue reactivity.
 */
export function useMessageManager() {
    const listeners = new Map<string, Map<MessageEventType, Set<MessageEventCallback>>>();

    // --- Event System (replaces Swift delegate pattern) ---

    function on(sessionId: string, event: MessageEventType, callback: MessageEventCallback): void {
        if (!listeners.has(sessionId)) {
            listeners.set(sessionId, new Map());
        }
        const sessionListeners = listeners.get(sessionId)!;
        if (!sessionListeners.has(event)) {
            sessionListeners.set(event, new Set());
        }
        sessionListeners.get(event)!.add(callback);
    }

    function off(sessionId: string, event: MessageEventType, callback: MessageEventCallback): void {
        listeners.get(sessionId)?.get(event)?.delete(callback);
    }

    function emit(sessionId: string, event: MessageEventType, message: LHMessage, extra?: unknown): void {
        console.log(`[MessageManager] emit event: ${event} for session: ${sessionId}`, message.messageId);
        const sessionListeners = listeners.get(sessionId);
        if (!sessionListeners) {
            console.log(`[MessageManager] No listeners for session: ${sessionId}`);
        }
        sessionListeners?.get(event)?.forEach((cb) => {
            console.log(`[MessageManager] Found callback for ${event}`);
            cb(message, extra);
        });
    }

    function removeAllListeners(sessionId: string): void {
        listeners.delete(sessionId);
    }

    // --- Message Creation (wrappers around factory methods) ---

    function newTextMessage(
        text: string,
        toUid: string,
        fromUid: string,
        fromUser?: LHMessageUser,
        toUser?: LHMessageUser,
        chatType: string = '1'
    ): LHMessage {
        const msg = createTextMessage(text, toUid, fromUid, fromUser, toUser);
        msg.chatType = chatType;
        return msg;
    }

    function newImageMessage(
        imageUrl: string,
        toUid: string,
        fromUid: string,
        fromUser?: LHMessageUser,
        toUser?: LHMessageUser,
        localBlob?: Blob,
        extension?: string,
        chatType: string = '1'
    ): LHMessage {
        const msg = createImageMessage(imageUrl, toUid, fromUid, fromUser, toUser);
        msg.localBlob = localBlob;
        msg.localExtension = extension;
        msg.chatType = chatType;
        return msg;
    }

    function newGifMessage(
        gifId: string,
        gifUrl: string,
        toUid: string,
        fromUid: string,
        fromUser?: LHMessageUser,
        toUser?: LHMessageUser,
        chatType: string = '1'
    ): LHMessage {
        const msg = createGifMessage(gifId, gifUrl, toUid, fromUid, fromUser, toUser);
        msg.chatType = chatType;
        return msg;
    }

    // --- Message Storage & Dispatch ---

    /**
     * Store a message locally and emit events to UI.
     * Mirrors Swift messagePlant().
     */
    async function messagePlant(message: LHMessage, saveChatRecord = true): Promise<void> {
        if (!message.messageId) {
            message.messageId = createUUID();
        }

        // --- 业务分流：通话中互动的消息 (ChatType="2") 不存入数据库，不影响列表 ---
        if (message.chatType === '2') {
            message.saveLocal = false;
        }

        emit(message.sessionID, 'willSave', message);

        if (message.saveLocal) {
            await DB.insertMessage(message);

            if (saveChatRecord) {
                await updateChatRecordFromMessage(message);
            }
        }

        emit(message.sessionID, 'received', message);
    }

    /**
     * Mark a message as send success, update DB and notify UI.
     */
    async function markSendSuccess(message: LHMessage): Promise<void> {
        message.sendStatus = MessageSendStatus.Success;
        if (message.saveLocal) {
            await DB.updateMessage(message);
        }
        emit(message.sessionID, 'sendSuccess', message);
    }

    /**
     * Mark a message as send failed, update DB and notify UI.
     */
    async function markSendFailed(message: LHMessage, code?: number, toast?: string): Promise<void> {
        message.sendStatus = MessageSendStatus.Failed;
        if (message.saveLocal) {
            await DB.updateMessage(message);
        }
        emit(message.sessionID, 'sendFail', message, { code, toast });
    }

    // --- Message Sending Queue ---
    const sendQueue: { message: LHMessage; chatType: string }[] = [];
    let isProcessing = false;

    async function processQueue() {
        if (isProcessing || sendQueue.length === 0) return;
        isProcessing = true;

        while (sendQueue.length > 0) {
            const { message, chatType } = sendQueue.shift()!;
            try {
                await executeSendMessage(message, chatType);
            } catch (error) {
                console.error("[MessageManager] Queue processing error:", error);
            }
            // Wait 0.2s after each completion
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        isProcessing = false;
    }

    /**
     * Internal actual send logic (moved from previous sendMessage).
     */
    async function executeSendMessage(message: LHMessage, chatType: string): Promise<any> {
        // 同步消息类型，用于后续 UI 逻辑判断是否本地持久化
        message.chatType = chatType;

        // --- 1. Handle Upload if needed ---
        // 仅当尚无远端 URL 时才走 OSS（用 trim 避免空字符串被当成「已有 URL」的边界问题）
        const hasRemoteImageUrl = Boolean(message.imageObj?.urlString?.trim());
        if (message.msgType === MessageType.Image && message.localBlob && !hasRemoteImageUrl) {
            try {
                const url = await ossUploadService.uploadImage(message.localBlob, message.localExtension || 'jpg');
                if (message.imageObj) {
                    message.imageObj.urlString = url;
                } else {
                    message.imageObj = { urlString: url };
                }
                message.localBlob = undefined;
                await DB.updateMessage(message);
            } catch (error) {
                await markSendFailed(message, -110, "Upload Failed");
                throw error;
            }
        }

        // --- 2. Prepare Parameters ---
        const params: any = {
            ChatType: chatType,
            UserId: message.toUid,
            MsgType: message.msgType.toString(),
        };

        switch (message.msgType) {
            case MessageType.Text:
                params.Message = message.textMessage || '';
                break;
            case MessageType.Image:
                params.Message = message.imageObj?.urlString || '';
                break;
            case MessageType.Animation:
                params.Message = 'gift';
                params.RelationId = message.RelationId || '';
                break;
            default:
                params.Message = '';
                break;
        }

        // --- 3. Execute POST Request ---
        try {
            const res = await post(API.send_message, params);
            if (res && res.code == "0") {
                await markSendSuccess(message);
                const coins = res.data?.Coins;
                if (coins !== undefined && coins !== null) {
                    const userStore = useUserStore();
                    if (userStore.userInfo) {
                        userStore.userInfo.Coins = String(coins);
                    }
                }
            } else {
                await markSendFailed(message, res?.code ? Number(res.code) : -1, res.data?.toast);
            }
            return res;
        } catch (error) {
            await markSendFailed(message, -1, "Net error");
            throw error;
        }
    }

    /**
     * Public sendMessage API — adds to queue.
     */
    async function sendMessage(message: LHMessage, chatType: string = '1'): Promise<void> {
        sendQueue.push({ message, chatType });
        processQueue(); // Don't await, let it run in background
    }

    /**
     * Update a message in DB.
     */
    async function updateMessage(message: LHMessage): Promise<void> {
        await DB.updateMessage(message);
    }

    // --- Chat Record Helpers ---

    async function updateChatRecordFromMessage(message: LHMessage): Promise<void> {
        // 如果是通话视频消息，不进入聊天列表，不更新未读，不持久化会话最后一条记录
        if (message.chatType === '2') return;

        const existingRecord = await DB.getChatRecordById(message.sessionID);
        const isMySend = message.fromUid === getCurrentUserId();

        const record: LHMsgChat = existingRecord ?? {
            chatId: message.sessionID,
            userId: isMySend ? message.toUid! : message.fromUid!,
            lastText: '',
            unreadCount: 0,
            lastTime: 0,
        };

        record.lastText = chatRecordLastText(message);
        record.lastTime = message.serverReceivedTs;
        record.unreadCount = await DB.getUnreadCount(message.sessionID);

        // Attach user info
        const chatUserId = isMySend ? message.toUid! : message.fromUid!;
        const chatUser = isMySend ? message.toUser : message.fromUser;
        record.userId = chatUserId;

        if (chatUser) {
            record.user = chatUser;
        } else {
            const cachedUser = await DB.getUser(chatUserId);
            if (cachedUser) {
                record.user = cachedUser;
            }
        }

        await DB.upsertChatRecord(record);
        // Notify ChatRecordManager to refresh its reactive list
        getChatRecordManager().chatRecordChange();
    }

    // --- Message Loading ---

    /**
     * Load messages for a session with pagination.
     * Mirrors Swift loadMessagesRecord.
     */
    async function loadMessages(
        sessionId: string,
        lastTs?: number,
        limit?: number
    ): Promise<LHMessage[]> {
        const messages = await DB.getMessageList(sessionId, lastTs, limit);
        return messages;
    }

    // --- Incoming Message Processing ---

    /**
     * Process an incoming RTM chat message.
     * Mirrors Swift processChatMessage.
     */
    async function processIncomingMessage(message: LHMessage): Promise<void> {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || !message.fromUid) {
            console.warn('[MessageManager] Incoming message ignored: missing current user or sender.', message);
            return;
        }
        if (!message.toUid && message.fromUid !== currentUserId) {
            message.toUid = currentUserId;
        }
        if (message.fromUid !== currentUserId && message.toUid !== currentUserId) {
            console.warn('[MessageManager] Incoming message ignored: current user is not sender or receiver.', message);
            return;
        }
        if (message.fromUid === currentUserId && (!message.toUid || message.toUid === currentUserId)) {
            console.warn('[MessageManager] Incoming message ignored: invalid receiver.', message);
            return;
        }

        message.saveLocal = true;
        message.sessionID = generateSessionId(message.toUid || '', message.fromUid || '');
        console.log("create message sessionId success:", message.sessionID);

        await messagePlant(message);
    }


    // --- Utility ---

    /** Must be set before using the manager */
    let _currentUserId = '';

    function setCurrentUserId(userId: string): void {
        _currentUserId = userId;
    }

    function getCurrentUserId(): string {
        return _currentUserId;
    }

    return {
        // Event system
        on,
        off,
        emit,
        removeAllListeners,

        // Message creation
        newTextMessage,
        newImageMessage,
        newGifMessage,

        // Message storage & dispatch
        messagePlant,
        sendMessage,
        markSendSuccess,
        markSendFailed,
        updateMessage,

        // Message loading
        loadMessages,

        // Incoming message processing
        processIncomingMessage,


        // User ID
        setCurrentUserId,
        getCurrentUserId,
    };
}

// Singleton instance
let _instance: ReturnType<typeof useMessageManager> | null = null;

export function getMessageManager(): ReturnType<typeof useMessageManager> {
    if (!_instance) {
        _instance = useMessageManager();
    }
    return _instance;
}

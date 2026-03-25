import { ref, type Ref } from 'vue';
import type { LHMsgChat } from './ChatModel';
import type { ChatTaskRecord } from './ChatModel';
import * as DB from './DBService';

type ChatRecordChangeCallback = (list: LHMsgChat[]) => void;
type ChatRecordDeleteCallback = (record: LHMsgChat) => void;
type UnreadCountChangeCallback = (count: number) => void;

/**
 * ChatRecordManager composable — manages chat list, unread count, and chat tasks.
 * Mirrors Swift ChatManager.
 */
export function useChatRecordManager() {
    const chatList: Ref<LHMsgChat[]> = ref([]);
    const totalUnread: Ref<number> = ref(0);

    const onChangeCallbacks = new Set<ChatRecordChangeCallback>();
    const onDeleteCallbacks = new Set<ChatRecordDeleteCallback>();
    const onUnreadCallbacks = new Set<UnreadCountChangeCallback>();

    // --- Event Registration ---

    function onChatRecordChange(callback: ChatRecordChangeCallback): () => void {
        onChangeCallbacks.add(callback);
        return () => onChangeCallbacks.delete(callback);
    }

    function onChatRecordDelete(callback: ChatRecordDeleteCallback): () => void {
        onDeleteCallbacks.add(callback);
        return () => onDeleteCallbacks.delete(callback);
    }

    function onUnreadCountChange(callback: UnreadCountChangeCallback): () => void {
        onUnreadCallbacks.add(callback);
        // Emit current value immediately
        callback(totalUnread.value);
        return () => onUnreadCallbacks.delete(callback);
    }

    // --- Chat Record Management ---

    /**
     * Refresh chat list and unread count from DB, notify listeners.
     * Mirrors Swift chatRecordChange().
     */
    async function chatRecordChange(): Promise<void> {
        const records = await DB.getChatRecordList();
        chatList.value = records;

        const unread = await DB.getUnreadCount();
        totalUnread.value = unread;

        onChangeCallbacks.forEach((cb) => cb(records));
        onUnreadCallbacks.forEach((cb) => cb(unread));
    }

    /**
     * Remove a chat record, optionally deleting all messages.
     * Mirrors Swift removeChatRecord().
     */
    async function removeRecord(record: LHMsgChat, deleteMessages = true): Promise<boolean> {
        const deleted = await DB.deleteChatRecord(record.chatId, deleteMessages);
        if (deleted) {
            onDeleteCallbacks.forEach((cb) => cb(record));
            await chatRecordChange();
        }
        return deleted;
    }

    /**
     * Update or insert a chat record.
     */
    async function updateRecord(record: LHMsgChat): Promise<void> {
        await DB.upsertChatRecord(record);
        await chatRecordChange();
    }

    /**
     * Get a single chat record by sessionId.
     */
    async function getRecord(sessionId: string): Promise<LHMsgChat | undefined> {
        return await DB.getChatRecordById(sessionId);
    }

    // --- Unread Management ---

    /**
     * Clear unread count for a specific session.
     * Mirrors Swift resetUnreadStatus(record:).
     */
    async function resetUnread(sessionId: string): Promise<void> {
        const success = await DB.clearUnread(sessionId);
        if (success) {
            await chatRecordChange();
        }
    }

    /**
     * Clear all unread counts.
     * Mirrors Swift resetAllUnreadStatus().
     */
    async function resetAllUnread(): Promise<void> {
        const success = await DB.clearAllUnread();
        if (success) {
            await chatRecordChange();
        }
    }

    // --- Chat Task Management ---

    /**
     * Get chat task for a session. Creates default if not exists.
     */
    async function getChatTask(sessionId: string): Promise<ChatTaskRecord> {
        return await DB.getChatTask(sessionId);
    }

    /**
     * Update a chat task record.
     */
    async function updateChatTask(task: ChatTaskRecord): Promise<void> {
        await DB.upsertChatTask(task);
    }

    // --- Initialization ---

    /**
     * Load initial data after DB is ready.
     */
    async function initialize(): Promise<void> {
        await chatRecordChange();
    }

    return {
        // Reactive state
        chatList,
        totalUnread,

        // Event registration
        onChatRecordChange,
        onChatRecordDelete,
        onUnreadCountChange,

        // Chat record management
        chatRecordChange,
        removeRecord,
        updateRecord,
        getRecord,

        // Unread management
        resetUnread,
        resetAllUnread,

        // Chat task management
        getChatTask,
        updateChatTask,

        // Initialization
        initialize,
    };
}

// Singleton instance
let _instance: ReturnType<typeof useChatRecordManager> | null = null;

export function getChatRecordManager(): ReturnType<typeof useChatRecordManager> {
    if (!_instance) {
        _instance = useChatRecordManager();
    }
    return _instance;
}

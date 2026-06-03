import Dexie, { type Table } from 'dexie';
import type { LHMessage, LHMessageUser } from './MessageModel';
import { MessageSendStatus, generateSessionId } from './MessageModel';
import type { LHMsgChat, ChatTaskRecord } from './ChatModel';

const DEFAULT_MSG_LIMIT = 50;

class MOMODatabase extends Dexie {
    msgTable!: Table<LHMessage, string>;
    userTable!: Table<LHMessageUser, string>;
    recordTable!: Table<LHMsgChat, string>;
    recordTaskTable!: Table<ChatTaskRecord, string>;

    constructor(userId: string) {
        super(`MOMODB_${userId}`);

        this.version(1).stores({
            // messageId = PK; compound index on [sessionID+serverReceivedTs]; index on isRead
            msgTable: 'messageId, [sessionID+serverReceivedTs], isRead, sessionID',
            // UserId = PK
            userTable: 'UserId',
            // chatId = PK; index on userId, lastTime
            recordTable: 'chatId, userId, lastTime',
            // chatId = PK
            recordTaskTable: 'chatId',
        });
    }
}

let db: MOMODatabase | null = null;
const dbReadyListeners = new Set<() => void>();
let duplicateMergePromise: Promise<void> | null = null;
let hasMergedDuplicates = false;

// --- Initialization ---

export function initDB(userId: string): void {
    if (db) {
        db.close();
    }
    db = new MOMODatabase(userId);
    hasMergedDuplicates = false;
    console.log(`[DBService] Initialized MOMODB_${userId}`);
    notifyDBReady();
    // Start maintenance task without blocking the main init
    ensureDuplicatesMerged(userId).catch(err => {
        console.error("[DBService] Maintenance failed:", err);
    });
}

export function closeDB(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[DBService] Database closed');
    }
}

export function isDBInitialized(): boolean {
    return Boolean(db);
}

export function onDBReady(callback: () => void): () => void {
    if (db) {
        queueMicrotask(callback);
        return () => {};
    }

    dbReadyListeners.add(callback);
    return () => {
        dbReadyListeners.delete(callback);
    };
}

function notifyDBReady(): void {
    const listeners = Array.from(dbReadyListeners);
    dbReadyListeners.clear();
    listeners.forEach((callback) => queueMicrotask(callback));
}

function getDB(): MOMODatabase {
    if (!db) {
        throw new Error('[DBService] Database not initialized. Call initDB(userId) first.');
    }
    return db;
}

// --- Helper ---

/**
 * Recursively clones an object to a plain JS object, stripping away Vue Proxies
 * while preserving special types like Blob that are serializable by IndexedDB.
 */
function toPlainObject<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Use Object.prototype.toString for robust type checking, 
    // especially when dealing with Vue Proxies where instanceof might fail.
    const typeString = Object.prototype.toString.call(obj);
    if (typeString === '[object Blob]' || typeString === '[object File]') {
        return obj;
    }

    if (Array.isArray(obj)) return obj.map(toPlainObject) as any;

    const plain: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            plain[key] = toPlainObject((obj as any)[key]);
        }
    }
    return plain;
}

// --- Message CRUD ---

export async function insertMessage(msg: LHMessage): Promise<void> {
    const plainMsg = toPlainObject(msg);
    await getDB().msgTable.put(plainMsg);
    console.log("insertMessage success", plainMsg);
}

export async function updateMessage(msg: LHMessage): Promise<void> {
    const plainMsg = toPlainObject(msg);
    const { messageId, ...rest } = plainMsg;
    await getDB().msgTable.update(messageId, rest);
    console.log("updateMessage success", plainMsg);
}

export async function deleteAllMessages(sessionId: string): Promise<void> {
    await getDB().msgTable.where('sessionID').equals(sessionId).delete();
    console.log("deleteAllMessages success", sessionId);
}

/**
 * Get messages list with pagination.
 * Returns messages ordered by serverReceivedTs ascending (oldest first).
 * If lastTs is provided, fetches messages older than lastTs.
 * Messages stuck in "sending" are marked as "failed".
 */
export async function getMessageList(
    sessionId: string,
    lastTs?: number,
    limit: number = DEFAULT_MSG_LIMIT
): Promise<LHMessage[]> {
    const database = getDB();

    let collection;
    if (lastTs !== undefined) {
        // Get messages older than lastTs for this session
        collection = database.msgTable
            .where('[sessionID+serverReceivedTs]')
            .between([sessionId, Dexie.minKey], [sessionId, lastTs], true, false)
            .reverse()
            .limit(limit);
    } else {
        // Get latest messages for this session
        collection = database.msgTable
            .where('[sessionID+serverReceivedTs]')
            .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
            .reverse()
            .limit(limit);
    }

    const messages = await collection.toArray();

    // Mark stale "sending" messages as "failed" (mirrors Swift behavior)
    for (const msg of messages) {
        if (msg.sendStatus === MessageSendStatus.Sending) {
            msg.sendStatus = MessageSendStatus.Failed;
        }
    }

    // Return in chronological order (oldest first)
    return messages.reverse();
}

// --- User CRUD ---

export async function insertUser(user: LHMessageUser): Promise<void> {
    await getDB().userTable.put(user);
}

export async function insertUsers(users: LHMessageUser[]): Promise<void> {
    if (users.length === 0) return;
    await getDB().userTable.bulkPut(users);
}

export async function getUser(userId: string): Promise<LHMessageUser | undefined> {
    return await getDB().userTable.get(userId);
}

// --- Chat Record CRUD ---

export async function upsertChatRecord(record: LHMsgChat): Promise<void> {
    const database = getDB();
    const sameUserRecords = await database.recordTable.where('userId').equals(record.userId).toArray();
    const duplicateRecords = sameUserRecords.filter((item) => item.chatId !== record.chatId);
    if (duplicateRecords.length > 0) {
        let targetRecord = record;
        for (const duplicateRecord of duplicateRecords) {
            targetRecord = await mergeChatRecord(database, duplicateRecord, targetRecord);
        }
        await database.recordTable.put(targetRecord);
        return;
    }

    await database.recordTable.put(record);
}

export async function getChatRecordList(): Promise<LHMsgChat[]> {
    await ensureDuplicatesMerged();
    return await getDB().recordTable.orderBy('lastTime').reverse().toArray();
}

export async function getChatRecordById(chatId: string): Promise<LHMsgChat | undefined> {
    return await getDB().recordTable.get(chatId);
}

export async function getChatRecordByUserId(userId: string): Promise<LHMsgChat | undefined> {
    return await getDB().recordTable.where('userId').equals(userId).first();
}

export async function deleteChatRecord(chatId: string, deleteMessages = true): Promise<boolean> {
    try {
        const database = getDB();
        await database.recordTable.delete(chatId);
        if (deleteMessages) {
            await deleteAllMessages(chatId);
        }
        return true;
    } catch {
        return false;
    }
}

// --- Unread Count ---

export async function getUnreadCount(sessionId?: string): Promise<number> {
    const database = getDB();
    /** 与 RTM 入站 message.isRead = false 及历史数据兼容（boolean / 0） */
    const isUnread = (msg: LHMessage) => !msg.isRead;

    if (sessionId) {
        return await database.msgTable
            .where('sessionID').equals(sessionId)
            .filter(isUnread)
            .count();
    }
    return await database.msgTable.filter(isUnread).count();
}

export async function clearUnread(sessionId: string): Promise<boolean> {
    try {
        const database = getDB();
        await database.transaction('rw', [database.msgTable, database.recordTable], async () => {
            // Mark all messages in session as read
            await database.msgTable
                .where('sessionID').equals(sessionId)
                .modify({ isRead: true });

            // Reset unread count on chat record
            await database.recordTable
                .where('chatId').equals(sessionId)
                .modify({ unreadCount: 0 });
        });
        return true;
    } catch {
        return false;
    }
}

export async function clearAllUnread(): Promise<boolean> {
    try {
        const database = getDB();
        await database.transaction('rw', [database.msgTable, database.recordTable], async () => {
            await database.msgTable
                .filter((msg) => !msg.isRead)
                .modify({ isRead: true });

            await database.recordTable.toCollection().modify({ unreadCount: 0 });
        });
        return true;
    } catch {
        return false;
    }
}

// --- Chat Task CRUD ---

export async function upsertChatTask(task: ChatTaskRecord): Promise<void> {
    await getDB().recordTaskTable.put(task);
}

export async function getChatTask(sessionId: string): Promise<ChatTaskRecord> {
    const existing = await getDB().recordTaskTable.get(sessionId);
    if (existing) return existing;

    // Create default task if not found
    const newTask: ChatTaskRecord = {
        chatId: sessionId,
        helloCompleted: false,
        giftCompleted: false,
    };
    await upsertChatTask(newTask);
    return newTask;
}

/**
 * Scan for duplicate/old-format chat records and merge them.
 */
function ensureDuplicatesMerged(me?: string): Promise<void> {
    if (hasMergedDuplicates) {
        return Promise.resolve();
    }
    duplicateMergePromise ??= checkAndMergeDuplicates(me).finally(() => {
        hasMergedDuplicates = true;
        duplicateMergePromise = null;
    });
    return duplicateMergePromise;
}

async function checkAndMergeDuplicates(me?: string): Promise<void> {
    const database = getDB();
    const allRecords = await database.recordTable.toArray();
    const currentUserId = me || database.name.replace(/^MOMODB_/, '');

    for (const record of allRecords) {
        // Calculate what the correct ID should be based on current logic
        const currentChatId = generateSessionId(currentUserId, record.userId);

        if (record.chatId !== currentChatId) {
            console.log(`[DBService] Migrating old record: ${record.chatId} -> ${currentChatId}`);

            await mergeChatRecord(database, record, { ...record, chatId: currentChatId });
            console.log(`[DBService] Migration of ${record.chatId} completed.`);
        }
    }
}

async function mergeChatRecord(
    database: MOMODatabase,
    sourceRecord: LHMsgChat,
    targetRecord: LHMsgChat
): Promise<LHMsgChat> {
    const existingTarget = await database.recordTable.get(targetRecord.chatId);
    const mergedRecord = existingTarget ? { ...existingTarget } : { ...targetRecord };

    if (sourceRecord.lastTime > mergedRecord.lastTime) {
        mergedRecord.lastText = sourceRecord.lastText;
        mergedRecord.lastTime = sourceRecord.lastTime;
    }
    if (targetRecord.lastTime > mergedRecord.lastTime) {
        mergedRecord.lastText = targetRecord.lastText;
        mergedRecord.lastTime = targetRecord.lastTime;
    }

    mergedRecord.unreadCount = await database.msgTable
        .where('sessionID')
        .anyOf(sourceRecord.chatId, targetRecord.chatId)
        .filter((msg) => !msg.isRead)
        .count();

    mergedRecord.user = targetRecord.user || mergedRecord.user || sourceRecord.user;
    mergedRecord.userId = targetRecord.userId;
    mergedRecord.chatId = targetRecord.chatId;

    await database.recordTable.put(mergedRecord);

    await database.msgTable
        .where('sessionID')
        .equals(sourceRecord.chatId)
        .modify({ sessionID: targetRecord.chatId });

    const sourceTask = await database.recordTaskTable.get(sourceRecord.chatId);
    if (sourceTask) {
        const targetTask = await database.recordTaskTable.get(targetRecord.chatId);
        await database.recordTaskTable.put({
            chatId: targetRecord.chatId,
            helloCompleted: Boolean(targetTask?.helloCompleted || sourceTask.helloCompleted),
            giftCompleted: Boolean(targetTask?.giftCompleted || sourceTask.giftCompleted),
        });
        await database.recordTaskTable.delete(sourceRecord.chatId);
    }

    if (sourceRecord.chatId !== targetRecord.chatId) {
        await database.recordTable.delete(sourceRecord.chatId);
    }

    return mergedRecord;
}

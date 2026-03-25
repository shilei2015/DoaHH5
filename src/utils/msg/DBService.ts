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

// --- Initialization ---

export function initDB(userId: string): void {
    if (db) {
        db.close();
    }
    db = new MOMODatabase(userId);
    console.log(`[DBService] Initialized MOMODB_${userId}`);
    // Start maintenance task without blocking the main init
    checkAndMergeDuplicates(userId).catch(err => {
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
    await getDB().recordTable.put(record);
}

export async function getChatRecordList(): Promise<LHMsgChat[]> {
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
    if (sessionId) {
        return await database.msgTable
            .where('sessionID').equals(sessionId)
            .and((msg) => msg.isRead === false)
            .count();
    } else {
        return await database.msgTable
            .where('isRead').equals(0) // IndexedDB stores boolean as 0/1
            .count();
    }
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
                .where('isRead').equals(0)
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
async function checkAndMergeDuplicates(me: string): Promise<void> {
    const database = getDB();
    const allRecords = await database.recordTable.toArray();

    for (const record of allRecords) {
        // Calculate what the correct ID should be based on current logic
        const currentChatId = generateSessionId(me, record.userId);

        if (record.chatId !== currentChatId) {
            console.log(`[DBService] Migrating old record: ${record.chatId} -> ${currentChatId}`);

            // 1. Check if a record already exists at the correct ID
            const existingRecord = await database.recordTable.get(currentChatId);

            if (existingRecord) {
                // MERGE: Pick the latest one
                if (record.lastTime > existingRecord.lastTime) {
                    existingRecord.lastText = record.lastText;
                    existingRecord.lastTime = record.lastTime;
                }
                existingRecord.unreadCount += record.unreadCount;
                // Preserve whatever user info we have
                if (!existingRecord.user && record.user) {
                    existingRecord.user = record.user;
                }
                await database.recordTable.put(existingRecord);
            } else {
                // MOVE: Copy record to new ID
                const newRecord = { ...record, chatId: currentChatId };
                await database.recordTable.put(newRecord);
            }

            // 2. Migrate all messages linked to the old sessionID
            await database.msgTable
                .where('sessionID')
                .equals(record.chatId)
                .modify({ sessionID: currentChatId });

            // 3. Migrate task records if any
            const oldTask = await database.recordTaskTable.get(record.chatId);
            if (oldTask) {
                const newTask = { ...oldTask, chatId: currentChatId };
                // Also check if existing task exists
                const existingTask = await database.recordTaskTable.get(currentChatId);
                if (existingTask) {
                    existingTask.helloCompleted = existingTask.helloCompleted || oldTask.helloCompleted;
                    existingTask.giftCompleted = existingTask.giftCompleted || oldTask.giftCompleted;
                    await database.recordTaskTable.put(existingTask);
                } else {
                    await database.recordTaskTable.put(newTask);
                }
                await database.recordTaskTable.delete(record.chatId);
            }

            // 4. Delete the old record
            await database.recordTable.delete(record.chatId);
            console.log(`[DBService] Migration of ${record.chatId} completed.`);
        }
    }
}


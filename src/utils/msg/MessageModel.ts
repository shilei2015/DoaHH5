
export enum MessageType {
    Text = "1",
    Image = "2",
    Animation = "5",
    TimeTag = "100"
}

export enum MessageSendStatus {
    Sending = "sending",
    Success = "success",
    Failed = "failed"
}

export enum OnlineState {
    Offline = "0",
    Online = "1",
    Busy = "2",
}

export enum TranslateState {
    Noyet = "0",
    Translating = "1",
    Translated = "2",
}

export interface MessageImageModel {
    urlString?: string;
}

export function isSvgaUrl(model: MessageImageModel): boolean {
    if (!model.urlString) return false;
    return model.urlString.endsWith('.zz') || model.urlString.endsWith('.svga');
}

export interface LHMessage {
    messageId: string;
    msgType: MessageType;
    toUid?: string;
    fromUid?: string;
    textMessage?: string;
    imageObj?: MessageImageModel;
    RelationId?: string;
    isRead: boolean;
    serverReceivedTs: number;
    saveLocal: boolean;
    sendStatus: MessageSendStatus;
    sessionID: string;
    isOfflineMessage: boolean;
    fromUser?: LHMessageUser;
    toUser?: LHMessageUser;
    // Local-only fields for upload
    localBlob?: Blob;
    localExtension?: string;
    translateState?: TranslateState;
    transLateTextMessage?: string;
    chatType?: string;
}

// Minimal user model for message storage (subset of UserInfoModel)
export interface LHMessageUser {
    UserId: string;
    HeadImage: string;
    Nickname: string;
    Gender?: string;
    OnlineState?: OnlineState
}

/**
 * Generate a session ID from two user IDs.
 * Mirrors Swift logic: (toUid.intValue + fromUid.intValue).toString
 */
export function generateSessionId(toUid: string, fromUid: string): string {
    let ids = [toUid, fromUid].sort((a, b) => a.localeCompare(b))
    return ids.join("_");
}

export function createUUID(): string {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// --- Factory Methods ---

export function createTextMessage(
    text: string,
    toUid: string,
    fromUid: string,
    fromUser?: LHMessageUser,
    toUser?: LHMessageUser
): LHMessage {
    return {
        messageId: createUUID(),
        msgType: MessageType.Text,
        textMessage: text,
        fromUid,
        toUid,
        sessionID: generateSessionId(toUid, fromUid),
        isRead: true,
        serverReceivedTs: Date.now() / 1000,
        saveLocal: true,
        sendStatus: MessageSendStatus.Sending,
        isOfflineMessage: false,
        fromUser,
        toUser,
        translateState: TranslateState.Noyet
    };
}

export function createImageMessage(
    imageUrl: string,
    toUid: string,
    fromUid: string,
    fromUser?: LHMessageUser,
    toUser?: LHMessageUser
): LHMessage {
    return {
        messageId: createUUID(),
        msgType: MessageType.Image,
        fromUid,
        toUid,
        sessionID: generateSessionId(toUid, fromUid),
        isRead: true,
        serverReceivedTs: Date.now() / 1000,
        saveLocal: true,
        sendStatus: MessageSendStatus.Sending,
        isOfflineMessage: false,
        imageObj: { urlString: imageUrl },
        fromUser,
        toUser,
    };
}

export function createGifMessage(
    gifId: string,
    gifUrl: string,
    toUid: string,
    fromUid: string,
    fromUser?: LHMessageUser,
    toUser?: LHMessageUser
): LHMessage {
    return {
        messageId: createUUID(),
        msgType: MessageType.Animation,
        fromUid,
        toUid,
        sessionID: generateSessionId(toUid, fromUid),
        isRead: true,
        serverReceivedTs: Date.now() / 1000,
        saveLocal: true,
        sendStatus: MessageSendStatus.Sending,
        isOfflineMessage: false,
        RelationId: gifId,
        imageObj: { urlString: gifUrl },
        fromUser,
        toUser,
    };
}

export function createTimeTagMessage(timestamp: number): LHMessage {
    return {
        messageId: createUUID(),
        msgType: MessageType.TimeTag,
        isRead: true,
        serverReceivedTs: timestamp,
        saveLocal: false,
        sendStatus: MessageSendStatus.Success,
        sessionID: '',
        isOfflineMessage: false,
    };
}

/**
 * Get the last text preview for a chat record
 */
export function chatRecordLastText(message: LHMessage): string {
    switch (message.msgType) {
        case MessageType.Text:
            return message.textMessage ?? '';
        case MessageType.Image:
            return '[IMG]';
        case MessageType.Animation:
            return '[GIFT]';
        case MessageType.TimeTag:
            return '';
    }
}
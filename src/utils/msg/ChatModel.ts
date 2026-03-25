import type { LHMessageUser } from './MessageModel';

/**
 * Chat session record — mirrors Swift LHMsgChat
 */
export interface LHMsgChat {
    chatId: string;
    userId: string;
    lastText: string;
    unreadCount: number;
    lastTime: number; // Unix timestamp in seconds
    user?: LHMessageUser;
}

/**
 * Chat task record — persists MissionData completion state locally.
 * Mirrors the runtime MissionData structure from ChatBottomMissionView.
 */
export interface ChatTaskRecord {
    chatId: string;
    helloCompleted: boolean;
    giftCompleted: boolean;
}

/**
 * GIF / Gift model — mirrors Swift GIFModel
 */
export interface GIFModel {
    GifId: string;      // mapped from "GiftId" in API
    Title: string;
    Image: string;      // preview image URL
    Gif: string;        // animation URL (gif / svga)
    Coins: string;
    GIFType: string;    // mapped from "Type" in API
    Purpose: string;
}

export function isVipGif(gif: GIFModel): boolean {
    return gif.Purpose === '10';
}

export function isGifSvga(gif: GIFModel): boolean {
    return gif.Gif.endsWith('.zz') || gif.Gif.endsWith('.svga');
}

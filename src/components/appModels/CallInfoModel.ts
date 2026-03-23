import { AnchorInfoModel } from './AnchorInfoModel';

export class LiveTokenModel {
    RoomId: string = ""
    SysUserId: string = ""
    UserRtcToken: string = ""
    UserId: string = ""
}

export class CallInfoModel {
    LiveId: string = ""
    LiveTime: string = ""
    LiveFreeTime: string = ""
    LiveCoins: string = ""
    LiveOriginalCoins: string = ""
    User: AnchorInfoModel | null = null
    LiveToken: LiveTokenModel | null = null
}

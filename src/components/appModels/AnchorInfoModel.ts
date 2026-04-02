export class AnchorInfoModel {
    UserId: string = ""
    Nickname: string = ""
    HeadImage: string = ""
    Birthday: string = ""
    Introduce: string = ""
    IsHotGirls: string = ""
    IsNewGirls: string = ""
    OnlineState: string = ""
    CallState: string = ""
    SortState: string = ""
    Albums: string[] = []
    AnchorType: string = ""
    Partners: string = ""
    Gender: string = ""
    Country: string = ""
    CountryCode: string = ""
    Age: string = ""
    IsLike: boolean = false
    VisitorMeNumber: string | null = null
    LikeMeNumber: string | null = null
    UserLikeNumber: string | null = null
    AlbumVideos: { [key: string]: string } | null = null
}
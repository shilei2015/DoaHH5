export interface SystemInfoModel {
    App: SystemInfoAppModel
    Tactics: SystemInfoTacticsModel
    SystemData: string
}

export interface SystemInfoAppModel {
    AppId: string
    AppName: string
    AppState: string
    VersionId: string
    VersionName: string
    VersionState: string
    CurrState: string
    LiveCoins: string
    LiveOriginalCoins: string
    OssCdnDomain: string
    AList: string
}

export interface SystemInfoTacticsModel {
    MatchOutStart: string
    LtoCoinsFirstStart: string
}


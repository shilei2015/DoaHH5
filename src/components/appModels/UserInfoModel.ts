export class UserInfoModel {
    // "UserId": "201828996760705668", //用户id
    // "HeadImage": "http://vclub-1v1.oss-us-west-1.aliyuncs.com/121/links/prod/images/202306/19/r3EiMHNO0cWMUNosqOBU0OduGAKNjG7AtGmkCa0j.png", //头像
    // "Nickname": "撒旦发射", //昵称
    // "Gender": "1", //性别，1-男，2-女，0-未知
    // "CountryCode": "CN", //国家code
    // "Country": "China", //国家
    // "Introduce": null, //介绍
    // "Sign": "CAPRICORN", //签名
    // "StarSign": "Capricorn", //星座显示，如果有值则替代星座显示
    // "Birthday": "1011516428", //生日
    // "Language": "English", //语言
    // "Albums": null, //相册
    // "Coins": "80", //金币
    // "VipExpire": "0", //vip有效期
    // "Vip": "0", //是否vip，1-是，0-否
    // "LikeUnReadNumber": "15", //点赞未读数量
    // "VisitorUnReadNumber": "27", //拜访未读数量
    // "VisitorMeNumber": "27", //拜访我数量
    // "LikeMeNumber": "15", //喜欢我数量
    // "UserLikeNumber": "0" //点赞数
    UserId: string = ""
    HeadImage: string = ""
    Nickname: string = ""
    Gender: "0" | "1" | "2" = "0"
    CountryCode: string = ""
    Country: string = ""
    Introduce: string = ""
    Sign: string = ""
    StarSign: string = ""
    Birthday: string = ""
    Language: string = ""
    Albums: string[] = []
    Coins: string = ""
    VipExpire: string = ""
    Vip: string = ""
    LikeUnReadNumber: string | null = null
    VisitorUnReadNumber: string | null = null
    VisitorMeNumber: string | null = null
    LikeMeNumber: string | null = null
    UserLikeNumber: string | null = null
}
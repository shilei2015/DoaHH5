// "ProductId": "403493322902122017",
// "ProductName": "100",
// "ProductType": "1", //礼物类型；1：直播礼物(打电话)；2：聊天室礼物
// "ProductSort": "1100", //0-默认排序，4-价格，2-金币，3-权益天数
// "ProductCover": "", //封面
// "ProductImages": null, //图片
// "ProductDesc": "",
// "ExtraCoins": "0", //金币-额外金币
// "Coins": "100", //金币
// "Days": "0",
// "ProductPower": null,
// "IsValid": "1",
// "PaypalSkuId": "",
// "Position": "", //使用配置
// "Purpose": "{\"Time\":\"\",\"TimeFormat\":\"\",\"Price\":\"￥500\",\"NumberBase\":\"100\",\"NumberEx\":\"\"}", //用途
// "ApplePrice": "1.99", //苹果价格
// "AppleSkuId": "playC001", //苹果skuid
// "AppleOriginalPrice": "0.00", //苹果原价
// "GooglePrice": "0.00", //谷歌价格
// "GoogleSkuId": "", //谷歌skuid
// "GoogleOriginalPrice": "0.00", //谷歌原价
// "ShowPrice": "日元 1.99", //显示价格
// "ShowOriginalPrice": "18", //显示原价格
export interface ProductModel {
    ProductId: string
    ProductName: string
    ProductType: string
    ProductSort: string
    ProductCover: string
    ProductImages: string
    ProductDesc: string
    ExtraCoins: string
    Coins: string
    Days: string
    ProductPower: string
    IsValid: string
    PaypalSkuId: string
    Position: string
    Purpose: string
    PurposeObj?: ProductExtra
    ApplePrice: string
    AppleSkuId: string
    AppleOriginalPrice: string
    GooglePrice: string
    GoogleSkuId: string
    GoogleOriginalPrice: string
    ShowPrice: string
    ShowOriginalPrice: string
}

export interface ProductExtra {
    Time: string
    TimeFormat: string
    Price: string
    NumberBase: string
    NumberEx: string
}
// "State": "1", //【*】定时任务状态，1-启用，0-不启用
// "FirstStart": "300", //【*】第一次开始时间
// "LimitTime": "600", //【*】优惠限时
// "IsBuy": "0", //是否购买，1-是，0-否
// "Product": {
// "ProductId": "812663550142614605", //产品id
// "ProductName": "限时优惠-金币", //产品名称
// "ProductType": "3", //产品类型，1-金币，2-权益，3-限时优惠
// "ProductSort": "1",
// "ProductCover": "", //封面
// "ProductDesc": "", //产品描述
// "Coins": "200", //金币
// "Days": "0", //有效期
// "ProductPower": "",
// "IsValid": "1",
// "ApplePrice": "1.99", //苹果价格
// "AppleSkuId": "cat07", //苹果商品id
// "AppleOriginalPrice": "3.99", //苹果原价
// "GooglePrice": "0.00", //谷歌价格
// "GoogleSkuId": "", //谷歌商品id
// "GoogleOriginalPrice": "0.00" //谷歌原价
// }, //产品信息

import type { get } from "vant/lib/utils"
import type { ProductModel } from "./ProductModel"

export interface LimitOffModel {
    State: string
    FirstStart: string
    LimitTime: string
    IsBuy: string
    Product?: ProductModel
}


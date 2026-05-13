/**
 * api.ts
 * API 路由列表映射
 */

import { encryptAES } from '@/utils/net/encryption'

export const API = {
  sys_info: 'systemInfo',
  app_cfg: 'cfg',
  login: 'login',
  register: 'register',
  list_nav: 'navList',
  list_user_byId: 'anchorListByNav',
  user_info: 'anchorInfo',
  main_user_info: 'userInfo',
  like_user: 'userLike',
  edit_profile: 'editUser',
  oss_file_upload_token: 'uploadOssStsToken',
  country_list: 'country8Launage',
  send_message: 'sendMsg',
  refresh_rtm_token: 'refreshRtmToken',
  translate_text: 'translate',
  hello_gif: 'giftSayHello',
  list_gif: 'giftListV2',
  heart_app: 'taskMinuteI',
  video_to_user: 'callUser',
  video_user_info: 'liveUserInfo',
  video_charging: 'liveCharging',
  video_stop: 'callEnd',
  slash_user: 'matchAnchor',
  read_msg: 'send2User',
  list_user_byIdList: 'userListById',
  list_like_me: 'likeMeList',
  list_visitor_me: 'visitorMeList',
  list_my_like: 'userLikeList',
  how_user: 'appraiseUser',
  how_app: 'appraiseApp',
  how_app_give_gif: 'appraiseGrantCoins',
  tac_out_start: 'matchOutStart',
  specail_lto: 'ltoCoinsV3',
  app_version: 'getNewVersion',
  stay_time: 'buryingPoint',
  list_top_user: 'hotGirls',
  user_block: 'userBlack',
  user_block_list: 'userBlackList',
  block_user_remove: 'userRemoveBlack',
  user_report: 'userReport',
  specail_start_time: 'ltoStart',
  apns_bind: 'bindToken',
  apns_click_push: 'clickPush',
  check_invite_code: 'checkInviteCode',
  delete_user_account: 'userLogOff',
  feedback: 'feedback',
  resotre: 'aRestore',
  vipDayGive: 'productPositionRecommandAnD',
  likeUser: 'userLike',
  vipDayGet: 'userVipGiveCoins',
  userFlyer: 'userFlyer',
  kfUserList: 'anchorList',
  userAlbums: 'toUserAlbums',
  coin_products: 'pCVListV1',
  coin_recommend: 'userRecommendCoinsV1',
  pay: 'unifiedOrder',
  /**
   * 苹果内购 v2 验单（开发中：路由名与入参以后端为准，就绪后把 paymentService 里开关打开）
   */
  pay_apple_verify: 'appleV2VerifyOrder',
} as const

// 根据加密标识返回最终请求URL
export function getApiUrl(apiEndpoint: string, isEncrypt: boolean = true) {
  // 如果服务端要求开启 aes，则将 endpoint 也做对应加密。
  const endpoint = isEncrypt ? encryptAES(apiEndpoint) : apiEndpoint
  return endpoint
}

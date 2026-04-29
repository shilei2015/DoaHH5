# H5 1v1 深色版多人实施计划

## 基本信息

- 集成分支：`darkStyle`
- Figma 文件：`1pGK6T9gUhbmnDZIpuRf10`
- Figma 根节点：`317:1287`（备用1v1）
- 页面级 Frame 数量：43
- 改造原则：只调整界面展示，不修改业务逻辑、接口、store、路由守卫、native bridge、聊天、通话、支付流程。

## 分支与合并顺序

| 顺序 | 分支 | 职责 | 合并目标 |
| --- | --- | --- | --- |
| 1 | `codex/dark-style-foundation` | 全局深色基础、页面容器、安全区、Tabbar、通用标题、Vant 深色覆盖、加载/空态、共享组件 | `darkStyle` |
| 2 | `codex/dark-style-core-pages` | 启动页、首页、消息、我的、资料页、编辑资料、用户列表 | `darkStyle` |
| 3 | `codex/dark-style-flows-modals` | 聊天、礼物、举报拉黑、设置账户、反馈、金币购买、限时优惠、权限弹窗、通话相关页面 | `darkStyle` |

## 同机 worktree 建议

同一台电脑多人或多 Agent 并行时，不要在同一个目录来回切 3 条分支。推荐一个分支一个 worktree：

| 用途 | 建议目录 | 分支 |
| --- | --- | --- |
| 集成 | `/Users/stone/Desktop/webonevone` | `darkStyle` |
| 基础视觉 | `/Users/stone/Desktop/webonevone-foundation` | `codex/dark-style-foundation` |
| 主路径页面 | `/Users/stone/Desktop/webonevone-core-pages` | `codex/dark-style-core-pages` |
| 流程弹窗 | `/Users/stone/Desktop/webonevone-flows-modals` | `codex/dark-style-flows-modals` |

## 状态规则

- `未开始`：尚未实施。
- `进行中`：实施者正在调整该页面。
- `待验收`：已完成代码调整，等待对照 Figma 验收。
- `已完成`：已通过视觉和核心交互验收。
- `阻塞`：缺少现有入口、设计细节或实现依赖，暂不能实施。

实施前必须用 Figma MCP 对目标节点调用 `get_design_context`。每完成一个页面，将状态更新为 `待验收`；验收通过后更新为 `已完成`，并填写验收备注。

## 页面级计划表

| 阶段 | 负责人/分支 | 状态 | 关联组 | 关联类型 | Figma 节点 | Figma 页面 | 现有页面/路由 | 代码映射 | 调整范围 | 验收备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | `codex/dark-style-foundation` | 待验收 | `global-loading` | 共享状态 | `401:1650` | 加载页 | 全局加载/HUD | `src/components/HUD/HUD.vue`、启动/全局加载相关展示 | 深色加载态、遮罩、loading 文案与安全区 | 已完成全局深色遮罩、绿色 loading、Loading 文案、Toast 深色样式；`npm run build` 通过 |
| P0 | `codex/dark-style-foundation` | 待验收 | `global-empty` | 待确认入口 | `483:3005` | 无网络 | 待确认 | 待确认：当前未见独立路由 | 无网络空态、重试按钮；不新增网络检测逻辑 | 已新增共享 `EmptyState` 的 network 形态，含无网络插画、文案和 Try again 按钮；未新增网络检测或业务入口 |
| P0 | `codex/dark-style-foundation` | 待验收 | `global-empty` | 共享状态 | `483:3101` | 通用缺省页 | 多个列表页共用 | `src/components/ScrollList.vue`、各列表空态 | 通用空态视觉、图标、文案容器 | 已完成通用空态组件并接入 `ScrollList`，同步深色背景与绿色刷新/加载指示；`npm run build` 通过 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `launch` | 现有页面 | `333:1291` | 启动页 | `/` | `src/views/Launch/launchPage.vue` | 启动页背景、Logo、加载衔接 | 已按“备用1v1”节点完成深色背景、绿色 Logo 与加载态调整。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `home` | 现有页面 | `350:2256` | 首页 | `/tab` | `src/views/tabbarSubViews/anchorList.vue` | 首页标题、分类、主播列表布局、余额/VIP 入口 | 已按“备用1v1”节点完成深色首页、VIP 入口、分类与双列主播卡调整。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `anchor-profile` | 现有页面 | `429:2222` | 客态资料页 | `/anchorProfile` | `src/views/AnchorProfile/AnchorProfile.vue` | 资料头图、信息区、按钮、相册、更多操作入口 | 已按“备用1v1”节点完成沉浸式头图、资料信息区与底部操作按钮调整。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `message-list` | 现有页面 | `457:7016` | 消息 | `/tab/message` | `src/views/tabbarSubViews/messageList.vue` | 消息列表、未读角标、滑动删除、空态 | 已按“备用1v1”节点完成深色消息列表、未读角标与删除按钮调整。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `user-center` | 现有页面 | `469:3668` | 我的 | `/tab/user` | `src/views/tabbarSubViews/userCenter.vue` | 个人中心头部、资产、统计、菜单入口 | 已按“备用1v1”节点完成 Personal 页头、统计卡、钱包卡与菜单深色视觉。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `edit-profile` | 现有页面 | `469:4262` | 编辑资料 | `/profile/edit` | `src/views/profile/EditProfilePage.vue` | 编辑资料整体布局、表单、相册、底部按钮 | 已按“备用1v1”节点完成编辑资料表单、相册区与底部 Save 按钮深色视觉。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `edit-profile` | 同页弹窗 | `469:4785` | 选择头像弹窗 | `/profile/edit` | `src/views/profile/EditProfilePage.vue` | 头像选择弹窗视觉；不改上传逻辑 | 已按“备用1v1”节点完成头像操作弹窗视觉，上传逻辑保持不变。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `edit-profile` | 同页弹窗 | `469:5567` | 修改年龄 | `/profile/edit` | `src/views/profile/EditProfilePage.vue` | 年龄选择器弹层视觉；不改选择逻辑 | 已按“备用1v1”节点完成年龄选择器深色弹层视觉，选择逻辑保持不变。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `edit-profile` | 同页弹窗 | `469:5850` | 选择国家 | `/profile/edit` | `src/views/profile/EditProfilePage.vue` | 国家选择器弹层视觉；不改数据来源 | 已按“备用1v1”节点完成国家选择器深色弹层视觉，数据来源保持不变。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `user-list` | 同组件页面 | `469:6130` | See who liked me | `/profile/like-me` | `src/views/profile/UserListPage.vue` | 喜欢我的列表页深色视觉 | 已按“备用1v1”节点完成用户列表页深色头部与双列卡片布局。 |
| P1 | `codex/dark-style-core-pages` | 待验收 | `user-list` | 同组件页面 | `469:6675` | See who visited me | `/profile/visitor` | `src/views/profile/UserListPage.vue` | 访客列表页深色视觉 | 已按“备用1v1”节点完成用户列表页深色头部与双列卡片布局。 |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `notification` | 共享弹层 | `426:1883` | 站内push | 全局通知 | `src/components/Notification/FlashNotification.vue` | 站内通知卡片、头像、按钮、阴影 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `permission` | 待确认入口 | `457:7704` | 开启通知权限 | 待确认 | 待确认：当前未见独立 UI 入口 | 权限提示弹窗视觉；不改权限申请逻辑 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `chat-detail` | 现有页面 | `457:8026` | 聊天页 | `/message/detail` | `src/views/message/ChatDetail/ChatDetailPage.vue`、`messageCells/*` | 聊天顶部、消息气泡、输入栏、任务/礼物入口 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `chat-detail` | 同页弹窗 | `469:2084` | 礼物弹窗 | `/message/detail` | `src/views/message/ChatDetail/messageOtherViews/ChatGiftPicker.vue` | 礼物面板、商品格、余额/发送按钮 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `report-block` | 共享弹层 | `469:2512` | 举报/拉黑 | 主播资料/聊天等页面触发 | `src/components/modal/UserActionModal.vue` | 操作菜单弹窗视觉 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `report-block` | 共享弹层 | `469:2919` | 举报-填写内容 | 主播资料/聊天等页面触发 | `src/components/modal/ReportModal.vue` | 举报输入弹窗、按钮、文本域 |  |
| P2 | `codex/dark-style-flows-modals` | 未开始 | `report-block` | 共享弹层 | `469:3291` | 拉黑 | 主播资料/聊天等页面触发 | `src/components/modal/BlackListConfirmModal.vue` | 拉黑确认弹窗、用户卡、按钮 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings` | 现有页面 | `469:7066` | feedback | `/setting/feedback` | `src/views/setting/FeedbackPage.vue` | 反馈页输入、上传、联系邮箱、提交按钮 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings` | 现有页面 | `469:7422` | 设置 | `/setting` | `src/views/setting/SettingPage.vue` | 设置列表、分组、Webview 入口 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings` | 现有页面 | `469:7687` | 黑名单 | `/setting/blacklist` | `src/views/setting/BlacklistPage.vue` | 黑名单列表、移除按钮、空态 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings` | 现有页面 | `469:7981` | 账户 | `/setting/account` | `src/views/setting/AccountPage.vue` | 账户页列表、退出登录入口 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings-extra` | 待确认入口 | `472:2293` | 关于APP | 待确认：可能由 Webview 或设置入口承载 | 待确认：当前可能由 Webview 或设置入口承载 | 关于页视觉；不新增业务入口 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `settings-extra` | 待确认入口 | `472:2451` | 联系我们 | 待确认：可能由 feedback/设置入口承载 | 待确认：当前可能由 feedback/设置入口承载 | 联系我们页面视觉；不新增业务入口 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `account-delete` | 待确认入口 | `472:2638` | 删除账户 | `/setting/account` 中删除入口当前被注释 | 待确认：`AccountPage` 中删除入口当前被注释 | 删除账户页面视觉；不启用删除功能 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `account-delete` | 待确认入口 | `472:2824` | 删除账户-二次确认 | `/setting/account` 中删除入口当前被注释 | 待确认：删除账户流程当前未启用 | 二次确认弹窗视觉；不启用删除功能 |  |
| P3 | `codex/dark-style-flows-modals` | 未开始 | `account-logout` | 同页弹窗 | `472:2934` | 退出登录 | `/setting/account` | `src/views/setting/AccountPage.vue` | 退出登录确认弹窗视觉；不改退出逻辑 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `commerce-limit` | 现有组件 | `457:5454` | 限时购买 | `/tab` 底部限时优惠入口 | `src/views/tabbarView/LimitOfferPage.vue` | 首页底部限时购买条/入口视觉 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `coin-shop` | 现有页面 | `472:3193` | 金币购买（大） | 商城弹层/页面 | `src/views/shop/CoinShopPage.vue` | 商城头部、余额、商品卡、价格按钮 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `coin-shop` | 同页状态 | `472:3632` | 金币购买宣传banner | 商城弹层/页面 | `src/views/shop/CoinShopPage.vue` | 商城宣传 banner 视觉 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `new-user-bonus` | 待确认入口 | `472:4098` | 新人赠币 | 待确认 | 待确认：当前未见明确独立入口 | 新人赠币弹窗/页面视觉；不新增触发逻辑 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `commerce-limit` | 同组件弹窗 | `472:4387` | 限时购买弹窗 | `/tab` 底部限时优惠入口 | `src/components/limitOff/LimitOfferModal.vue` | 限时购买大弹窗视觉 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `permission` | 待确认入口 | `472:6991` | 权限弹窗 | 待确认 | 待确认：权限提示触发点需实施时确认 | 权限弹窗视觉；不改权限申请逻辑 |  |
| P4 | `codex/dark-style-flows-modals` | 未开始 | `hot-girl` | 待确认入口 | `472:7569` | Hot girl弹窗 | 待确认 | 待确认：当前未见明确独立入口 | Hot girl 弹窗视觉；不新增触发逻辑 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `call` | 同页状态 | `448:2807` | 主叫 | `/call` | `src/views/call/callPage.vue` | 主叫等待页视觉 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `call` | 同页状态 | `457:6504` | 被叫 | `/call` | `src/views/call/callPage.vue` | 被叫来电页视觉 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `video-call` | 同页状态 | `457:3265` | 通话中 | `/video` | `src/views/call/videoPage.vue` | 通话中视频层、按钮、礼物/计费展示 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `video-call` | 同页弹窗 | `457:3659` | 退出通话弹窗 | `/video` | `src/components/modal/ExitCallConfirmModal.vue` | 退出确认弹窗视觉 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `video-call` | 同页弹窗 | `457:4006` | 评价主播 | `/video` | `src/components/modal/EvaluateCallModal.vue` | 通话评价弹窗视觉 |  |
| P5 | `codex/dark-style-flows-modals` | 未开始 | `video-call` | 同页状态 | `457:4378` | 通话中-编辑文字 | `/video` | `src/views/call/videoPage.vue` | 通话中文字编辑/输入状态视觉 |  |

## 每批验收清单

- Figma 节点已通过 `get_design_context` 读取。
- 页面背景、字体、颜色、间距、图标、按钮、列表、弹窗、安全区与设计稿一致。
- 核心交互不回归：Tab 切换、资料页进入、聊天入口、弹窗打开关闭、设置跳转、支付入口、通话基础进入/退出。
- `npm run build` 通过。
- 本地 `npm run dev -- --host 0.0.0.0` 可运行。

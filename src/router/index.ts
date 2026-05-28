import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/userStore";
import { hideGlobalLoading } from "@/utils/native/A0019Bridge";

const loadMainTabView = () => import("@/views/tabbarView/mainTabbarView.vue");
const loadAnchorList = () => import("@/views/tabbarSubViews/anchorList.vue");
const loadMessageList = () => import("@/views/tabbarSubViews/messageList.vue");
const loadUserCenter = () => import("@/views/tabbarSubViews/userCenter.vue");
const loadMessageDetail = () => import("@/views/message/ChatDetail/ChatDetailPage.vue");
const loadAnchorProfile = () => import("@/views/AnchorProfile/AnchorProfile.vue");
const loadCallPage = () => import("@/views/call/callPage.vue");
const loadVideoPage = () => import("@/views/call/videoPage.vue");
const loadEditProfile = () => import("@/views/profile/EditProfilePage.vue");
const loadUserListPage = () => import("@/views/profile/UserListPage.vue");
const loadSettingPage = () => import("@/views/setting/SettingPage.vue");
const loadAccountPage = () => import("@/views/setting/AccountPage.vue");
const loadBlacklistPage = () => import("@/views/setting/BlacklistPage.vue");
const loadFeedbackPage = () => import("@/views/setting/FeedbackPage.vue");

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "launch",
        component: () => import("@/views/Launch/launchPage.vue"),
        meta: { depth: 10 }
    },
    {
        path: "/tab",
        name: "mainTabView",
        component: loadMainTabView,
        meta: { depth: 20 },
        children: [
            {
                path: "",
                component: loadAnchorList,
                name: "anchorList",
                meta: { depth: 20 }
            },
            {
                path: "message",
                component: loadMessageList,
                name: "messageList",
                meta: { depth: 20 }
            },
            {
                path: "user",
                component: loadUserCenter,
                name: "userCenter",
                meta: { depth: 20 }
            }
        ],
    },
    {
        path: "/message/detail",
        component: loadMessageDetail,
        name: "messageDetail",
        meta: { depth: 50 }
    },
    {
        path: "/anchorProfile",
        name: "AnchorProfile",
        component: loadAnchorProfile,
        meta: { depth: 40 }
    },
    {
        path: "/call",
        name: "callPage",
        component: loadCallPage,
        meta: { depth: 40, disableSwipeBack: true }
    },
    {
        path: "/video",
        name: "videoPage",
        component: loadVideoPage,
        meta: { depth: 40, disableSwipeBack: true }
    },
    { path: "/login", redirect: "/" },
    { path: "/register", redirect: "/" },
    { path: "/register/:pathMatch(.*)*", redirect: "/" },
    {
        path: "/profile/edit",
        name: "EditProfile",
        component: loadEditProfile,
        meta: { depth: 30 }
    },
    {
        path: "/profile/like-me",
        name: "LikeMe",
        component: loadUserListPage,
        props: { title: 'See who liked me', apiType: 'list_like_me' },
        meta: { depth: 30 }
    },
    {
        path: "/profile/visitor",
        name: "Visitor",
        component: loadUserListPage,
        props: { title: 'Visitors', apiType: 'list_visitor_me' },
        meta: { depth: 30 }
    },
    {
        path: "/profile/my-likes",
        name: "MyLikes",
        component: loadUserListPage,
        props: { title: 'Girls I like', apiType: 'list_my_like' },
        meta: { depth: 30 }
    },
    {
        path: "/setting",
        name: "Setting",
        component: loadSettingPage,
        meta: { depth: 30 }
    },
    {
        path: "/setting/account",
        name: "Account",
        component: loadAccountPage,
        meta: { depth: 40 }
    },
    {
        path: "/setting/blacklist",
        name: "Blacklist",
        component: loadBlacklistPage,
        meta: { depth: 40 }
    },
    {
        path: "/setting/feedback",
        name: "Feedback",
        component: loadFeedbackPage,
        meta: { depth: 30 }
    }
]

if (import.meta.env.DEV) {
    routes.push({
        path: "/native-bridge-test",
        name: "NativeBridgeTest",
        component: () => import("@/views/dev/NativeBridgeTestPage.vue"),
        meta: { depth: 90 }
    })
}

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    if (import.meta.env.DEV && to.path === '/native-bridge-test') {
        return next();
    }

    const publicPages = import.meta.env.DEV ? ['/', '/native-bridge-test'] : ['/'];
    const authRequired = !publicPages.includes(to.path);
    
    // 1. 引导流程 (SystemInfo, User恢复等)
    await userStore.bootstrapApp();

    // 2. 特殊拦截：通话页刷新判定
    // 物理刷新进入 (from.name 为空) 且 目标为通话/呼叫页，强制重定向至首页
    const isCallRoute = ['callPage', 'videoPage'].includes(to.name as string);
    const isInitialLoad = !from.name;
    if (isInitialLoad && isCallRoute) {
        console.warn("[Router] Refresh detected on call/video page. Redirecting to home.");
        return next('/');
    }

    // 3. 需登录页：无 token 回启动页完成匿名注册
    if (authRequired && !userStore.token) {
        console.warn("[Router] No token, redirecting to launch");
        return next({ path: '/', query: { redirect: to.fullPath }, replace: true });
    }

    if (from.name === 'messageDetail' && to.name === 'AnchorProfile') {
        to.meta.depth = 60;
    }

    next();
});

router.afterEach(() => {
    // 通知 App 隐藏全局加载动画
    hideGlobalLoading();
});

let interactiveRoutesPreloaded = false;
let discoverRoutesPreloaded = false;

export function preloadDiscoverRoutes(): void {
    if (discoverRoutesPreloaded) return;
    discoverRoutesPreloaded = true;

    const preloaders = [
        loadMainTabView,
        loadAnchorList,
    ];

    preloaders.forEach((load) => {
        load().catch((error) => {
            console.warn('[Router] discover route preload failed:', error);
        });
    });
}

export function preloadInteractiveRoutes(): void {
    if (interactiveRoutesPreloaded) return;
    interactiveRoutesPreloaded = true;

    const preloaders = [
        loadMainTabView,
        loadAnchorList,
        loadMessageList,
        loadUserCenter,
        loadMessageDetail,
        loadAnchorProfile,
        loadCallPage,
        loadVideoPage,
    ];

    preloaders.forEach((load) => {
        load().catch((error) => {
            console.warn('[Router] route preload failed:', error);
        });
    });
}

export default router

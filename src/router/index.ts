import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import mainTabView from "@/views/tabbarView/mainTabbarView.vue";
import anchorList from "@/views/tabbarSubViews/anchorList.vue";
import messageList from "@/views/tabbarSubViews/messageList.vue";
import userCenter from "@/views/tabbarSubViews/userCenter.vue";
import messageDetail from "@/views/message/ChatDetail/ChatDetailPage.vue"
import { useUserStore } from "@/stores/userStore";
import { hideGlobalLoading } from "@/utils/native/A0019Bridge";

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
        component: mainTabView,
        meta: { depth: 20 },
        children: [
            {
                path: "",
                component: anchorList,
                name: "anchorList",
                meta: { depth: 20 }
            },
            {
                path: "message",
                component: messageList,
                name: "messageList",
                meta: { depth: 20 }
            },
            {
                path: "user",
                component: userCenter,
                name: "userCenter",
                meta: { depth: 20 }
            }
        ],
    },
    {
        path: "/message/detail",
        component: messageDetail,
        name: "messageDetail",
        meta: { depth: 31 }
    },
    {
        path: "/anchorProfile",
        name: "AnchorProfile",
        component: () => import("@/views/AnchorProfile/AnchorProfile.vue"),
        meta: { depth: 40 }
    },
    {
        path: "/call",
        name: "callPage",
        component: () => import("@/views/call/callPage.vue"),
        meta: { depth: 40, disableSwipeBack: true }
    },
    {
        path: "/video",
        name: "videoPage",
        component: () => import("@/views/call/videoPage.vue"),
        meta: { depth: 40, disableSwipeBack: true }
    },
    { path: "/login", redirect: "/" },
    { path: "/register", redirect: "/" },
    { path: "/register/:pathMatch(.*)*", redirect: "/" },
    {
        path: "/profile/edit",
        name: "EditProfile",
        component: () => import("@/views/profile/EditProfilePage.vue"),
        meta: { depth: 30 }
    },
    {
        path: "/profile/like-me",
        name: "LikeMe",
        component: () => import("@/views/profile/UserListPage.vue"),
        props: { title: 'See who liked me', apiType: 'list_like_me' },
        meta: { depth: 30 }
    },
    {
        path: "/profile/visitor",
        name: "Visitor",
        component: () => import("@/views/profile/UserListPage.vue"),
        props: { title: 'Visitors', apiType: 'list_visitor_me' },
        meta: { depth: 30 }
    },
    {
        path: "/profile/my-likes",
        name: "MyLikes",
        component: () => import("@/views/profile/UserListPage.vue"),
        props: { title: 'Girls I like', apiType: 'list_my_like' },
        meta: { depth: 30 }
    },
    {
        path: "/setting",
        name: "Setting",
        component: () => import("@/views/setting/SettingPage.vue"),
        meta: { depth: 30 }
    },
    {
        path: "/setting/account",
        name: "Account",
        component: () => import("@/views/setting/AccountPage.vue"),
        meta: { depth: 40 }
    },
    {
        path: "/setting/blacklist",
        name: "Blacklist",
        component: () => import("@/views/setting/BlacklistPage.vue"),
        meta: { depth: 40 }
    },
    {
        path: "/setting/feedback",
        name: "Feedback",
        component: () => import("@/views/setting/FeedbackPage.vue"),
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
        return next({ path: '/', replace: true });
    }

    next();
});

router.afterEach(() => {
    // 通知 App 隐藏全局加载动画
    hideGlobalLoading();
});

export default router

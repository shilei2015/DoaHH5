import { createRouter, createWebHistory } from "vue-router";
import mainTabView from "@/views/tabbarView/mainTabbarView.vue";
import anchorList from "@/views/tabbarSubViews/anchorList.vue";
import messageList from "@/views/tabbarSubViews/messageList.vue";
import userCenter from "@/views/tabbarSubViews/userCenter.vue";
import messageDetail from "@/views/message/ChatDetail/ChatDetailPage.vue"
import { useUserStore } from "@/stores/userStore";
import LoginedMissions from "@/utils/loginedMissions";
import { hideGlobalLoading } from "@/utils/native/A0019Bridge";

const routes = [
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
        meta: { depth: 30 }
    },
    {
        path: "/call",
        name: "callPage",
        component: () => import("@/views/call/callPage.vue"),
        meta: { depth: 40 }
    },
    {
        path: "/video",
        name: "videoPage",
        component: () => import("@/views/call/videoPage.vue"),
        meta: { depth: 40 }
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginRegister/Login/loginView.vue"),
        meta: { depth: 10 }
    },
    {
        path: "/register",
        name: "register",
        component: () => import("@/views/LoginRegister/Register/register.vue"),
        meta: { depth: 10 },
        children: [
            {
                path: "",
                name: "selecteGender",
                component: () => import("@/views/LoginRegister/Register/registerChildChooseGender.vue"),
                meta: { depth: 10 }
            },
            {
                path: "inputCode",
                name: "inputCode",
                component: () => import("@/views/LoginRegister/Register/registerChildInputCode.vue"),
                meta: { depth: 11 }
            }
        ]
    },
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

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const publicPages = ['/login', '/register', '/'];
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

    // 3. 登录拦截
    if (authRequired && !userStore.token) {
        console.warn("[Router] No token found, redirecting to login");
        return next('/login');
    }

    next();
});

router.afterEach(() => {
    // 通知 App 隐藏全局加载动画
    hideGlobalLoading();
});

export default router
import { createRouter, createWebHistory } from "vue-router";
import mainTabView from "@/views/tabbarView/mainTabbarView.vue";
import anchorList from "@/views/tabbarSubViews/anchorList.vue";
import messageList from "@/views/tabbarSubViews/messageList.vue";
import userCenter from "@/views/tabbarSubViews/userCenter.vue";
import messageDetail from "@/views/message/ChatDetail/ChatDetailPage.vue"
import { useUserStore } from "@/stores/userStore";
import LoginedMissions from "@/utils/loginedMissions";
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
        meta: { depth: 30 }
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

    // 1. Check if token exists
    if (authRequired && !userStore.token) {
        console.warn("[Router] No token found, redirecting to login");
        return next('/login');
    }

    // 2. If token exists, ensure RTM and DB are initialized
    if (userStore.token) {
        // Quietly start background missions (idempotent)
        await LoginedMissions.start();
    }

    next();
});

export default router
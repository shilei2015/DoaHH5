import { createRouter, createWebHistory } from "vue-router";
import mainTabView from "@/views/tabbarView/mainTabbarView.vue";
import anchorList from "@/views/tabbarSubViews/anchorList.vue";
import messageList from "@/views/tabbarSubViews/messageList.vue";
import userCenter from "@/views/tabbarSubViews/userCenter.vue";
const routes = [
    {
        path: "/",
        name: "launch",
        component: () => import("@/views/Launch/launchPage.vue")
    },
    {
        path: "/tab",
        name: "mainTabView",
        component: mainTabView,
        children: [
            {
                path: "",
                component: anchorList,
                name: "anchorList"
            },
            {
                path: "message",
                component: messageList,
                name: "messageList"
            },
            {
                path: "user",
                component: userCenter,
                name: "userCenter"
            }
        ],
    },
    {
        path: "/anchorProfile",
        name: "AnchorProfile",
        component: () => import("@/views/AnchorProfile/AnchorProfile.vue")
    },
    {
        path: "/call",
        name: "callPage",
        component: () => import("@/views/call/callPage.vue")
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginRegister/Login/loginView.vue")
    },
    {
        path: "/register",
        name: "register",
        component: () => import("@/views/LoginRegister/Register/register.vue"),
        children: [
            {
                path: "",
                name: "selecteGender",
                component: () => import("@/views/LoginRegister/Register/registerChildChooseGender.vue"),
            },
            {
                path: "inputCode",
                name: "inputCode",
                component: () => import("@/views/LoginRegister/Register/registerChildInputCode.vue"),
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
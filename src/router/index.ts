import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import DiscoverPage from '../views/DiscoverPage.vue'
import ProfilePage from '../views/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverPage,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
    },
  ],
})

export default router

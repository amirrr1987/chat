import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/chats' },
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/chats',
    component: () => import('@/pages/ChatsPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/chats/new',
    component: () => import('@/pages/NewChatPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/chats/:id',
    component: () => import('@/pages/ChatRoomPage.vue'),
    meta: { auth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.token) return '/login';
  if (to.meta.guest && auth.token) return '/chats';
});

export default router;

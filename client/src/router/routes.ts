import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/:senderId',
        name: 'ChatList',
        component: () => import('pages/ChatList.vue'),
      },
      {
        path: '/:senderId/:getterId',
        name: 'UserPage',
        component: () => import('pages/UserPage.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'ChatList',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: () => import('pages/RegisterPage.vue'),
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;

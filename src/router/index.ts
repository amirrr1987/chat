import { createRouter, createWebHistory } from "vue-router";
import ListView from "@/views/ListView.vue";
import SingleView from "@/views/SingleView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "ListView",
      component: ListView,
    },
    {
      path: "/:id",
      name: "SingleView",
      component: SingleView,
    },
  ],
});

export default router;

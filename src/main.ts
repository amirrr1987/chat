import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
// main.ts
import "uno.css";
import "virtual:unocss-devtools";
import "@unocss/reset/tailwind.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

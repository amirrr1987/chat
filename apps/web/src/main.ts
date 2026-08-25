import { Buffer } from 'buffer';

(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';

import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/display.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/palettes/dark.system.css';
import '@fontsource-variable/vazirmatn/wght.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import './theme/variables.css';
import './theme/chat.css';

const app = createApp(App)
  .use(IonicVue, {
    mode: 'ios',
    animated: true,
  })
  .use(createPinia())
  .use(VueQueryPlugin)
  .use(i18n)
  .use(router);

router.isReady().then(() => app.mount('#app'));

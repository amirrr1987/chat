<template>
  <ion-page>
    <ion-content class="araz-auth-content ion-padding" fullscreen>
      <div class="ion-text-center araz-auth-hero">
        <ion-icon class="araz-brand-icon" :icon="chatbubbles" color="primary" />
        <ion-text color="dark">
          <h1 class="araz-brand-title">{{ t('appName') }}</h1>
        </ion-text>
        <ion-text color="medium">
          <p>{{ t('welcomeBack') }}</p>
        </ion-text>
      </div>

      <form @submit.prevent="onSubmit">
        <ion-list inset>
          <ion-item>
            <ion-input
              v-model="mobile"
              :label="t('mobile')"
              label-placement="stacked"
              type="tel"
              inputmode="tel"
              autocomplete="username"
              placeholder="09xxxxxxxxx"
              required
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              :label="t('password')"
              label-placement="stacked"
              type="password"
              autocomplete="current-password"
              required
            />
          </ion-item>
        </ion-list>

        <ion-text v-if="error" color="danger" class="ion-padding-start">
          <p>{{ error }}</p>
        </ion-text>

        <div class="ion-padding-horizontal">
          <ion-button
            expand="block"
            shape="round"
            type="submit"
            :disabled="loading"
            class="ion-margin-top"
          >
            <ion-spinner v-if="loading" name="crescent" slot="start" />
            {{ t('login') }}
          </ion-button>
          <ion-button expand="block" fill="clear" shape="round" router-link="/register">
            {{ t('register') }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IonPage, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonSpinner,
} from '@ionic/vue';
import { chatbubbles } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { connectSocket } from '@/lib/socket';
import { applyDocumentLocale } from '@/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const mobile = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(mobile.value, password.value);
    if (auth.user?.locale) {
      locale.value = auth.user.locale;
      applyDocumentLocale(auth.user.locale);
    }
    connectSocket();
    router.replace('/chats');
  } catch {
    error.value = t('loginFailed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/login" text="" />
        </ion-buttons>
        <ion-title>{{ t('register') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="araz-auth-content ion-padding" fullscreen>
      <div class="ion-text-center araz-auth-hero">
        <ion-icon class="araz-brand-icon" :icon="personAdd" color="primary" />
        <ion-text color="dark">
          <h1 class="araz-brand-title">{{ t('createAccount') }}</h1>
        </ion-text>
        <ion-text color="medium">
          <p>{{ t('appName') }}</p>
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
              v-model="displayName"
              :label="t('displayName')"
              label-placement="stacked"
              type="text"
              autocomplete="nickname"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              :label="t('password')"
              label-placement="stacked"
              type="password"
              autocomplete="new-password"
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonInput, IonButton, IonText, IonIcon, IonSpinner,
} from '@ionic/vue';
import { personAdd } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';
import { connectSocket } from '@/lib/socket';
import { applyDocumentLocale } from '@/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const mobile = ref('');
const displayName = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.register(mobile.value, password.value, displayName.value || undefined);
    if (auth.user?.locale) {
      locale.value = auth.user.locale;
      applyDocumentLocale(auth.user.locale);
    }
    connectSocket();
    router.replace('/chats');
  } catch (err) {
    console.error('register failed', err);
    error.value = t('registerFailed');
  } finally {
    loading.value = false;
  }
}
</script>

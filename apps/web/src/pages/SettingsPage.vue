<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/chats" />
        </ion-buttons>
        <ion-title>{{ t('settings') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content fullscreen>
      <div class="ion-text-center ion-padding">
        <ion-avatar class="araz-avatar-lg ion-margin-horizontal">
          <img v-if="avatarPreview" :src="avatarPreview" alt="" />
          <div v-else class="araz-avatar-fallback">{{ form.displayName.slice(0, 1) || '?' }}</div>
        </ion-avatar>
        <ion-button size="small" fill="outline" class="ion-margin-top" @click="pickAvatar">
          {{ t('avatar') }}
        </ion-button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onAvatar" />
      </div>

      <ion-list-header>
        <ion-label>{{ t('profile') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item>
          <ion-input v-model="form.displayName" :label="t('displayName')" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input v-model="form.bio" :label="t('bio')" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-select v-model="form.locale" :label="t('language')" label-placement="stacked" interface="popover">
            <ion-select-option value="fa">فارسی</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select
            v-model="form.lastSeenVisibility"
            :label="t('lastSeenVisibility')"
            label-placement="stacked"
            interface="popover"
          >
            <ion-select-option value="everyone">{{ t('everyone') }}</ion-select-option>
            <ion-select-option value="nobody">{{ t('nobody') }}</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-list-header>
        <ion-label>{{ t('privacy') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item>
          <ion-toggle v-model="form.allowForward" justify="space-between">
            {{ t('allowForward') }}
          </ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle v-model="form.allowScreenshot" justify="space-between">
            {{ t('allowScreenshot') }}
          </ion-toggle>
        </ion-item>
        <ion-item lines="none">
          <ion-note class="ion-text-wrap">{{ t('privacyHint') }}</ion-note>
        </ion-item>
      </ion-list>

      <div class="ion-padding-horizontal">
        <ion-button expand="block" shape="round" :disabled="saving" @click="save">
          <ion-spinner v-if="saving" name="crescent" slot="start" />
          {{ t('save') }}
        </ion-button>
      </div>

      <ion-list-header>
        <ion-label>{{ t('sessions') }}</ion-label>
      </ion-list-header>
      <ion-list inset>
        <ion-item v-for="s in sessions" :key="s.id">
          <ion-label>
            <h3>{{ s.deviceName || s.deviceId || 'Device' }}</h3>
            <p>{{ s.ip }} · {{ formatDate(s.createdAt) }}</p>
            <p v-if="s.current">
              <ion-text color="success">{{ t('currentSession') }}</ion-text>
            </p>
          </ion-label>
          <ion-button
            v-if="!s.current"
            slot="end"
            fill="clear"
            color="danger"
            @click="revoke(s.id)"
          >
            {{ t('revokeSession') }}
          </ion-button>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
        <ion-button expand="block" fill="outline" color="danger" @click="revokeAll">
          {{ t('revokeAll') }}
        </ion-button>
        <ion-button expand="block" fill="clear" color="medium" class="ion-margin-top" @click="logout">
          {{ t('logout') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonListHeader, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonAvatar, IonText, IonSpinner, IonToggle, IonNote,
} from '@ionic/vue';
import type { Locale, LastSeenVisibility, SessionDto, UserDto } from '@arazchat/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { applyDocumentLocale } from '@/i18n';
import { disconnectSocket } from '@/lib/socket';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const saving = ref(false);
const sessions = ref<SessionDto[]>([]);
const fileInput = ref<HTMLInputElement>();
const avatarPreview = ref(auth.user?.avatarUrl ?? null);

const form = reactive({
  displayName: auth.user?.displayName ?? '',
  bio: auth.user?.bio ?? '',
  locale: (auth.user?.locale ?? 'fa') as Locale,
  lastSeenVisibility: (auth.user?.lastSeenVisibility ?? 'everyone') as LastSeenVisibility,
  avatarUrl: auth.user?.avatarUrl ?? null as string | null,
  allowForward: auth.user?.allowForward ?? true,
  allowScreenshot: auth.user?.allowScreenshot ?? true,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value === 'fa' ? 'fa-IR' : 'en-US');
}

async function loadSessions() {
  const { data } = await api.get<SessionDto[]>('/auth/sessions');
  sessions.value = data;
}

function pickAvatar() {
  fileInput.value?.click();
}

async function onAvatar(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post<{ url: string }>('/upload/image', body);
  form.avatarUrl = data.url;
  avatarPreview.value = data.url;
}

async function save() {
  saving.value = true;
  try {
    const { data } = await api.patch<UserDto>('/users/me', {
      displayName: form.displayName,
      bio: form.bio || null,
      locale: form.locale,
      lastSeenVisibility: form.lastSeenVisibility,
      avatarUrl: form.avatarUrl,
      allowForward: form.allowForward,
      allowScreenshot: form.allowScreenshot,
    });
    auth.setUser(data);
    locale.value = data.locale;
    applyDocumentLocale(data.locale);
  } finally {
    saving.value = false;
  }
}

async function revoke(id: string) {
  await api.delete(`/auth/sessions/${id}`);
  await loadSessions();
}

async function revokeAll() {
  await api.delete('/auth/sessions');
  await loadSessions();
}

async function logout() {
  disconnectSocket();
  await auth.logout();
  router.replace('/login');
}

onMounted(loadSessions);
</script>

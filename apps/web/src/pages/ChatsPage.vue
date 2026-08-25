<template>
  <ion-page class="araz-chats-page">
    <ion-header translucent collapse="fade">
      <ion-toolbar class="araz-chats-toolbar">
        <div slot="start" class="araz-brand-chip" aria-hidden="true">Araz</div>
        <ion-title>{{ t('chats') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/settings" :aria-label="t('settings')" class="araz-settings-btn">
            <ion-icon slot="icon-only" :icon="settingsOutline" color="primary" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="araz-chats-toolbar">
        <ion-searchbar
          v-model="filter"
          class="araz-searchbar"
          :placeholder="t('searchChats')"
          animated
          :debounce="150"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="araz-chats-content">
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <ion-list v-if="filteredChats.length" lines="none" class="araz-chat-list">
        <ion-item
          v-for="chat in filteredChats"
          :key="chat.id"
          button
          :detail="false"
          class="araz-chat-row"
          :class="{ unread: chat.unreadCount > 0, saved: chat.isSavedMessages }"
          :router-link="`/chats/${chat.id}`"
        >
          <div slot="start" class="araz-avatar-wrap">
            <ion-avatar>
              <template v-if="chat.isSavedMessages">
                <div class="araz-avatar-fallback araz-saved-avatar">
                  <ion-icon :icon="bookmark" />
                </div>
              </template>
              <template v-else>
                <img v-if="chatAvatar(chat)" :src="chatAvatar(chat)!" alt="" />
                <div v-else class="araz-avatar-fallback">{{ chatTitle(chat).slice(0, 1) }}</div>
              </template>
            </ion-avatar>
            <span v-if="isOnline(chat)" class="araz-online-dot" aria-hidden="true" />
          </div>
          <ion-label>
            <h2>
              <ion-icon v-if="chat.isSavedMessages" :icon="bookmark" color="primary" class="araz-inline-icon" />
              {{ chatTitle(chat) }}
            </h2>
            <p>
              <ion-icon
                v-if="chat.lastMessage && chat.lastMessage.senderId === auth.user?.id && !chat.lastMessage.deletedAt"
                class="araz-ticks araz-list-ticks"
                :class="listStatusClass(chat.lastMessage.status)"
                :icon="listStatusIcon(chat.lastMessage.status)"
              />
              <template v-if="chat.lastMessage?.deletedAt">{{ t('deletedMessage') }}</template>
              <template v-else-if="chat.lastMessage?.type === 'image'">{{ t('image') }}</template>
              <template v-else-if="chat.lastMessage">{{ chat.lastMessage.content }}</template>
              <template v-else>&nbsp;</template>
            </p>
          </ion-label>
          <div slot="end" class="araz-chat-meta">
            <ion-note :class="{ unread: chat.unreadCount > 0 }">
              {{ formatTime(chat.updatedAt) }}
            </ion-note>
            <ion-badge
              v-if="chat.unreadCount > 0"
              color="primary"
              class="araz-badge-unread"
            >
              {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
            </ion-badge>
          </div>
        </ion-item>
      </ion-list>

      <div v-else-if="!isLoading" class="araz-empty ion-padding">
        <ion-icon :icon="chatbubblesOutline" color="primary" />
        <ion-text color="dark"><h2 class="araz-empty-title">{{ t('noChats') }}</h2></ion-text>
        <ion-text color="medium"><p>{{ t('noChatsHint') }}</p></ion-text>
        <ion-button router-link="/chats/new" shape="round" class="araz-cta-main">{{ t('startChat') }}</ion-button>
        <ion-button fill="outline" shape="round" @click="openSaved">{{ t('savedMessages') }}</ion-button>
      </div>

      <div v-else class="araz-empty">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <ion-fab class="araz-fab" slot="fixed" vertical="bottom" horizontal="end" edge>
        <ion-fab-button :aria-label="t('newChat')" @click="fabOpen = !fabOpen">
          <ion-icon :icon="fabOpen ? closeOutline : pencilOutline" />
        </ion-fab-button>
        <ion-fab-list side="top" :activated="fabOpen">
          <ion-fab-button :aria-label="t('savedMessages')" color="secondary" @click="openSaved">
            <ion-icon :icon="bookmarkOutline" />
          </ion-fab-button>
          <ion-fab-button router-link="/chats/new" :aria-label="t('newChat')" color="primary" @click="fabOpen = false">
            <ion-icon :icon="personAddOutline" />
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonNote, IonButton, IonButtons, IonIcon, IonRefresher, IonRefresherContent,
  IonAvatar, IonBadge, IonFab, IonFabButton, IonFabList, IonText, IonSpinner, IonSearchbar,
} from '@ionic/vue';
import {
  pencilOutline, settingsOutline, chatbubblesOutline, bookmark, bookmarkOutline,
  personAddOutline, closeOutline, checkmarkOutline, checkmarkDoneOutline,
} from 'ionicons/icons';
import type { ChatDto, MessageStatus } from '@arazchat/shared';
import { useAuthStore } from '@/stores/auth';
import { useChatsQuery, useCreateDirectChat } from '@/composables/useChatQueries';
import { useRealtimeMessages } from '@/composables/useRealtimeMessages';

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const filter = ref('');
const fabOpen = ref(false);
const { data, isLoading, refetch } = useChatsQuery();
const createDirect = useCreateDirectChat();
const chats = computed(() => data.value ?? []);

useRealtimeMessages();

const filteredChats = computed(() => {
  const q = filter.value.trim().toLowerCase();
  if (!q) return chats.value;
  return chats.value.filter((c) => chatTitle(c).toLowerCase().includes(q));
});

function listStatusIcon(status: MessageStatus | undefined) {
  if (status === 'delivered' || status === 'read') return checkmarkDoneOutline;
  return checkmarkOutline;
}

function listStatusClass(status: MessageStatus | undefined) {
  if (status === 'read') return 'araz-ticks--read';
  if (status === 'delivered') return 'araz-ticks--delivered';
  return 'araz-ticks--sent';
}

function chatTitle(chat: ChatDto) {
  if (chat.isSavedMessages || chat.type === 'saved') return t('savedMessages');
  if (chat.type === 'group') return chat.name ?? t('group');
  const other = chat.participants.find((p) => p.id !== auth.user?.id);
  return other?.displayName ?? t('direct');
}

function chatAvatar(chat: ChatDto) {
  if (chat.isSavedMessages || chat.type === 'saved' || chat.type === 'group') return null;
  return chat.participants.find((p) => p.id !== auth.user?.id)?.avatarUrl ?? null;
}

function isOnline(chat: ChatDto) {
  if (chat.type !== 'direct' || chat.isSavedMessages) return false;
  return !!chat.participants.find((p) => p.id !== auth.user?.id)?.isOnline;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const loc = locale.value === 'fa' ? 'fa-IR' : 'en-US';
  if (sameDay) return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(loc, { month: 'short', day: 'numeric' });
}

async function refresh(ev: CustomEvent) {
  await refetch();
  (ev.target as HTMLIonRefresherElement).complete();
}

async function openSaved() {
  fabOpen.value = false;
  if (!auth.user?.id) return;
  const chat = await createDirect.mutateAsync(auth.user.id);
  router.push(`/chats/${chat.id}`);
}
</script>

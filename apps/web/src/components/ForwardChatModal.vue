<template>
  <ion-modal :is-open="open" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">{{ closeLabel }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="q" :placeholder="searchPlaceholder" :debounce="150" />
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="none">
        <ion-item
          v-for="chat in filtered"
          :key="chat.id"
          button
          :detail="false"
          class="araz-chat-row"
          @click="$emit('select', chat.id)"
        >
          <div slot="start" class="araz-avatar-wrap">
            <ion-avatar>
              <div class="araz-avatar-fallback" :class="{ 'araz-saved-avatar': chat.isSavedMessages }">
                <ion-icon v-if="chat.isSavedMessages" :icon="bookmark" />
                <template v-else>{{ label(chat).slice(0, 1) }}</template>
              </div>
            </ion-avatar>
          </div>
          <ion-label>
            <h2>{{ label(chat) }}</h2>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonLabel, IonAvatar, IonIcon, IonSearchbar,
} from '@ionic/vue';
import { bookmark } from 'ionicons/icons';
import type { ChatDto } from '@arazchat/shared';

const props = defineProps<{
  open: boolean;
  chats: ChatDto[];
  title: string;
  closeLabel: string;
  searchPlaceholder: string;
  labelFn: (chat: ChatDto) => string;
}>();

defineEmits<{ close: []; select: [chatId: string] }>();

const q = ref('');
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  if (!s) return props.chats;
  return props.chats.filter((c) => props.labelFn(c).toLowerCase().includes(s));
});

function label(chat: ChatDto) {
  return props.labelFn(chat);
}
</script>

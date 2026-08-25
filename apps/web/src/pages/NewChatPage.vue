<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/chats" />
        </ion-buttons>
        <ion-title>{{ t('newChat') }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="mode">
          <ion-segment-button value="direct">
            <ion-label>{{ t('direct') }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="group">
            <ion-label>{{ t('group') }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen>
      <ion-list inset lines="none" class="ion-margin-top">
        <ion-item button :detail="false" @click="openSaved">
          <ion-avatar slot="start">
            <div class="araz-avatar-fallback araz-saved-avatar">
              <ion-icon :icon="bookmark" />
            </div>
          </ion-avatar>
          <ion-label>
            <h2>{{ t('savedMessages') }}</h2>
            <p>{{ t('me') }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-searchbar
        v-model="search"
        :placeholder="t('searchUser')"
        :debounce="300"
        animated
      />

      <template v-if="mode === 'group'">
        <ion-list inset>
          <ion-item>
            <ion-input
              v-model="groupName"
              :label="t('groupName')"
              label-placement="stacked"
              :placeholder="t('groupName')"
            />
          </ion-item>
        </ion-list>
        <div class="ion-padding-horizontal ion-padding-bottom">
          <ion-chip v-for="id in selectedIds" :key="id" color="primary" outline>
            <ion-label>{{ userName(id) }}</ion-label>
            <ion-icon :icon="closeCircle" @click="toggleUser(id)" />
          </ion-chip>
        </div>
      </template>

      <ion-list v-if="users.length" inset lines="full">
        <ion-item
          v-for="user in users"
          :key="user.id"
          button
          detail
          @click="onSelectUser(user.id)"
        >
          <ion-avatar slot="start">
            <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" />
            <div v-else class="araz-avatar-fallback">{{ user.displayName.slice(0, 1) }}</div>
          </ion-avatar>
          <ion-label>
            <h2>{{ user.displayName }}</h2>
            <p>{{ user.mobile }}</p>
          </ion-label>
          <ion-icon
            v-if="mode === 'group' && selectedIds.has(user.id)"
            slot="end"
            :icon="checkmarkCircle"
            color="primary"
          />
        </ion-item>
      </ion-list>

      <div v-else-if="search.trim()" class="araz-empty ion-padding">
        <ion-text color="medium">
          <p>{{ t('noUsers') }}</p>
        </ion-text>
      </div>

      <div v-if="mode === 'group'" class="ion-padding">
        <ion-button
          expand="block"
          :disabled="!groupName || selectedIds.size === 0 || creating"
          @click="createGroupChat"
        >
          <ion-spinner v-if="creating" name="crescent" slot="start" />
          {{ t('createGroup') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSearchbar, IonList, IonItem, IonLabel, IonSegment, IonSegmentButton,
  IonInput, IonButton, IonChip, IonIcon, IonAvatar, IonText, IonSpinner,
} from '@ionic/vue';
import { checkmarkCircle, closeCircle, bookmark } from 'ionicons/icons';
import type { UserDto } from '@arazchat/shared';
import { api } from '@/lib/api';
import { useCreateDirectChat, useCreateGroupChat } from '@/composables/useChatQueries';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const mode = ref<'direct' | 'group'>('direct');
const search = ref('');
const groupName = ref('');
const selectedIds = ref(new Set<string>());
const usersCache = ref<Map<string, UserDto>>(new Map());

const { data: usersData } = useQuery({
  queryKey: computed(() => ['users', 'search', search.value]),
  queryFn: async () => {
    if (!search.value.trim()) return [] as UserDto[];
    const { data } = await api.get<UserDto[]>('/users/search', { params: { q: search.value } });
    for (const u of data) usersCache.value.set(u.id, u);
    return data;
  },
});
const users = computed(() => usersData.value ?? []);

const createDirect = useCreateDirectChat();
const createGroupMutation = useCreateGroupChat();
const creating = computed(() => createDirect.isPending.value || createGroupMutation.isPending.value);

watch(mode, () => selectedIds.value.clear());

async function openSaved() {
  if (!auth.user?.id) return;
  const chat = await createDirect.mutateAsync(auth.user.id);
  router.replace(`/chats/${chat.id}`);
}

function userName(id: string) {
  return usersCache.value.get(id)?.displayName ?? id.slice(0, 8);
}

function toggleUser(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
}

async function onSelectUser(id: string) {
  if (mode.value === 'direct') {
    const chat = await createDirect.mutateAsync(id);
    router.replace(`/chats/${chat.id}`);
  } else {
    toggleUser(id);
  }
}

async function createGroupChat() {
  const chat = await createGroupMutation.mutateAsync({
    name: groupName.value,
    participantIds: [...selectedIds.value],
  });
  router.replace(`/chats/${chat.id}`);
}
</script>

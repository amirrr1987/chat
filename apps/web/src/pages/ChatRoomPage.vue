<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/chats" text="" />
        </ion-buttons>
        <ion-avatar slot="start" class="araz-header-avatar">
          <div v-if="chat?.isSavedMessages" class="araz-avatar-fallback araz-saved-avatar">
            <ion-icon :icon="bookmark" />
          </div>
          <template v-else>
            <img v-if="peerAvatar" :src="peerAvatar" alt="" />
            <div v-else class="araz-avatar-fallback">{{ title.slice(0, 1) }}</div>
          </template>
        </ion-avatar>
        <ion-title>
          <div class="araz-title-block">
            <div>{{ title }}</div>
            <div
              v-if="presenceText"
              class="araz-presence"
              :class="{ 'is-offline': !isPeerOnline }"
            >
              {{ presenceText }}
            </div>
          </div>
        </ion-title>
        <ion-buttons v-if="chat && !chat.isSavedMessages" slot="end">
          <ion-button
            v-if="chat.type === 'direct'"
            :aria-label="t('voiceCall')"
            :disabled="call.isOpen"
            @click="startVoiceCall"
          >
            <ion-icon slot="icon-only" :icon="callOutline" color="primary" />
          </ion-button>
          <ion-button :aria-label="t('chatPrivacy')" @click="privacyOpen = true">
            <ion-icon slot="icon-only" :icon="shieldOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content
      ref="contentRef"
      class="araz-chat-content"
      :class="{ 'araz-no-screenshot': chat && !chat.allowScreenshot }"
      fullscreen
    >
      <div class="araz-messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="araz-message"
          :class="{ 'araz-message--mine': msg.senderId === auth.user?.id }"
          @contextmenu.prevent="openActions(msg)"
        >
          <div
            v-if="msg.senderId !== auth.user?.id && chat?.type === 'group'"
            class="araz-sender-name"
          >
            {{ msg.sender.displayName }}
          </div>
          <div
            class="araz-bubble"
            :class="{ 'araz-bubble--deleted': !!msg.deletedAt }"
            @click="openActions(msg)"
          >
            <template v-if="msg.deletedAt">
              <em>{{ t('deletedMessage') }}</em>
            </template>
            <template v-else>
              <div v-if="msg.forwardFrom" class="araz-forward-label">
                <ion-icon :icon="arrowRedoOutline" />
                {{ t('forwardedFrom') }} {{ msg.forwardFrom.senderName }}
              </div>
              <button
                v-if="msg.replyTo"
                type="button"
                class="araz-reply-quote"
                @click.stop
              >
                <strong>{{ msg.replyTo.senderName }}</strong>
                <span>{{ msg.replyTo.deleted ? t('deletedMessage') : msg.replyTo.content }}</span>
              </button>
              <img v-if="msg.type === 'image'" :src="msg.content" :alt="t('image')" />
              <span v-else class="araz-bubble-body">{{ msg.content }}</span>
              <span class="araz-bubble-meta">
                <span v-if="msg.editedAt">{{ t('edited') }}</span>
                <span>{{ formatMsgTime(msg.createdAt) }}</span>
                <ion-icon
                  v-if="msg.senderId === auth.user?.id"
                  class="araz-ticks"
                  :class="statusClass(msg.status)"
                  :icon="statusIcon(msg.status)"
                  :aria-label="statusLabel(msg.status)"
                />
              </span>
            </template>
          </div>
        </div>
      </div>
    </ion-content>

    <div v-if="screenshotShield" class="araz-screenshot-shield">
      {{ t('screenshotBlocked') }}
    </div>

    <ion-footer>
      <ion-toolbar v-if="editingId || replyTo" color="light" class="araz-edit-bar">
        <ion-icon
          slot="start"
          :icon="editingId ? createOutline : arrowUndoOutline"
          color="primary"
          class="ion-padding-start"
        />
        <ion-label class="ion-text-wrap">
          <p v-if="editingId">{{ t('edit') }}</p>
          <template v-else-if="replyTo">
            <strong>{{ replyTo.sender.displayName }}</strong>
            <p>{{ replyPreview }}</p>
          </template>
        </ion-label>
        <ion-buttons slot="end">
          <ion-button :aria-label="t('cancel')" @click="cancelComposeExtras">
            <ion-icon slot="icon-only" :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar v-if="!editingId" color="light" class="araz-restrict-bar">
        <ion-buttons slot="start">
          <ion-button
            fill="clear"
            :color="restrictForward ? 'danger' : 'medium'"
            :aria-label="t('restrictForward')"
            :title="t('restrictForward')"
            @click="restrictForward = !restrictForward"
          >
            <ion-icon slot="icon-only" :icon="arrowRedoOutline" />
          </ion-button>
          <ion-button
            fill="clear"
            :color="restrictScreenshot ? 'danger' : 'medium'"
            :aria-label="t('restrictScreenshot')"
            :title="t('restrictScreenshot')"
            @click="restrictScreenshot = !restrictScreenshot"
          >
            <ion-icon slot="icon-only" :icon="eyeOffOutline" />
          </ion-button>
        </ion-buttons>
        <ion-note v-if="restrictForward || restrictScreenshot" class="ion-padding-end">
          {{ t('restrictThisMessage') }}
        </ion-note>
      </ion-toolbar>

      <ion-toolbar class="araz-composer">
        <div class="araz-composer-row">
          <ion-button fill="clear" :aria-label="t('emoji')" @click="emojiOpen = true">
            <ion-icon slot="icon-only" :icon="happyOutline" color="medium" />
          </ion-button>
          <ion-button fill="clear" :disabled="!!editingId" :aria-label="t('image')" @click="pickImage">
            <ion-icon slot="icon-only" :icon="imageOutline" color="medium" />
          </ion-button>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onImageSelected" />
          <ion-input
            v-model="text"
            class="araz-composer-input"
            :placeholder="t('messagePlaceholder')"
            enterkeyhint="send"
            @keyup.enter="sendOrSave"
            @ion-input="onTyping"
          />
          <ion-button
            class="araz-send-btn"
            fill="solid"
            color="primary"
            :disabled="!text.trim() || sending"
            :aria-label="t('send')"
            @click="sendOrSave"
          >
            <ion-icon slot="icon-only" :icon="send" />
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>

    <ion-modal :is-open="privacyOpen" @didDismiss="privacyOpen = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ t('chatPrivacy') }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="privacyOpen = false">{{ t('close') }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list inset>
          <ion-item>
            <ion-toggle v-model="chatPrivacy.allowForward" justify="space-between">
              {{ t('chatAllowForward') }}
            </ion-toggle>
          </ion-item>
          <ion-item>
            <ion-toggle v-model="chatPrivacy.allowScreenshot" justify="space-between">
              {{ t('chatAllowScreenshot') }}
            </ion-toggle>
          </ion-item>
          <ion-item lines="none">
            <ion-note class="ion-text-wrap">{{ t('chatPrivacyHint') }}</ion-note>
          </ion-item>
        </ion-list>
        <ion-button expand="block" shape="round" :disabled="privacySaving" @click="saveChatPrivacy">
          {{ t('save') }}
        </ion-button>
      </ion-content>
    </ion-modal>

    <ion-action-sheet
      :is-open="!!actionMsg"
      :header="t('messageActions')"
      :buttons="actionButtons"
      @didDismiss="actionMsg = null"
    />

    <EmojiPickerModal
      :open="emojiOpen"
      :title="t('emoji')"
      :close-label="t('close')"
      @close="emojiOpen = false"
      @pick="onEmoji"
    />

    <ForwardChatModal
      :open="forwardOpen"
      :chats="chats ?? []"
      :title="t('forwardTo')"
      :close-label="t('close')"
      :search-placeholder="t('searchChats')"
      :label-fn="chatTitle"
      @close="forwardOpen = false"
      @select="doForward"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDebounceFn } from '@vueuse/core';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButtons, IonBackButton, IonButton, IonIcon, IonInput, IonActionSheet,
  IonAvatar, IonLabel, IonModal, IonList, IonItem, IonToggle, IonNote,
} from '@ionic/vue';
import {
  send, imageOutline, closeOutline, checkmarkOutline, checkmarkDoneOutline,
  createOutline, bookmark, happyOutline, arrowUndoOutline, arrowRedoOutline,
  shieldOutline, eyeOffOutline, callOutline,
} from 'ionicons/icons';
import { WS_EVENTS, type MessageDto, type MessageStatus, type ChatDto } from '@arazchat/shared';
import { useAuthStore } from '@/stores/auth';
import { useCallStore } from '@/stores/call';
import {
  useMessagesQuery,
  useChatsQuery,
  useUploadImage,
  useUpdateChatPrivacy,
} from '@/composables/useChatQueries';
import { useRealtimeMessages } from '@/composables/useRealtimeMessages';
import { getSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/vue-query';
import EmojiPickerModal from '@/components/EmojiPickerModal.vue';
import ForwardChatModal from '@/components/ForwardChatModal.vue';

const { t, locale } = useI18n();
const route = useRoute();
const auth = useAuthStore();
const call = useCallStore();
const qc = useQueryClient();
const chatId = computed(() => route.params.id as string);
const contentRef = ref<InstanceType<typeof IonContent>>();
const text = ref('');
const sending = ref(false);
const fileInput = ref<HTMLInputElement>();
const editingId = ref<string | null>(null);
const replyTo = ref<MessageDto | null>(null);
const actionMsg = ref<MessageDto | null>(null);
const forwardSource = ref<MessageDto | null>(null);
const emojiOpen = ref(false);
const forwardOpen = ref(false);
const screenshotShield = ref(false);
const privacyOpen = ref(false);
const privacySaving = ref(false);
const restrictForward = ref(false);
const restrictScreenshot = ref(false);
const chatPrivacy = ref({ allowForward: true, allowScreenshot: true });

const { data: chats } = useChatsQuery();
const { data: messageList } = useMessagesQuery(chatId);
const uploadImage = useUploadImage();
const updateChatPrivacy = useUpdateChatPrivacy();
useRealtimeMessages();

const messages = computed(() => messageList.value ?? []);
const chat = computed(() => chats.value?.find((c) => c.id === chatId.value));
const peer = computed(() => {
  if (!chat.value || chat.value.type !== 'direct' || chat.value.isSavedMessages) return null;
  return chat.value.participants.find((p) => p.id !== auth.user?.id) ?? null;
});

const peerAvatar = computed(() => peer.value?.avatarUrl ?? null);
const isPeerOnline = computed(() => !!peer.value?.isOnline);

const title = computed(() => {
  if (!chat.value) return t('direct');
  if (chat.value.isSavedMessages || chat.value.type === 'saved') return t('savedMessages');
  if (chat.value.type === 'group') return chat.value.name ?? t('group');
  return peer.value?.displayName ?? t('direct');
});

const presenceText = computed(() => {
  if (chat.value?.isSavedMessages) return t('me');
  if (!peer.value) return '';
  if (peer.value.isOnline) return t('online');
  if (peer.value.lastSeenAt) {
    const time = new Date(peer.value.lastSeenAt).toLocaleString(
      locale.value === 'fa' ? 'fa-IR' : 'en-US',
      { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' },
    );
    return `${t('lastSeen')} ${time}`;
  }
  return '';
});

const replyPreview = computed(() => {
  if (!replyTo.value) return '';
  if (replyTo.value.deletedAt) return t('deletedMessage');
  if (replyTo.value.type === 'image') return t('image');
  return replyTo.value.content.slice(0, 80);
});

const actionButtons = computed(() => {
  const msg = actionMsg.value;
  if (!msg || msg.deletedAt) return [{ text: t('cancel'), role: 'cancel' }];
  const buttons: Array<{ text: string; role?: string; handler?: () => void }> = [
    {
      text: t('reply'),
      handler: () => {
        replyTo.value = msg;
        editingId.value = null;
      },
    },
  ];
  // Per-message snapshot from send-time (user ∩ chat ∩ restrict)
  if (msg.allowForward !== false) {
    buttons.push({
      text: t('forward'),
      handler: () => {
        forwardSource.value = msg;
        forwardOpen.value = true;
      },
    });
  }
  if (msg.senderId === auth.user?.id && msg.type === 'text') {
    buttons.push({
      text: t('edit'),
      handler: () => {
        editingId.value = msg.id;
        text.value = msg.content;
        replyTo.value = null;
      },
    });
    buttons.push({
      text: t('delete'),
      role: 'destructive',
      handler: () => {
        getSocket().emit(WS_EVENTS.MESSAGE_DELETE, { messageId: msg.id });
      },
    });
  }
  buttons.push({ text: t('cancel'), role: 'cancel' });
  return buttons;
});

function chatTitle(c: ChatDto) {
  if (c.isSavedMessages || c.type === 'saved') return t('savedMessages');
  if (c.type === 'group') return c.name ?? t('group');
  const other = c.participants.find((p) => p.id !== auth.user?.id);
  return other?.displayName ?? t('direct');
}

function statusIcon(status: MessageStatus | undefined) {
  if (status === 'delivered' || status === 'read') return checkmarkDoneOutline;
  return checkmarkOutline;
}

function statusClass(status: MessageStatus | undefined) {
  if (status === 'read') return 'araz-ticks--read';
  if (status === 'delivered') return 'araz-ticks--delivered';
  return 'araz-ticks--sent';
}

function statusLabel(status: MessageStatus | undefined) {
  if (status === 'read') return t('statusRead');
  if (status === 'delivered') return t('statusDelivered');
  return t('statusSent');
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openActions(msg: MessageDto) {
  if (msg.deletedAt) return;
  actionMsg.value = msg;
}

function startVoiceCall() {
  if (!chat.value || chat.value.type !== 'direct' || chat.value.isSavedMessages) return;
  call.startOutgoing(chat.value.id, title.value);
}

function cancelComposeExtras() {
  if (editingId.value) text.value = '';
  editingId.value = null;
  replyTo.value = null;
}

function onEmoji(e: string) {
  text.value += e;
  emojiOpen.value = false;
}

function scrollBottom() {
  requestAnimationFrame(() => contentRef.value?.$el.scrollToBottom(280));
}

function buildRestrictPayload(payload: Record<string, unknown>) {
  if (restrictForward.value) payload.restrictForward = true;
  if (restrictScreenshot.value) payload.restrictScreenshot = true;
}

async function sendOrSave() {
  const content = text.value.trim();
  if (!content) return;
  sending.value = true;
  try {
    if (editingId.value) {
      getSocket().emit(WS_EVENTS.MESSAGE_EDIT, {
        messageId: editingId.value,
        content,
      });
      editingId.value = null;
      text.value = '';
    } else {
      text.value = '';
      const payload: Record<string, unknown> = {
        chatId: chatId.value,
        type: 'text',
        content,
      };
      if (replyTo.value) payload.replyToMessageId = replyTo.value.id;
      buildRestrictPayload(payload);
      replyTo.value = null;
      restrictForward.value = false;
      restrictScreenshot.value = false;
      getSocket().emit(WS_EVENTS.SEND_MESSAGE, payload);
    }
  } finally {
    sending.value = false;
  }
}

async function doForward(targetChatId: string) {
  if (!forwardSource.value || forwardSource.value.allowForward === false) return;
  forwardOpen.value = false;
  getSocket().emit(WS_EVENTS.SEND_MESSAGE, {
    chatId: targetChatId,
    forwardFromMessageId: forwardSource.value.id,
  });
  forwardSource.value = null;
  if (targetChatId === chatId.value) scrollBottom();
}

function pickImage() {
  fileInput.value?.click();
}

async function onImageSelected(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  sending.value = true;
  try {
    const url = await uploadImage.mutateAsync(file);
    const payload: Record<string, unknown> = {
      chatId: chatId.value,
      type: 'image',
      content: url,
    };
    if (replyTo.value) payload.replyToMessageId = replyTo.value.id;
    buildRestrictPayload(payload);
    replyTo.value = null;
    restrictForward.value = false;
    restrictScreenshot.value = false;
    getSocket().emit(WS_EVENTS.SEND_MESSAGE, payload);
  } finally {
    sending.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function saveChatPrivacy() {
  privacySaving.value = true;
  try {
    await updateChatPrivacy.mutateAsync({
      chatId: chatId.value,
      allowForward: chatPrivacy.value.allowForward,
      allowScreenshot: chatPrivacy.value.allowScreenshot,
    });
    privacyOpen.value = false;
  } finally {
    privacySaving.value = false;
  }
}

const emitTyping = useDebounceFn((isTyping: boolean) => {
  getSocket().emit(WS_EVENTS.TYPING, { chatId: chatId.value, isTyping });
}, 300);

function onTyping() {
  if (!editingId.value) emitTyping(true);
}

function onVisibility() {
  if (chat.value && !chat.value.allowScreenshot && document.hidden) {
    screenshotShield.value = true;
  } else if (!document.hidden) {
    screenshotShield.value = false;
  }
}

onMounted(() => {
  const socket = getSocket();
  socket.emit(WS_EVENTS.JOIN_CHAT, { chatId: chatId.value });
  qc.setQueryData<ChatDto[]>(['chats'], (old) =>
    (old ?? []).map((c) => (c.id === chatId.value ? { ...c, unreadCount: 0 } : c)),
  );
  document.addEventListener('visibilitychange', onVisibility);
  scrollBottom();
});

onUnmounted(() => {
  getSocket().emit(WS_EVENTS.LEAVE_CHAT, { chatId: chatId.value });
  document.removeEventListener('visibilitychange', onVisibility);
});

watch(messages, scrollBottom, { deep: true });

watch(
  chat,
  (c) => {
    if (!c) return;
    chatPrivacy.value = {
      allowForward: c.chatAllowForward ?? true,
      allowScreenshot: c.chatAllowScreenshot ?? true,
    };
  },
  { immediate: true },
);

watch(privacyOpen, (open) => {
  if (!open || !chat.value) return;
  chatPrivacy.value = {
    allowForward: chat.value.chatAllowForward ?? true,
    allowScreenshot: chat.value.chatAllowScreenshot ?? true,
  };
});
</script>

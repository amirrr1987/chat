<template>
    <div v-if="call.isOpen || call.error" class="araz-call-overlay" role="dialog" aria-modal="true" @click.self="dismissError">
    <div class="araz-call-card">
      <div class="araz-call-pulse" aria-hidden="true" />
      <div class="araz-call-avatar">
        {{ (call.peerName || '?').slice(0, 1) }}
      </div>
      <h2 class="araz-call-name">{{ call.peerName || t('direct') }}</h2>
      <p class="araz-call-status">{{ statusText }}</p>
      <p v-if="elapsed" class="araz-call-timer">{{ elapsed }}</p>

      <div class="araz-call-actions">
        <template v-if="call.phase === 'incoming'">
          <ion-button class="araz-call-btn araz-call-btn--accept" shape="round" @click="call.accept()">
            <ion-icon slot="icon-only" :icon="callOutline" />
          </ion-button>
          <ion-button class="araz-call-btn araz-call-btn--hang" shape="round" color="danger" @click="call.reject()">
            <ion-icon slot="icon-only" :icon="closeOutline" />
          </ion-button>
        </template>
        <template v-else>
          <ion-button
            class="araz-call-btn"
            shape="round"
            fill="outline"
            :color="call.muted ? 'warning' : 'medium'"
            @click="call.toggleMute()"
          >
            <ion-icon slot="icon-only" :icon="call.muted ? micOffOutline : micOutline" />
          </ion-button>
          <ion-button class="araz-call-btn araz-call-btn--hang" shape="round" color="danger" @click="call.hangup()">
            <ion-icon slot="icon-only" :icon="callOutline" class="araz-hang-flip" />
          </ion-button>
        </template>
      </div>
    </div>

    <audio ref="remoteAudio" autoplay playsinline />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { IonButton, IonIcon } from '@ionic/vue';
import { callOutline, closeOutline, micOutline, micOffOutline } from 'ionicons/icons';
import { useCallStore } from '@/stores/call';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const call = useCallStore();
const auth = useAuthStore();
const remoteAudio = ref<HTMLAudioElement | null>(null);
const now = ref(Date.now());
let tick: ReturnType<typeof setInterval> | null = null;

const statusText = computed(() => {
  if (call.error === 'mic') return t('callMicDenied');
  if (call.error === 'busy') return t('callBusy');
  if (call.error === 'rejected') return t('callRejected');
  switch (call.phase) {
    case 'outgoing':
      return t('callCalling');
    case 'incoming':
      return t('callIncoming');
    case 'connecting':
      return t('callConnecting');
    case 'active':
      return t('callActive');
    default:
      return '';
  }
});

const elapsed = computed(() => {
  if (call.phase !== 'active' || !call.startedAt) return '';
  const sec = Math.max(0, Math.floor((now.value - call.startedAt) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

watch(
  () => call.remoteStream,
  (stream) => {
    if (remoteAudio.value && stream) {
      remoteAudio.value.srcObject = stream;
      void remoteAudio.value.play().catch(() => undefined);
    }
  },
);

watch(
  () => call.error,
  (err) => {
    if (!err) return;
    setTimeout(() => {
      if (call.phase === 'idle') call.error = null;
    }, 2200);
  },
);

onMounted(() => {
  if (auth.token) call.bindSocket();
  tick = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (tick) clearInterval(tick);
});

watch(
  () => auth.token,
  (token) => {
    if (token) call.bindSocket();
  },
);

function dismissError() {
  if (!call.isOpen && call.error) call.error = null;
}
</script>

<template>
  <ion-modal :is-open="open" :initial-breakpoint="0.45" :breakpoints="[0, 0.45, 0.75]" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">{{ closeLabel }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="araz-emoji-grid">
        <button
          v-for="e in emojis"
          :key="e"
          type="button"
          class="araz-emoji-btn"
          @click="$emit('pick', e)"
        >
          {{ e }}
        </button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/vue';

defineProps<{ open: boolean; title: string; closeLabel: string }>();
defineEmits<{ close: []; pick: [emoji: string] }>();

const emojis = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤩','😇',
  '🙂','😉','😭','😤','😡','🤯','😴','🤗','🤔','🫡',
  '👍','👎','👏','🙌','🙏','🔥','✨','💯','❤️','💙',
  '💚','💛','💜','🖤','🤍','💔','⭐','🌟','🎉','🎊',
  '✅','❌','⚡','💡','📌','📎','📷','🎵','🏆','🎁',
  '☕','🍕','🍔','🍦','🌈','🌙','☀️','🌸','🍀','🐱',
  '🐶','🦄','🚀','✈️','🏠','💬','📝','🔒','🔓','🤝',
];
</script>

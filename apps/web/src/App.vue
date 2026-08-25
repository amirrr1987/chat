<template>
  <ion-app>
    <ion-router-outlet />
    <VoiceCallOverlay />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import VoiceCallOverlay from '@/components/VoiceCallOverlay.vue';
</script>

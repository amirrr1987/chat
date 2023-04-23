<template>
  <q-header elevated>
    <q-toolbar>
      <q-btn
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="appConfigStore.toggleDrawer"
      />

      <q-toolbar-title> Quasar App </q-toolbar-title>

      <div>Quasar v{{ $q.version }}</div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { useAppConfigStore } from 'src/stores/AppConfig';

const appConfigStore = useAppConfigStore();
</script>

<style scoped></style>

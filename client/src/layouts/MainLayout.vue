<template>
  <q-layout view="lHh Lpr lFf">
    <TheHeader />
    <TheDrawer />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import TheHeader from 'src/components/TheHeader.vue';
import TheDrawer from 'src/components/TheDrawer.vue';
</script>

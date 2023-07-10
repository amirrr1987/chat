<template>
  <q-list>
    <template v-for="(friend, index) in friends" :key="index">
      <q-item clickable v-ripple top>
        <q-item-section avatar>
          <q-avatar>
            <img :src="friend.avatar" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ friend.name }}</q-item-label>
          <q-item-label caption>{{ friend.lastText }}</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-item-label overline>{{ friend.lastSeen }}</q-item-label>
          <q-item-label><q-badge rounded  label="1" /></q-item-label>
        </q-item-section>
      </q-item>
      <q-separator />
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const friends = ref([
  {
    chatId: '1',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
  {
    chatId: '2',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
  {
    chatId: '3',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
  {
    chatId: '4',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
  {
    chatId: '5',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
  {
    chatId: '6',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
    name: 'Amir Maghami',
    lastSeen: '02:20',
    lastText: 'hello, world',
  },
]);
</script>
<style lang="scss"></style>

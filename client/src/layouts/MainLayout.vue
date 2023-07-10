<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Telegram </q-toolbar-title>


      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-img
        src="https://cdn.quasar.dev/img/parallax2.jpg"
        spinner-color="white"
        style="height: 170px; max-width: 300px"
        img-class="my-custom-image"
        class="rounded-borders"
      >
        <div class="absolute-bottom text-subtitle1 text-center">
          Amir Maghami
        </div>
      </q-img>
      <q-list>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, {
  EssentialLinkProps,
} from 'components/EssentialLink.vue';

const essentialLinks: EssentialLinkProps[] = [
  {
    title: 'New Group',
    icon: 'people',
    link: 'https://chat.quasar.dev',
  },
  {
    title: 'Contacts',
    icon: 'person',
    link: 'https://chat.quasar.dev',
  },
  {
    title: 'Calls',
    icon: 'call',
    link: 'https://facebook.quasar.dev',
  },
  {
    title: 'People Nearby',
    icon: 'location_on',
    link: 'https://twitter.quasar.dev',
  },
  {
    title: 'Saved Messages',
    icon: 'bookmark_border',
    link: 'https://forum.quasar.dev',
  },
  {
    title: 'Setting',
    icon: 'settings',
    link: 'https://quasar.dev',
    separator: true
  },
  {
    title: 'Invite Friends',
    icon: 'person_add',
    link: 'https://awesome.quasar.dev',
  },
  {
    title: 'Telegram Feathers',
    icon: 'question_mark',
    link: 'https://awesome.quasar.dev',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

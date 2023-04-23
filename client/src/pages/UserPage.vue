<template>
  <q-page class="q-pa-lg">
    <template
      v-for="(item, index) in appConfigStore.state.user.chats"
      :key="index"
    >
      <q-chat-message
        :name="item.sent"
        :avatar="item.avatar"
        :text="['hey, how are you?']"
        :sent="item.sent"
        :stamp="item.stamp"
      />
    </template>

    <q-input v-model="message" />
    <q-btn type="button" @click="submitMessage">send</q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { useAppConfigStore } from 'src/stores/AppConfig';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

const senderId = computed(() => route.params.senderId as string);
const getterId = computed(() => route.params.getterId as string);
const message = ref('Hi User 2');

const appConfigStore = useAppConfigStore();



onMounted(async () => {
  // await appConfigStore.setSender({ senderId: senderId.value });

  // await appConfigStore.getChats({
  //   getterId: getterId.value,
  // });
});

const submitMessage = async () => {
  if (message.value.length > 0) {
    await appConfigStore.getMessages({
      senderId: senderId.value,
      getterId: getterId.value,
      message: message.value,
    });
    message.value = '';
    appConfigStore.getUsers();
  }
};
</script>

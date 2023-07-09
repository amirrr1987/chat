<template>
  <q-page class="q-pa-md custom">
    <div>
      <q-chat-message
        v-for="(message, index) in messages"
        :text="[message.text]"
        :sent="userId !== message.userId"
        :key="index"
      />
    </div>
    <q-input
      class="custom"
      type="text"
      v-model="newMessage"
      @keydown.enter="sendMessage"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { io } from 'socket.io-client';

interface Message {
  userId: string;
  text: string;
}
const userId = ref('');

const socket = io('http://localhost:4000');
const messages = ref<Message[]>([]);
const newMessage = ref<string>('');

socket.on('message', (message: Message) => {
  if (!userId.value) {
    userId.value = message.userId;
  }
  messages.value.push(message);
});

const sendMessage = () => {
  if (newMessage.value.length > 0) {
    socket.emit('sendMessage', {
      text: newMessage.value,
    });
    newMessage.value = '';
  }
};
</script>
<style lang="scss">
.custom {
  display: grid;
  grid-template-rows: 1fr max-content;
}
</style>

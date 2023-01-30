<template>
  <div class=":uno: grid grid-cols-[max-content_1fr]">
    <div class="">
      <template v-for="item in users" :key="item">
        <div class=":uno: border border-solid border-gray-200 flex items-center gap-x-2 p-4">
          <div class=":uno: bg-gray-200 rounded-full p-1">
            <img class=":uno: w-10 h-10 mx-auto" :src="item.avatar" alt="" />
          </div>
          <div class="">
            {{ item.username }}
          </div>
          <!-- <div class="">
            {{ item.id }}
          </div> -->
        </div>
      </template>
    </div>
    <div class=":uno: bg-red-500">1</div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const users = reactive([
  {
    id: 1,
    username: "asdasd",
    avatar: "https://techdic.ir/wp-content/uploads/2015/10/Avatar2.png",
  },
  {
    id: 2,
    username: "asdasd",
    avatar: "https://techdic.ir/wp-content/uploads/2015/10/Avatar2.png",
  },
  {
    id: 3,
    username: "asdasd",
    avatar: "",
  },
  {
    id: 4,
    username: "asdasd",
    avatar: "https://techdic.ir/wp-content/uploads/2015/10/Avatar2.png",
  },
]);
</script>

<style scoped></style>

<template>
  <q-drawer
    v-model="appConfigStore.state.drawerVisibility"
    show-if-above
    bordered
  >
    <q-list>
      <q-banner
        class="bg-blue-8 text-white"
        style="height: 100%; aspect-ratio: 3/2; overflow: hidden"
      >
        <img
          style="height: 100%; display: block"
          src="https://cdn.quasar.dev/img/avatar1.jpg"
          alt=""
        />
        Amir Maghami
      </q-banner>
      <template
        v-for="(item, index) in appConfigStore.state.users"
        :key="index"
      >
        <q-item clickable @click="selectThisUser({ getterId: item._id })">
          <q-item-section v-if="item.avatar" avatar>
            <q-avatar>
              <img :src="item.avatar" alt="" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.username }}</q-item-label>
            <!-- <q-item-label caption>{{ item.lastText }}</q-item-label> -->
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppConfigStore } from 'src/stores/AppConfig';

const route = useRoute();

const senderId = computed(() => route.params.senderId);
onMounted(async () => {
  await appConfigStore.getUsersWithoutMe({ senderId: senderId.value });
});

const router = useRouter();
const selectThisUser = ({ getterId }: { getterId: string }) => {
  router.push({ name: 'UserPage', params: { getterId } });
};

const appConfigStore = useAppConfigStore();
</script>

<style scoped></style>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page>
        <div class="q-pa-md">
          <q-form @submit="submit" @reset="onReset" class="q-gutter-md">
            <q-input
              filled
              v-model="user.username"
              label="username *"
              hint="username"
              lazy-rules
              :rules="[
                (val) => (val && val.length > 0) || 'Please type something',
              ]"
            />

            <q-input
              filled
              type="password"
              v-model="user.password"
              label="Your password *"
              lazy-rules
              :rules="[
                (val) =>
                  (val !== null && val !== '') || 'Please type your password',
                (val) =>
                  (val > 0 && val < 100) || 'Please type a real password',
              ]"
            />

            <div>
              <q-btn label="Submit" type="submit" color="primary" />
              <q-btn
                label="Reset"
                type="reset"
                color="primary"
                flat
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { useAppConfigStore } from 'src/stores/AppConfig';
import { reactive } from 'vue';
const appConfigStore = useAppConfigStore();

const user = reactive({
  username: '',
  password: '',
});

const submit = () => {
  const data = api.post('/users', user);
  console.log(data);
};
const onReset = () => {
  Object.assign(user, {
    username: '',
    password: '',
  });
};
</script>

<style scoped></style>

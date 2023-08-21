<template>
  <q-page class="q-pa-md">
    <div>
      <h4>Form</h4>
      <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
        <q-input
          filled
          v-model="form.name"
          label="Your name *"
          hint="Name and surname"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Please type something']"
        />

        <q-input
          filled
          type="number"
          v-model="form.age"
          label="Your age *"
          lazy-rules
          :rules="[
            (val) => (val !== null && val !== '') || 'Please type your age',
            (val) => (val > 0 && val < 100) || 'Please type a real age',
          ]"
        />

        <q-toggle v-model="accept" label="I accept the license and terms" />

        <div>
          <q-btn label="Register" type="submit" color="primary" />
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const form = ref({
  name: '',
  email: '',
  password: '',
  age: 0,
});

const accept = ref(false);

const onSubmit = () => {
  if (accept.value !== true) {
    $q.notify({
      color: 'red-5',
      textColor: 'white',
      icon: 'warning',
      message: 'You need to accept the license and terms first',
    });
  } else {
    setTimeout(() => {
      loading.value = false;
      console.log('Form submitted:', form.value);
    }, 2000);

    $q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'cloud_done',
      message: 'Submitted',
    });
  }
};

const onReset = () => {
  form.value.email = '';
  form.value.name = '';
  form.value.password = '';
  form.value.age = 0;
  accept.value = false;
};

const loading = ref(false);

// const submitForm = () => {
//   // Perform form submission logic here
//   loading.value = true;

//   // Simulate form submission delay

// };
</script>
<style lang="scss"></style>

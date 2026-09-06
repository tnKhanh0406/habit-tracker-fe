<script setup>
import { ref, defineEmits } from "vue";
import { createHabitWithName } from "@/api/habitApi";

const emit = defineEmits(['createdWithName']);

const name = ref('');
const loading = ref(false);
const createHabit = async () => {
  loading.value = true;
  try {
    const response = await createHabitWithName(name.value);
    name.value = '';
    emit('createdWithName', response.data);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="createHabit">
    <input v-model="name" placeholder="Enter habit name" />
    <button type="submit" :disabled="loading">Add Habit</button>
  </form>
</template>
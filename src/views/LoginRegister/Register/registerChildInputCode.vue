<script setup lang="ts">
import { useRouter } from 'vue-router';


const router = useRouter()

const toMainTab = () => {
    router.push({ name: "anchorList" })
}


</script>

<template>

    <button @click="toMainTab">to main tab view</button>
</template>

<style scoped></style>
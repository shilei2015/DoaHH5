<template>
  <div class="page home-page">
    <div class="page-header">
      <h1>Home</h1>
    </div>
    <div class="page-content">
      <div class="card">
        <div class="card-icon">🏠</div>
        <h2>Welcome</h2>
        <p :disabled="disableDesc">This is the home page. Start exploring from here. click count {{count}}</p>
        <button @click="addCount" >click me</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

var count = ref(1)
var disableDesc = ref(true)
function addCount() {
  count.value++
  disableDesc.value = !disableDesc.value
}

</script>

<style scoped>
.home-page .page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>

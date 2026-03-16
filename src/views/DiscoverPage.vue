<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: string
  name: string
  age: number
  country: string
  flag: string
  status: 'online' | 'busy' | 'offline'
  label?: 'HOT' | 'NEW'
  image: string
}

const categories = ref(['Hot Girl', 'Ukraine', 'Brazil', 'USA', 'Germany', 'France'])
const activeCategory = ref('Hot Girl')

function selectCategory(cat: string, event: Event) {
  activeCategory.value = cat
  const target = event.currentTarget as HTMLElement
  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }
}

const users = ref<User[]>([
  {
    id: '1',
    name: 'Aarav G',
    age: 28,
    country: 'Ukraine',
    flag: '🇧🇪',
    status: 'online',
    label: 'HOT',
    image: 'http://localhost:3845/assets/7907965e32b971fa53fc7d52c05f4878501d53d1.png',
  },
  {
    id: '2',
    name: 'Aarav G',
    age: 28,
    country: 'USA',
    flag: '🇺🇸',
    status: 'busy',
    label: 'NEW',
    image: 'http://localhost:3845/assets/3aad027746604562d0b60aa55be0857d9ae9ba6f.png',
  },
  {
    id: '3',
    name: 'Aarav G',
    age: 28,
    country: 'Ukraine',
    flag: '🇧🇪',
    status: 'offline',
    label: 'HOT',
    image: 'http://localhost:3845/assets/2468fb655eb3bf56782d36959fcb275551b25a6e.png',
  },
  {
    id: '4',
    name: 'Aarav G',
    age: 28,
    country: 'USA',
    flag: '🇺🇸',
    status: 'busy',
    // label: "",
    image: 'http://localhost:3845/assets/619146beb57443c3c016d16bdf5f42bfca9b0751.png',
  },{
    id: '5',
    name: 'Aarav G',
    age: 28,
    country: 'Ukraine',
    flag: '🇧🇪',
    status: 'online',
    label: 'HOT',
    image: 'http://localhost:3845/assets/7907965e32b971fa53fc7d52c05f4878501d53d1.png',
  },
  {
    id: '6',
    name: 'Aarav G',
    age: 28,
    country: 'USA',
    flag: '🇺🇸',
    status: 'busy',
    label: 'NEW',
    image: 'http://localhost:3845/assets/3aad027746604562d0b60aa55be0857d9ae9ba6f.png',
  },
  {
    id: '7',
    name: 'Aarav G',
    age: 28,
    country: 'Ukraine',
    flag: '🇧🇪',
    status: 'offline',
    label: 'HOT',
    image: 'http://localhost:3845/assets/2468fb655eb3bf56782d36959fcb275551b25a6e.png',
  },
  {
    id: '8',
    name: 'Aarav G',
    age: 28,
    country: 'USA',
    flag: '🇺🇸',
    status: 'busy',
    // label: "",
    image: 'http://localhost:3845/assets/619146beb57443c3c016d16bdf5f42bfca9b0751.png',
  },
])

function getStatusColor(status: User['status']) {
  switch (status) {
    case 'online': return 'var(--status-online)'
    case 'busy': return 'var(--status-busy)'
    case 'offline': return 'var(--status-offline)'
  }
}
</script>

<template>

  

  <div class="discover-page">

    <div class="page-bg">
      <img src="../assets/discover_page_bg.png" alt="">
    </div>

    <!-- Header -->
    <header class="header">
      <h1 class="header-title">Discover</h1>
      <div class="daily-bonus">
        <div class="bonus-bg"></div>
        <div class="bonus-content">
          <span class="bonus-icon">🎁</span>
          <span class="bonus-text">Daily Bonus</span>
        </div>
      </div>
    </header>

    <!-- Categories -->
    <div class="categories-wrapper">
      <div class="categories">
        <button 
          v-for="cat in categories" 
          :key="cat"
          class="category-tag"
          :class="{ active: activeCategory === cat }"
          @click="selectCategory(cat, $event)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- User Grid -->
    <div class="user-grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="card-image-wrapper">
          <img :src="user.image" :alt="user.name" class="card-image" />
          
          <!-- Status Overlay -->
          <div class="status-badge" :style="{ backgroundColor: 'rgba(0,0,0,0.3)' }">
            <span class="status-dot" :style="{ backgroundColor: getStatusColor(user.status) }"></span>
            <span class="status-text" :style="{color: getStatusColor(user.status)}">{{ user.status.charAt(0).toUpperCase() + user.status.slice(1) }}</span>
          </div>

          <!-- Label Overlay (HOT/NEW) -->
          <div v-if="user.label" class="type-label" :class="user.label.toLowerCase()">
            <img class="hot-icon" src="../assets/hotGirlIcon.png" alt="" v-if="user.label == 'HOT'">
            <img class="new-icon" src="../assets/newGirlIcon.png" alt="" v-if="user.label == 'NEW'">
          </div>

          <!-- Call Button -->
          <button class="call-button">
            <img src="../assets/call.png" alt="" style="width: 100%; height:100%;">
          </button>
        </div>

        <!-- Info Section -->
        <div class="card-info">
          <div class="user-main-info">
            <span class="user-name">{{ user.name }}, {{ user.age }}</span>
          </div>
          <div class="user-sub-info">
            <span class="user-flag">{{ user.flag }}</span>
            <span class="user-country">{{ user.country }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>


.discover-page {
  padding: 16px;
  background-color: var(--bg-color);
  padding-bottom: 80px; /* Space for tab bar */
}

.page-bg {
  top: 0;
  left: 0;
  position: absolute;
  width: 100%;
  aspect-ratio: 500 / 375;
}

.page-bg img {
  width: 100%;
  height: 100%;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: env(safe-area-inset-top, 20px);
  margin-bottom: 24px;
}

.header-title {
  font-family: 'Alibaba Sans', -apple-system, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 28px;
  color: #000;
  z-index: 1;
}

.daily-bonus {
  position: relative;
  height: 32px;
}

.bonus-bg {
  position: absolute;
  left: 12px;
  top: 3px;
  width: 100px;
  height: 26px;
  background-color: #fed224;
  border-radius: 13px;
}

.bonus-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 100%;
}

.bonus-text {
  font-size: 12px;
  font-weight: 800;
  font-style: italic;
  color: #1f2124;
}

/* Categories */
.categories-wrapper {
  margin: 0 -16px 20px -16px;
  padding: 0 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.categories-wrapper::-webkit-scrollbar {
  display: none;
}

.categories {
  display: flex;
  gap: 12px;
  padding-bottom: 4px;
  z-index: 4;
}

.category-tag {
  flex-shrink: 0;
  padding: 10px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

.category-tag.active {
  background: var(--primary-gradient);
  color: #fff;
}

/* User Grid */
.user-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.user-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--card-shadow);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 184 / 248;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Overlays */
.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 11px;
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-text {
  font-size: 12px;
  font-weight: 590;
  line-height: 16px; /* 133.333% */
  color: #fff;
}

.type-label {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.type-text {
  font-size: 11px;
  font-weight: 800;
  font-style: italic;
}

/* Call Button */
.call-button {
  position: absolute;
  bottom: -20px;
  right: 8px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  border: none;
  background: var(--clear-color);
  display: flex;
  align-items: center;
  justify-content: center;
  /* box-shadow: 0 4px 12px rgba(255, 26, 208, 0.3); */
  z-index: 2;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.call-button:active {
  transform: scale(0.9);
}

/* Info Section */
.card-info {
  padding: 12px;
  background: #fff;
}

.user-name {
  font-size: 15px;
  font-weight: 700;
  color: #000;
}

.user-sub-info {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-flag {
  font-size: 14px;
}

.user-country {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.hot-icon {
  width: 62px;
  height: 22px;
}  

.new-icon {
  width: 62px;
  height: 22px;
}
</style>

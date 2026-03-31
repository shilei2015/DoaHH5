<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import {
  Icon as VanIcon,
  showToast,
  showSuccessToast
} from 'vant';
import { API } from '@/utils/net/api';
import { post } from '@/utils/net/request';
import { useUserStore } from '@/stores/userStore';
import type { Path } from 'typescript';
import checkinGiftBig from '@/assets/checkIn/checkin-gift-big.svg'
import checkinGiftSmall from '@/assets/checkIn/checkin-gift-normal.svg'
import type { CheckInInfoModel } from './appModels/ChcekInInfoModel';
import HUD from './HUD';
import { showModal } from '@/utils/tools/modalService';
import SignInSuccessModal from './modal/SignInSuccessModal.vue';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'check-in-success'): void;
}>();

const userStore = useUserStore();
const myDiamonds = computed(() => userStore.userInfo?.Coins || 0);

/**
 * Check-in state model
 */
interface CheckInItem {
  day: number;
  diamonds: number;
  status: 'collected' | 'current' | 'pending';
}

const checkInList = ref<CheckInItem[]>([
  { day: 1, diamonds: 5, status: "collected" },
  { day: 2, diamonds: 10, status: "collected" },
  { day: 3, diamonds: 15, status: "collected" },
  { day: 4, diamonds: 20, status: "collected" },
  { day: 5, diamonds: 25, status: "collected" },
  { day: 6, diamonds: 30, status: "collected" },
  { day: 7, diamonds: 50, status: "collected" }
]);

const checkInDays = computed(() => Number(checkInInfo.value?.CSDay))
const checkInInfo = ref<CheckInInfoModel | null>(null)

const fetchCheckInData = async () => {
  try {
    const response = await post(API.daily_info);
    if (response.code === "0" && response.data) {
      checkInInfo.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch check-in info', error);
  }
};

const handleCheckIn = async () => {
  if (checkInInfo.value?.IsSignIn != "0") {
    showToast('Already checked in today');
    return;
  }

  try {
    HUD.showLoading()
    const response = await post(API.dally_checkIn);
    HUD.hideLoading()
    if (response.code === "0") {
      showSuccessToast('Check-in success!');
      checkInInfo.value.IsSignIn = "1"
      checkInInfo.value.CSDay = (Number(checkInInfo.value.CSDay) + 1).toString()
      userStore.updateLoginUserInfo();
      showModal(SignInSuccessModal, { diamonds: response.data.GrantCoins }, {
        position: 'center',
        round: false, // 签到弹窗通常是无背景或透明背景的
        customStyle: {
          background: 'transparent', // 关键：设为透明，只保留组件内容
          border: 'none',
          boxShadow: 'none'
        }
      })
      fetchCheckInData();
      emit('check-in-success');
    } else {
      showToast(response.data?.toast || 'Failed to check in');
    }
  } catch (error) {
    showToast('Network Error');
  }
};

const getGiftIcon = (item: CheckInItem): string => {
  if (item.day == 7) {
    return checkinGiftBig
  } else {
    return checkinGiftSmall
  }
}

watch(() => checkInInfo.value?.CSDay, (newVal) => {
  if (newVal) {
    const newDay = Number(newVal) % checkInList.value.length
    for (const item of checkInList.value) {
      if (item.day <= newDay) {
        item.status = "collected"
      } else if (item.day === newDay + 1) {
        item.status = "current"
      } else {
        item.status = "pending"
      }
    }
  }
})

onMounted(() => {
  fetchCheckInData();
});

</script>

<template>
  <div class="check-in-page">
    <div class="check-in-wrapper">
      <!-- Close Button -->
      <button class="close-btn" @click="emit('close')">
        <van-icon name="cross" />
      </button>

      <!-- Main Activity Area -->
      <div class="activity-top">
        <div class="user-diamonds">
          <div class="label">My diamonds:</div>
          <div class="amount">{{ myDiamonds }}</div>
        </div>
      </div>

      <!-- Main White Card -->
      <div class="check-in-card">
        <h2 class="card-title">Daily Bonus</h2>
        <p class="card-subtitle">Check in and get free diamonds every day.</p>

        <!-- Rewards Grid -->
        <div class="rewards-grid">
          <div v-for="item in checkInList" :key="item.day"
            :class="['reward-item', item.status, item.day == 7 ? 'big' : 'normal']">
            <div class="reward-content">
              <img :src="getGiftIcon(item)" :class="['gift-icon']" />
              <div :class="['day-text', item.status]">Day {{ item.day }}</div>
            </div>
            <div v-if="item.status === 'current'" class="collected-badge">
              <img src="@/assets/checkIn/checkin-current-tag.svg" alt="">
            </div>
          </div>
        </div>

        <button class="submit-btn" :disabled="checkInInfo?.IsSignIn != '0'"
          :class="{ 'already-checked': checkInInfo?.IsSignIn == '0' }" @click="handleCheckIn">
          {{ checkInInfo?.IsSignIn == '1' ? 'Checked in' : 'Check in' }}
        </button>

        <p class="footer-hint" v-if="checkInDays > 0">
          Checked in consecutively for {{ checkInDays }} days.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.check-in-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Match Figma Background */
  background-image: url('@/assets/checkIn/checkInDayBg.svg');
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-color: #FFD69F;
  /* Fallback to bottom gradient color to prevent white flash */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.check-in-wrapper {
  /* flex: 1; */
  /* flex-direction: column; */
  padding: env(safe-area-inset-top) 20px env(safe-area-inset-bottom);
}

.close-btn {
  position: relative;
  top: 8px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  z-index: 100;
}

.activity-top {
  width: 100%;
  padding-top: 60px;
  margin-bottom: 24px;
}

.user-diamonds .label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.user-diamonds .amount {
  font-size: 32px;
  font-weight: 700;
  color: #000;
  margin-top: 12px;
}

.check-in-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 20px 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0;
}

.card-subtitle {
  font-size: 12px;
  color: #8A8A8E;
  margin: 4px 0 20px;
}

.rewards-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.reward-item {
  position: relative;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.reward-content {
  align-items: center;
  display: flex;
  flex-direction: column;
}

.reward-item.normal {
  aspect-ratio: 70 / 92;
}

.reward-item.big {
  grid-column: span 2;
}

.reward-item.current {
  background: #FFE0F9;
  border: 2px solid #FF1AD0;
}

.reward-item.collected {
  opacity: 0.5;
}

.gift-icon {
  height: 44px;
  position: absolute;
  top: 8px;
}

.day-text {
  font-size: 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-weight: 510;
  color: #000;
  position: absolute;
  width: 54px;
  height: 24px;
  bottom: 8px;
  border-radius: 12px;
  border-color: #EBECED;
  border-style: solid;
  border-width: 1px;
  text-align: center;
  align-items: center;
  /* justify-content: center; */
  line-height: 24px;
  /* display: flex; */
}

.day-text.current {
  color: #fff;
  background-color: #FF1AD0;
}

.day-text.collected {
  border-width: 0px;
}

.collected-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #FF1AD0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
}


.reward-content-long {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.day-text-long {
  font-size: 14px;
  font-weight: 600;
}

.reward-amount {
  font-size: 14px;
  font-weight: 700;
  color: #FF1AD0;
  margin-left: auto;
}

.submit-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(113deg, #FED627 0%, #FF1AD0 100%);
  border: none;
  border-radius: 26px;
  color: #FFF;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0px 4px 15px rgba(255, 26, 208, 0.3);
  cursor: pointer;
  opacity: 0.5;
}

.submit-btn.already-checked {
  box-shadow: none;
  opacity: 1;
}

.footer-hint {
  text-align: center;
  font-size: 12px;
  color: #8A8A8E;
  margin-top: 12px;
}
</style>

<script setup lang="ts">

const props = defineProps<{
    diamonds?: string
}>();

const emit = defineEmits(['close']);

const handleOk = () => {
    emit('close');
};
</script>

<template>
    <div class="sign-in-success">
        <!-- Text Content -->
        <div class="text-content">
            <h1 class="title">Congratulations</h1>
            <p class="subtitle">
                You have checked in get <span class="highlight">{{ diamonds }} diamonds</span>
            </p>
        </div>

        <!-- Diamond Visual -->
        <div class="visual-container">
            <!-- Background glow effect -->
            <div class="light-ray"></div>
            <img src="@/assets/limitOff/limit-off-gift-icon.png" alt="Diamond" class="diamond-img" />
        </div>

        <!-- OK Button -->
        <div class="ok-btn" @click="handleOk">
            OK
        </div>
    </div>
</template>

<style scoped>
.sign-in-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    width: 100%;
}

.text-content {
    text-align: center;
    margin-bottom: 20px;
}

.title {
    font-size: 28px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
    font-size: 16px;
    color: #FFFFFF;
    font-weight: 600;
}

.highlight {
    color: #F7F719;
    /* 黄色高亮 */
    font-weight: 800;
}

.visual-container {
    position: relative;
    width: 240px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
}

.diamond-img {
    width: 180px;
    height: 180px;
    object-fit: contain;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.4));
    animation: float 3s ease-in-out infinite;
}

.light-ray {
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0) 70%);
    z-index: 1;
}

.ok-btn {
    width: 280px;
    height: 56px;
    background: linear-gradient(to right, #FDC830, #F37335, #FF00CC);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    color: #FFFFFF;
    cursor: pointer;
    box-shadow: 0 8px 25px rgba(243, 115, 53, 0.4);
    transition: transform 0.2s, opacity 0.2s;
}

.ok-btn:active {
    transform: scale(0.95);
    opacity: 0.9;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}
</style>

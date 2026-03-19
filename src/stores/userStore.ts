import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('useUserStore', () => {
    const token = ref("")

    return { token }
},
    {
        persist: true
    }
)
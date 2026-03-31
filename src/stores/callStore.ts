import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CallInfoModel } from '@/components/appModels/CallInfoModel';

export const useCallStore = defineStore('call', () => {
    const currentCallInfo = ref<CallInfoModel | null>(null);

    const setCurrentCallInfo = (info: CallInfoModel | null) => {
        currentCallInfo.value = info;
    };

    const clearCallInfo = () => {
        currentCallInfo.value = null;
    };

    return {
        currentCallInfo,
        setCurrentCallInfo,
        clearCallInfo
    };
});

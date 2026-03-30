import { markRaw } from 'vue';
import { showModal } from '@/utils/tools/modalService';
import CheckInModal from '@/components/CheckInModal.vue';

/**
 * missionService.ts
 * Handling daily missions and check-in UI commands
 */

export function showCheckIn() {
    return showModal(markRaw(CheckInModal), {}, {
        position: 'bottom',
        round: false,
        customStyle: { height: '100vh', background: 'transparent' },
    });
}

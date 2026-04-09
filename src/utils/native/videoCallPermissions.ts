import { nextTick } from 'vue';
import HUD from '@/components/HUD';
import {
  checkPermission,
  openSystemSettings,
  isA0019Native,
  A0019PermissionGetType,
} from '@/utils/native/A0019Bridge';

/**
 * 视频通话前：按《北京-App-H5 Bridge交互规范》用 Web->App type 8 逐项查询/请求相机与麦克风权限；
 * 回调中 `isOpen === false` 时按文档示例调用 Web->App type 9 打开系统设置。
 *
 * 调用前若刚执行过 `HUD.hideLoading()`，会先 `nextTick` 再调 Bridge，避免 Loading 遮罩未卸完时挡住系统权限 UI。
 *
 * @see `.agents/doc/北京-App-H5 Bridge交互规范.md` §「Web->App type: 8」「App->Web type: 8」§7.1 `onPermissionResult`
 */
export async function ensureVideoCallMediaPermissions(): Promise<boolean> {
  if (!isA0019Native()) {
    return true;
  }

  await nextTick();

  try {
    // 规范：sendToApp(8, { getType: 1 }) — 相机
    const camera = await checkPermission(A0019PermissionGetType.Camera);
    if (!camera.isOpen) {
      HUD.showToast('Please allow camera access in Settings to continue.');
      openSystemSettings();
      return false;
    }

    // 规范：sendToApp(8, { getType: 3 }) — 麦克风
    const microphone = await checkPermission(A0019PermissionGetType.Microphone);
    if (!microphone.isOpen) {
      HUD.showToast('Please allow microphone access in Settings to continue.');
      openSystemSettings();
      return false;
    }

    return true;
  } catch (e) {
    console.error('[videoCallPermissions] type 8 check failed', e);
    HUD.showToast('Unable to verify permissions. Please try again.');
    return false;
  }
}

export interface mainTabbarConfig {
    name: string
    iconUrl: string
    selectedIconUrl: string
    isSelected: boolean
}

import anchorListoff from '@/assets/tabbar/anchorList.png'
import anchorListon from '@/assets/tabbar/anchorList_selected.png'
import messageListoff from '@/assets/tabbar/messageList.png'
import messageListon from '@/assets/tabbar/messageList_selected.png'
import userCenteroff from '@/assets/tabbar/userCenter.png'
import userCenteron from '@/assets/tabbar/userCenter_selected.png'


export const mainTabbarConfigList: mainTabbarConfig[] = [
    {
        name: "anchorList",
        iconUrl: anchorListoff,
        selectedIconUrl: anchorListon,
        isSelected: true
    },
    {
        name: "messageList",
        iconUrl: messageListoff,
        selectedIconUrl: messageListon,
        isSelected: false
    },
    {
        name: "userCenter",
        iconUrl: userCenteroff,
        selectedIconUrl: userCenteron,
        isSelected: false
    }
]

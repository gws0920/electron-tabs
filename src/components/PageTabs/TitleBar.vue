<script lang="ts" setup>
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { Close, Subtract, Copy, Home } from '@vicons/carbon'
import { switchTab, removeTab } from './utils'
import Mousetrap from 'mousetrap'

type TabItem = {id: string, path: string, loading: boolean, progress: number}
interface RenderTabItem extends TabItem {
  title: string
  icon?: any
}

const router = useRouter()
const tabs = ref<RenderTabItem[]>([])
const activeTabId = ref('')
const isFullScreen = ref(false)
const isMac = process.platform === 'darwin'

const onViewsInfo = (e: IpcRendererEvent, tabList: TabItem[], activeId: string) => {
  tabs.value = tabList.map((item) => {
    const { path, loading } = item
    const route = router.resolve(path)
    const { title, name } = route.query
    return {
      ...item,
      title: !path && loading ? '加载中...' : (title || name || route?.meta?.title || path) as string,
      icon: route.meta?.icon
    }
  })
  activeTabId.value = activeId
}

const onUpdateFullScreenState = (e: IpcRendererEvent, isFull: boolean) => {
  isFullScreen.value = !!isFull
}

ipcRenderer.on('get-views-return', onViewsInfo)
ipcRenderer.on('update-full-screen-state', onUpdateFullScreenState)
const sendControlEvent = (e: string) => {
  ipcRenderer.send(e)
}
onMounted(() => {
  Mousetrap.bind('mod+w', () => {
    if (activeTabId.value) {
      removeTab(activeTabId.value)
    }
  })
})

onUnmounted(() => {
  ipcRenderer.off('get-views-return', onViewsInfo)
  ipcRenderer.off('update-full-screen-state', onUpdateFullScreenState)
})

</script>

<template>
  <Teleport to="body .electron-title-bar">
    <div class="title-bar" :class="{mac: isMac, 'full-screen': isFullScreen}" @dblclick="sendControlEvent('maximize')">
      <i class="bottom-line" />
      <img v-if="!isMac" src="@/assets/electron.svg" class="logo">
      <ul
        class="tabs"
        @dblclick.stop
      >
        <li :class="{'tab-item': true, active: activeTabId === ''}" @click="switchTab('')">
          <i class="active-line" />
          <el-icon class="mr-2">
            <Home />
          </el-icon>
          首页
        </li>
        <li
          v-for="item in tabs"
          :key="item.id"
          :class="{
            'tab-item': true,
            active: activeTabId === item.id,
            'loading': item.loading,
            'other-tab': true
          }"
          :draggable="true"
          @click="item.id !== activeTabId && switchTab(item.id)"
        >
          <i v-if="item.loading" class="progress" :style="{width: `${item.progress}%`}" />
          <i v-if="item.loading" class="loading-icon" />
          <template v-else-if="item.icon">
            <component :is="item.icon" class="mr-2 w-14px" />
          </template>
          {{ item.title }}
          <el-icon class="icon" @click.stop="removeTab(item.id)">
            <Close />
          </el-icon>
        </li>
      </ul>
      <div v-if="!isMac" class="controls" @dblclick.stop>
        <!-- 最小化 -->
        <el-icon class="icon" @click="sendControlEvent('minimize')">
          <Subtract />
        </el-icon>
        <!-- 最大化 -->
        <el-icon class="icon" @click="sendControlEvent('maximize')">
          <Copy />
        </el-icon>
        <!-- 关闭 -->
        <el-icon class="icon error" @click="sendControlEvent('close')">
          <Close />
        </el-icon>
      </div>
      <img
        v-if="isMac"
        src="@/assets/electron.svg"
        class="mac-logo"
      >
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
$radius: 4px;
$h: 42px;
$background-page: var(--background-page);
$background-base-page: var(--background-base-page);
$border-color: var(--border-color);
$text-color: var(--text-color);
$text-color-secondary: var(--text-color-secondary);
$color-primary: var(--color-primary);

.title-bar {
  @apply flex flex-shrink-0 w-full items-center relative overflow-hidden;
  height: $h;
  background-color: $background-base-page;
  -webkit-app-region: drag;
  .bottom-line {
    @apply h-1px w-full bottom-0 left-0 absolute;
    content: '';
    background-color: $border-color;
  }
  .logo {
    @apply h-5 mx-4;
    transform: translateY(2px);
  }
  .tabs {
    @apply flex items-center relative overflow-auto;
    max-width: calc(100vw - 220px);
    height: calc(100% - 8px);
    transform: translateY(4px);
    -webkit-app-region: no-drag;
    &::-webkit-scrollbar {
      display: none;
    }
    &::-webkit-scrollbar-thumb {
      display: none;
    }
    &::after {
      @apply h-full right-0 w-50px z-10 absolute pointer-events-none;
      content: '';
      background: linear-gradient(to right, transparent 0%, $background-base-page 100%);
    }
    .tab-item {
      @apply cursor-pointer flex h-full flex-shrink-0 px-4 transition items-center whitespace-nowrap relative overflow-hidden;
      border-radius: $radius $radius 0 0;
      font-size: 14px;
      color: var(--text-color-secondary);
      border: 1px solid transparent;
      &:hover {
        color: var(--text-color);
        .loading-icon {
          border-top-color: $text-color;
          border-right-color: $text-color;
        }
      }
      &.active {
        background-color: $background-page;
        z-index: 100;
        color: var(--text-color);
        border-top-color: $border-color;
        border-left-color: $border-color;
        border-right-color: $border-color;
        .active-line {
          @apply h-1px w-full left-0 z-10 absolute;
          content: '';
          background-color: $background-page;
          bottom: -5px;
        }
        .loading-icon {
          border-top-color: $text-color;
          border-right-color: $text-color;
        }
      }
      &.other-tab:not(.active) {
        &::before {
          @apply left-0 w-1px absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 60%;
          content: '';
          background-color: $border-color;
        }
      }
      .icon {
        @apply h-18px ml-2 transition w-18px;
        border-radius: 50%;
        &:hover {
          background-color: var(--fill-color);
        }
      }
      .loading-icon {
        @apply mr-2 opacity-50 transition;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: $text-color-secondary;
        border-right-color: $text-color-secondary;
        animation: loading linear infinite 1s;
      }
      .progress {
        @apply max-w-full h-2px top-0 left-0 absolute;
        background-color: $color-primary;
      }
    }
    .tab-item.active + .other-tab {
      &::before {
        opacity: 0;
      }
    }
  }

  .controls {
    @apply h-full ml-auto whitespace-nowrap;
    -webkit-app-region: no-drag;
    .icon {
      @apply cursor-pointer h-full transition;
      width: $h;
      color: var(--text-color-secondary);
      &.error:hover {
        background-color: var(--color-error);
      }
      &:hover {
        background-color: var(--fill-color);
        color: var(--text-color);
      }
    }
  }
  &.mac {
    &.full-screen .tabs {
      @apply ml-4;
    }
    .tabs {
      @apply ml-80px;
    }
    .mac-logo {
      @apply ml-auto h-5 mr-4;
      transform: translateY(2px);
    }
  }
}

@keyframes loading {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

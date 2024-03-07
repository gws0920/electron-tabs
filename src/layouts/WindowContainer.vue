<script lang="ts" setup>
import { ipcRenderer, IpcRendererEvent, SaveDialogSyncOptions } from 'electron'
import { nanoid } from 'nanoid'
import { Close, Subtract, Copy } from "@vicons/carbon";

type TabItem = {id: string, path: string}
const router = useRouter()
const pages = [
  {path: '/Home'},
  {path: '/About'},
]
const tabs = ref<TabItem[]>([])
const activeTabId = ref('')
const openView = (page: {path: string}) => {
  const id = nanoid()
  ipcRenderer.send('create-view', id, page.path)
  tabs.value.push({path: page.path, id})
  activeTabId.value = id
}
const remove = (id: string) => {
  console.log('close');
  ipcRenderer.send('remove-view', id)
  tabs.value = tabs.value.filter(item => item.id !== id)
  switchTab('')
}

const switchTab = (id: string) => {
  activeTabId.value = id
  ipcRenderer.send('switch-view', id)
}

const getViews = () => {
  ipcRenderer.send('get-views')
}

const getTitleByPath = (path: string) => {
  const route = router.resolve(path)
  return route?.meta?.title || route.name || path
}

const dragstart = (e: DragEvent) => {
  console.log('start', e);
}

const dragend = (e: DragEvent, viewId: string) => {
  // const { clientX, clientY } = e
  // const { innerWidth, innerHeight } = window
  // if (clientX > innerWidth || clientY > innerHeight || clientX < 0 || clientY < 0) {
  //   // TODO: 拖动到边缘，创建新窗口
  //   console.log('创建新窗口')
  //   ipcRenderer.send('create-window-view', viewId, {offsetX: clientX, offsetY: clientY})
  // }
}
const drop = (e: DragEvent) => {
  console.log('drop', e);
}

onMounted(() => {
  getViews()
})

ipcRenderer.on('get-views-return', (e: IpcRendererEvent, tabList: TabItem[], activeId: string) => {
  console.log('更新view', tabList, activeId)
  tabs.value = tabList
  activeTabId.value = activeId
  switchTab(activeId)
})
</script>

<template>
<div class="flex flex-col h-full w-full overflow-hidden">
  <div class="title-bar">
    <img src="@/assets/electron.svg" class="logo">
    <ul 
      class="tabs" 
      :style="{gridTemplateColumns: `repeat(${tabs.length + 1}, 1fr)`}" 
      @drop.prevent="drop"
      @dragover.prevent
      @dragleave.prevent
    >
      <li :class="{'tab-item': true, active: activeTabId === ''}" @click="switchTab('')">首页</li>
      <li 
        v-for="item, index in tabs" 
        :key="item.id" 
        :class="{'tab-item': true, active: activeTabId === item.id}" 
        :draggable="true"
        @dragstart="dragstart"
        @dragend="dragend($event, item.id)"
        @click="switchTab(item.id)"
      >
        {{ getTitleByPath(item.path) }}
        <el-icon class="icon"  @click.stop="remove(item.id)">
          <Close />
        </el-icon>
      </li>
    </ul>
    <div class="controls">
      <!-- 最小化 -->
      <el-icon class="icon">
        <Subtract />
      </el-icon>
      <!-- 最大化 -->
      <el-icon class="icon">
        <Copy />
      </el-icon>
      <!-- 关闭 -->
      <el-icon class="icon error">
        <Close />
      </el-icon>
    </div>
  </div>
  <!-- 这是页面内容 -->
    <h1 @click="getViews">这是容器{{ activeTabId }} (get views)</h1> 
    <div class="links">
      <span v-for="page in pages" :key="page.path" @click="openView(page)">
        点击打开 {{ page.path }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$radius: 4px;
$h: 42px;
.title-bar {
  @apply flex w-full items-center relative overflow-hidden;
  height: $h;
  background-color: var(--background-page);
  -webkit-app-region: drag;
  .logo {
    @apply h-5 mx-4;
    transform: translateY(2px);
  }
  .tabs {
    @apply grid;
    height: calc(100% - 8px);
    max-width: fit-content;
    transform: translateY(4px);
    -webkit-app-region: no-drag;
    .tab-item {
      @apply cursor-pointer flex h-full px-2 transition items-center whitespace-nowrap relative;
      border-radius: $radius $radius 0 0;
      font-size: 14px;
      color: var(--text-color-secondary);
      &:hover {
        color: var(--color-primary);
      }
      &.active {
        background-color: var(--fill-color-darker);
        color: var(--text-color)
      }
      .icon {
        @apply h-18px ml-2 transition w-18px;
        border-radius: 50%;
        &:hover {
          background-color: var(--fill-color);
        }
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

  // &::after {
  //   @apply h-4px w-full bottom-1px left-0 absolute;
  //   content: '';
  //   background-color: var(--fill-color-darker);
  //   border-radius: $radius $radius 0 0;
  // }
}
.links {
  @apply flex flex-col flex-1;
}
</style>

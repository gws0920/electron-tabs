<script lang="ts" setup>
import { createTab, updateTabSate, updateTabs } from "@/components/PageTabs/utils";
const count = ref(0)

const router = useRouter()
const goPage = (path: string, inTab?: boolean) => {
  if (inTab) {
    createTab(path)
  } else {
    router.push(path).then(() => {
      updateTabs()
    })
  }
}

const showProgress = () =>{
  let progress = 0
  const timer: NodeJS.Timeout = setInterval(() => {
    if (progress > 100) {
      updateTabSate({ loading: false })
      return clearInterval(timer)
    }
    updateTabSate({ loading: true, progress: progress++ })
  }, 100)
}
</script>

<template>
  <div class="grid gap-2 grid-cols-1">
    <h1>首页</h1>
    <el-button type="primary" @click="count++">点击计数: {{ count }}</el-button>

    <el-button-group>
      <el-button type="primary" @click="updateTabSate({loading: true})">显示Loading</el-button>
      <el-button type="primary" @click="updateTabSate({loading: false})">关闭Loading</el-button>
    </el-button-group>

    <el-button-group>
      <el-button type="primary" @click="showProgress">显示进度</el-button>
    </el-button-group>

    <el-button-group>
      <el-button bg text @click="goPage('/About', true)">打开About页 (Tab)</el-button>
    </el-button-group>

    <el-button-group>
      <el-button bg text @click="goPage('/User', true)">打开User页 (Tab)</el-button>
    </el-button-group>
  </div>
</template>

<style lang="scss" scoped>

</style>

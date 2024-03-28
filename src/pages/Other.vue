<script lang="ts" setup>
import { createTab, updateTabSate, updateTabs } from "@/components/PageTabs/utils";
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
</script>

<template>
  <div class="grid grid-cols-1 gap-2">
    <h1>这是Other页</h1>
    <el-button-group>
      <el-button type="primary" @click="updateTabSate({loading: true})">显示Loading</el-button>
      <el-button type="primary" @click="updateTabSate({loading: false})">关闭Loading</el-button>
    </el-button-group>

    <el-button-group>
      <el-button type="primary" @click="showProgress">显示进度</el-button>
    </el-button-group>

    <el-button-group>
      <el-button bg text @click="goPage('/Home', false)">打开Home页 (当前页)</el-button>
      <el-button bg text @click="goPage('/Home', true)">打开Home页 (Tab)</el-button>
    </el-button-group>

    <el-button-group>
      <el-button bg text @click="goPage('/About', false)">打开About页 (当前页)</el-button>
      <el-button bg text @click="goPage('/About', true)">打开About页 (Tab)</el-button>
    </el-button-group>
  </div>
</template>

<style lang="scss" scoped>

</style>

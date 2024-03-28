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
</script>

<template>
  <div class="flex mt-2">
    <el-button bg @click="goPage('/Home', true)">打开Home页 (Tab)</el-button>
    <el-button bg @click="goPage('/About', true)">打开About页 (Tab)</el-button>
    <el-button bg @click="goPage('/User', true)">打开User页 (Tab)</el-button>
  </div>
</template>

<style lang="scss" scoped>

</style>

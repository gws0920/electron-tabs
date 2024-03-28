<script lang="ts" setup>
import TitleBar from './TitleBar.vue'
import { isInBrowserWindow } from './utils'
const isInWindow = ref(false)
console.log(isInWindow.value, '111')

isInBrowserWindow().then(res => {
  isInWindow.value = res
})
</script>

<template>
  <TitleBar v-if="isInWindow" />
</template>

<style lang="scss" scoped>

</style>

<script lang="ts" setup>
const count = ref(0)
</script>

<template>
  <div @click="count++">
    这是首页 {{ count }}
  </div>
</template>

<style lang="scss" scoped>

</style>

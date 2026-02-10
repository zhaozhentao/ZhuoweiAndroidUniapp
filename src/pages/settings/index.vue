<template>
  <div class="content">
    <t-empty
        icon="no-result"
        style="margin-top: 200px"
        description="没有历史组合，请先添加"/>

    <t-button
        class="add"
        theme="primary"
        @click="add"
        block>
      添加
    </t-button>
  </div>
</template>

<script setup>
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TButton from '@tdesign/uniapp/button/button.vue'

function add() {
  uni.navigateTo({ url: '/pages/add/index' })
}
</script>

<style scoped>
@import "@/styles/common.css";

.add {
  position: fixed;
  bottom: 20px;
  width: calc(100% - 24px);
}
</style>

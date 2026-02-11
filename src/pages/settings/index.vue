<template>
  <div class="content">
    <div
        class="item-header card"
        v-if="configs.length"
        v-for="(item, index) in configs"
        :key="index">
      <span class="alias">{{ item.alias }}</span>

      <div>
        <t-button
            size="small"
            theme="danger"
            @click="removeConfig(index)">
          删除
        </t-button>
      </div>
    </div>

    <t-empty
        v-else
        icon="no-result"
        style="margin-top: 200px"
        description="没有历史组合，请先添加"/>

    <t-button
        class="add"
        theme="primary"
        @click="add"
        block>
      添加组合
    </t-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TButton from '@tdesign/uniapp/button/button.vue'

const configs = ref([])

onShow(() => {
  const key = 'machine-settings-config'
  const stored = uni.getStorageSync(key)

  if (Array.isArray(stored)) {
    configs.value = stored
  } else if (stored && typeof stored === 'object') {
    configs.value = [stored]
  } else {
    configs.value = []
  }
})

function add() {
  uni.navigateTo({ url: '/pages/settings/add' })
}

function removeConfig(index) {
  configs.value.splice(index, 1)
  uni.setStorageSync('machine-settings-config', configs.value)
}
</script>

<style>
@import "@/styles/common.css";
</style>

<style scoped>
@import "@/styles/common.css";

.add {
  position: fixed;
  bottom: 20px;
  width: calc(100% - 24px);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alias {
  font-weight: 600;
  font-size: 16px;
}
</style>

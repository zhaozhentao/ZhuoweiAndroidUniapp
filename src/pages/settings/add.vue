<template>
  <div class="content">
    <div class="card">
      <div class="card_head">
        <span>组合</span>

        <div>
          <t-button
              theme="primary"
              size="small"
              class="actions"
              @click="addCombo('出圈')">
            出圈
          </t-button>

          <t-button
              theme="light"
              size="small"
              class="actions"
              @click="addCombo('含圈')">
            含圈
          </t-button>

          <t-button
              size="small"
              @click="addCombo('平圈')">
            平圈
          </t-button>
        </div>
      </div>

      <t-divider/>

      <div class="container">
        <t-tag
            v-for="(item, index) in combos"
            :key="index"
            closable
            size="large"
            class="combo-tag"
            :theme="getTagTheme(item.label)"
            :variant="getTagClass(item.label)"
            @close="remove(item.id)">
          {{ index + 1 }}. {{ item.label }}
        </t-tag>

        <div class="empty" v-if="!combos.length">
          请点击卡片右上角按钮添加组合
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card_head">
        <span>排列</span>

        <div>
          <t-button
              theme="primary"
              size="small"
              class="actions"
              @click="addArrange('组合')">
            组合
          </t-button>

          <t-button
              theme="light"
              size="small"
              @click="addArrange('针门')">
            针门
          </t-button>
        </div>
      </div>

      <t-divider/>

      <div class="container">
        <t-tag
            v-for="(item, index) in arranges"
            :key="index"
            closable
            size="large"
            class="combo-tag"
            :theme="getTagTheme(item.label)"
            :variant="getTagClass(item.label)"
            @close="removeArrange(item.id)">
          {{ index + 1 }}. {{ item.label }}
        </t-tag>

        <div class="empty" v-if="!arranges.length">
          请点击卡片右上角按钮进行排列
        </div>
      </div>
    </div>

    <div class="card">
      <t-input
          label="配置别名"
          :value="alias"
          @change="onInputChange"
          :borderless="true"
          style="padding-left: 0"
          placeholder="请输入配置别名如：一号大圆机"/>
    </div>

    <t-button
        class="confirm"
        theme="primary"
        @click="save"
        block>
      保存
    </t-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TTag from '@tdesign/uniapp/tag/tag.vue'
import TInput from '@tdesign/uniapp/input/input.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import TDivider from '@tdesign/uniapp/divider/divider.vue'

const alias = ref('')
const combos = ref([])
const arranges = ref([])

function addCombo(type) {
  combos.value.push({ label: type })
}

function addArrange(type) {
  arranges.value.push({ label: type })
}

function remove(id) {
  combos.value = combos.value.filter((item) => item.id !== id)
}

function removeArrange(id) {
  arranges.value = arranges.value.filter((item) => item.id !== id)
}

function getTagTheme(label) {
  switch (label) {
    case '出圈':
    case '组合':
      return 'primary'
    case '含圈':
    case '针门':
      return 'primary'
    case '平圈':
      return 'default'
  }
}

function getTagClass(label) {
  switch (label) {
    case '出圈':
    case '组合':
      return 'dark'
    case '含圈':
    case '针门':
      return 'light'
    case '平圈':
      return 'light'
  }
}

function onInputChange(value) {
  alias.value = value.value
}

function save() {
  if (!combos.value.length) {
    uni.showToast({ title: '您还没有设置组合', icon: 'none' })
    return
  }

  if (!arranges.value.length) {
    uni.showToast({ title: '您还没有设置排列', icon: 'none' })
    return
  }

  if (!alias.value.trim()) {
    uni.showToast({ title: '配置别名不能为空', icon: 'none' })
    return
  }

  try {
    const key = 'machine-settings-config'
    let list = []

    const stored = uni.getStorageSync(key)
    if (Array.isArray(stored)) {
      list = stored
    }

    list.push({
      alias: alias.value,
      combos: combos.value,
      arranges: arranges.value,
    })

    uni.setStorageSync(key, list)

    uni.showToast({ title: '保存成功', icon: 'success' })

    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>

<style>
@import "@/styles/common.css";
</style>

<style scoped>
.actions {
  margin-right: 12px;
}

.confirm {
  position: fixed;
  bottom: 20px;
  width: calc(100% - 24px);
}

.card_head {
  display: flex;
  justify-content: space-between;
  align-items: center
}

.container {
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 8px 0;
  gap: 8px;
  white-space: nowrap;
}

.combo-tag {
  flex: 0 0 auto;
}

.empty {
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
  line-height: 28px;
  width: 100%;
}
</style>

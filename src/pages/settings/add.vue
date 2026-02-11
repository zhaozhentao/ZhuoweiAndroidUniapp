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
              theme="primary"
              size="small"
              class="actions"
              @click="addCombo('含圈')">
            含圈
          </t-button>

          <t-button
              theme="primary"
              size="small"
              @click="addCombo('平圈')">
            平圈
          </t-button>
        </div>
      </div>

      <t-divider/>

      <div class="container">
        <t-badge
            v-for="item in combos"
            :key="item.id"
            count="x"
            :offset="[0, 2]"
            aria-role="button"
            @click="remove(item.id)"
            class="badge-item">
          <t-button>{{ item.label }}</t-button>
        </t-badge>

        <div class="empty" v-if="!combos.length">
          请点击卡片右上角按钮添加组合
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card_head">
        <span>排列</span>

        <div>
          <t-button theme="primary" size="small" class="actions">组合</t-button>

          <t-button theme="primary" size="small">针门</t-button>
        </div>
      </div>

      <t-divider/>

      <div class="container">
        <div class="empty">
          请点击卡片右上角按钮进行排列
        </div>
      </div>
    </div>

    <t-button
        class="confirm"
        theme="primary"
        @click="add"
        block>
      保存
    </t-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TBadge from '@tdesign/uniapp/badge/badge.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import TDivider from '@tdesign/uniapp/divider/divider.vue'

const combos = ref([])

function addCombo(type) {
  combos.value.push({
    id: Date.now() + Math.random(),
    label: type,
  })
}

function remove(id) {
  combos.value = combos.value.filter((item) => item.id !== id)
}
</script>

<style scoped>
.actions {
  margin-right: 12px;
}

.confirm {
  position: fixed;
  bottom: 20px;
  width: calc(100% - 24px);
}

.card {
  width: 100%;
  margin: 12px auto;
  padding: 12px;
  border-radius: 12px;
  background-color: #fff;
  box-sizing: border-box;
  box-shadow: 0 4px 12px 2px rgba(0, 0, 0, 0.12);
  border: none;
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

.badge-item {
  flex: 0 0 auto;
}

.empty {
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
  line-height: 40px;
  width: 100%;
}
</style>

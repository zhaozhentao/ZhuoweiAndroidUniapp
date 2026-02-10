<template>
  <div class="content">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <span>组合</span>

      <div>
        <t-button theme="primary" size="small" class="actions">出圈</t-button>

        <t-button theme="primary" size="small" class="actions">含圈</t-button>

        <t-button theme="primary" size="small">平圈</t-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TButton from '@tdesign/uniapp/button/button.vue'

</script>

<style scoped>
.actions {
  margin-right: 12px;
}
</style>

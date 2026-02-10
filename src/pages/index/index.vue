<template>
  <div class="content">
    <div style="text-align: right">
      <t-button @click="settings" variant="text" size="small">设置</t-button>
    </div>

    <e-chart
        ref="eChartRef"
        style="height: 300px; margin-top: 16px"
        @ready="initEChart"/>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TButton from '@tdesign/uniapp/button/button.vue'

const eChartRef = ref(null);

const option = {
  title: {
    text: '大圆机',
    left: 'center',
    top: 'center'
  },
  animation: true,
  series: [
    {
      type: 'pie',
      startAngle: 90,
      data: [
        {
          value: 120,
          name: 'A'
        },
        {
          value: 120,
          name: 'B'
        },
        {
          value: 120,
          name: 'C'
        }
      ],
      radius: ['80%', '95%'],
      label: {
        position: 'inside'
      }
    }
  ]
};

function initEChart() {
  eChartRef.value.init(option)
}

function settings() {
  uni.navigateTo({ url: '/pages/settings/index'})
}
</script>

<style scoped>

</style>

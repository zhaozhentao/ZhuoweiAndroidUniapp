<template>
  <div class="content">
    <t-button theme="primary">哈哈</t-button>

    <e-chart
        ref="eChartRef"
        style="height: 400px"
        @ready="initEChart" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
      radius: ['40%', '50%'],
      label: {
        position: 'inside'
      }
    }
  ]
};

function initEChart() {
  eChartRef.value.init(option)
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
</style>

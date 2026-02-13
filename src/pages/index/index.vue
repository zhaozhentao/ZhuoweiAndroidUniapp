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
import { onMounted, onUnmounted, ref } from 'vue'
import TButton from '@tdesign/uniapp/button/button.vue'

const eChartRef = ref(null)

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
      radius: ['70%', '95%'],
      label: {
        position: 'outside'
      }
    }
  ]
}

function initEChart() {
  eChartRef.value.init(option)
}

onMounted(() => {
  uni.$on('configSelect', (data) => {
    // 保存数据时，已经做了非空校验
    const { alias, combos = [], arranges = [] } = data

    // 用配置别名作为图表标题
    option.title.text = alias

    // 根据 arranges 顺序生成饼图数据：
    // label 为「组合」的，用 combos 依次展开
    // 其它步骤（如「针门」）则按步骤本身依次插入
    const result = []

    arranges.forEach((step) => {
      if (step.label === '组合') {
        combos.forEach((item) => {
          result.push({ name: item.label || '未命名', value: 1 })
        })
      } else {
        result.push({ name: step.label || '未命名', value: 1 })
      }
    })

    option.series[0].data = result

    // 重新渲染图表
    eChartRef.value.setOption(option)
  })
})

onUnmounted(() => {
  // 页面卸载时取消监听，避免重复触发
  uni.$off('configSelect')
})

function settings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}
</script>

<style scoped>

</style>

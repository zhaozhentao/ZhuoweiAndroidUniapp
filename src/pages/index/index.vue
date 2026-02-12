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
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TButton from '@tdesign/uniapp/button/button.vue'

const eChartRef = ref(null)
const selectedConfig = ref(null)

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
}

function initEChart() {
  eChartRef.value.init(option)
}

onMounted(() => {
  uni.$on('configSelect', (data) => {
    // 保存当前选中的配置
    selectedConfig.value = data

    if (!data) {
      return
    }

    // 用配置别名作为图表标题
    if (data.alias) {
      option.title.text = data.alias
    }

    // 根据组合数据生成饼图数据
    if (Array.isArray(data.combos) && data.combos.length) {
      option.series[0].data = data.combos.map((item) => {
        return {
          value: 1,
          name: item.label
        }
      })
    }

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

<template>
  <div class="content">
    <div style="height: 12px"/>

    <div style="text-align: right">
      <t-button @click="connect" variant="text" size="small">连接</t-button>

      <t-button @click="send" variant="text" size="small">发送</t-button>

      <t-button @click="settings" variant="text" size="small">设置</t-button>
    </div>

    <t-row>
      <t-col span="8">
        <e-chart
            ref="eChartRef"
            style="height: 300px; margin-top: 16px"
            @ready="initEChart"/>
      </t-col>

      <t-col span="16">
        <div class="grid-container">
          <div
              class="grid-item"
              v-for="(item, index) in tableData"
              :key="index">
            <div class="grid-index">{{ index + 1 }}</div>

            <div class="grid-name">类型: {{ item.name }}</div>

            <div class="grid-name">峰值:</div>

            <div class="grid-name">时间点:</div>
          </div>
        </div>
      </t-col>
    </t-row>
  </div>
</template>

<script setup>
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import { onMounted, onUnmounted, ref } from 'vue'

const module = uni.requireNativePlugin("UsbModule")

const eChartRef = ref(null)

const tableData = ref([])

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

function settings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function connect() {
  module.connect()
}

function uint8ArrayToBase64(uint8Arr) {
  let binary = ''
  const len = uint8Arr.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Arr[i])
  }
  return btoa(binary)
}

function send() {
  const byteArray = new Uint8Array([0x08, 0x03, 0x00, 0x1A, 0x00, 0x01, 0xA5, 0x54])

  module.send(uint8ArrayToBase64(byteArray))
}

onMounted(() => {
  if (module) {
    module.connect()
  } else {
    console.log('加载失败')
    uni.showToast({ title: '加载模块失败', icon: 'error' })
  }

  uni.$on('configSelect', (data) => {
    // 保存数据时，已经做了非空校验
    const { alias, combos = [], arranges = [] } = data

    // 用配置别名作为图表标题
    option.title.text = alias

    // 根据 arranges 顺序生成饼图数据, label 为「组合」的，用 combos 依次展开, 其它步骤（如「针门」）则按步骤本身依次插入
    const result = []

    arranges.forEach((step) => {
      if (step.label === '组合') {
        combos.forEach((item) => {
          result.push({ name: item.label, value: 1 })
        })
      } else {
        result.push({ name: step.label, value: 1 })
      }
    })

    // 表格中逆时针显示，需要倒序
    option.series[0].data = result.slice().reverse()

    tableData.value = result

    // 重新渲染图表
    eChartRef.value.setOption(option)
  })
})

onUnmounted(() => {
  // 页面卸载时取消监听，避免重复触发
  uni.$off('configSelect')
})
</script>

<style scoped>
.grid-container {
  display: grid;
  margin-top: 16px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.grid-item {
  background-color: #ffffff;
  padding: 8px 12px;
  box-sizing: border-box;
  border: 1px solid #eee;
  margin: 0 -1px -1px 0;
}

.grid-index {
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.grid-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}
</style>

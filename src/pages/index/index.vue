<template>
  <div class="content" style="padding-top: 24px">
    <div style="text-align: right">
      <t-button @click="connect" variant="text" size="small">连接</t-button>

      <t-button @click="write" variant="text" size="small">写</t-button>

      <t-button @click="read" variant="text" size="small">读</t-button>

      <t-button @click="settings" variant="text" size="small">设置</t-button>
    </div>

    <t-row>
      <t-col span="8">
        <t-row>
        <e-chart
            ref="eChartRef"
            style="height: 300px; margin-top: 16px"
            @ready="initEChart"/>
        </t-row>

        <t-row>
          {{ msg }}
        </t-row>
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

function write() {
  module.write(0x30, 1)
}

function read() {
  module.read(0x30)
}

const msg = ref('')

let pendingWrite = null

// 带确认的写入函数
function writeWithConfirm(address, value, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingWrite = null
      reject(new Error(`写入超时: 0x${address.toString(16)}`))
    }, timeout)

    pendingWrite = { address, value, resolve, reject, timer }
    module.write(address, value)
  })
}

onMounted(() => {
  plus.globalEvent.addEventListener('usb_data', e => {
    const hexString = e.data
    const byteArray = []

    // 每两位切割并转换为十进制
    for (let i = 0; i < hexString.length; i += 2) {
      const byte = hexString.substr(i, 2)
      byteArray.push(parseInt(byte, 16))
    }

    // 处理写确认
    if (pendingWrite) {
      const respAddress = (byteArray[2] << 8) | byteArray[3]
      const respValue = (byteArray[4] << 8) | byteArray[5]

      if (respAddress === pendingWrite.address && respValue === pendingWrite.value) {
        clearTimeout(pendingWrite.timer)
        pendingWrite.resolve(byteArray)
        pendingWrite = null
        return
      }
    }

    uni.showToast({
      title: '收到消息：' + byteArray.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '),
      icon: 'none'
    })
  })

  uni.$on('configSelect', async (data) => {
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

    // 写入寄存器数据，等待硬件确认
    const writeRegisters = async () => {
      try {
        // 向 0x12 寄存器写入表格项总数
        await writeWithConfirm(0x12, result.length)

        // 根据表格项类型向寄存器写入数据，起始寄存器 0x30
        for (let index = 0; index < result.length; index++) {
          const item = result[index]
          const nameToValue = { '出圈': 1, '含圈': 2, '平圈': 3, '针门': 0 }
          const value = nameToValue[item.name] ?? 0
          await writeWithConfirm(0x30 + index, value)
        }

        return 'ok'
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'error' })
        return 'error'
      }
    }

    let res = await writeRegisters()

    if (res !== 'ok') {
      return
    }

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

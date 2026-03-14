<template>
  <div class="content" style="padding-top: 24px">
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
        <div style="text-align: right">
          <t-button @click="connect" variant="text" size="small">连接</t-button>

          <t-button @click="write" variant="text" size="small">写</t-button>

          <t-button @click="read" variant="text" size="small">读</t-button>

          <t-button @click="settings" variant="text" size="small">设置</t-button>
        </div>

        <div v-if="tableData.length > 0">
          <div>
            <t-button theme="primary" size="small" @click="start">开始测量</t-button>
          </div>

          <div class="grid-container">
            <div
              :key="index"
              class="grid-item"
              v-for="(item, index) in tableData">
              <div class="grid-index">{{ index + 1 }}</div>

              <div class="grid-name">类型: {{ item.name }}</div>

              <div class="grid-name">峰值:</div>

              <div class="grid-name">时间点:</div>
            </div>
          </div>
        </div>

        <t-empty v-else icon="no-result" style="margin-top: 200px" description="尚未设置针门组合，连接设备后点击右上角设置" />
      </t-col>
    </t-row>
  </div>
</template>

<script setup>
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import { onMounted, onUnmounted, ref } from 'vue'

// #ifdef APP-PLUS
const module = uni.requireNativePlugin("UsbModule")
// #endif

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
  // #ifdef APP-PLUS
  module.connect()
  // #endif
}

function write() {
  // #ifdef APP-PLUS
  module.write(0x30, 1)
  // #endif
}

function read() {
  // #ifdef APP-PLUS
  module.read(0x30)
  // #endif
}

const msg = ref('')

let pendingWrite = null
let pendingRead = null

// 带确认的写入函数
function writeWithConfirm(address, value, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingWrite = null
      reject(new Error(`写入超时: 0x${address.toString(16)}`))
    }, timeout)

    pendingWrite = { address, value, resolve, reject, timer }
    // #ifdef APP-PLUS
    module.write(address, value)
    // #endif
  })
}

// 带确认的读取函数
function readWithConfirm(address, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRead = null
      reject(new Error(`读取超时: 0x${address.toString(16)}`))
    }, timeout)

    pendingRead = { address, resolve, reject, timer }
    // #ifdef APP-PLUS
    module.read(address)
    // #endif
  })
}

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function start() {
  // 清空寄存器
  let res = await writeWithConfirm(0x11, 0x55)

  // 打开运行开关
  res = await writeWithConfirm(0xf9, 0x1)
  msg.value += `<br/> ${JSON.stringify(res)}`

  uni.showToast({ title: '开始轮询' })

  // 轮询最多100次，直到读取到结果为1
  let pollCount = 0
  while (pollCount < 100) {
    res = await readWithConfirm(0xfb)
    pollCount++

    if (res === 1) {
      uni.showToast({ title: `轮询成功，第${pollCount}次` })
      break
    } else {
      uni.showToast({ title: `res = ${res}` })
    }

    await sleep(1000)
  }

  if (res !== 1) {
    uni.showToast({ title: `轮询超时，已尝试${pollCount}次`, icon: 'error' })
  }
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

    // 处理读取响应（7个16进制数）
    if (pendingRead && byteArray.length === 7) {
      clearTimeout(pendingRead.timer)
      const value = (byteArray[3] << 8) | byteArray[4]
      pendingRead.resolve(value)
      pendingRead = null
      return
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

<template>
  <t-row class="home">
    <t-col span="8" style="border-right: 1px solid #eee;">
      <t-row>
        <e-chart
          ref="eChartRef"
          style="height: 300px; margin-top: 16px"
          @ready="initEChart"/>
      </t-row>

      <t-row style="margin-top: 12px">
        <t-col class="item" span="6">
          当前测量值
        </t-col>

        <t-col class="item" span="18">
          {{ currentReadValue }}
        </t-col>
      </t-row>
    </t-col>

    <t-col span="16" classc="left_pannel">
      <div style="display: flex; justify-content: space-between;">
        <div style="padding-left: 12px;">
          <t-button
            v-if="tableData.length !== 0"
            @click="start"
            size="small"
            :loading="isMeasuring"
            theme="primary">
            {{ isMeasuring ? '测量中' : '开始测量' }}
          </t-button>

          <t-button v-if="tableData.length !== 0" theme="primary" size="small" @click="inc">设置路号</t-button>
        </div>

        <div style="text-align: right">
          <t-button @click="connect" variant="text" size="small">连接</t-button>

          <t-button @click="settings" variant="text" size="small">设置</t-button>
        </div>
      </div>

      <div style="flex: 1; overflow: auto; padding-left: 12px; padding-right: 12px;">
        <div v-if="tableData.length > 0" class="grid-container">
          <div
            :key="index"
            class="grid-item"
            v-for="(item, index) in tableData">
            <div class="grid-index">
              <div>{{ index + 1 }}</div>

              <div v-if="index === currentIndex && isMeasuring" class="indicator"/>
            </div>

            <div class="grid-name">类型: {{ item.name }}</div>

            <div class="grid-name">峰值: {{ item.maxValue }}</div>

            <div class="grid-name">时间点:</div>
          </div>
        </div>

        <t-empty
          v-else icon="no-result"
          style="margin-top: 120px;"
          description="尚未设置针门组合，连接设备后点击右上角设置"/>
      </div>
    </t-col>
  </t-row>
</template>

<script setup>
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import TFormItem from '@tdesign/uniapp/form-item/form-item.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { sleep } from '@/utils/helpers'

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
      data: [],
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

const currentIndex = ref(0)

const currentReadValue = ref(0)

const isMeasuring = ref(false)

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

async function inc() {
  if (tableData.value.length === 0) {
    uni.showToast({ title: '请先设置针门组合', icon: 'none' })
    return
  }

  try {
    // 递增，但不超过表格元素数量
    let value = (currentIndex.value + 1) % tableData.value.length

    await writeWithConfirm(0x13, value)

    let res = await readWithConfirm(0x13)

    currentIndex.value = res
    uni.showToast({ title: `set ${value} read ${res}`, icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'error' })
  }
}

async function start() {
  isMeasuring.value = true

  try {
    // 清空寄存器
    let res = await writeWithConfirm(0x11, 0x55)

    // 打开运行开关
    res = await writeWithConfirm(0xf9, 0x1)

    // 轮询最多100次，直到读取到结果为1
    let pollCount = 0
    while (pollCount++ < 100) {
      res = await readWithConfirm(0xfb)

      if (res === 1) {
        uni.showToast({ title: `轮询成功，第${pollCount}次` })
        break
      }

      // 读取路号
      let index = await readWithConfirm(0x13)

      // 起始的寄存器是 0x102 ，每间隔 4 个寄存器是下一个保存数值的寄存器
      const addr = 0x102 + index * 4
      let value = await readWithConfirm(addr)

      // 更新到table的峰值中
      if (index >= 0 && index < tableData.value.length) {
        tableData.value[index].maxValue = value
      }

      // 读取当前值
      currentReadValue.value = await readWithConfirm(0x15)

      await sleep(1000)
    }

    if (res !== 1) {
      uni.showToast({ title: `轮询超时，已尝试${pollCount}次`, icon: 'error' })
    }
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'error' })
  } finally {
    isMeasuring.value = false
    uni.showToast({ title: '退出循环', icon: 'error' })
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
          result.push({ name: item.label, value: 1, maxValue: '' })
        })
      } else {
        result.push({ name: step.label, value: 1, maxValue: '' })
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
    currentIndex.value = 0 // 重置路号计数器

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
@import './index.css';

page {
  width: 100%;
  height: 100%;
}
</style>

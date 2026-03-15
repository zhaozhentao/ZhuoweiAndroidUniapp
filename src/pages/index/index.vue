<template>
  <t-row class="home">
    <t-col span="8" style="border-right: 1px solid #eee;">
      <t-row>
        <e-chart
          ref="eChartRef"
          style="height: 250px; margin-top: 12px"
          @ready="initEChart"/>
      </t-row>

      <t-input
        id="chu"
        :value="chu"
        label="出圈"
        align="right"
        @change="onChuChange"
        placeholder="请输入"
        type="number"/>

      <t-input
        id="han"
        :value="han"
        label="含圈"
        align="right"
        @change="onHanChange"
        placeholder="请输入"
        type="number"/>

      <t-input
        id="ping"
        :value="ping"
        label="平圈"
        align="right"
        @change="onPingChange"
        placeholder="请输入"
        type="number"/>
    </t-col>

    <t-col span="16" class="left_panel">
      <div class="left_panel_top">
        <div style="padding-left: 12px;">
          <t-button
            v-if="tableData.length !== 0"
            @click="start"
            size="small"
            :loading="isMeasuring"
            theme="primary">
            {{ isMeasuring ? '测量中' : '开始测量' }}
          </t-button>

          <t-button
            v-if="tableData.length !== 0"
            style="margin-left: 12px"
            theme="primary"
            size="small"
            @click="inc">
            下一路
          </t-button>
        </div>

        <div style="text-align: right">
          <t-button @click="connect" variant="text" size="small">连接</t-button>

          <t-button @click="settings" variant="text" size="small">设置</t-button>
        </div>
      </div>

      <div class="left_panel_content">
        <div v-if="tableData.length > 0" class="grid-container">
          <div
            :key="index"
            class="grid-item"
            @click="setting(index)"
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

    <t-dialog
      :title="dialogTitle"
      :visible="dialogShow"
      style="width: 200px"
      :confirm-btn="confirmBtn"
      @confirm="confirm">
      <template #content>
        <div>
          <span>当前值</span>
          <span style="margin-left: 12px;">{{ currentReadValue }}</span>
        </div>

        <div style="margin-top: 12px">
          <span>调机值</span>
          
          <span style="margin-left: 12px;">0</span>
        </div>

        <t-button @click="modifyCurrentValue" style="margin-top: 12px;" theme="primary" size="small">DEBUG 修改当前值</t-button>
      </template>
    </t-dialog>
  </t-row>
</template>

<script setup>
import { sleep } from '@/utils/helpers'
import TRow from '@tdesign/uniapp/row/row.vue'
import TCol from '@tdesign/uniapp/col/col.vue'
import TEmpty from '@tdesign/uniapp/empty/empty.vue'
import TInput from '@tdesign/uniapp/input/input.vue'
import TButton from '@tdesign/uniapp/button/button.vue'
import TDialog from '@tdesign/uniapp/dialog/dialog.vue'
import { onMounted, onUnmounted, ref } from 'vue'

// #ifdef APP-PLUS
const module = uni.requireNativePlugin("UsbModule")
// #endif

const currentValueRegister = 0x15
let pendingWrite = null
let pendingRead = null
let readValueTimer = null

const chu = ref('')
const han = ref('')
const ping = ref('')
const currentIndex = ref(0)
const isMeasuring = ref(false)
const currentReadValue = ref(0)
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
const confirmBtn = {
  content: '确定',
  variant: 'base',
}
const dialogShow = ref(false)
const dialogTitle = ref('')

function initEChart() {
  eChartRef.value.init(option)
}

function settings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function setting(index) {
  dialogShow.value = true

  dialogTitle.value = `${index + 1}${tableData.value[index].name} 调试`

  // 启动定时器，每隔1秒读取当前值
  readValueTimer = setInterval(async () => {
    try {
      // #ifdef APP-PLUS
      currentReadValue.value = await readWithConfirm(currentValueRegister)
      // #endif
    } catch (error) {
      console.error('读取当前值失败:', error)
    }
  }, 1000)
}

function connect() {
  // #ifdef APP-PLUS
  module.connect()
  // #endif
}

async function modifyCurrentValue() {
  await writeWithConfirm(currentValueRegister, 0x123, 4)
}

function confirm() {
  // 清除定时器
  if (readValueTimer) {
    clearInterval(readValueTimer)
    readValueTimer = null
  }

  dialogShow.value = false
}

function onChuChange(value) {
  chu.value = value.value
}

function onHanChange(value) {
  han.value = value.value
}

function onPingChange(value) {
  ping.value = value.value
}

// 带确认的写入函数
function writeWithConfirm(address, value, length, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingWrite = null
      reject(new Error(`写入超时: 0x${address.toString(16)}`))
    }, timeout)

    pendingWrite = { address, value, resolve, reject, timer }
    // #ifdef APP-PLUS
    module.write(address, value, length)
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

    await writeWithConfirm(0x13, value, 2)

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
    await writeWithConfirm(0x11, 0x55, 2)

    // 打开运行开关
    let res = await writeWithConfirm(0xf9, 0x1, 2)

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
      currentReadValue.value = await readWithConfirm(currentValueRegister)

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
  // #ifdef APP-PLUS
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
  // #endif

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
        await writeWithConfirm(0x12, result.length, 2)

        // 根据表格项类型向寄存器写入数据，起始寄存器 0x30
        for (let index = 0; index < result.length; index++) {
          const item = result[index]
          const nameToValue = { '出圈': 1, '含圈': 2, '平圈': 3, '针门': 0 }
          const value = nameToValue[item.name] ?? 0
          await writeWithConfirm(0x30 + index, value, 2)
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

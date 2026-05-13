# ZNYX5.5 智能药箱 — 项目技术手册

| 项目 | 信息 |
|------|------|
| 项目名称 | 智能药箱系统 (Smart Medicine Box) |
| 项目代号 | ZNYX5.5 |
| 主控平台 | STM32F103C8T6 (ARM Cortex-M3, 72MHz) |
| 固件版本 | v5.5 |
| 开发环境 | Keil MDK v5, STM32 StdPeriph Library v3.5.0 |
| 文档日期 | 2026-05-08 |

---

## 1. 系统概述

### 1.1 产品定义

ZNYX5.5 是一款面向家庭用药管理的物联网终端设备。设备放置于药箱内部，通过传感器实时监测药品存储环境和余量，按预设时间表主动提醒用户服药，并将状态数据上传至云平台，支持手机端远程查看和控制。

### 1.2 功能清单

| 编号 | 功能 | 描述 |
|------|------|------|
| F01 | OLED 显示 | 0.96 寸 128×64 单色屏，显示时间、药品信息、温湿度、重量 |
| F02 | 旋转编码器输入 | 正转/反转调节数值，按键确认/切换，替代多个独立按键 |
| F03 | 辅助按键 | 独立按键 Key2，快捷进入定时界面 |
| F04 | 服药定时提醒 | 5 组独立闹钟，每组可配 4 种药品，到时间声光报警 |
| F05 | 红外取药检测 | 反射式红外传感器检测用户伸手取药动作，自动确认已服药 |
| F06 | 超时未服处理 | 报警 10 秒无人取药自动停止，标记未服并云端推送 |
| F07 | 温湿度监测 | DHT11 实时采集，超阈值语音报警 + 云端推送 |
| F08 | 重量监测 | HX711 + 压力传感器，药品不足时语音提醒 + 云端推送 |
| F09 | 阈值可配置 | 温度/湿度/重量阈值通过编码器调节，存入 Flash 掉电不丢失 |
| F10 | 语音播报 | JQ8900 模块，支持服药提醒/温度高/湿度高/缺药四种语音，音量可调 |
| F11 | WiFi 云平台 | ESP01S MQTT 接入 OneNET，上报状态数据，接收远程控制指令 |
| F12 | 远程开关定时 | 手机端可远程开启/关闭定时 1~3 |
| F13 | 服药记录存储 | 内部 Flash 存储最近 6 条服药记录（时间 + 已服/未服） |
| F14 | 低功耗管理 | 无操作 10s 关屏，空闲进入 STOP 模式，RTC 闹钟或 UART 唤醒 |
| F15 | 看门狗 | IWDG 15s 超时，防止死机 |

### 1.3 技术指标

| 参数 | 指标 |
|------|------|
| 主频 | 72MHz (HSE 8MHz × PLL 9) |
| 正常功耗 | ~89mA @5V |
| STOP 模式功耗 | ~17.6mA @5V |
| 温度测量范围/精度 | 0~50°C / ±2°C |
| 湿度测量范围/精度 | 20~90%RH / ±5%RH |
| 重量测量范围 | 0~5000g |
| 闹钟数量 | 5 组 |
| 服药记录容量 | 6 条 |
| WiFi 频段 | 2.4GHz (ESP8266) |
| 云平台 | OneNET MQTT |
| 工作温度 | -10 ~ 60°C |

---

## 2. 硬件架构

### 2.1 硬件框图

```
                    5V 电源输入
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
           HX711      JQ8900      ESP01S
         (5V 称重)   (5V 语音)   (3.3V WiFi)
              │          │          │
         PA6,PA7      PB10        PA2,PA3
              │      USART3      USART2
              │     (9600bps)   (115200bps)
              │          │          │
              └──────────┼──────────┘
                         │
                    ┌────┴────┐
                    │ STM32   │
                    │ F103C8T6│
                    │ 72MHz   │
                    └────┬────┘
                         │
         ┌───────┬───────┼───────┬───────┬───────┐
         │       │       │       │       │       │
        PB6,7   PB9     PB0     PB8     PA8,9   PB11,12
         │       │       │       │       │       │
         ▼       ▼       ▼       ▼       ▼       ▼
       OLED    DHT11   红外    LED报警  旋转    按键
     0.96寸   温湿度   传感器          编码器  (Key2+
     I2C(软)                                编码器键)
```

### 2.2 MCU 引脚资源分配

| GPIO | 外设 | 功能 | 模式 | 备注 |
|------|------|------|------|------|
| PA2 | USART2_TX | ESP01S 发送 | AF_PP | 115200bps |
| PA3 | USART2_RX / EXTI3 | ESP01S 接收 + STOP 唤醒 | IN_FLOATING / IPU | 低功耗时切换为 EXTI |
| PA6 | GPIO | HX711 SCK | Out_PP | |
| PA7 | GPIO | HX711 DOUT | IPU | |
| PA8 | TIM1_CH1 | 编码器 A 相 | IPU | 编码器模式 |
| PA9 | TIM1_CH2 | 编码器 B 相 | IPU | 编码器模式 |
| PB0 | GPIO | 红外传感器 DO | IPU | 低电平 = 检测到物体 |
| PB6 | GPIO | OLED SCL (软件 I2C) | Out_OD | |
| PB7 | GPIO | OLED SDA (软件 I2C) | Out_OD | |
| PB8 | GPIO | LED1 报警灯 | Out_PP | 低电平亮 |
| PB9 | GPIO | DHT11 DATA | Out_PP / IPU | 双向单总线 |
| PB10 | USART3_TX | JQ8900 语音控制 | AF_PP | 9600bps, TX only |
| PB11 | EXTI11 | Key2 按键 | IPU | 下降沿中断 |
| PB12 | EXTI12 | 编码器 C 相按键 | IPU | 下降沿中断 |
| PC13 | GPIO | LED2 辅助指示 | Out_PP | |

### 2.3 时钟配置

```
HSE (8MHz) ──→ PLL (×9) ──→ SYSCLK (72MHz)
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                AHB 72MHz   APB1 36MHz   APB2 72MHz
                               │            │
                          TIM2/3/4    TIM1, GPIOA/B/C
                          USART2/3    AFIO
                          I2C1
                          IWDG

LSE (32.768kHz) ──→ RTC (预分频 32767 → 1Hz)
```

### 2.4 外设时钟与中断优先级

NVIC 优先级分组：Group 4（仅抢占优先级，0~15，数值越小优先级越高）

| 优先级 | IRQn | 中断源 | 处理函数 |
|--------|------|--------|----------|
| 1 | EXTI3_IRQn | PA3 下降沿 (ESP01S 数据唤醒) | EXTI3_IRQHandler [main.c] |
| 2 | TIM4_IRQn | 系统 1ms 时钟 | TIM4_IRQHandler [Tick.c] |
| 3 | USART2_IRQn | ESP01S 数据接收 | USART2_IRQHandler [ESP01S.c] |
| 4 | TIM2_IRQn | 按键消抖 20ms | TIM2_IRQHandler [BtnTIM.c] |
| 5~6 | EXTI15_10_IRQn | PB11/PB12 按键 | EXTI15_10_IRQHandler [Key.c] |
| 7 | RTCAlarm_IRQn | RTC 闹钟 (低功耗唤醒) | RTCAlarm_IRQHandler [main.c] |

---

## 3. 软件架构

### 3.1 整体架构

项目采用**裸机前后台**架构，不使用 RTOS。选型依据：系统内所有任务均为秒级周期，无硬实时约束，RTOS 引入的内存和调度开销不必要。

```
┌─────────────────────────────────────────────┐
│              Application (应用层)             │
│  main.c                                      │
│  系统初始化 / 主循环调度 / UI 状态机          │
│  传感器采集 / 闹钟逻辑 / 低功耗管理           │
├─────────────────────────────────────────────┤
│              System (系统服务层)              │
│  Delay    — 阻塞延时 (SysTick)               │
│  Tick     — 毫秒时钟 (TIM4, 1ms)             │
│  MyRTC    — 实时时钟 (LSE RTC)               │
│  BtnTIM   — 按键消抖 (TIM2, 20ms)            │
│  My_Flash — 内部 Flash 存储管理              │
├─────────────────────────────────────────────┤
│              Hardware (硬件驱动层)            │
│  OLED   — 0.96" SSD1306 (软件 I2C)           │
│  DHT11  — 温湿度 (单总线)                    │
│  HX711  — 称重 (双线协议, 24-bit ADC)        │
│  JQ8900 — 语音播报 (USART3)                  │
│  ESP01S — WiFi + MQTT (USART2, AT 指令)     │
│  encoder — 旋转编码器 (TIM1 编码器模式)       │
│  Key    — 按键 + 闹钟管理逻辑                │
│  LED    — 报警灯 + 低功耗引脚切换             │
│  Reflect— 红外传感器 (GPIO 输入)              │
├─────────────────────────────────────────────┤
│         STM32F10x Standard Peripheral Library │
│              CMSIS Core + 启动                │
└─────────────────────────────────────────────┘
```

### 3.2 主循环

```
main():
    ├── NVIC 优先级分组初始化
    ├── Tick_Init()            // TIM4, 1ms
    ├── OLED_Init()            // SSD1306, 软件 I2C
    ├── Store_Init()           // Flash 存储读取
    ├── BtnTIM_Init()          // TIM2, 按键消抖
    ├── ESP01S_Usart()         // USART2 + EXTI3
    ├── esp_Init()             // AT 指令初始化 WiFi+MQTT
    ├── encoder_Init()         // TIM1 编码器模式
    ├── MyRTC_Init()           // LSE → RTC
    ├── DHT11/HX711/Key/LED/JQ8900/Reflect_Init()
    ├── IWDG 初始化 (15s)
    │
    └── while(1):
          ├── IWDG_ReloadCounter()
          ├── MyRTC_GetTime(now_time)
          ├── MedBox_StateTake()         // 每 3s: 读温湿度+重量, 阈值比较
          ├── esp_Change_Timer()         // 处理远程定时控制指令
          ├── Alaem_Check()              // 5 组闹钟检测
          ├── JQ8900_ReportStates()      // 语音播报状态机 (2s 间隔)
          ├── [检测编码器/按键输入, 更新 last_operation_time]
          ├── [10s 无操作且无异常 → OLED 浅睡眠]
          ├── switch(timestate):         // 6 种界面渲染
          │     case Normal:   OLED_ShowNormal()
          │     case Setting:  OLED_ShowSetting()
          │     case Timing:   OLED_ShowTiming()
          │     case Warning:  OLED_ShowWarning()
          │     case Record:   OLED_ShowRecord()
          │     case Adjust:   OLED_ShowAdjust()
          ├── if (oledstate == 0) OLED_Update()
          ├── WiFi 重连 / MedBox_StateSend()  // 每 60s 上报云平台
          └── [空闲 → OLED_DeepSleep → STOP 模式 → 唤醒 → 恢复]
```

### 3.3 UI 状态机

系统共 6 个界面状态，用户操作驱动状态切换：

```
                      ┌──────────┐
                      │  Normal  │ ← 主界面
                      │  (首页)  │
                      └────┬─────┘
           ┌────────┬──────┼──────┬────────┐
      编码器反转 编码器键   │   Key2    编码器正转
           │        │      │      │        │
           ▼        ▼      │      ▼        ▼
      ┌────────┐ ┌──────┐  │  ┌──────┐ ┌────────┐
      │ Adjust │ │Setting│  │  │Timing│ │ Record │
      │  调节  │ │ 设置  │  │  │ 定时 │ │ 记录  │
      └───┬────┘ └──┬───┘  │  └──┬───┘ └───┬────┘
          │         │      │     │         │
          │    ┌────┘      │     │    ┌────┘
          │    │ 闹钟触发  │     │    │
          │    ▼           │     │    │
          │ ┌────────┐     │     │    │
          │ │Warning │◄────┘     │    │
          │ │  报警  │           │    │
          │ └───┬────┘           │    │
          │     │ 任意键/取药    │    │
          └─────┴───────┴───────┴────┘
                   返回 Normal
```

**Setting 子状态流转**（按键进入下一项）：

```
hour → min → sec → year → mon → mday → weightThr → tempThr → humiThr → (确认返回Normal)
```

**Timing 子状态流转**（每组定时可配置 21 个字段）：

```
Timer → Hour → Min → MedType1 → MedNum1 → Dosage1 → UnitType1
    → MedType2 → MedNum2 → Dosage2 → UnitType2
    → MedType3 → MedNum3 → Dosage3 → UnitType3
    → MedType4 → MedNum4 → Dosage4 → UnitType4
    → Enable → Confirm → (确认保存返回Normal)
```

> 若某 MedType 为 None，自动跳过后续 MedNum/Dosage/UnitType，直接进入 Confirm，避免对不存在的药品设置无意义参数。

**Adjust 子状态流转**：

```
volume → tare → clearrecord → cleartimer → (返回Normal)
```

---

## 4. 模块详细设计

### 4.1 OLED 显示驱动

**文件**：`Hardware/OLED.c`

**通信方式**：软件模拟 I2C，PB6=SCL, PB7=SDA。未使用 STM32 硬件 I2C（规避 STM32F1 I2C 硬件 bug）。

**显存模型**：`uint8_t OLED_DisplayBuf[8][128]`，8 页 × 128 列，共 1024 字节。所有绘制操作先写入显存缓存，最后通过 `OLED_Update()` 整帧发送至 OLED。采用页寻址模式。

**关键 API**：

| 函数 | 功能 |
|------|------|
| `OLED_ShowString(x, y, str, fontsize)` | 显示 ASCII 字符串，支持 6×8 和 8×16 两种字号 |
| `OLED_ShowChinese(x, y, "汉字")` | 显示中文（UTF-8 编码，16×16 点阵），字库在 `OLED_Data.c` |
| `OLED_ShowNum(x, y, num, size, len)` | 显示数字（右对齐，高位补 0） |
| `OLED_ShowImage(x, y, w, h, data)` | 显示任意位图，支持跨页 |
| `OLED_Update()` | 整帧刷新，将显存缓存写入 OLED |
| `OLED_Clear()` | 清空显存缓存 |
| `OLED_DeepSleep_Into/Out()` | 深睡眠控制（关显示 + 关电荷泵，STOP 前使用） |
| `OLED_ShallowSleep_Into/Out()` | 浅睡眠控制（仅关显示，10s 无操作使用） |

**字库与图像资源**：`OLED_Data.c` 中包含项目所需的全部汉字字模（如"药品余量""温度""湿度""定时""设置""已服""未服"等）和 7 种药品类型图标 + 7 种剂量单位图标（均为 16×16 点阵）。

### 4.2 DHT11 温湿度驱动

**文件**：`Hardware/DHT11.c`

**引脚**：PB9，单总线协议（输出推挽 / 输入上拉动态切换）。

**通信时序**：主机拉低 20ms → 拉高 30μs → DHT11 应答 80μs 低 + 80μs 高 → 接收 40bit（湿度整数+小数+温度整数+小数+校验和）。每 bit 由 50μs 低电平 + 高电平长度（26~28μs=0, 70μs=1）表示。

**容错**：每个等待阶段设有超时计数，超时返回 1；校验和不匹配时丢弃数据。调用方通过返回值判断读取是否成功。

### 4.3 HX711 称重驱动

**文件**：`Hardware/HX711.c`

**引脚**：PA6=SCK, PA7=DOUT。

**通信协议**：DOUT 拉低表示数据就绪，SCK 产生 25 个脉冲（前 24 个读取数据 MSB 优先，第 25 个选择下次增益=128）。原始 24-bit 值异或 0x800000 转换为有符号数。

**校准**：`TareValue`（去皮零点）和 `Weights_100`（100g 标定值）为编译期常数，基于实际传感器标定确定。`GetMaoPi()` 支持运行时去皮。

**换算公式**：`重量(g) = (raw - maopi) × Weights / (Weights_100 - TareValue)`

### 4.4 JQ8900 语音模块

**文件**：`Hardware/JQ8900.c`

**通信**：USART3, TX only, 9600-8-N-1。

**指令帧格式**（定长）：`AA + 指令码 + 数据长度 + 数据... + 校验和(前部累加取低字节)`

**语音播放**：4 个预录音频文件（01=请服药, 02=温度过高, 03=湿度过高, 04=药品不足），通过 `AA 07 02 00 [序号] [校验]` 指令触发。

**优先级调度**：异常状态标志 `mediBoxStateFlags` 的 bit 位记录当前异常。播报优先级从高到低：

```
药品不足 (播2次) > 温度过高 (播2次) > 湿度过高 (播1次) > 服药提醒 (播1次)
```

使用 `nowIndex`/`nowWeight` 静态变量实现分时轮播：每次主循环调用最多发一条语音指令，播报间隔 2 秒，防止指令重叠导致模块无响应。

### 4.5 ESP01S WiFi MQTT 通信

**文件**：`Hardware/ESP01S.c`

**物理层**：USART2, 115200-8-N-1。TX(PA2) 推挽发送；RX(PA3) 浮空输入接收，同时复用为 EXTI3 下降沿中断用于 STOP 唤醒。

**数据接收**：USART2 RXNE 中断 → 256 字节环形缓冲 `ESP01S_RxData[]` → 检测 `\n` 帧尾 → 触发帧解析 `esp_Get_Data()`。

**AT 指令交互**：`esp_Cmd(cmd, expected_response)` 发送指令 + 轮询等待期望响应（超时 2s）。通过 `ESP01S_Printf` 支持格式化发送。

**MQTT 连接参数**：

| 项目 | 值 |
|------|-----|
| 平台 | OneNET (中国移动) |
| 服务器 | mqtts.heclouds.com:1883 |
| 产品 ID | NA506BXRBK |
| 设备 ID | znyx |
| 认证 | Token (MD5 签名) |
| WiFi AP | www / www123456 |

**MQTT 主题**：

| 方向 | 主题 | 用途 |
|------|------|------|
| 发布 | `$sys/.../thing/property/post` | 设备属性上报 |
| 订阅 | `$sys/.../thing/property/set` | 接收平台下发指令 |

**上报数据**（按频率分类）：

| 频率 | 数据内容 | 上报函数 |
|------|----------|----------|
| 每 60s | temp + humi + weight + record | `ESP01S_SendMedState()` |
| 事件触发 | nogood / notake / noenough 报警 | `ESP01S_SendNoGood/Notake/NoEnough()` |
| 状态变更 | one/two/three 定时开关 | `ESP01S_SendTimerState()` |

**远程控制流程**：

```
手机APP切换定时开关 → OneNET下发MQTT消息
  → ESP01S接收 → USART2中断 → esp_Get_Data()
  → esp_Get_Timer() 解析JSON (识别one/two/three + true/false)
  → 置位 alarmEnFlag (1~6)
  → 主循环 esp_Change_Timer() 消费标志位
  → 修改 alarm[].Enable + 写Flash + 上报最新状态
```

**断线重连状态机**（8 状态）：

```
state 0: AT+RST     (复位)
state 1: AT+CWMODE   (等2s)
state 2: AT+CWDHCP   (等2s)
state 3: AT+CWJAP    (连接WiFi, 等3s)
state 4: AT+MQTTUSERCFG (等2s)
state 5: AT+MQTTCONN (等2s)
state 6: AT+MQTTSUB  (等2s)
state 7: Done (恢复 Initflag=0)

每步失败 → 重置回 state 0，等待下次触发 (esp_reconnect_flag=1 | 10s 超时)
```

每次主循环只推进一个状态，不会长时间阻塞。触发条件：`Initflag == 1` 或 `esp_timeout > 2`（累计收到 ERROR 响应次数）。

### 4.6 旋转编码器驱动

**文件**：`Hardware/encoder.c`

**编码器接口**：TIM1 编码器模式 (TI1)，Filter=0xF，CNT 初始值 32767。

**方向判定**：TIM1 计数器值 > 32767 = 正转，< 32767 = 反转。每次读取后重置计数器。

**C 相按键**：PB12, EXTI Line12 下降沿中断，与 Key2 共用 TIM2 20ms 消抖。

**交互逻辑**：`foreward()` / `backward()` 根据当前 `timestate` 和子状态执行对应的数值加减或状态跳转（详见 3.3 节 UI 状态机）。各状态的数值调节范围均有边界保护。

### 4.7 按键 + 闹钟管理

**文件**：`Hardware/Key.c`

**按键消抖流程**：

```
按键按下(PB11/PB12) → EXTI15_10_IRQHandler
  → 关闭两个 EXTI 线（防重复触发）
  → 启动 TIM2 (20ms)
  → TIM2_IRQHandler: 读引脚电平确认 → 置 Pressed/Unpressed
  → 重新使能两个 EXTI 线
```

**闹钟触发检测**（`Alaem_Check()`，主循环每轮调用）：

1. 遍历 alarm[0]~alarm[4]，跳过 Enable != 1 的闹钟
2. 匹配条件：小时相等 AND 分钟相等 AND 秒数 ≤ 20（提供 20s 窗口）
3. 匹配后：禁用该闹钟（单次触发）、置 timerFlags、记录 TrigTime、切换至 Warning 界面
4. 红外确认检测：`PB0 == 0` → 已服药（Confirm=2），存记录
5. 超时检测：`RTC_GetCounter() - TrigTime >= 10` → 未服（Confirm=1），存记录，云端推送
6. 任一闹钟触发 → LED_ON；全部清除 → LED_OFF

**闹钟数据结构**（每闹钟 20 个字段）：

```
{ Hour, Min,                                    // 触发时间
  MedType1, MedNum1(A-Z), Dosage1(0-99), UnitType1,  // 药品1
  MedType2, MedNum2,       Dosage2,       UnitType2,  // 药品2
  MedType3, MedNum3,       Dosage3,       UnitType3,  // 药品3
  MedType4, MedNum4,       Dosage4,       UnitType4,  // 药品4
  Enable, Confirm, TrigTime }
```

### 4.8 系统服务模块

**Tick** — 毫秒时钟（`System/Tick.c`）：TIM4 配置 1ms 周期，中断内 `g_tick_count++`。`GetTick()` 返回 32 位毫秒计数，差值比较可正确处理溢出回绕。

**Delay** — 阻塞延时（`System/Delay.c`）：操作 SysTick 实现 us/ms/s 延时。仅用于初始化阶段和外设时序控制，主循环中不使用阻塞延时。

**MyRTC** — 实时时钟（`System/MyRTC.c`）：LSE 32.768kHz → RTC 预分频 32767 → 1Hz。首次上电检测 BKP_DR1 确定是否需要初始化。时区 UTC+8，使用 C 标准库 `mktime/localtime` 转换。RTC Alarm 中断用于 STOP 模式定时唤醒。光标闪烁效果通过 500ms 周期的线段擦除/重绘实现。

**BtnTIM** — 按键消抖（`System/BtnTIM.c`）：TIM2 配置 20ms 周期（72MHz/7200/200=20ms）。在 ISR 中确认按键有效后，重新使能 EXTI 等待下次按键。

**My_Flash** — Flash 存储（`System/My_Flash.c`）：封装 Flash 解锁→擦除→编程→上锁序列。写入期间关全局中断保护 FPEC。Store_Data[10][20] 数组为全 Flash 数据的 RAM 缓存，上电时从 Flash 读取到缓存，修改后统一写入。

### 4.9 低功耗管理

**文件**：`User/main.c`, `Hardware/LED.c`

**进入 STOP 流程**（`main.c:191~211`）：

1. 前提条件：无异常报警 (`mediBoxStateFlags==0`) + OLED 已关闭 (`oledstate==1`) + WiFi 就绪 (`Initflag==0`)
2. OLED 深睡眠（关升压电路）
3. `LowPower_ON()` → 关 USART2 → PA3 切换为 EXTI 唤醒引脚
4. `LowPowerWakeUp(10)` → 设置 RTC 闹钟 10 秒后触发
5. `PWR_EnterSTOPMode()` → CPU 休眠

**退出 STOP 流程**（唤醒后）：

1. `LowPower_OFF()` → 禁用 EXTI3 → `SystemClock_Recovery()` 恢复 72MHz → PA3 切回 UART → 重开 USART2
2. OLED 深睡眠退出（开升压电路）
3. IWDG 喂狗
4. 继续主循环

**时钟恢复**（`SystemClock_Recovery()`）：HSE_ON → 等待 HSERDY → PLL 配置 → PLL_ON → 等待 PLLRDY → Flash Latency=2 → SYSCLK 切换至 PLL。

---

## 5. 数据存储

### 5.1 Flash 分区

```
0x08000000 ───────────── 固件区 ────────────── 0x0800F7FF
0x0800F800 ─── Alarm 页 (1KB) ─── 0x0800FBFF  闹钟1~3配置
0x0800FC00 ─── Store 页 (1KB) ─── 0x0800FFFF  标志+阈值+6条记录
```

### 5.2 Store 页布局

| 缓存索引 | Flash 偏移 | 内容 |
|----------|-----------|------|
| Store_Data[0] | +0~39 | [0]=0x5A5A 初始化标志, [1]=温度阈值(默认40), [2]=湿度阈值(默认65), [3]=重量阈值(默认0), [4..19]=保留 |
| Store_Data[1] | +40~79 | 服药记录#1（最新）：年,月,日,时,分,确认状态(2=已服/1=未服/0=无) |
| Store_Data[2] | +80~119 | 服药记录#2 |
| ... | ... | ... |
| Store_Data[6] | +240~279 | 服药记录#6（最早） |

### 5.3 Alarm 页布局

| 缓存索引 | Flash 偏移 | 内容 |
|----------|-----------|------|
| Store_Data[7] | +0~39 | 闹钟1：Hour,Min + 4×药品(类型,名称,剂量,单位) + Enable + Confirm |
| Store_Data[8] | +40~79 | 闹钟2 |
| Store_Data[9] | +80~119 | 闹钟3 |

### 5.4 写入安全

- 所有 Flash 写入操作均在 `__disable_irq()` / `__enable_irq()` 保护下执行
- 页擦除前先擦除整页再重写全部数据（简单可靠，适合低频写入场景）
- 写入时机（低频，日均数次）：用户确认退出设置、闹钟触发记录、远程控制指令、清空操作

---

## 6. 构建与烧录

### 6.1 开发环境

| 组件 | 版本/配置 |
|------|-----------|
| IDE | Keil MDK v5 (uVision 5) |
| 编译器 | ARMCC (Keil 内置) |
| 库 | STM32F10x Standard Peripheral Library v3.5.0 |
| 调试器 | ST-Link V2 (SWD) |
| 预定义宏 | `STM32F10X_HD`, `USE_STDPERIPH_DRIVER` |

### 6.2 编译与下载

1. 用 Keil MDK 打开 `Project.uvprojx`
2. 确认 Target 芯片为 `STM32F103C8`
3. Build (F7)，确认 0 Error
4. Flash → Configure Flash Tools → 选择 ST-Link Debugger, SWD 接口
5. 烧录 (F8)

### 6.3 首次烧录注意

首次烧录后 MCU Flash 全部为空（0xFF），系统会检测到 BKP_DR1 ≠ 0xA5A5 和 Store_Data[0][0] ≠ 0x5A5A，自动执行初始化序列，在 Flash 存储区写入默认参数。

后续固件更新时，建议使用 Sector 擦除模式，并排除 0x0800F800~0x0800FFFF 区域，以保护用户配置和服药记录不被擦除。

---

## 7. 版本历史

| 版本 | 关键变更 |
|------|----------|
| v3.0 | 首版：OLED 显示、DHT11/HX711/JQ8900/ESP01S 驱动、定时提醒、OneNET 通信 |
| v3.5 | 可调音量、去皮校准、完善 HX711 函数 |
| v3.7 | ESP01S 异常断线重连 |
| v4.0 | 阈值存储改为仅变更时写入 Flash；Key1/Key2 功能调换 |
| v4.2 | 重连改为分段执行，防止阻塞影响闹钟响应（最大 5s 窗口） |
| v4.5 | 再次优化重连机制；代码格式规范化 |
| v4.6 | 数据上报异步化；修复清空记录时读取错误数据导致卡死的 bug；修复闹钟触发时只保存记录不保存闹钟状态的 bug |
| v4.7 | 增加 IWDG 独立看门狗（15s 超时） |
| v5.0 | 引入 SLEEP 低功耗模式 |
| v5.5 | 升级为 STOP 模式；增加 UART 数据到达唤醒；功耗从 ~22mA 降至 ~17.6mA |

---

## 附录 A. 模块依赖关系

```
main.c
 ├── Delay.h        (初始化阶段使用)
 ├── Tick.h         (GetTick 超时判断)
 ├── MyRTC.h        (时间获取、UI状态枚举)
 ├── BtnTIM.h       (初始化)
 ├── My_Flash.h     (Store_Init)
 ├── LED.h          (LowPower_ON/OFF、LED控制)
 ├── Key.h          (按键、闹钟)
 ├── OLED.h         (显示)
 ├── encoder.h      (编码器输入)
 ├── DHT11.h        (温湿度)
 ├── ESP01s.h       (WiFi/MQTT)
 ├── HX711.h        (称重)
 ├── JQ8900.h       (语音)
 └── Reflect.h      (红外)
```

---

## 附录 B. 全局变量索引

| 变量 | 类型 | 定义位置 | 用途 |
|------|------|----------|------|
| `timestate` | TimeState | MyRTC.c | 当前 UI 界面状态 |
| `alarm[5]` | Alarm[] | Key.c | 5 组闹钟配置 |
| `Store_Data[10][20]` | uint16_t[][] | My_Flash.c | Flash 数据 RAM 缓存 |
| `mediBoxStateFlags` | uint8_t | JQ8900.c | 异常状态位 (bit0~3) |
| `now_time[6]` | int16_t[] | MyRTC.c | 当前时间 {年,月,日,时,分,秒} |
| `setting_time[6]` | int16_t[] | MyRTC.c | 设置界面中的临时时间 |
| `tempInThr/humiInThr` | int8_t | MyRTC.c | 温度/湿度阈值 |
| `weightInThr` | int16_t | MyRTC.c | 重量阈值 (g) |
| `g_tick_count` | uint32_t | Tick.c | 系统毫秒计数 |
| `Initflag` | uint8_t | ESP01S.c | WiFi 就绪标志 (0=就绪) |
| `ESP01S_RxData[256]` | uint8_t[] | ESP01S.c | UART 接收缓冲区 |
| `oledstate` | uint8_t | main.c | OLED 睡眠状态 (0=亮, 1=灭) |
| `last_operation_time` | uint32_t | main.c | 上次用户操作时间戳 |
| `volumeadjust` | int8_t | JQ8900.c | 当前音量 (0-30) |
| `newRecord[32]` | char[] | My_Flash.c | 最新服药记录字符串 |
| `lasttimestate` | TimeState | MyRTC.c | 进入 Warning 前的界面状态 |

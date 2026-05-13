# Search Patterns for Embedded Code Analysis

Regex and grep patterns for extracting key information from STM32 firmware (bare-metal or FreeRTOS).

---

## STM32 Standard Peripheral Library Patterns

### GPIO Init (pin config)
```regex
GPIO_InitStructure\.GPIO_Pin\s*=|GPIO_InitStructure\.GPIO_Mode\s*=
```
Find every GPIO pin configuration. Cross-reference with `GPIO_Init()` calls to build the complete pin mapping table.

### Peripheral Clock Enable
```regex
RCC_APB\w+PeriphClockCmd\(\s*|RCC_AHB\w+PeriphClockCmd\(\s*
```
Reveals which peripherals are enabled: USART, SPI, I2C, TIM, ADC, DMA, etc.

### NVIC Configuration
```regex
NVIC_PriorityGroupConfig\(\s*|NVIC_InitStructure\.NVIC_IRQChannel\s*=|NVIC_InitStructure\.NVIC_IRQChannelPreemptionPriority\s*=
```
Extract every IRQ priority assignment.

### Timer Configuration
```regex
TIM_TimeBaseInit\(\s*TIM\d\s*,
```
Find all timer instances and their periods (from `TIM_Period` and `TIM_Prescaler`).

---

## STM32 HAL Patterns

### HAL Peripheral Init
```regex
HAL_\w+_Init\(\s*&\w+\s*\)
```
Captures: UART, SPI, I2C, ADC, TIM, CAN, RTC, DMA, RCC, GPIO init calls.

### HAL MSP Init (pin mapping)
```regex
HAL_\w+_MspInit\(\s*
```
Where GPIOs, clocks, DMA, NVIC are configured per peripheral.

### HAL IRQ Handlers
```regex
void\s+\w+_IRQHandler\s*\(\s*void\s*\)
```

---

## Clock Tree

### PLL Configuration
```regex
RCC_PLLConfig\(\s*|RCC_HSEConfig\(\s*|RCC_SYSCLKConfig\(\s*
```
HSE frequency, PLL source and multiplier, system clock source.

### RTC Configuration
```regex
RCC_RTCCLKConfig\(\s*|RCC_LSEConfig\(\s*|RTC_SetPrescaler\(\s*
```

---

## State Machines

### State Enums
```regex
typedef\s+enum\s*\{[^}]*\}\s*\w*State|typedef\s+enum\s*\{[^}]*\}\s*\w*state
```
Find state machine definitions, then search for the state variable and all transitions.

### State Variable Usage
Once you find the state enum, grep for the state variable name to find all transition points.

---

## FreeRTOS (if applicable)

### Task Creation
```regex
xTaskCreate\(\s*\w+\s*,|xTaskCreateStatic\(\s*
```
Follow up: read the task function, note priority and stack size.

### Queue/Semaphore Creation
```regex
xQueueCreate\(\s*\d+\s*,\s*\d+\s*\)|xSemaphoreCreate\w+\(\s*\)
```

### FreeRTOSConfig.h Key Values
Read `FreeRTOSConfig.h` for: `configTICK_RATE_HZ`, `configMAX_PRIORITIES`, `configMINIMAL_STACK_SIZE`, `configTOTAL_HEAP_SIZE`.

---

## Flash / Storage

### Flash Address Definitions
```regex
#define\s+\w*START_ADDRESS\s+0x|#define\s+\w*STORE\w*\s+0x|#define\s+FLASH_\w*_ADDR\s+0x
```
Find custom Flash storage addresses and page boundaries.

### Flash Operations
```regex
FLASH_ErasePage\(\s*|FLASH_ProgramHalfWord\(\s*|FLASH_Unlock\(\s*|__disable_irq\(\s*\)
```
Reveals storage write sequences and critical section protection.

---

## Low Power

### Power Mode Entry
```regex
PWR_EnterSTOPMode\(\s*|PWR_EnterSTANDBYMode\(\s*|PWR_EnterSLEEPMode\(\s*|__WFI\(\s*\)|__WFE\(\s*\)
```

### Clock Recovery
```regex
SystemClock_Recovery|RCC_HSEConfig\(\s*RCC_HSE_ON\s*\)
```
Wake-up clock recovery sequences.

---

## Communication Protocols

### UART Init
```regex
USART_Init\(\s*USART\d\s*,|USART_InitStructure\.USART_BaudRate\s*=
```
Baud rates and UART instance usage.

### AT Commands
```regex
AT\+|esp_Cmd\(\s*\"AT|ESP01S_Printf\(\s*\"AT
```
Find AT command strings sent to WiFi/BLE modules.

### MQTT / Cloud
```regex
mqtt|MQTT|AT\+MQTT|AT\+MQTTSUB|AT\+MQTTPUB|\$sys/
```
MQTT topic strings, broker addresses, device credentials.

---

## Build System

### Preprocessor Defines (chip model)
```regex
#define\s+STM32\w+|#define\s+USE_STDPERIPH_DRIVER
```
Reveals: MCU series, library mode.

### Toolchain Info
Look for: `arm-none-eabi-`, `-mcpu=cortex-`, `-mthumb` in Makefile or build output.

---
name: embedded-doc-generator
description: Generate comprehensive project documentation for embedded C/C++ projects, especially STM32 + FreeRTOS. Use this skill whenever the user asks to generate project docs, document their embedded codebase, create architecture documentation, write API references, document drivers or RTOS tasks, or produce any kind of technical documentation from embedded firmware code. Also trigger when the user mentions 项目文档, 生成文档, 代码文档, 架构文档, or wants to onboard someone to their embedded project.
---

# Embedded Project Technical Manual Generator

Generate a professional, single-file technical manual from embedded C/C++ firmware codebases. The output is a cohesive Markdown document written in a **company-deliverable technical manual style** — formal, readable, and structured for human engineers. Bilingual: Chinese descriptions + English technical identifiers.

## Core Philosophy

This is NOT API reference docs. This is NOT an academic thesis. This is a **company project technical manual** — the kind of document a team produces when shipping an embedded product. It should:
- Be a **single file** that reads as one cohesive document
- Explain **WHY** design decisions were made, not just WHAT was implemented
- Use **professional technical writing** — factual, concise, no fluff
- Be **scannable**: tables, lists, clear headings; diagrams where helpful
- Serve as **the definitive reference** for anyone joining the project

---

## Workflow Overview

```
Phase 1: Discover   →  Map project structure, identify architecture, classify files
Phase 2: Analyze    →  Deep-read every layer, extract key design details
Phase 3: Compose    →  Write a single cohesive technical manual
Phase 4: Verify     →  Cross-check every claim against source code
```

---

## Phase 1: Discovery

### 1.1 Survey the project

Identify:
- **Build system**: `Makefile`, `CMakeLists.txt`, `*.ioc` (CubeMX), `.cproject` (STM32CubeIDE), `*.uvprojx` (Keil), `platformio.ini`
- **Architecture pattern**: RTOS (FreeRTOS/ThreadX/etc.) or bare-metal superloop
- **MCU family**: STM32F1/F4/H7/etc., GD32, ESP32, etc.
- **Main entry**: `main.c`, `main.cpp`
- **Key config**: `FreeRTOSConfig.h`, `stm32*_conf.h`, `*_it.c`
- **Linker script**: `*.ld` — extract memory layout

### 1.2 Classify every source file

| Layer | Contents | Examples |
|-------|----------|----------|
| **Hardware Drivers** | Custom peripheral/sensor drivers | `OLED.c`, `DHT11.c`, `ESP01S.c`, `HX711.c` |
| **System Services** | Timers, RTC, flash storage, delay, watchdog | `Tick.c`, `MyRTC.c`, `My_Flash.c` |
| **Application** | Main loop, state machines, business logic, UI | `main.c`, UI rendering functions |
| **Library / HAL** | Vendor SDK, CMSIS, standard peripheral lib | `stm32f10x_*.c`, `FreeRTOS/` |

Present the classification to the user for confirmation before proceeding.

---

## Phase 2: Deep Analysis

Read every `.c` and `.h` file in the Hardware, System, and Application layers. Extract the following:

### 2.1 Hardware Platform

- **MCU**: exact model, core, frequency, Flash/SRAM size
- **Clock tree**: HSE/HSE freq, PLL config, SYSCLK, APB1/APB2/AHB frequencies. Draw as ASCII or Mermaid
- **Pin mapping**: Every GPIO pin — number, signal name, connected device, mode (PP/IPU/OD/AF), peripheral instance
- **Peripheral allocation**: Which USART, SPI, I2C, TIM, ADC, DMA channels are used and for what
- **NVIC configuration**: Priority grouping, each IRQ's preemption priority, handler function

### 2.2 Software Architecture

- **Architecture pattern**: Bare-metal superloop or RTOS. If bare-metal, describe the main loop sequence. If RTOS, describe all tasks
- **Main loop flow**: What happens in each iteration, in order. Draw as sequence or flowchart
- **UI state machine** (if applicable): All states, transitions, and what triggers each transition. Draw as state diagram
- **Data flow**: How sensor data flows from hardware → driver → application → display/cloud

### 2.3 Each Hardware Driver Module

For every driver, document:
- **Communication protocol**: I2C/SPI/UART/one-wire/two-wire, baud rate, addressing, timing
- **Key data structures**: Important structs and enums
- **Public API**: Functions in the header — what each does, parameters, return values
- **Initialization sequence**: What `*_Init()` does step by step
- **Design rationale**: Why this approach (e.g., "software I2C instead of hardware I2C to avoid STM32F1 I2C hardware bug")
- **Error handling**: Recovery mechanisms, timeouts, retry logic

### 2.4 Application Logic

- **Startup sequence**: `main()` from reset to main loop
- **Key algorithms**: How alarm checking works, how threshold detection works, how debouncing works
- **Data persistence**: Flash/EEPROM layout — addresses, page sizes, data structures stored, write timing, atomicity protection
- **State transitions**: Complete state machine documentation

### 2.5 Communication & Protocols

- **External communication**: WiFi/MQTT/BLE/CAN — connection parameters, topics, message formats, authentication
- **Protocol details**: AT commands, JSON payloads, binary packet formats
- **Error recovery**: Reconnection logic, timeout handling, keep-alive

### 2.6 Power Management (if applicable)

- Low-power modes used (SLEEP/STOP/STANDBY)
- Entry/exit conditions and sequences
- Wake-up sources
- Measured current consumption

---

## Phase 3: Composition

### Output: A single Markdown file

Write **one** file named `[PROJECT]-技术手册.md` (or `[PROJECT]-Technical-Manual.md`).

Use `references/templates.md` for the exact section structure structure and writing style. The template is the authoritative reference for formatting.

### Essential Rules

1. **Single cohesive document** — never scatter into multiple files. One file, one project, complete documentation.
2. **Professional tone** — factual, concise, no filler. Write like an engineer documenting their work for colleagues.
3. **Explain design decisions** — for every non-obvious choice, add a sentence about WHY. "Uses software I2C rather than hardware I2C due to STM32F1 hardware I2C bus lock bug."
4. **Bilingual**: Chinese for narrative/descriptions. English for all code identifiers (function names, variable names, register names, enum values).
5. **Tables for data, paragraphs for explanation**: Pin mappings, API lists, config parameters go in tables. Algorithms, state machine flows, protocol sequences, and error recovery procedures go in numbered lists or ASCII flow diagrams — never compress these into tiny table cells.
6. **Match module type to template**: Communication modules (WiFi/MQTT/BLE) MUST include connection params table, topic table, data reporting table, and reconnection flow. Do not skip these sub-sections. Storage modules must show address layout and field definitions. Power management modules must show numbered enter/exit sequences.
7. **Don't over-compress**: The module design section is the most important part of the document. Each module gets its own `### 4.X` subsection. Do not merge multiple modules into a single table or single paragraph. Use the templates in `references/templates.md` — they specify exactly which sub-sections each module type requires.
8. **Every claim must be verifiable in source code** — no guessing pin numbers, function names, or behaviors.

### Diagrams

- **ASCII block diagrams** for hardware architecture (works in any text viewer)
- **Mermaid** for state machines (`stateDiagram-v2`), flowcharts (`graph TD/LR`), sequences (`sequenceDiagram`)
- For Chinese text in Mermaid nodes, wrap in quotes: `A["中文描述"]`

---

## Phase 4: Verification

Before finalizing:

1. **Pin check**: Every pin number and function must match the actual GPIO init code
2. **Function check**: Every function name mentioned must exist when grepped
3. **Address check**: Flash addresses, peripheral instances must match actual `#define` values
4. **Priority check**: NVIC priority values must match actual `NVIC_InitStructure` assignments
5. **Data structure check**: Struct field offsets in Flash layout docs must match actual struct definitions

If verification finds a discrepancy, fix the documentation. Never fake or guess values.

---

## Tool Usage

- **Glob**: Discover file structure. Always use first.
- **Grep**: Search for specific patterns (peripheral init, ISRs, state enums). See `references/patterns.md`.
- **Read**: Read every source file. Do not skip.
- **Write**: Write the single output file to `docs/` directory.
- **Bash**: List directories, check build artifacts.

# Embedded Doc Generator — Claude Code Skill

A Claude Code skill that generates professional, single-file **technical manuals** from embedded C/C++ firmware codebases. Designed for STM32 + FreeRTOS or bare-metal projects.

The output is a company-deliverable technical manual — not scattered API docs, not an academic thesis. It follows the standard Chinese engineering documentation format used in real product teams.

## Features

- **Single-file output** — one cohesive Markdown document covering the entire project
- **Multi-architecture** — supports both bare-metal superloop and FreeRTOS RTOS projects
- **Module-type-aware** — uses different templates for sensors, displays, communication modules, input devices, storage, and power management
- **Communication modules get full treatment** — MQTT topic tables, data reporting tables, remote control flows, reconnection state machines
- **Bilingual convention** — Chinese narrative + English code identifiers
- **ASCII + Mermaid diagrams** — hardware block diagrams, clock trees, state machines, data flow
- **Phase-based workflow** — Discover → Analyze → Compose → Verify, with cross-checking against source code

## Quick Start

### Installation

1. Download `embedded-doc-generator.zip` from the latest release
2. In Claude Code, type:
   ```
   /install embedded-doc-generator.zip
   ```
3. Or manually extract to `~/.claude/skills/embedded-doc-generator/`

### Usage

```
为 <项目目录> 生成项目技术手册，放在 <输出目录> 下
```

The skill triggers on phrases like: `项目文档`, `生成文档`, `代码文档`, `架构文档`, `技术手册`, or any request to document an embedded codebase.

## Output Structure

A single `PROJECT-技术手册.md` file with the following sections:

| Section | Content |
|---------|---------|
| **1. 系统概述** | Product definition, feature checklist (F01-Fxx), technical specifications |
| **2. 硬件架构** | Hardware block diagram, full pin mapping table, clock tree, interrupt priority table |
| **3. 软件架构** | Layered architecture diagram, main loop / task scheduling, UI state machine with transitions |
| **4. 模块详细设计** | One subsection per module with protocol details, API tables, data structures, design rationale |
| **5. 数据存储** | Flash/EEPROM partition layout, data structure definitions, write safety mechanisms |
| **6. 构建与烧录** | Development environment, build steps, flash/download notes |
| **7. 版本历史** | Version changelog table |
| **附录 A/B** | Module dependency graph, global variable index |

### Module Templates

Each module type has its own required structure:

| Template | Applies to | Required sub-sections |
|----------|-----------|----------------------|
| **4C (通信)** | WiFi/MQTT/BLE modules | Connection params, topic table, data reporting table, reconnection state machine, remote control flow |
| **4B (显示)** | OLED/LCD drivers | Communication method, framebuffer model, font/image resources |
| **4A (传感器)** | DHT11, HX711, etc. | Pin, protocol timing, error handling |
| **4D (输入)** | Encoders, buttons | Debounce mechanism, interaction logic, data structures |
| **4E (系统)** | RTC, timers, flash storage | Individual paragraph per service, never merged |
| **4F (功耗)** | Low-power management | Numbered enter/exit sequences, power comparison table |

## Example Output

See [`examples/ZNYX5.5-技术手册.md`](examples/ZNYX5.5-技术手册.md) for a complete example generated from a real STM32F103 smart medicine box project.

## Supported Projects

- **MCU**: STM32F1/F4/H7, GD32, ESP32, and other Cortex-M based MCUs
- **SDK**: STM32 HAL, Standard Peripheral Library, CMSIS
- **RTOS**: FreeRTOS (with CMSIS-RTOS v1/v2 wrapper), or bare-metal superloop
- **Build systems**: Keil MDK, STM32CubeIDE, CMake, PlatformIO
- **Peripherals**: UART, SPI, I2C, ADC, TIM, DMA, RTC, IWDG, GPIO EXTI

## How It Works

The skill follows a 4-phase workflow:

```
Phase 1: Discover   →  Map project structure, identify architecture, classify files
Phase 2: Analyze    →  Deep-read every layer, extract design details
Phase 3: Compose    →  Write a single cohesive technical manual
Phase 4: Verify     →  Cross-check every claim against source code
```

In Phase 4, every pin number, function name, Flash address, interrupt priority, and data structure offset is verified against the actual source code before the document is finalized.

## Requirements

- Claude Code (CLI or IDE extension)
- The skill runs entirely within Claude Code — no external dependencies

## Files

```
embedded-doc-generator/
├── SKILL.md                    # Main skill definition and workflow
└── references/
    ├── templates.md            # Exact section templates with writing rules
    └── patterns.md             # Regex patterns for code analysis
```

## License

MIT

---

*Built for embedded engineers who need to document what they've built, not just list APIs.*

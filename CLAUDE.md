# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZhuoweiUniapp (卓纬大圆机) is a cross-platform mobile app built with Uniapp 3.0 + Vue 3 for managing circular knitting machine configurations. Primary target is Android with native plugin support.

## Development Commands

```bash
# Development
npm run dev:h5              # Web development server
npm run dev:mp-weixin       # WeChat mini program dev

# Production builds
npm run build:h5            # Web build
npm run build:mp-weixin     # WeChat mini program build
```

For Android builds, use HBuilder X IDE (configured in `.hbuilderx/launch.json`).

## Architecture

**Three-page structure:**
- `src/pages/index/index.vue` - Main dashboard with ECharts pie chart and machine config grid display
- `src/pages/settings/index.vue` - Configuration list management
- `src/pages/settings/add.vue` - Create/edit configurations with combos (出圈/含圈/平圈) and arranges (组合/针门)

**Key patterns:**
- Local storage key: `machine-settings-config` for persisting configurations
- Inter-page communication via `uni.$emit`/`uni.$on('configSelect', ...)`
- Path alias: `@` maps to `src/`

**Native plugin:**
- `nativeplugins/HuaweiScanModule/` - Android-specific scanning module
- Usage: `uni.requireNativePlugin("HuaweiScanModule-HuaweiScanModule")`

**UI framework:** TDesign Uniapp (`@tdesign/uniapp`)

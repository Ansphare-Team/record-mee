# RecordMee v1.6.0

## What's New

RecordMee is a free, open-source screen recorder and editor for creating polished demo videos, walkthroughs, and product recordings. This release brings performance improvements, bug fixes, and enhanced stability across all platforms.

---

## Key Features

### Recording
- Multi-Source Capture: Record entire displays or specific application windows
- Audio Support: Capture microphone audio and system audio simultaneously
- Platform-Specific Capture:
  - macOS: Native ScreenCaptureKit for optimal performance
  - Windows: Windows Graphics Capture (WGC) with native audio support
  - Linux: Electron-based capture with PipeWire audio support
- Webcam Overlay: Record webcam footage as an overlay bubble
- Auto-Zoom Suggestions: Intelligent zoom suggestions based on cursor activity
- Countdown Timer: Configurable countdown before recording starts

### Editing
- Timeline-Based Editor: Drag-and-drop timeline for precise editing
- Trim Clips: Remove unwanted sections easily
- Zoom Regions: Add manual or automatic zoom effects
- Speed Control: Add speed-up and slow-down regions
- Annotations: Add text, images, and figure annotations
- Extra Audio: Add additional audio tracks on the timeline
- Crop & Aspect Ratio: Crop recorded footage with preset aspect ratios
- Project Persistence: Save and reopen `.recordly` project files

### Cursor Effects
- Polished Cursor Overlay: macOS-style cursor assets
- Cursor Smoothing: Smooth cursor movement
- Motion Blur: Add motion blur to cursor
- Click Bounce: Visual feedback on clicks
- Cursor Sway: Subtle cursor movement effects
- Size Adjustment: Customize cursor size
- Loop Mode: Cleaner looping for cursor animations

### Frame Styling
- Wallpapers: Built-in wallpapers and custom backgrounds
- Colors & Gradients: Solid colors and gradient backgrounds
- Blur Effects: Background blur options
- Padding & Shadows: Frame padding and drop shadows
- Rounded Corners: Customizable corner radius
- Aspect Ratio Presets: Common video aspect ratios

### Export Options
- MP4 Export: High-quality video output
- GIF Export: Lightweight animated GIFs
- Quality Settings: Adjustable export quality
- Frame Rate Control: Custom frame rates for GIFs
- Loop Toggle: GIF looping options
- Size Presets: Pre-configured export sizes
- Auto-Captions: AI-powered caption generation (with Whisper)

### Internationalization
- Multi-Language Support: English and Chinese (简体中文)
- Easy Translation: Community-driven translation system

---

## What's New in v1.6.0

### Improvements
- Build System: Enhanced cross-platform build configuration
- Dependencies: Updated dependencies for better performance
- Smoke Tests: Improved binary verification tests
- GPU Support: Optional NVIDIA CUDA acceleration for exports

### Bug Fixes
- Package Lock: Fixed package-lock.json synchronization issues
- macOS Signing: Made macOS code signing optional for unsigned builds
- CUDA Compositor: Made NVIDIA CUDA compositor optional in smoke tests
- Export Stability: Improved export pipeline reliability

---

## Open Source & Self-Hosting

### 100% Open Source
RecordMee is completely open-source under the AGPLv3 license. You can:
- View the source code on GitHub
- Modify and customize the application
- Distribute modified versions
- Self-host for personal or commercial use
- Contribute to the project

### Self-Hosting Options

#### Option 1: Download Prebuilt Binaries
Easiest way to get started - download and install directly:
- Windows: `.exe` installer
- macOS: `.dmg` (Intel & Apple Silicon)
- Linux: `.AppImage`

#### Option 2: Build from Source
Build RecordMee yourself from source code:

**Prerequisites:**
- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Linux: `sudo apt install build-essential cmake libx11-dev libxtst-dev libxrandr-dev libxt-dev`
- Windows: Visual Studio 2022 with C++ workload and CMake

**Build Commands:**
```bash
# Clone the repository
git clone https://github.com/Ansphare-Team/record-mee.git
cd record-mee

# Install dependencies
npm install

# Development mode
npm run dev

# Production build (current platform)
npm run build

# Platform-specific builds
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

#### Option 3: Host Your Own Distribution
You can host RecordMee for your organization:

1. Fork the Repository: Create your own fork on GitHub
2. Customize: Modify branding, features, or configurations
3. Build: Build for your target platforms
4. Distribute: Host on your own servers or internal tools
5. Comply: Keep your modifications open-source under AGPLv3

### Privacy & Security
- No Telemetry: RecordMee does not collect personal data
- Local Processing: All recording and editing happens locally on your machine
- Offline Usage: Works without internet connection
- Source Code Transparency: Fully auditable codebase

---

## Subscription Model

RecordMee offers a flexible subscription model for enhanced features:

### Plans
- Starter: Free tier with basic features
- Pro: Paid tier with extended limits and premium features
- Enterprise: Custom solutions for organizations

### Subscription Benefits
- Extended recording limits
- Cloud storage integration
- Priority support
- Advanced export options
- Team collaboration features

Note: Core recording and editing features remain free and open-source. Subscription provides additional cloud-based services and extended limits.

---

## System Requirements

| Platform | Minimum Version | Notes |
|----------|----------------|-------|
| macOS | macOS 14.0 (Sonoma) | Required for ScreenCaptureKit audio and microphone capture |
| Windows | Windows 10 20H1 (Build 19041) | Required for native Windows Graphics Capture |
| Linux | Modern distributions | Recording works through Electron capture; PipeWire for system audio |

---

## Installation

### Download Prebuilt Releases
Visit our [Releases page](https://github.com/Ansphare-Team/record-mee/releases) to download the latest version for your platform.

### Arch Linux / Manjaro
```bash
yay -S recordly-bin
```

---

## Contributing

We welcome contributions! Areas where help is especially valuable:
- Linux capture and cursor behavior improvements
- Export performance optimization
- UI/UX refinements
- Additional editor tools
- Localization work
- Wallpaper submissions
- Extensions (device frames, click effects, render hooks)

See [CONTRIBUTING.md](https://github.com/Ansphare-Team/record-mee/blob/main/CONTRIBUTING.md) for guidelines.

---

## Documentation

- GitHub Repository: https://github.com/Ansphare-Team/record-mee
- Issues: https://github.com/Ansphare-Team/record-mee/issues
- Extensions Marketplace: https://marketplace.recordly.dev/extensions

---

## Acknowledgements

RecordMee started as a fork of [OpenScreen](https://github.com/siddharthvaddem/openscreen). Over 80% of the code has diverged since then. Many features from OpenScreen have been directly ported and improved.

Created by [@AnsphareTeam](https://x.com/AnsphareTeam)

---

## License

RecordMee is licensed under the GNU Affero General Public License v3.0 (AGPLv3).

### What This Means:
- You can use, modify, and distribute the software
- You can self-host for personal or commercial use
- You can run modified versions on servers
- If you modify the code or use it for a SaaS/website, you must make your source code publicly available under the same AGPLv3 license
- You cannot use the "RecordMee" name or branding for your own project
- You must attribute RecordMee in your UI and repository

See [LICENSE.md](https://github.com/Ansphare-Team/record-mee/blob/main/LICENSE.md) for the full license text.

---

## Thank You

Thank you for using RecordMee! We hope this open-source tool helps you create amazing screen recordings and demo videos.

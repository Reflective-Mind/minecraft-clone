# Guruzen Minecraft Clone

A 3D Minecraft-inspired game built with Unreal Engine 5.5, featuring block placement, first-person gameplay, and procedural world generation.

## Features (Planned)

- First-person perspective gameplay
- Block placement and destruction
- Different block types
- Advanced world generation with UE5.5's enhanced terrain system
- Player movement and physics
- Inventory system
- Save/Load world functionality
- Next-gen graphics using enhanced Nanite and Lumen (UE5.5)
- Optimized voxel-based world system

## Requirements

- Unreal Engine 5.5 Preview or later
- Git
- Visual Studio 2022 or later
- At least 32GB RAM recommended (16GB minimum)
- Graphics card that supports DX12 or Vulkan (8GB VRAM recommended)
- Windows 10/11 64-bit

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/Reflective-Mind/Guruzen-AI.git
```

2. Download and install Epic Games Launcher from [https://www.unrealengine.com](https://www.unrealengine.com)

3. Install Unreal Engine 5.5 through Epic Games Launcher:
   - Go to Unreal Engine tab
   - Click on "Library"
   - Click the "+" button
   - Select "5.5 Preview"
   - Install with the following components:
     - Core Components
     - Editor
     - Templates and Feature Packs

4. Install Visual Studio 2022 with the following components:
   - Game development with C++
   - Windows 10/11 SDK
   - C++ profiling tools
   - C++ AddressSanitizer

5. Open the project by double-clicking the .uproject file

## Development Workflow

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes in Unreal Editor

3. Commit and push your changes:
```bash
git add .
git commit -m "Description of your changes"
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub

## Project Structure

- `/Content` - Contains all UE5 project assets
  - `/Blueprints` - Blueprint classes
  - `/Maps` - Game levels
  - `/Materials` - Material assets
  - `/Meshes` - 3D models
  - `/Textures` - Texture files
- `/Source` - C++ source code
  - `/GuruzenGame` - Game-specific C++ code

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 
# 🏗️ Paging Simulator Build System

This document explains how to build and run the Paging Simulator project using the provided build system.

## 📋 Build Options

### Option 1: Makefile (Linux/Mac/Windows with Make)
```bash
# Show all available targets
make help

# Complete setup (builds everything)
make setup

# Start web interface
make run-ui

# Run tests
make test

# Clean build artifacts
make clean
```

### Option 2: Batch Script (Windows)
```cmd
# Show all available targets
build.bat help

# Complete setup (builds everything)
build.bat setup

# Start web interface
build.bat run-ui

# Run tests
build.bat test

# Clean build artifacts
build.bat clean
```

### Option 3: Manual Build
```bash
# Compile paging simulator
gcc -Wall -Wextra -std=c99 -pedantic -O2 -lm -o paging paging.c

# Compile process generator
gcc -Wall -Wextra -std=c99 -pedantic -O2 -o process_generator process_generator.c

# Generate process files
./process_generator

# Start server
python server.py
```

## 🎯 Build Targets

### Core Targets
- **all/setup**: Build all components and generate process files
- **run-ui**: Build and start the web interface
- **test**: Run automated tests
- **clean**: Remove all build artifacts

### Utility Targets
- **check**: Verify system requirements (GCC, Python)
- **run-example**: Run example simulation
- **help**: Show available targets

### Development Targets
- **quick**: Fast development build
- **dev**: Development build with tests

## 📁 Project Structure

```
Paging-Simulator/
├── Makefile              # Unix/Linux build system
├── build.bat             # Windows build script
├── paging.c              # Core paging simulator
├── process_generator.c   # Process file generator
├── server.py             # Python web server
├── test_ui.py            # Automated test suite
├── ui/                   # Web interface files
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── BUILD_README.md       # This file
```

## 🔧 System Requirements

### Required Software
- **GCC Compiler**: For compiling C code
- **Python 3.6+**: For web server and testing
- **Modern Web Browser**: For the web interface

### Platform Support
- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Fedora, etc.)
- ✅ macOS (Intel/Apple Silicon)

## 🚀 Quick Start

### Windows
```cmd
# Option 1: Use batch script
build.bat setup
build.bat run-ui

# Option 2: Use Makefile (if Make is installed)
make setup
make run-ui
```

### Linux/Mac
```bash
# Use Makefile
make setup
make run-ui
```

### Open Web Interface
Navigate to: http://localhost:8000

## 🧪 Testing

### Automated Tests
```bash
# Run full test suite
make test
# or
build.bat test
```

### Manual Testing
```bash
# Test command line interface
make run-example
# or
build.bat run-example

# Test with custom parameters
make run ARGS="4096 12 64 p1.proc p2.proc p3.proc"
```

## 🛠️ Development Workflow

### Typical Development Cycle
```bash
# Clean previous build
make clean

# Quick development build
make quick

# Run tests
make test

# Start web interface for manual testing
make run-ui
```

### Adding New Features
1. Modify source code
2. Update build targets if needed
3. Test with `make test`
4. Run web interface with `make run-ui`

## 🔍 Troubleshooting

### Common Issues

#### "GCC not found"
**Solution**: Install GCC compiler
- Windows: Install MinGW-w64 or WSL
- Linux: `sudo apt-get install build-essential`
- Mac: `xcode-select --install`

#### "Python not found"
**Solution**: Install Python 3.6+
- Download from python.org
- Use package manager (brew, apt, etc.)

#### "make command not found"
**Solution**: 
- Windows: Use `build.bat` instead
- Linux/Mac: Install Make (`sudo apt-get install build-essential`)

#### Port already in use
**Solution**: Server automatically finds available ports (8000-8009)

#### Compilation errors
**Solution**: Check GCC version and try manual compilation:
```bash
gcc --version
gcc -Wall -Wextra -std=c99 -pedantic -O2 -lm -o paging paging.c
```

### Debug Mode
For debugging, compile with debug symbols:
```bash
gcc -g -DDEBUG -Wall -lm -o paging paging.c
```

## 📊 Build Artifacts

### Generated Files
- `paging.exe` / `paging`: Main simulator executable
- `process_generator.exe` / `process_generator`: Process generator
- `p1.proc, p2.proc, p3.proc`: Binary process files
- `p1.txt, p2.txt, p3.txt`: Text process representations

### Temporary Files
- `paging.o`: Object file (during compilation)
- `temp_process_*.proc`: Temporary process files (cleaned automatically)

## 🎯 Advanced Usage

### Custom Configuration
```bash
# Custom memory configuration
make run ARGS="8192 13 128 p1.proc p2.proc"

# Generate specific number of processes
./process_generator  # Edit source for custom counts
```

### Performance Testing
```bash
# Large memory test
make run ARGS="65536 16 256 p1.proc p2.proc p3.proc"
```

### Cross-Platform Development
The build system automatically detects the platform and adjusts:
- Executable extensions (.exe on Windows)
- File deletion commands
- Path separators

## 📝 Build System Design

### Philosophy
- **Simple**: Easy to understand and modify
- **Cross-Platform**: Works on Windows, Linux, Mac
- **Comprehensive**: Handles all build tasks
- **Preserved**: Original Makefile targets maintained

### Features
- **Automatic Dependency Management**: Builds components in correct order
- **Error Handling**: Clear error messages and exit codes
- **Platform Detection**: Automatic OS-specific adjustments
- **Progress Feedback**: Informative build messages
- **Help System**: Built-in help for all targets

### Extensibility
Adding new targets is straightforward:
```makefile
# Add new target
new-target: dependencies
	@echo "Building new feature..."
	commands
	@echo "New target complete!"
```

---

## 📞 Support

For build system issues:
1. Check system requirements with `make check` or `build.bat check`
2. Review troubleshooting section above
3. Try manual compilation as fallback
4. Check GCC and Python versions

**Build System Version**: 1.0  
**Last Updated**: October 31, 2025  
**Author**: Yokheshvar

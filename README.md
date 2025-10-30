# 🖥️ OS Paging Simulator

A comprehensive Operating System Paging Memory Management Simulator with interactive web interface, developed as an academic project to demonstrate virtual memory concepts and memory management algorithms.

## 🎯 Project Overview

This project implements a complete paging memory management system that simulates how operating systems handle virtual memory, page tables, and frame allocation. It provides both command-line and web-based interfaces for educational purposes and practical demonstration.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Python Server  │    │   C Simulator   │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │◄──►│ • HTTP Server   │◄──►│ • Paging Logic  │
│ • Visualization │    │ • REST API      │    │ • Memory Mgmt   │
│ • User Input    │    │ • File Handling │    │ • Process Gen   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📚 Educational Objectives

- **Virtual Memory**: Demonstrate logical-to-physical address translation
- **Page Tables**: Show page table management and frame allocation
- **Memory Fragmentation**: Calculate and visualize internal fragmentation
- **Multi-programming**: Handle multiple concurrent processes
- **Memory Management**: Implement frame allocation/deallocation algorithms

## 🚀 Quick Start

### Prerequisites
- GCC Compiler
- Python 3.6+
- Modern Web Browser

### Setup & Run

#### Option 1: Automated Setup
```bash
# Using Makefile (Linux/Mac/Windows with Make)
make setup
make run-ui

# Using Batch Script (Windows)
build.bat setup
build.bat run-ui
```

#### Option 2: Manual Setup
```bash
# Compile C components
gcc -Wall -Wextra -std=c99 -pedantic -O2 -lm -o paging paging.c
gcc -Wall -Wextra -std=c99 -pedantic -O2 -o process_generator process_generator.c

# Generate process files
./process_generator

# Start web server
python server.py
```

### Access the Interface
Open your browser and navigate to: **http://localhost:8000**

## 🎨 Features

### Core Simulator
- ✅ **Paging Algorithm**: Complete virtual memory simulation
- ✅ **Process Management**: Multi-process memory allocation
- ✅ **Frame Allocation**: Dynamic frame assignment and deallocation
- ✅ **Fragmentation Analysis**: Internal fragmentation calculation
- ✅ **Memory Visualization**: Real-time memory frame display

### Web Interface
- ✅ **Interactive Configuration**: Dynamic parameter adjustment
- ✅ **Visual Memory Grid**: Color-coded frame allocation
- ✅ **Page Table Display**: Process-wise page table visualization
- ✅ **Results Export**: Copy/download simulation results
- ✅ **Persistent Notes**: Save simulation observations

### Build System
- ✅ **Cross-Platform**: Windows, Linux, macOS support
- ✅ **Automated Testing**: Built-in test suite
- ✅ **Development Tools**: Debug and build utilities

## 📊 Usage Examples

### Web Interface
1. Configure memory parameters (physical memory, page size, etc.)
2. Set up processes with code and data segments
3. Run simulation and observe memory allocation
4. Analyze fragmentation and utilization metrics
5. Export results for documentation

### Command Line
```bash
# Basic simulation
./paging 4096 12 64 p1.proc p2.proc p3.proc

# Custom configuration
./paging 8192 13 128 p1.proc p2.proc p3.proc
```

## 🧪 Testing

### Automated Tests
```bash
# Run full test suite
make test
# or
python test_ui.py
```

### Manual Testing
```bash
# Example simulation
make run-example

# Custom parameters
make run ARGS="4096 12 64 p1.proc p2.proc p3.proc"
```

## 📁 Project Structure

```
Paging-Simulator/
├── README.md              # This file
├── Makefile               # Build system (Unix/Linux/Mac)
├── build.bat              # Build script (Windows)
├── BUILD_README.md        # Build system documentation
├── paging.c               # Core paging simulator
├── process_generator.c    # Process file generator
├── server.py              # Python web server
├── test_ui.py             # Automated test suite
├── start_ui.bat           # Windows launcher
├── ui/                    # Web interface
│   ├── index.html         # Main UI page
│   ├── styles.css         # UI styling
│   └── script.js          # Frontend JavaScript
└── *.proc, *.txt          # Generated process files
```

## 🔧 Technical Specifications

### Memory Management
- **Page Size**: Configurable (16-1024 bytes, power of 2)
- **Physical Memory**: Up to 1MB supported
- **Process Count**: Up to 10 concurrent processes
- **Address Space**: 8-32 bit logical addresses

### File Formats
- **Binary Process Files**: Structured format with PID, sizes, data
- **JSON API**: RESTful communication between frontend and backend
- **Text Output**: Human-readable simulation results

### Performance
- **Simulation Time**: < 1 second for typical configurations
- **Memory Usage**: < 50MB total system footprint
- **Response Time**: < 100ms for API requests

## 🎓 Educational Value

### Learning Outcomes
- Understanding of virtual memory concepts
- Practical experience with memory management algorithms
- Knowledge of page table implementation
- Awareness of memory fragmentation issues
- Full-stack development experience

### Target Audience
- Computer Science students studying Operating Systems
- Educators teaching memory management concepts
- Developers interested in systems programming
- Anyone learning about OS internals

## 🛠️ Development

### Build System
```bash
# Show all options
make help

# Development cycle
make clean && make quick && make test && make run-ui
```

### Contributing
This project is designed for educational purposes. Extensions and improvements are encouraged for learning and exploration.

## 📈 Project Metrics

- **Lines of Code**: ~2000+ across all components
- **Development Time**: ~4 hours
- **Test Coverage**: Automated testing for core functionality
- **Cross-Platform**: Windows, Linux, macOS compatibility

## 🔮 Future Enhancements

### Short-term
- Page replacement algorithms (LRU, FIFO, Optimal)
- Memory protection bits and permissions
- Shared memory simulation
- Performance metrics and timing analysis

### Long-term
- Virtual memory extensions with swap space
- Multi-level page tables
- TLB (Translation Lookaside Buffer) simulation
- Distributed memory management

## 📞 Support

For issues or questions:
1. Check build requirements: `make check` or `build.bat check`
2. Review troubleshooting section in BUILD_README.md
3. Test with manual compilation steps
4. Verify system dependencies (GCC, Python)

---

**Project Developed By**: Yokheshvar  
**Academic Purpose**: Operating Systems Course Project  
**Development Date**: October 2025  
**Technologies**: C, Python, HTML, CSS, JavaScript  
**License**: Educational Use

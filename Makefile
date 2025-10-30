# Makefile for Paging Simulator Project
# Author: Yokheshvar
# Description: OS-based Paging Memory Management Simulator with Web UI

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -pedantic -O2 -lm

# Project directories
SRC_DIR = .
UI_DIR = ui

# Executable names (platform-specific)
ifeq ($(OS),Windows_NT)
    EXE_EXT = .exe
    PAGING_EXE = paging$(EXE_EXT)
    PROCESS_GEN_EXE = process_generator$(EXE_EXT)
    RM = del /Q 2>nul || echo "Cleaning Windows files..."
else
    EXE_EXT = 
    PAGING_EXE = paging$(EXE_EXT)
    PROCESS_GEN_EXE = process_generator$(EXE_EXT)
    RM = rm -f
endif

# Source files
PAGING_SRC = paging.c
PROCESS_GEN_SRC = process_generator.c

# Python files
SERVER_PY = server.py
TEST_PY = test_ui.py

# UI files
UI_HTML = $(UI_DIR)/index.html
UI_CSS = $(UI_DIR)/styles.css
UI_JS = $(UI_DIR)/script.js

# Generated files
PROCESS_FILES = p1.proc p2.proc p3.proc
TEXT_FILES = p1.txt p2.txt p3.txt

# Default target
.PHONY: all clean help test run-ui run-server setup build compile

all: $(PAGING_EXE) $(PROCESS_GEN_EXE) process-files

# Compile paging simulator (original target preserved)
compile:
	@echo " Compiling Paging Simulator..."
	$(CC) $(CFLAGS) -c $(PAGING_SRC) -o paging.o

# Build paging simulator (original target preserved)
build: compile
	@echo " Linking Paging Simulator..."
	$(CC) paging.o -o $(PAGING_EXE) $(CFLAGS)

# Process generator
$(PROCESS_GEN_EXE): $(PROCESS_GEN_SRC)
	@echo " Compiling Process Generator..."
	$(CC) $(CFLAGS) -o $@ $<

# Generate process files
process-files: $(PROCESS_GEN_EXE)
	@echo " Generating process files..."
ifeq ($(OS),Windows_NT)
	./$(PROCESS_GEN_EXE)
else
	./$(PROCESS_GEN_EXE)
endif
	@echo " Process files generated!"

# Complete setup
setup: all
	@echo " Setting up Paging Simulator environment..."
	@echo " Setup complete! Use 'make run-ui' to start the web interface."

# Run the web interface
run-ui: setup
	@echo " Starting Paging Simulator Web UI..."
	@echo " Open your browser and navigate to http://localhost:8000"
	python $(SERVER_PY)

# Run just the server
run-server:
	@echo " Starting web server..."
	python $(SERVER_PY)

# Test the system
test: all
	@echo " Running Paging Simulator tests..."
	python $(TEST_PY)

# Run with arguments (original target preserved)
run: build
	@echo " Running Paging Simulator with arguments: $(ARGS)"
ifeq ($(OS),Windows_NT)
	./$(PAGING_EXE) $(ARGS)
else
	./$(PAGING_EXE) $(ARGS)
endif

# Run example
run-example: all
	@echo " Running example simulation..."
ifeq ($(OS),Windows_NT)
	./$(PAGING_EXE) 4096 12 64 $(PROCESS_FILES)
else
	./$(PAGING_EXE) 4096 12 64 $(PROCESS_FILES)
endif

# Clean build artifacts
clean:
	@echo " Cleaning build artifacts..."
ifeq ($(OS),Windows_NT)
	-if exist paging.o $(RM) paging.o
	-if exist $(PAGING_EXE) $(RM) $(PAGING_EXE)
	-if exist $(PROCESS_GEN_EXE) $(RM) $(PROCESS_GEN_EXE)
	-if exist $(PROCESS_FILES) $(RM) $(PROCESS_FILES)
	-if exist $(TEXT_FILES) $(RM) $(TEXT_FILES)
	-if exist temp_process_*.proc $(RM) temp_process_*.proc
else
	$(RM) paging.o $(PAGING_EXE) $(PROCESS_GEN_EXE)
	$(RM) $(PROCESS_FILES) $(TEXT_FILES)
	$(RM) temp_process_*.proc
endif
	@echo " Clean complete!"

# Check system requirements
check:
	@echo " Checking system requirements..."
	@echo "Checking GCC..."
	@which gcc > /dev/null || (echo " GCC not found. Please install GCC compiler." && exit 1)
	@echo " GCC found"
	@echo "Checking Python..."
	@python --version > /dev/null || (echo " Python not found. Please install Python 3.6+" && exit 1)
	@echo " Python found"
	@echo " All requirements satisfied!"

# Show help
help:
	@echo " Paging Simulator Makefile Help"
	@echo ""
	@echo "Original targets (preserved):"
	@echo "  compile      - Compile paging simulator to object file"
	@echo "  build        - Link paging simulator executable"
	@echo "  run ARGS=... - Run with custom arguments"
	@echo "  clean        - Remove build artifacts"
	@echo ""
	@echo "New targets:"
	@echo "  all          - Build everything including process files"
	@echo "  setup        - Complete project setup"
	@echo "  run-ui       - Build and start web interface"
	@echo "  run-server   - Start web server only"
	@echo "  test         - Run automated tests"
	@echo "  run-example  - Run example simulation"
	@echo "  process-files- Generate process files only"
	@echo "  check        - Check system requirements"
	@echo "  help         - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make setup                    # Complete setup"
	@echo "  make run-ui                   # Start web interface"
	@echo "  make run ARGS=\"1024 12 64\"  # Custom arguments"
	@echo "  make run-example              # Example simulation"
	@echo ""
	@echo "Web Interface: http://localhost:8000"
	@echo "Project: OS Paging Memory Management Simulator"

# Development targets
dev: clean all test
	@echo " Development build complete!"

# Quick build for development
quick: clean
	@echo " Quick build..."
	$(CC) $(CFLAGS) -o $(PAGING_EXE) $(PAGING_SRC)
	$(CC) $(CFLAGS) -o $(PROCESS_GEN_EXE) $(PROCESS_GEN_SRC)
	$(MAKE) process-files
	@echo " Quick build complete!"
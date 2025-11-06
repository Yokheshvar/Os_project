#!/usr/bin/env python3
"""
Simple HTTP server for the Paging Simulator UI
Integrates the web interface with the C-based paging simulator
"""

import http.server
import socketserver
import json
import subprocess
import os
import tempfile
import random
from urllib.parse import urlparse, parse_qs

class PagingSimulatorHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/ui/index.html'
        elif self.path == '/styles.css':
            self.path = '/ui/styles.css'
        elif self.path == '/script.js':
            self.path = '/ui/script.js'
        return super().do_GET()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_POST(self):
        if self.path == '/api/simulate':
            self.handle_simulation()
        else:
            self.send_error(404)
    
    def handle_simulation(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))
            
            # Generate temporary process files
            process_files = []
            for i, process in enumerate(config['processes']):
                filename = self.generate_process_file(process, i)
                process_files.append(filename)
            
            # Run the C simulator
            result = self.run_c_simulator(config, process_files)
            
            # Add code and data sizes to each process from config
            for i, process in enumerate(result['processes']):
                result['processes'][i]['codeSize'] = config['processes'][i]['codeSize']
                result['processes'][i]['dataSize'] = config['processes'][i]['dataSize']
            
            # Clean up temporary files
            for filename in process_files:
                try:
                    os.remove(filename)
                except:
                    pass
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def generate_process_file(self, process, index):
        """Generate a binary process file compatible with the C simulator"""
        filename = f"temp_process_{index}.proc"
        
        with open(filename, 'wb') as f:
            # Process ID (1 byte)
            pid = random.randint(1, 255)
            f.write(pid.to_bytes(1, byteorder='big'))
            
            # Code size (2 bytes, big-endian)
            code_size = process['codeSize']
            f.write((code_size >> 8).to_bytes(1, byteorder='big'))
            f.write((code_size & 0xFF).to_bytes(1, byteorder='big'))
            
            # Code segment (random data)
            for _ in range(code_size):
                byte = random.randint(0, 255)
                f.write(byte.to_bytes(1, byteorder='big'))
            
            # Data size (2 bytes, big-endian)
            data_size = process['dataSize']
            f.write((data_size >> 8).to_bytes(1, byteorder='big'))
            f.write((data_size & 0xFF).to_bytes(1, byteorder='big'))
            
            # Data segment (random data)
            for _ in range(data_size):
                byte = random.randint(0, 255)
                f.write(byte.to_bytes(1, byteorder='big'))
            
            # End marker (1 byte)
            f.write(bytes([0xFF]))
        
        return filename
    
    def run_c_simulator(self, config, process_files):
        """Run the C paging simulator and parse its output"""
        exe_name = './paging.exe' if os.name == 'nt' else './paging'
        cmd = [
            exe_name,
            str(config['physicalMemSize']),
            str(config['logicalAddrSize']),
            str(config['pageSize'])
        ] + process_files
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                raise Exception(f"Simulator error: {result.stderr}")
            
            # Parse the C simulator output
            return self.parse_simulator_output(result.stdout, config)
            
        except subprocess.TimeoutExpired:
            raise Exception("Simulation timed out")
        except FileNotFoundError:
            exe_name = './paging.exe' if os.name == 'nt' else './paging'
            raise Exception(f"Paging simulator executable {exe_name} not found. Please compile paging.c first")
    
    def parse_simulator_output(self, output, config):
        """Parse the text output from the C simulator"""
        lines = output.strip().split('\n')
        
        # Extract basic info
        num_frames = config['physicalMemSize'] // config['pageSize']
        
        # Parse processes
        processes = []
        current_process = None
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('Process ') and 'PID:' in line:
                # Extract process info
                parts = line.split(',')
                process_info = parts[0]
                pid_info = parts[1]
                size_info = parts[2]
                pages_info = parts[3]
                
                pid = int(pid_info.split('PID: ')[1])
                size = int(size_info.split('Process Size: ')[1].split(' bytes')[0])
                pages = int(pages_info.split('Number of Pages: ')[1])
                
                current_process = {
                    'id': len(processes) + 1,
                    'pid': pid,
                    'procSize': size,
                    'numPages': pages,
                    'pageTable': []
                }
                processes.append(current_process)
            
            elif line.startswith('Page ') and '-> Frame' in line:
                # Parse page table entry
                if current_process:
                    parts = line.split('->')
                    page_num = int(parts[0].strip().split('Page ')[1])
                    frame_num = int(parts[1].strip().split('Frame ')[1])
                    
                    current_process['pageTable'].append({
                        'pageNumber': page_num,
                        'frameNumber': frame_num,
                        'valid': True
                    })
        
        # Calculate frames and free frames
        frames = [None] * num_frames
        free_frames = [True] * num_frames
        
        for process in processes:
            for entry in process['pageTable']:
                frame_num = entry['frameNumber']
                if 0 <= frame_num < num_frames:
                    frames[frame_num] = {
                        'processId': process['id'],
                        'pageNumber': entry['pageNumber'],
                        'data': []  # We don't parse the actual data from text output
                    }
                    free_frames[frame_num] = False
        
        # Calculate internal fragmentation
        internal_fragmentation = 0
        for line in lines:
            if 'Total Internal Fragmentation:' in line:
                internal_fragmentation = int(line.split('Total Internal Fragmentation: ')[1].split(' bytes')[0])
                break
        
        # Calculate calculation data for display
        calculations = self.calculate_values(config, processes, internal_fragmentation, num_frames)
        
        return {
            'config': config,
            'numFrames': num_frames,
            'frames': frames,
            'freeFrames': free_frames,
            'internalFragmentation': internal_fragmentation,
            'processes': processes,
            'calculations': calculations,
            'rawOutput': output  # Include the raw C simulator output
        }
    
    def calculate_values(self, config, processes, internal_fragmentation, num_frames):
        """Calculate all values needed for the calculations display"""
        import math
        
        physical_mem_size = config['physicalMemSize']
        page_size = config['pageSize']
        logical_addr_size = config['logicalAddrSize']
        
        # Memory configuration calculations
        offset_bits = int(math.log2(page_size))
        page_bits = logical_addr_size - offset_bits
        max_pages = 2 ** page_bits if page_bits > 0 else 0
        
        memory_calc = {
            'numFrames': {
                'formula': f'Number of Frames = Physical Memory Size ÷ Page Size',
                'calculation': f'{physical_mem_size} bytes ÷ {page_size} bytes',
                'result': f'{num_frames} frames'
            },
            'offsetBits': {
                'formula': f'Offset Bits = log₂(Page Size)',
                'calculation': f'log₂({page_size})',
                'result': f'{offset_bits} bits'
            },
            'pageBits': {
                'formula': f'Page Number Bits = Logical Address Size - Offset Bits',
                'calculation': f'{logical_addr_size} bits - {offset_bits} bits',
                'result': f'{page_bits} bits'
            },
            'maxPages': {
                'formula': f'Maximum Pages = 2^(Page Number Bits)',
                'calculation': f'2^{page_bits}',
                'result': f'{max_pages} pages'
            }
        }
        
        # Process calculations
        process_calculations = []
        for process in processes:
            proc_size = process['procSize']
            num_pages = process['numPages']  # Use the actual number from the simulator
            
            # Calculate fragmentation for this process
            # Each page that's not fully used contributes to fragmentation
            pages_used = num_pages
            space_used = pages_used * page_size
            fragmentation = space_used - proc_size
            
            process_calc = {
                'processId': process['id'],
                'processSize': {
                    'formula': f'Process Size = Code Size + Data Size',
                    'calculation': f'{process.get("codeSize", 0)} + {process.get("dataSize", 0)}',
                    'result': f'{proc_size} bytes'
                },
                'numPages': {
                    'formula': f'Number of Pages = ⌈Process Size ÷ Page Size⌉',
                    'calculation': f'⌈{proc_size} ÷ {page_size}⌉',
                    'result': f'{num_pages} pages'
                },
                'fragmentation': {
                    'formula': f'Internal Fragmentation = (Pages × Page Size) - Process Size',
                    'calculation': f'({num_pages} × {page_size}) - {proc_size}',
                    'result': f'{fragmentation} bytes'
                }
            }
            process_calculations.append(process_calc)
        
        # Fragmentation calculations
        total_used_memory = sum(p['procSize'] for p in processes)
        total_allocated_memory = sum(math.ceil(p['procSize'] / page_size) * page_size for p in processes) if page_size > 0 else 0
        total_fragmentation = total_allocated_memory - total_used_memory
        
        fragmentation_calc = {
            'totalUsed': {
                'formula': 'Total Used Memory = Sum of all Process Sizes',
                'calculation': ' + '.join([f'{p["procSize"]}' for p in processes]) if processes else '0',
                'result': f'{total_used_memory} bytes'
            },
            'totalAllocated': {
                'formula': 'Total Allocated Memory = Sum of (Pages × Page Size) for all processes',
                'calculation': ' + '.join([f'({math.ceil(p["procSize"]/page_size)} × {page_size})' for p in processes]) if processes else '0',
                'result': f'{total_allocated_memory} bytes'
            },
            'totalFragmentation': {
                'formula': 'Total Internal Fragmentation = Total Allocated - Total Used',
                'calculation': f'{total_allocated_memory} - {total_used_memory}',
                'result': f'{total_fragmentation} bytes'
            },
            'utilization': {
                'formula': 'Memory Utilization = (Total Used Memory ÷ Physical Memory Size) × 100%',
                'calculation': f'({total_used_memory} ÷ {physical_mem_size}) × 100%',
                'result': f'{(total_used_memory / physical_mem_size * 100) if physical_mem_size > 0 else 0:.2f}%'
            }
        }
        
        # Address translation example (using first process)
        address_translation_calc = None
        if processes and processes[0]['pageTable']:
            first_entry = processes[0]['pageTable'][0]
            example_page = first_entry['pageNumber']
            example_frame = first_entry['frameNumber']
            example_offset = page_size // 4
            logical_addr = (example_page << offset_bits) + example_offset
            physical_addr = (example_frame * page_size) + example_offset
            
            address_translation_calc = {
                'logicalAddress': {
                    'formula': f'Logical Address = (Page Number × 2^(Offset Bits)) + Offset',
                    'calculation': f'({example_page} × 2^{offset_bits}) + {example_offset}',
                    'result': f'{logical_addr} (binary: {logical_addr:b})'
                },
                'pageLookup': {
                    'formula': 'Page Table Lookup',
                    'calculation': f'Page {example_page} → Frame {example_frame}',
                    'result': 'Frame found'
                },
                'physicalAddress': {
                    'formula': f'Physical Address = (Frame Number × Page Size) + Offset',
                    'calculation': f'({example_frame} × {page_size}) + {example_offset}',
                    'result': f'{physical_addr} (0x{physical_addr:X})'
                }
            }
        
        return {
            'memory': memory_calc,
            'processes': process_calculations,
            'fragmentation': fragmentation_calc,
            'addressTranslation': address_translation_calc
        }

def main():
    PORT = 8000
    
    # Check if paging executable exists
    exe_name = './paging.exe' if os.name == 'nt' else './paging'
    if not os.path.exists(exe_name):
        print(f"Error: {exe_name} not found!")
        print("Please compile the simulator first:")
        print("gcc -Wall -lm -o paging paging.c")
        return
    
    # Try to find an available port
    available_port = None
    for port in range(8000, 8010):
        try:
            with socketserver.TCPServer(("", port), PagingSimulatorHandler) as test_server:
                available_port = port
                break
        except OSError:
            continue
    
    if available_port is None:
        print("Error: No available ports found in range 8000-8009")
        return
    
    # Start the server on the available port
    try:
        with socketserver.TCPServer(("", available_port), PagingSimulatorHandler) as httpd:
            print(f"Paging Simulator UI running at http://localhost:{available_port}")
            print(f"Serving files from: {os.getcwd()}")
            print("Press Ctrl+C to stop the server")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        return

if __name__ == "__main__":
    main()

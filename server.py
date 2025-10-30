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
        # Add CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        return super().do_GET()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
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
            
            # Clean up temporary files
            for filename in process_files:
                try:
                    os.remove(filename)
                except:
                    pass
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
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
        
        return {
            'config': config,
            'numFrames': num_frames,
            'frames': frames,
            'freeFrames': free_frames,
            'internalFragmentation': internal_fragmentation,
            'processes': processes,
            'rawOutput': output  # Include the raw C simulator output
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
            print(f"🚀 Paging Simulator UI running at http://localhost:{available_port}")
            print(f"📁 Serving files from: {os.getcwd()}")
            print("Press Ctrl+C to stop the server")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n👋 Server stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        return

if __name__ == "__main__":
    main()

class PagingSimulator {
    constructor() {
        this.processes = [];
        this.results = null;
    }

    async runSimulation(config) {
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.results = await response.json();
            return this.results;
        } catch (error) {
            console.error('Error running simulation:', error);
            throw error;
        }
    }

    generateProcessFile(processData) {
        // This would normally be done server-side, but for demo purposes
        // we'll simulate the process file generation
        const file = {
            pid: Math.floor(Math.random() * 256),
            code_size: processData.codeSize,
            data_size: processData.dataSize,
            proc_size: processData.codeSize + processData.dataSize
        };
        return file;
    }
}

const simulator = new PagingSimulator();

function generateProcessInputs() {
    console.log('generateProcessInputs called');
    
    const numProcessesElement = document.getElementById('numProcesses');
    const containerElement = document.getElementById('processInputs');
    
    if (!numProcessesElement) {
        console.error('numProcesses element not found');
        return;
    }
    
    if (!containerElement) {
        console.error('processInputs element not found');
        return;
    }
    
    const numProcesses = parseInt(numProcessesElement.value);
    console.log('Generating inputs for', numProcesses, 'processes');
    
    containerElement.innerHTML = '';

    for (let i = 0; i < numProcesses; i++) {
        const processDiv = document.createElement('div');
        processDiv.className = 'process-input';
        processDiv.innerHTML = `
            <h4>Process ${i + 1}</h4>
            <div class="process-input-grid">
                <div class="input-group">
                    <label for="codeSize${i}">Code Size (bytes):</label>
                    <input type="number" id="codeSize${i}" value="${Math.floor(Math.random() * 64) + 16}" min="1">
                </div>
                <div class="input-group">
                    <label for="dataSize${i}">Data Size (bytes):</label>
                    <input type="number" id="dataSize${i}" value="${Math.floor(Math.random() * 128) + 32}" min="1">
                </div>
            </div>
        `;
        containerElement.appendChild(processDiv);
    }
    
    console.log('Process inputs generated successfully');
}

async function runSimulation() {
    const resultsSection = document.getElementById('resultsSection');
    const numProcesses = parseInt(document.getElementById('numProcesses').value);

    // Show loading state
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = '<div class="loading">Running simulation...</div>';

    try {
        // Collect configuration
        const config = {
            physicalMemSize: parseInt(document.getElementById('physicalMem').value),
            logicalAddrSize: parseInt(document.getElementById('logicalAddr').value),
            pageSize: parseInt(document.getElementById('pageSize').value),
            processes: []
        };

        // Collect process data
        for (let i = 0; i < numProcesses; i++) {
            const codeSize = parseInt(document.getElementById(`codeSize${i}`).value);
            const dataSize = parseInt(document.getElementById(`dataSize${i}`).value);
            
            config.processes.push({
                codeSize,
                dataSize,
                procSize: codeSize + dataSize
            });
        }

        // Call the actual backend API
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        
        // Display results
        displayResults(results);

    } catch (error) {
        console.error('Simulation error:', error);
        resultsSection.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

function simulatePaging(config) {
    const numFrames = Math.floor(config.physicalMemSize / config.pageSize);
    const frames = new Array(numFrames).fill(null);
    const freeFrames = new Array(numFrames).fill(true);
    
    let internalFragmentation = 0;
    const processes = [];

    // Simulate process allocation
    config.processes.forEach((process, index) => {
        const numPages = Math.ceil(process.procSize / config.pageSize);
        const pageTable = [];
        let allocatedFrame = 0;

        for (let i = 0; i < numPages; i++) {
            // Find next free frame
            while (allocatedFrame < numFrames && !freeFrames[allocatedFrame]) {
                allocatedFrame++;
            }

            if (allocatedFrame >= numFrames) {
                throw new Error('Not enough frames available');
            }

            pageTable.push({
                pageNumber: i,
                frameNumber: allocatedFrame,
                valid: true
            });

            frames[allocatedFrame] = {
                processId: index + 1,
                pageNumber: i,
                data: generateRandomData(config.pageSize)
            };
            freeFrames[allocatedFrame] = false;
            allocatedFrame++;
        }

        // Calculate fragmentation for last page
        const usedSpace = process.procSize % config.pageSize;
        if (usedSpace !== 0) {
            internalFragmentation += config.pageSize - usedSpace;
        }

        processes.push({
            id: index + 1,
            pid: Math.floor(Math.random() * 256),
            ...process,
            numPages,
            pageTable
        });
    });

    return {
        config,
        numFrames,
        frames,
        freeFrames,
        internalFragmentation,
        processes
    };
}

function generateRandomData(size) {
    const data = [];
    for (let i = 0; i < size; i++) {
        data.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
    }
    return data;
}

function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    
    resultsSection.innerHTML = `
        <h2>Simulation Results</h2>
        
        <div class="summary-cards">
            <div class="card">
                <h3>Memory Configuration</h3>
                <div class="process-info">
                    <div class="info-item">
                        <span class="info-label">Physical Memory:</span>
                        <span class="info-value">${results.config.physicalMemSize} bytes</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Logical Address:</span>
                        <span class="info-value">${results.config.logicalAddrSize} bits</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Page Size:</span>
                        <span class="info-value">${results.config.pageSize} bytes</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Frames:</span>
                        <span class="info-value">${results.numFrames}</span>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3>Fragmentation</h3>
                <div class="process-info">
                    <div class="info-item">
                        <span class="info-label">Internal Fragmentation:</span>
                        <span class="info-value">${results.internalFragmentation} bytes</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Memory Utilization:</span>
                        <span class="info-value">${calculateUtilization(results)}%</span>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3>Free Frames</h3>
                <div id="freeFramesList"></div>
            </div>
        </div>

        <div class="visualization">
            <h3>Memory Visualization</h3>
            <div class="memory-grid" id="memoryGrid"></div>
        </div>

        <div class="process-details">
            <h3>Process Details</h3>
            <div id="processCards"></div>
        </div>

        <div class="output-section">
            <h3>Simulation Output</h3>
            <div class="output-controls">
                <button onclick="copyOutput()" class="secondary">📋 Copy Output</button>
                <button onclick="downloadOutput()" class="secondary">💾 Download Output</button>
            </div>
            <pre id="simulationOutput" class="output-display"></pre>
        </div>

        <div class="notes-section">
            <h3>📝 Simulation Notes</h3>
            <textarea id="simulationNotes" placeholder="Add your notes about this simulation run..." rows="4"></textarea>
            <button onclick="saveNotes()" class="secondary">💾 Save Notes</button>
        </div>
    `;

    // Display free frames
    const freeFramesList = document.getElementById('freeFramesList');
    const freeFrameNumbers = results.freeFrames
        .map((free, index) => free ? index : -1)
        .filter(frame => frame !== -1);
    
    freeFramesList.innerHTML = `
        <div class="info-item">
            <span class="info-label">Available Frames:</span>
            <span class="info-value">${freeFrameNumbers.length}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Frame Numbers:</span>
            <span class="info-value">${freeFrameNumbers.join(', ') || 'None'}</span>
        </div>
    `;

    // Display memory grid
    const memoryGrid = document.getElementById('memoryGrid');
    results.frames.forEach((frame, index) => {
        const frameDiv = document.createElement('div');
        frameDiv.className = `frame ${frame ? 'occupied' : 'free'}`;
        frameDiv.innerHTML = `
            <div class="frame-number">Frame ${index}</div>
            ${frame ? `<div class="frame-process">P${frame.processId}</div>` : '<div class="frame-process">Free</div>'}
        `;
        memoryGrid.appendChild(frameDiv);
    });

    // Display process cards
    const processCards = document.getElementById('processCards');
    results.processes.forEach(process => {
        const processCard = document.createElement('div');
        processCard.className = 'process-card';
        
        const pageEntries = process.pageTable.map(entry => `
            <div class="page-entry ${entry.valid ? 'valid' : 'invalid'}">
                <div>Page ${entry.pageNumber}</div>
                <div>→ Frame ${entry.frameNumber}</div>
                <div>${entry.valid ? 'Valid' : 'Invalid'}</div>
            </div>
        `).join('');

        processCard.innerHTML = `
            <div class="process-header">
                <div class="process-title">Process ${process.id} (PID: ${process.pid})</div>
            </div>
            <div class="process-info">
                <div class="info-item">
                    <span class="info-label">Process Size:</span>
                    <span class="info-value">${process.procSize} bytes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Code Size:</span>
                    <span class="info-value">${process.codeSize} bytes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data Size:</span>
                    <span class="info-value">${process.dataSize} bytes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Number of Pages:</span>
                    <span class="info-value">${process.numPages}</span>
                </div>
            </div>
            <div class="page-table">
                <h4>Page Table</h4>
                <div class="page-entries">
                    ${pageEntries}
                </div>
            </div>
        `;
        processCards.appendChild(processCard);
    });

    // Display the formatted simulation output
    const outputElement = document.getElementById('simulationOutput');
    if (outputElement) {
        outputElement.textContent = formatSimulationOutput(results);
    }

    // Load any saved notes
    loadNotes();
}

function calculateUtilization(results) {
    const totalMemory = results.config.physicalMemSize;
    const usedMemory = results.processes.reduce((sum, process) => sum + process.procSize, 0);
    return ((usedMemory / totalMemory) * 100).toFixed(1);
}

function formatSimulationOutput(results) {
    // Use the raw output from the C simulator if available
    if (results.rawOutput) {
        return results.rawOutput;
    }
    
    // Fallback to formatted output if raw output is not available
    let output = `Physical Page Size: ${results.config.physicalMemSize}\n`;
    output += `Logical Address Size: ${results.config.logicalAddrSize}\n`;
    output += `Page Size: ${results.config.pageSize}\n`;
    output += `Number of Frames: ${results.numFrames}\n\n`;

    results.processes.forEach((process, index) => {
        output += `Process ${index + 1} (PID: ${process.pid}):\n`;
        output += `  Process Size: ${process.procSize} bytes, Number of Pages: ${process.numPages}\n`;
        output += `  Page Table:\n`;
        process.pageTable.forEach(entry => {
            output += `    Page ${entry.pageNumber} -> Frame ${entry.frameNumber}\n`;
        });
        output += `\n`;
    });

    output += `Total Internal Fragmentation: ${results.internalFragmentation} bytes\n\n`;
    output += `Free Frames:\n`;
    output += `FRAMES - `;
    results.freeFrames.forEach((free, index) => {
        if (free) output += `${index} `;
    });
    output += `- ARE FREE\n`;

    return output;
}

function copyOutput() {
    const outputElement = document.getElementById('simulationOutput');
    if (outputElement) {
        navigator.clipboard.writeText(outputElement.textContent).then(() => {
            alert('Output copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy output: ', err);
        });
    }
}

function downloadOutput() {
    const outputElement = document.getElementById('simulationOutput');
    if (outputElement) {
        const blob = new Blob([outputElement.textContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paging_simulation_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

function saveNotes() {
    const notesElement = document.getElementById('simulationNotes');
    const notes = notesElement.value;
    
    if (notes.trim()) {
        localStorage.setItem('pagingSimulatorNotes', notes);
        localStorage.setItem('pagingSimulatorNotesDate', new Date().toISOString());
        alert('Notes saved successfully!');
    } else {
        alert('Please enter some notes before saving.');
    }
}

function loadNotes() {
    const savedNotes = localStorage.getItem('pagingSimulatorNotes');
    const savedDate = localStorage.getItem('pagingSimulatorNotesDate');
    
    if (savedNotes) {
        const notesElement = document.getElementById('simulationNotes');
        if (notesElement) {
            notesElement.value = savedNotes;
            if (savedDate) {
                const date = new Date(savedDate);
                console.log(`Loaded notes from ${date.toLocaleString()}`);
            }
        }
    }
}

function clearResults() {
    console.log('clearResults called');
    
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        console.error('resultsSection element not found');
        return;
    }
    
    resultsSection.style.display = 'none';
    resultsSection.innerHTML = '';
    console.log('Results cleared successfully');
}

// Initialize the page with default process inputs
document.addEventListener('DOMContentLoaded', function() {
    generateProcessInputs();
});

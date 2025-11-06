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
}

const simulator = new PagingSimulator();

function generateProcessInputs() {
    const numProcessesElement = document.getElementById('numProcesses');
    const containerElement = document.getElementById('processInputs');
    
    if (!numProcessesElement || !containerElement) {
        console.error('Required elements not found');
        return;
    }
    
    const numProcesses = parseInt(numProcessesElement.value) || 3;
    containerElement.innerHTML = '';

    for (let i = 0; i < numProcesses; i++) {
        const processDiv = document.createElement('div');
        processDiv.className = 'process-input';
        processDiv.innerHTML = `
            <h4>Process ${i + 1}</h4>
            <div class="process-input-grid">
                <div class="input-group">
                    <label for="codeSize${i}">Code Size</label>
                    <div class="input-wrapper">
                    <input type="number" id="codeSize${i}" value="${Math.floor(Math.random() * 64) + 16}" min="1">
                        <span class="unit">bytes</span>
                    </div>
                </div>
                <div class="input-group">
                    <label for="dataSize${i}">Data Size</label>
                    <div class="input-wrapper">
                    <input type="number" id="dataSize${i}" value="${Math.floor(Math.random() * 128) + 32}" min="1">
                        <span class="unit">bytes</span>
                    </div>
                </div>
            </div>
        `;
        containerElement.appendChild(processDiv);
    }
}

async function runSimulation() {
    const resultsSection = document.getElementById('resultsSection');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const numProcesses = parseInt(document.getElementById('numProcesses').value);

    // Validate inputs
    if (!validateInputs()) {
        return;
    }

    // Show loading
    loadingOverlay.style.display = 'flex';

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

        // Call the backend API
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
        
        // Hide loading
        loadingOverlay.style.display = 'none';
        
        // Display results with animation
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');
        displayResults(results);

    } catch (error) {
        console.error('Simulation error:', error);
        loadingOverlay.style.display = 'none';
        showError(`Simulation failed: ${error.message}`);
    }
}

function validateInputs() {
    const physicalMem = parseInt(document.getElementById('physicalMem').value);
    const pageSize = parseInt(document.getElementById('pageSize').value);
    const numProcesses = parseInt(document.getElementById('numProcesses').value);

    if (physicalMem < 1024) {
        showError('Physical memory must be at least 1024 bytes');
        return false;
    }

    if (pageSize < 16) {
        showError('Page size must be at least 16 bytes');
        return false;
    }

    if (numProcesses < 1 || numProcesses > 10) {
        showError('Number of processes must be between 1 and 10');
        return false;
    }

    // Check if total memory requirements can be met
    const numFrames = Math.floor(physicalMem / pageSize);
    if (numFrames < numProcesses) {
        showError('Not enough frames for the specified number of processes');
        return false;
    }

    return true;
}

function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        console.error('resultsSection not found for error display');
        return;
    }
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = `<div class="error">${message}</div>`;
}

function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        console.error('resultsSection not found');
        return;
    }
    
    // Check if structure exists, if not recreate it
    if (!document.getElementById('memoryConfig')) {
        // Structure was cleared, recreate it
        resultsSection.innerHTML = `
            <div class="results-header">
                <h2>Simulation Results</h2>
            </div>
            
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-icon-wrapper">
                        <svg class="card-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="card-header-with-dropdown">
                        <h3>Memory Configuration</h3>
                        <button class="btn btn-secondary btn-sm calc-toggle-btn" onclick="toggleCalculations('memoryConfig')">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path id="calcIcon-memoryConfig" d="M5 12L10 8L5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Show Calculations</span>
                        </button>
                    </div>
                    <div id="memoryConfig" class="card-content"></div>
                    <div id="memoryConfig-calculations" class="calculations-container" style="display: none;"></div>
                </div>
                <div class="summary-card">
                    <div class="card-icon-wrapper">
                        <svg class="card-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M3 9H21M9 3V21" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="card-header-with-dropdown">
                        <h3>Fragmentation</h3>
                        <button class="calc-toggle-btn" onclick="toggleCalculations('fragmentation')">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path id="calcIcon-fragmentation" d="M5 12L10 8L5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Show Calculations</span>
                        </button>
                    </div>
                    <div id="fragmentationInfo" class="card-content"></div>
                    <div id="fragmentationChart" class="fragmentation-chart"></div>
                    <div id="fragmentation-calculations" class="calculations-container" style="display: none;"></div>
                </div>
                <div class="summary-card">
                    <div class="card-icon-wrapper">
                        <svg class="card-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H16M21 16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H16M21 16L16 16M8 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 12C16 13.1046 15.1046 14 14 14C12.8954 14 12 13.1046 12 12C12 10.8954 12.8954 10 14 10C15.1046 10 16 10.8954 16 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h3>Memory Utilization</h3>
                    <div id="utilizationMeter" class="utilization-meter"></div>
                </div>
            </div>

            <div class="visualization-section">
                <div class="viz-header">
                    <h3>Physical Memory Layout</h3>
                    <div id="frameLegend" class="frame-legend"></div>
                </div>
                <div id="memoryGrid" class="memory-grid"></div>
                <div class="memory-footer">
                    <small>Click on frames to view detailed information</small>
                </div>
            </div>

            <div class="translation-section">
                <div class="section-header-with-dropdown">
                    <div>
                        <h3>Address Translation Example</h3>
                        <p class="section-description">Demonstration of logical to physical address translation</p>
                    </div>
                    <button class="calc-toggle-btn" onclick="toggleCalculations('addressTranslation')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path id="calcIcon-addressTranslation" d="M5 12L10 8L5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Show Calculations</span>
                    </button>
                </div>
                <div id="translationDemo" class="translation-demo"></div>
                <div id="addressTranslation-calculations" class="calculations-container" style="display: none;"></div>
            </div>

            <div class="details-section">
                <div class="section-header-with-dropdown">
                    <div>
                        <h3>Process Details</h3>
                        <p class="section-description">Page table mappings and process information</p>
                    </div>
                </div>
                <div id="processDetails" class="process-details-container"></div>
            </div>

            <div class="output-section">
                <button onclick="toggleRawOutput()" class="btn btn-secondary btn-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path id="toggleIconPath" d="M5 12L10 8L5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Show Raw Output</span>
                </button>
                <div id="rawOutputContainer" class="raw-output-container" style="display: none;">
                    <pre id="simulationOutput" class="output-display"></pre>
                    <div class="output-actions">
                        <button onclick="copyOutput()" class="btn btn-secondary btn-sm">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="5" y="5" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M9 5V3C9 2.44772 8.55228 2 8 2H4C3.44772 2 3 2.44772 3 3V8C3 8.55228 3.44772 9 4 9H5" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            <span>Copy</span>
                        </button>
                        <button onclick="downloadOutput()" class="btn btn-secondary btn-sm">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 12V2M8 12L4 8M8 12L12 8M3 13H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            <span>Download</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Display memory configuration
    const memoryConfig = document.getElementById('memoryConfig');
    if (!memoryConfig) {
        console.error('memoryConfig element not found after structure creation');
        return;
    }
    memoryConfig.innerHTML = `
        <div class="info-item">
            <span class="info-label">Physical Memory:</span>
            <span class="info-value">${formatBytes(results.config.physicalMemSize)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Logical Address:</span>
            <span class="info-value">${results.config.logicalAddrSize} bits</span>
        </div>
        <div class="info-item">
            <span class="info-label">Page Size:</span>
            <span class="info-value">${formatBytes(results.config.pageSize)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Total Frames:</span>
            <span class="info-value">${results.numFrames}</span>
        </div>
    `;
    
    // Display memory configuration calculations
    if (results.calculations && results.calculations.memory) {
        displayMemoryCalculations(results.calculations.memory);
    }

    // Display fragmentation info
    const fragmentationInfo = document.getElementById('fragmentationInfo');
    if (fragmentationInfo) {
        fragmentationInfo.innerHTML = `
                    <div class="info-item">
                        <span class="info-label">Internal Fragmentation:</span>
                <span class="info-value">${formatBytes(results.internalFragmentation)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Memory Utilization:</span>
                        <span class="info-value">${calculateUtilization(results)}%</span>
        </div>
    `;
    }
    
    // Display fragmentation calculations
    if (results.calculations && results.calculations.fragmentation) {
        displayFragmentationCalculations(results.calculations.fragmentation);
    }

    // Display free frames - check if element exists
    const freeFramesInfo = document.getElementById('freeFramesInfo');
    if (freeFramesInfo) {
    const freeFrameNumbers = results.freeFrames
        .map((free, index) => free ? index : -1)
        .filter(frame => frame !== -1);
    
        freeFramesInfo.innerHTML = `
        <div class="info-item">
                <span class="info-label">Available:</span>
                <span class="info-value">${freeFrameNumbers.length} frames</span>
        </div>
        <div class="info-item">
            <span class="info-label">Frame Numbers:</span>
            <span class="info-value">${freeFrameNumbers.join(', ') || 'None'}</span>
        </div>
    `;
    }

    // Display frame legend
    const frameLegend = document.getElementById('frameLegend');
    if (frameLegend) {
        frameLegend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background: var(--success-light); border: 2px solid var(--success);"></div>
                <span>Free</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 2px solid #6366f1;"></div>
                <span>Occupied</span>
            </div>
        `;
    }

    // Display memory grid with hover details
    const memoryGrid = document.getElementById('memoryGrid');
    if (memoryGrid) {
        memoryGrid.innerHTML = '';
        results.frames.forEach((frame, index) => {
            const frameDiv = document.createElement('div');
            frameDiv.className = `frame ${frame ? 'occupied' : 'free'}`;
            
            if (frame) {
                const pageOffset = index * results.config.pageSize;
                const endOffset = pageOffset + results.config.pageSize - 1;
                frameDiv.setAttribute('title', `Frame ${index}\nProcess P${frame.processId}\nPage ${frame.pageNumber}\nAddress Range: 0x${pageOffset.toString(16).padStart(4, '0')} - 0x${endOffset.toString(16).padStart(4, '0')}\nSize: ${results.config.pageSize} bytes`);
                frameDiv.innerHTML = `
                    <div class="frame-number">${index}</div>
                    <div class="frame-process">P${frame.processId}</div>
                    <div class="frame-page">Page ${frame.pageNumber}</div>
                `;
            } else {
                frameDiv.innerHTML = `
                    <div class="frame-number">${index}</div>
                    <div class="frame-process">Free</div>
                `;
            }
            
            frameDiv.addEventListener('click', () => showFrameDetails(frame, index, results.config));
            memoryGrid.appendChild(frameDiv);
        });
    }

    // Display fragmentation chart
    displayFragmentationChart(results);

    // Display utilization meter
    displayUtilizationMeter(results);

    // Display address translation demo
    displayAddressTranslation(results);
    
    // Display address translation calculations
    if (results.calculations && results.calculations.addressTranslation) {
        displayAddressTranslationCalculations(results.calculations.addressTranslation);
    }

    // Display process details
    const processDetails = document.getElementById('processDetails');
    if (processDetails) {
        processDetails.innerHTML = '';
        results.processes.forEach((process, index) => {
            const processCard = document.createElement('div');
            processCard.className = 'process-card';
            
            const pageEntries = process.pageTable.map(entry => `
                <div class="page-entry ${entry.valid ? 'valid' : 'invalid'}">
                    <div><strong>Page ${entry.pageNumber}</strong></div>
                    <div>→ Frame ${entry.frameNumber}</div>
                </div>
            `).join('');

            // Find process calculations
            const processCalc = results.calculations && results.calculations.processes 
                ? results.calculations.processes.find(p => p.processId === process.id)
                : null;

            processCard.innerHTML = `
                <div class="process-header">
                    <div class="process-title">Process ${process.id} (PID: ${process.pid})</div>
                    ${processCalc ? `
                        <button class="calc-toggle-btn" onclick="toggleProcessCalculations(${process.id})">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path id="calcIcon-process${process.id}" d="M5 12L10 8L5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Show Calculations</span>
                        </button>
                    ` : ''}
                </div>
                <div class="process-info">
                    <div class="info-item">
                        <span class="info-label">Process Size:</span>
                        <span class="info-value">${formatBytes(process.procSize)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Code:</span>
                        <span class="info-value">${formatBytes(process.codeSize)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data:</span>
                        <span class="info-value">${formatBytes(process.dataSize)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Pages:</span>
                        <span class="info-value">${process.numPages}</span>
                    </div>
                </div>
                <div class="page-table">
                    <h4>Page Table</h4>
                    <div class="page-entries">
                        ${pageEntries}
                    </div>
                </div>
                ${processCalc ? `
                    <div id="process${process.id}-calculations" class="calculations-container" style="display: none;"></div>
                ` : ''}
            `;
            processDetails.appendChild(processCard);
            
            // Display process calculations if available
            if (processCalc) {
                displayProcessCalculations(process.id, processCalc);
            }
        });
    }

    // Display raw output
    const outputElement = document.getElementById('simulationOutput');
    if (outputElement) {
        outputElement.textContent = formatSimulationOutput(results);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function calculateUtilization(results) {
    const totalMemory = results.config.physicalMemSize;
    const usedMemory = results.processes.reduce((sum, process) => sum + process.procSize, 0);
    return ((usedMemory / totalMemory) * 100).toFixed(1);
}

function formatSimulationOutput(results) {
    if (results.rawOutput) {
        return results.rawOutput;
    }
    
    let output = `Physical Page Size: ${results.config.physicalMemSize} bytes\n`;
    output += `Logical Address Size: ${results.config.logicalAddrSize} bits\n`;
    output += `Page Size: ${results.config.pageSize} bytes\n`;
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

function toggleRawOutput() {
    const container = document.getElementById('rawOutputContainer');
    const toggleIconPath = document.getElementById('toggleIconPath');
    
    if (!container || !toggleIconPath) {
        return;
    }
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggleIconPath.setAttribute('d', 'M5 4L10 8L5 12');
    } else {
        container.style.display = 'none';
        toggleIconPath.setAttribute('d', 'M5 12L10 8L5 4');
    }
}

function copyOutput() {
    const outputElement = document.getElementById('simulationOutput');
    if (outputElement) {
        navigator.clipboard.writeText(outputElement.textContent).then(() => {
            showToast('Output copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy output:', err);
            showToast('Failed to copy to clipboard', 'error');
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
        showToast('Download started!');
    }
}

function clearResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        return;
    }
    
    resultsSection.style.display = 'none';
    resultsSection.innerHTML = '';
    resultsSection.classList.remove('fade-in');
}

function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    let bgColor;
    if (type === 'error') {
        bgColor = '#ef4444';
    } else if (type === 'info') {
        bgColor = '#3b82f6';
    } else {
        bgColor = '#10b981';
    }
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${bgColor};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function displayFragmentationChart(results) {
    const chartContainer = document.getElementById('fragmentationChart');
    if (!chartContainer) return;
    
    const totalMemory = results.config.physicalMemSize;
    const usedMemory = results.processes.reduce((sum, p) => sum + p.procSize, 0);
    const actualUsed = usedMemory - results.internalFragmentation;
    const fragmentationPercent = Math.min((results.internalFragmentation / totalMemory * 100), 100).toFixed(1);
    const usedPercent = Math.min((actualUsed / totalMemory * 100), 100).toFixed(1);
    const freePercent = Math.max((totalMemory - usedMemory) / totalMemory * 100, 0).toFixed(1);
    
    chartContainer.innerHTML = `
        <div class="chart-bar">
            <div class="chart-label">Memory Breakdown</div>
            <div class="chart-visualization">
                <div class="chart-segment" style="width: ${usedPercent}%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);" title="Actually Used: ${formatBytes(actualUsed)} (${usedPercent}%)"></div>
                <div class="chart-segment" style="width: ${fragmentationPercent}%; background: var(--warning);" title="Wasted (Fragmentation): ${formatBytes(results.internalFragmentation)} (${fragmentationPercent}%)"></div>
                <div class="chart-segment" style="width: ${freePercent}%; background: var(--success);" title="Free: ${formatBytes(totalMemory - usedMemory)} (${freePercent}%)"></div>
            </div>
        </div>
    `;
}

function displayUtilizationMeter(results) {
    const meterContainer = document.getElementById('utilizationMeter');
    if (!meterContainer) return;
    
    const utilization = calculateUtilization(results);
    const colorClass = utilization > 90 ? 'high' : utilization > 50 ? 'medium' : 'low';
    
    meterContainer.innerHTML = `
        <div class="meter-wrapper">
            <div class="meter-bar" id="utilizationBar"></div>
            <div class="meter-value">${utilization}%</div>
        </div>
        <div class="meter-info">
            <span>Used: ${formatBytes(results.processes.reduce((sum, p) => sum + p.procSize, 0))}</span>
            <span>Total: ${formatBytes(results.config.physicalMemSize)}</span>
        </div>
    `;
    
    // Animate the meter
    setTimeout(() => {
        const bar = document.getElementById('utilizationBar');
        if (bar) {
            bar.style.width = `${utilization}%`;
            bar.className = `meter-bar ${colorClass}`;
        }
    }, 100);
}

function displayAddressTranslation(results) {
    const demoContainer = document.getElementById('translationDemo');
    if (!demoContainer) return;
    
    // Calculate address components
    const logicalAddrBits = results.config.logicalAddrSize;
    const pageSize = results.config.pageSize;
    const offsetBits = Math.log2(pageSize);
    const pageBits = logicalAddrBits - offsetBits;
    
    // Pick an example from the first process
    if (results.processes.length === 0) return;
    const firstProcess = results.processes[0];
    if (firstProcess.pageTable.length === 0) return;
    
    const examplePage = firstProcess.pageTable[0].pageNumber;
    const exampleFrame = firstProcess.pageTable[0].frameNumber;
    const exampleOffset = Math.floor(pageSize / 4); // Sample offset
    const logicalAddress = (examplePage << offsetBits) + exampleOffset;
    const physicalAddress = (exampleFrame * pageSize) + exampleOffset;
    
    demoContainer.innerHTML = `
        <div class="translation-container">
            <div class="translation-step">
                <div class="step-label">Logical Address</div>
                <div class="address-binary">${logicalAddress.toString(2).padStart(logicalAddrBits, '0')}</div>
                <div class="address-breakdown">
                    <span class="address-part">Page: ${examplePage.toString(2).padStart(pageBits, '0')} (${examplePage})</span>
                    <span class="address-part">Offset: ${exampleOffset.toString(2).padStart(offsetBits, '0')} (${exampleOffset})</span>
                </div>
            </div>
            
            <div class="translation-arrow">⟶</div>
            
            <div class="translation-step">
                <div class="step-label">Page Table Lookup</div>
                <div class="page-table-entry">
                    <span>Page ${examplePage}</span>
                    <span>→</span>
                    <span>Frame ${exampleFrame}</span>
                </div>
            </div>
            
            <div class="translation-arrow">⟶</div>
            
            <div class="translation-step">
                <div class="step-label">Physical Address</div>
                <div class="address-binary">${physicalAddress.toString(2).padStart(logicalAddrBits, '0')}</div>
                <div class="address-breakdown">
                    <span class="address-part">Frame: ${exampleFrame}</span>
                    <span class="address-part">Offset: ${exampleOffset}</span>
                    <span class="address-hex">0x${physicalAddress.toString(16).toUpperCase()}</span>
                </div>
            </div>
        </div>
    `;
}

function showFrameDetails(frame, frameIndex, config) {
    if (!frame) {
        showToast(`Frame ${frameIndex} is free`, 'info');
        return;
    }
    
    const startAddr = frameIndex * config.pageSize;
    const endAddr = startAddr + config.pageSize - 1;
    
    const details = `
Frame ${frameIndex}
Process: P${frame.processId}
Page: ${frame.pageNumber}
Address Range: 0x${startAddr.toString(16).padStart(4, '0')} - 0x${endAddr.toString(16).padStart(4, '0')}
Size: ${formatBytes(config.pageSize)}
    `.trim();
    
    // Create a modal or detailed view
    const modal = document.createElement('div');
    modal.className = 'frame-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Frame Details</h3>
                <button onclick="this.closest('.frame-modal').remove()" class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <pre>${details}</pre>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

// Calculation display functions
function displayMemoryCalculations(memoryCalc) {
    const container = document.getElementById('memoryConfig-calculations');
    if (!container || !memoryCalc) return;
    
    container.innerHTML = `
        <div class="calculation-group">
            <h4>Number of Frames</h4>
            <div class="calc-item">
                <div class="calc-formula">${memoryCalc.numFrames.formula}</div>
                <div class="calc-calculation">${memoryCalc.numFrames.calculation}</div>
                <div class="calc-result">= ${memoryCalc.numFrames.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Offset Bits</h4>
            <div class="calc-item">
                <div class="calc-formula">${memoryCalc.offsetBits.formula}</div>
                <div class="calc-calculation">${memoryCalc.offsetBits.calculation}</div>
                <div class="calc-result">= ${memoryCalc.offsetBits.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Page Number Bits</h4>
            <div class="calc-item">
                <div class="calc-formula">${memoryCalc.pageBits.formula}</div>
                <div class="calc-calculation">${memoryCalc.pageBits.calculation}</div>
                <div class="calc-result">= ${memoryCalc.pageBits.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Maximum Pages</h4>
            <div class="calc-item">
                <div class="calc-formula">${memoryCalc.maxPages.formula}</div>
                <div class="calc-calculation">${memoryCalc.maxPages.calculation}</div>
                <div class="calc-result">= ${memoryCalc.maxPages.result}</div>
            </div>
        </div>
    `;
}

function displayFragmentationCalculations(fragCalc) {
    const container = document.getElementById('fragmentation-calculations');
    if (!container || !fragCalc) return;
    
    container.innerHTML = `
        <div class="calculation-group">
            <h4>Total Used Memory</h4>
            <div class="calc-item">
                <div class="calc-formula">${fragCalc.totalUsed.formula}</div>
                <div class="calc-calculation">${fragCalc.totalUsed.calculation}</div>
                <div class="calc-result">= ${fragCalc.totalUsed.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Total Allocated Memory</h4>
            <div class="calc-item">
                <div class="calc-formula">${fragCalc.totalAllocated.formula}</div>
                <div class="calc-calculation">${fragCalc.totalAllocated.calculation}</div>
                <div class="calc-result">= ${fragCalc.totalAllocated.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Total Internal Fragmentation</h4>
            <div class="calc-item">
                <div class="calc-formula">${fragCalc.totalFragmentation.formula}</div>
                <div class="calc-calculation">${fragCalc.totalFragmentation.calculation}</div>
                <div class="calc-result">= ${fragCalc.totalFragmentation.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Memory Utilization</h4>
            <div class="calc-item">
                <div class="calc-formula">${fragCalc.utilization.formula}</div>
                <div class="calc-calculation">${fragCalc.utilization.calculation}</div>
                <div class="calc-result">= ${fragCalc.utilization.result}</div>
            </div>
        </div>
    `;
}

function displayProcessCalculations(processId, processCalc) {
    const container = document.getElementById(`process${processId}-calculations`);
    if (!container || !processCalc) return;
    
    container.innerHTML = `
        <div class="calculation-group">
            <h4>Process Size</h4>
            <div class="calc-item">
                <div class="calc-formula">${processCalc.processSize.formula}</div>
                <div class="calc-calculation">${processCalc.processSize.calculation}</div>
                <div class="calc-result">= ${processCalc.processSize.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Number of Pages</h4>
            <div class="calc-item">
                <div class="calc-formula">${processCalc.numPages.formula}</div>
                <div class="calc-calculation">${processCalc.numPages.calculation}</div>
                <div class="calc-result">= ${processCalc.numPages.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Internal Fragmentation</h4>
            <div class="calc-item">
                <div class="calc-formula">${processCalc.fragmentation.formula}</div>
                <div class="calc-calculation">${processCalc.fragmentation.calculation}</div>
                <div class="calc-result">= ${processCalc.fragmentation.result}</div>
            </div>
        </div>
    `;
}

function displayAddressTranslationCalculations(addrCalc) {
    const container = document.getElementById('addressTranslation-calculations');
    if (!container || !addrCalc) return;
    
    container.innerHTML = `
        <div class="calculation-group">
            <h4>Logical Address Calculation</h4>
            <div class="calc-item">
                <div class="calc-formula">${addrCalc.logicalAddress.formula}</div>
                <div class="calc-calculation">${addrCalc.logicalAddress.calculation}</div>
                <div class="calc-result">= ${addrCalc.logicalAddress.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Page Table Lookup</h4>
            <div class="calc-item">
                <div class="calc-formula">${addrCalc.pageLookup.formula}</div>
                <div class="calc-calculation">${addrCalc.pageLookup.calculation}</div>
                <div class="calc-result">${addrCalc.pageLookup.result}</div>
            </div>
        </div>
        <div class="calculation-group">
            <h4>Physical Address Calculation</h4>
            <div class="calc-item">
                <div class="calc-formula">${addrCalc.physicalAddress.formula}</div>
                <div class="calc-calculation">${addrCalc.physicalAddress.calculation}</div>
                <div class="calc-result">= ${addrCalc.physicalAddress.result}</div>
            </div>
        </div>
    `;
}

// Toggle calculation displays
function toggleCalculations(sectionId) {
    const container = document.getElementById(`${sectionId}-calculations`);
    const iconPath = document.getElementById(`calcIcon-${sectionId}`);
    
    if (!container) return;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (iconPath) {
            iconPath.setAttribute('d', 'M5 4L10 8L5 12');
        }
    } else {
        container.style.display = 'none';
        if (iconPath) {
            iconPath.setAttribute('d', 'M5 12L10 8L5 4');
        }
    }
}

function toggleProcessCalculations(processId) {
    const container = document.getElementById(`process${processId}-calculations`);
    const iconPath = document.getElementById(`calcIcon-process${processId}`);
    
    if (!container) return;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (iconPath) {
            iconPath.setAttribute('d', 'M5 4L10 8L5 12');
        }
    } else {
        container.style.display = 'none';
        if (iconPath) {
            iconPath.setAttribute('d', 'M5 12L10 8L5 4');
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    generateProcessInputs();
    console.log('Paging Simulator initialized successfully!');
});

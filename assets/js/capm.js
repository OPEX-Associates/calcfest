// CAPM Calculator
class CAPMCalculator {
    constructor() {
        this.form = document.getElementById('capmForm');
        this.resultsContainer = document.getElementById('capmResults');
        this.smlContainer = document.getElementById('smlContainer');
        this.betaAnalysisContainer = document.getElementById('betaAnalysisContainer');
        this.riskReturnContainer = document.getElementById('riskReturnContainer');
        
        this.smlChart = null;
        this.betaChart = null;
        this.assets = [];
        this.assetCounter = 0;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Setup beta calculation method toggle
        this.setupBetaCalculationToggle();
        
        // Setup beta calculation button
        this.setupBetaCalculation();
        
        // Setup additional assets functionality
        this.setupAdditionalAssets();
        
        // Format inputs
        this.setupInputFormatting();
    }

    setupBetaCalculationToggle() {
        const methodSelect = document.getElementById('betaCalculationMethod');
        const calculationSection = document.getElementById('betaCalculationSection');
        const betaInput = document.getElementById('assetBeta');

        methodSelect.addEventListener('change', () => {
            if (methodSelect.value === 'calculate') {
                calculationSection.classList.remove('hidden');
                betaInput.disabled = true;
                betaInput.classList.add('bg-gray-100', 'dark:bg-gray-600');
            } else {
                calculationSection.classList.add('hidden');
                betaInput.disabled = false;
                betaInput.classList.remove('bg-gray-100', 'dark:bg-gray-600');
            }
        });
    }

    setupBetaCalculation() {
        const calculateBtn = document.getElementById('calculateBetaBtn');
        const resultDiv = document.getElementById('betaCalculationResult');
        
        calculateBtn.addEventListener('click', () => {
            const assetReturns = this.parseReturns(document.getElementById('assetReturns').value);
            const marketReturns = this.parseReturns(document.getElementById('marketReturns').value);
            
            if (assetReturns.length === 0 || marketReturns.length === 0) {
                this.showBetaCalculationError('Please enter both asset and market returns');
                return;
            }
            
            if (assetReturns.length !== marketReturns.length) {
                this.showBetaCalculationError('Asset and market returns must have the same number of data points');
                return;
            }
            
            if (assetReturns.length < 3) {
                this.showBetaCalculationError('Need at least 3 data points to calculate beta');
                return;
            }
            
            const beta = this.calculateBeta(assetReturns, marketReturns);
            const correlation = this.calculateCorrelation(assetReturns, marketReturns);
            const rSquared = correlation * correlation;
            
            document.getElementById('assetBeta').value = beta.toFixed(3);
            
            resultDiv.innerHTML = `
                <div class="space-y-2">
                    <h5 class="font-medium text-amber-800 dark:text-amber-200">Calculation Results:</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="font-semibold text-amber-900 dark:text-amber-100">${beta.toFixed(3)}</div>
                            <div class="text-amber-700 dark:text-amber-300">Beta (β)</div>
                        </div>
                        <div class="text-center">
                            <div class="font-semibold text-amber-900 dark:text-amber-100">${correlation.toFixed(3)}</div>
                            <div class="text-amber-700 dark:text-amber-300">Correlation</div>
                        </div>
                        <div class="text-center">
                            <div class="font-semibold text-amber-900 dark:text-amber-100">${(rSquared * 100).toFixed(1)}%</div>
                            <div class="text-amber-700 dark:text-amber-300">R-Squared</div>
                        </div>
                    </div>
                    <p class="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        Beta calculated using ${assetReturns.length} data points. Higher R-squared indicates better fit.
                    </p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            
            this.debounceCalculate();
        });
    }

    setupAdditionalAssets() {
        const addBtn = document.getElementById('addAssetBtn');
        const container = document.getElementById('additionalAssets');
        
        addBtn.addEventListener('click', () => {
            this.assetCounter++;
            const assetDiv = document.createElement('div');
            assetDiv.className = 'grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg';
            assetDiv.id = `asset-${this.assetCounter}`;
            
            assetDiv.innerHTML = `
                <div>
                    <input type="text" placeholder="Asset name" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="name">
                </div>
                <div>
                    <input type="number" placeholder="Beta" step="0.01" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="beta">
                </div>
                <div>
                    <input type="number" placeholder="Actual return %" step="0.01" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="actualReturn">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional</p>
                </div>
                <div>
                    <button type="button" onclick="this.parentElement.parentElement.remove()" 
                        class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded transition duration-200">
                        Remove
                    </button>
                </div>
            `;
            
            container.appendChild(assetDiv);
            
            // Add event listeners to new inputs
            const inputs = assetDiv.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.debounceCalculate());
            });
        });
    }

    setupInputFormatting() {
        // Percentage inputs
        const percentageInputs = ['riskFreeRate', 'marketReturn', 'assetBeta'];
        percentageInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d.-]/g, '');
                    if (value && inputName !== 'assetBeta') {
                        const parts = value.split('.');
                        if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        if (parts[1] && parts[1].length > 3) {
                            value = parts[0] + '.' + parts[1].substring(0, 3);
                        }
                    }
                    e.target.value = value;
                });
            }
        });
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculateCAPM();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateCAPM();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['riskFreeRate', 'marketReturn', 'assetBeta'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = parseFloat(field.value);

            if (isNaN(value)) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate rate ranges
        const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value);
        const marketReturn = parseFloat(document.getElementById('marketReturn').value);
        
        if (!isNaN(riskFreeRate) && !isNaN(marketReturn) && riskFreeRate >= marketReturn) {
            if (showErrors) {
                this.showFieldError(document.getElementById('marketReturn'), 'Market return should be higher than risk-free rate');
            }
            isValid = false;
        }

        return isValid;
    }

    calculateCAPM() {
        const data = this.getFormData();
        const results = this.performCAPMCalculations(data);
        
        this.displayResults(results, data);
        this.displaySML(results, data);
        this.displayBetaAnalysis(results, data);
        this.displayRiskReturnAnalysis(results, data);
    }

    getFormData() {
        const additionalAssets = this.getAdditionalAssets();
        
        return {
            riskFreeRate: parseFloat(document.getElementById('riskFreeRate').value) || 0,
            marketReturn: parseFloat(document.getElementById('marketReturn').value) || 0,
            assetBeta: parseFloat(document.getElementById('assetBeta').value) || 0,
            assetName: document.getElementById('assetName').value || 'Asset',
            riskFreeSource: document.getElementById('riskFreeSource').value,
            marketBenchmark: document.getElementById('marketBenchmark').value,
            betaCalculationMethod: document.getElementById('betaCalculationMethod').value,
            additionalAssets: additionalAssets
        };
    }

    getAdditionalAssets() {
        const container = document.getElementById('additionalAssets');
        const assetDivs = container.querySelectorAll('[id^="asset-"]');
        const assets = [];
        
        assetDivs.forEach(div => {
            const nameInput = div.querySelector('[data-field="name"]');
            const betaInput = div.querySelector('[data-field="beta"]');
            const actualReturnInput = div.querySelector('[data-field="actualReturn"]');
            
            const name = nameInput?.value?.trim();
            const beta = parseFloat(betaInput?.value);
            const actualReturn = parseFloat(actualReturnInput?.value);
            
            if (name && !isNaN(beta)) {
                assets.push({
                    name,
                    beta,
                    actualReturn: isNaN(actualReturn) ? null : actualReturn
                });
            }
        });
        
        return assets;
    }

    performCAPMCalculations(data) {
        const marketRiskPremium = data.marketReturn - data.riskFreeRate;
        const expectedReturn = data.riskFreeRate + (data.assetBeta * marketRiskPremium);
        
        // Calculate for main asset
        const mainAsset = {
            name: data.assetName,
            beta: data.assetBeta,
            expectedReturn: expectedReturn,
            marketRiskPremium: data.assetBeta * marketRiskPremium,
            riskPremium: expectedReturn - data.riskFreeRate,
            riskClass: this.getRiskClassification(data.assetBeta),
            actualReturn: null
        };
        
        // Calculate for additional assets
        const additionalResults = data.additionalAssets.map(asset => {
            const assetExpectedReturn = data.riskFreeRate + (asset.beta * marketRiskPremium);
            return {
                name: asset.name,
                beta: asset.beta,
                expectedReturn: assetExpectedReturn,
                marketRiskPremium: asset.beta * marketRiskPremium,
                riskPremium: assetExpectedReturn - data.riskFreeRate,
                riskClass: this.getRiskClassification(asset.beta),
                actualReturn: asset.actualReturn,
                alpha: asset.actualReturn !== null ? asset.actualReturn - assetExpectedReturn : null,
                overUnderValued: asset.actualReturn !== null ? 
                    (asset.actualReturn > assetExpectedReturn ? 'Undervalued' : 'Overvalued') : null
            };
        });
        
        // Generate SML data points
        const smlPoints = [];
        for (let beta = -0.5; beta <= 2.5; beta += 0.1) {
            smlPoints.push({
                beta: beta,
                expectedReturn: data.riskFreeRate + (beta * marketRiskPremium)
            });
        }
        
        return {
            mainAsset,
            additionalAssets: additionalResults,
            marketRiskPremium,
            smlPoints,
            allAssets: [mainAsset, ...additionalResults]
        };
    }

    getRiskClassification(beta) {
        if (beta < 0) return 'Defensive (Counter-cyclical)';
        if (beta < 0.8) return 'Low Risk (Defensive)';
        if (beta < 1.2) return 'Market Risk';
        if (beta < 1.5) return 'High Risk (Aggressive)';
        return 'Very High Risk';
    }

    displayResults(results, data) {
        const mainAsset = results.mainAsset;
        
        this.resultsContainer.innerHTML = `
            <!-- Main CAPM Result -->
            <div class="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    CAPM Expected Return: ${mainAsset.name}
                </h4>
                
                <div class="text-center mb-4">
                    <div class="text-3xl font-bold text-green-600 dark:text-green-400">
                        ${mainAsset.expectedReturn.toFixed(2)}%
                    </div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">Expected Annual Return</div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            ${data.riskFreeRate.toFixed(2)}%
                        </div>
                        <div class="text-xs text-blue-700 dark:text-blue-300">Risk-Free Rate</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            ${mainAsset.beta.toFixed(2)}
                        </div>
                        <div class="text-xs text-blue-700 dark:text-blue-300">Beta (β)</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            ${results.marketRiskPremium.toFixed(2)}%
                        </div>
                        <div class="text-xs text-blue-700 dark:text-blue-300">Market Risk Premium</div>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Formula:</strong> ${mainAsset.expectedReturn.toFixed(2)}% = ${data.riskFreeRate.toFixed(2)}% + ${mainAsset.beta.toFixed(2)} × (${data.marketReturn.toFixed(2)}% - ${data.riskFreeRate.toFixed(2)}%)
                    </p>
                </div>
            </div>

            <!-- Risk Assessment -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Risk Assessment</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-purple-700 dark:text-purple-300">Risk Classification</span>
                        <span class="font-semibold text-purple-900 dark:text-purple-100">${mainAsset.riskClass}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-purple-700 dark:text-purple-300">Risk Premium</span>
                        <span class="font-medium text-purple-800 dark:text-purple-200">${mainAsset.riskPremium.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-purple-700 dark:text-purple-300">Systematic Risk Factor</span>
                        <span class="font-medium text-purple-800 dark:text-purple-200">${mainAsset.marketRiskPremium.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-purple-700 dark:text-purple-300">Volatility vs Market</span>
                        <span class="font-medium text-purple-800 dark:text-purple-200">
                            ${mainAsset.beta > 1 ? ((mainAsset.beta - 1) * 100).toFixed(0) + '% Higher' : 
                              mainAsset.beta < 1 ? ((1 - mainAsset.beta) * 100).toFixed(0) + '% Lower' : 'Same as Market'}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <p class="text-xs text-purple-800 dark:text-purple-200">
                        ${this.getBetaInterpretation(mainAsset.beta)}
                    </p>
                </div>
            </div>

            ${results.additionalAssets.length > 0 ? `
            <!-- Additional Assets Comparison -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Comparison</h4>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-600">
                                <th class="text-left py-2 text-gray-900 dark:text-white">Asset</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Beta</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Expected Return</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Risk Premium</th>
                                ${results.additionalAssets.some(a => a.actualReturn !== null) ? 
                                    '<th class="text-right py-2 text-gray-900 dark:text-white">Actual Return</th><th class="text-right py-2 text-gray-900 dark:text-white">Alpha</th><th class="text-center py-2 text-gray-900 dark:text-white">Valuation</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100 dark:border-gray-600">
                                <td class="py-2 font-medium text-gray-900 dark:text-white">${mainAsset.name}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${mainAsset.beta.toFixed(2)}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${mainAsset.expectedReturn.toFixed(2)}%</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${mainAsset.riskPremium.toFixed(2)}%</td>
                                ${results.additionalAssets.some(a => a.actualReturn !== null) ? '<td class="py-2 text-right text-gray-500 dark:text-gray-400">-</td><td class="py-2 text-right text-gray-500 dark:text-gray-400">-</td><td class="py-2 text-center text-gray-500 dark:text-gray-400">-</td>' : ''}
                            </tr>
                            ${results.additionalAssets.map(asset => `
                                <tr class="border-b border-gray-100 dark:border-gray-600">
                                    <td class="py-2 font-medium text-gray-900 dark:text-white">${asset.name}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${asset.beta.toFixed(2)}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${asset.expectedReturn.toFixed(2)}%</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${asset.riskPremium.toFixed(2)}%</td>
                                    ${asset.actualReturn !== null ? `
                                        <td class="py-2 text-right text-gray-700 dark:text-gray-300">${asset.actualReturn.toFixed(2)}%</td>
                                        <td class="py-2 text-right ${asset.alpha > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${asset.alpha.toFixed(2)}%</td>
                                        <td class="py-2 text-center">
                                            <span class="px-2 py-1 text-xs rounded-full ${asset.overUnderValued === 'Undervalued' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}">
                                                ${asset.overUnderValued}
                                            </span>
                                        </td>
                                    ` : results.additionalAssets.some(a => a.actualReturn !== null) ? '<td class="py-2 text-right text-gray-500 dark:text-gray-400">-</td><td class="py-2 text-right text-gray-500 dark:text-gray-400">-</td><td class="py-2 text-center text-gray-500 dark:text-gray-400">-</td>' : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <!-- Market Context -->
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h4 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Market Context</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 class="font-medium text-amber-700 dark:text-amber-300 mb-2">Current Settings</h5>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-amber-600 dark:text-amber-400">Risk-Free Source:</span>
                                <span class="text-amber-800 dark:text-amber-200">${this.getRiskFreeSourceName(data.riskFreeSource)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-amber-600 dark:text-amber-400">Market Benchmark:</span>
                                <span class="text-amber-800 dark:text-amber-200">${this.getMarketBenchmarkName(data.marketBenchmark)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-amber-600 dark:text-amber-400">Market Risk Premium:</span>
                                <span class="text-amber-800 dark:text-amber-200">${results.marketRiskPremium.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h5 class="font-medium text-amber-700 dark:text-amber-300 mb-2">Key Insights</h5>
                        <div class="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                            <div class="flex items-start">
                                <div class="w-1 h-1 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></div>
                                <span>Higher beta assets require higher expected returns to compensate for increased risk</span>
                            </div>
                            <div class="flex items-start">
                                <div class="w-1 h-1 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></div>
                                <span>Assets above the SML are considered undervalued investment opportunities</span>
                            </div>
                            <div class="flex items-start">
                                <div class="w-1 h-1 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"></div>
                                <span>CAPM assumes investors can diversify away unsystematic risk</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.resultsContainer.classList.remove('hidden');
    }

    displaySML(results, data) {
        this.smlContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('smlChart').getContext('2d');
        
        // Destroy existing chart
        if (this.smlChart) {
            this.smlChart.destroy();
        }

        // Prepare datasets
        const smlData = results.smlPoints.map(point => ({x: point.beta, y: point.expectedReturn}));
        
        const datasets = [
            {
                label: 'Security Market Line',
                data: smlData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                showLine: true,
                fill: false
            }
        ];

        // Add assets as points
        results.allAssets.forEach((asset, index) => {
            const colors = [
                'rgb(239, 68, 68)',   // Red
                'rgb(34, 197, 94)',   // Green
                'rgb(168, 85, 247)',  // Purple
                'rgb(251, 191, 36)',  // Yellow
                'rgb(236, 72, 153)',  // Pink
                'rgb(20, 184, 166)'   // Teal
            ];
            
            datasets.push({
                label: asset.name,
                data: [{x: asset.beta, y: asset.expectedReturn}],
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length],
                borderWidth: 2,
                pointRadius: 8,
                showLine: false
            });

            // Add actual return point if available
            if (asset.actualReturn !== null) {
                datasets.push({
                    label: `${asset.name} (Actual)`,
                    data: [{x: asset.beta, y: asset.actualReturn}],
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: colors[index % colors.length],
                    borderWidth: 3,
                    pointRadius: 6,
                    showLine: false,
                    pointStyle: 'triangle'
                });
            }
        });

        this.smlChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Security Market Line') {
                                    return `SML: β=${context.parsed.x.toFixed(2)}, E(R)=${context.parsed.y.toFixed(2)}%`;
                                }
                                return `${context.dataset.label}: β=${context.parsed.x.toFixed(2)}, Return=${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Beta (β)'
                        },
                        min: Math.min(0, ...results.allAssets.map(a => a.beta)) - 0.2,
                        max: Math.max(1.5, ...results.allAssets.map(a => a.beta)) + 0.2
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Expected Return (%)'
                        },
                        min: Math.min(data.riskFreeRate - 1, ...results.allAssets.map(a => a.expectedReturn)) - 1
                    }
                }
            }
        });
    }

    displayBetaAnalysis(results, data) {
        this.betaAnalysisContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('betaChart').getContext('2d');
        
        // Destroy existing chart
        if (this.betaChart) {
            this.betaChart.destroy();
        }

        const labels = results.allAssets.map(asset => asset.name);
        const betas = results.allAssets.map(asset => asset.beta);
        const expectedReturns = results.allAssets.map(asset => asset.expectedReturn);

        this.betaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Beta',
                        data: betas,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Expected Return (%)',
                        data: expectedReturns,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Assets'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Beta'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Expected Return (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
    }

    displayRiskReturnAnalysis(results, data) {
        this.riskReturnContainer.classList.remove('hidden');
        
        const hasAlpha = results.additionalAssets.some(asset => asset.alpha !== null);
        
        document.getElementById('riskReturnContent').innerHTML = `
            <div class="space-y-6">
                <!-- Risk Categories -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <h5 class="font-medium text-green-800 dark:text-green-200 mb-2">Low Risk (β < 1)</h5>
                        <div class="space-y-1 text-sm">
                            ${results.allAssets.filter(a => a.beta < 1).map(asset => `
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">${asset.name}:</span>
                                    <span class="text-green-800 dark:text-green-200">${asset.beta.toFixed(2)}</span>
                                </div>
                            `).join('') || '<p class="text-green-600 dark:text-green-400 text-xs">No assets in this category</p>'}
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Market Risk (β ≈ 1)</h5>
                        <div class="space-y-1 text-sm">
                            ${results.allAssets.filter(a => a.beta >= 0.8 && a.beta <= 1.2).map(asset => `
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">${asset.name}:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${asset.beta.toFixed(2)}</span>
                                </div>
                            `).join('') || '<p class="text-blue-600 dark:text-blue-400 text-xs">No assets in this category</p>'}
                        </div>
                    </div>
                    
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                        <h5 class="font-medium text-red-800 dark:text-red-200 mb-2">High Risk (β > 1.2)</h5>
                        <div class="space-y-1 text-sm">
                            ${results.allAssets.filter(a => a.beta > 1.2).map(asset => `
                                <div class="flex justify-between">
                                    <span class="text-red-600 dark:text-red-400">${asset.name}:</span>
                                    <span class="text-red-800 dark:text-red-200">${asset.beta.toFixed(2)}</span>
                                </div>
                            `).join('') || '<p class="text-red-600 dark:text-red-400 text-xs">No assets in this category</p>'}
                        </div>
                    </div>
                </div>

                ${hasAlpha ? `
                <!-- Alpha Analysis -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Alpha Analysis (Risk-Adjusted Performance)</h5>
                    <div class="space-y-2">
                        ${results.additionalAssets.filter(a => a.alpha !== null).map(asset => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700 dark:text-gray-300">${asset.name}</span>
                                <div class="text-right">
                                    <span class="font-medium ${asset.alpha > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                        α = ${asset.alpha.toFixed(2)}%
                                    </span>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">
                                        ${asset.alpha > 0 ? 'Outperforming' : 'Underperforming'} by ${Math.abs(asset.alpha).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        Positive alpha indicates the asset generated returns above what CAPM predicted for its level of risk.
                    </p>
                </div>
                ` : ''}

                <!-- Portfolio Implications -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <h5 class="font-medium text-purple-800 dark:text-purple-200 mb-3">Portfolio Construction Insights</h5>
                    <div class="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>
                                <strong>Diversification:</strong> Combine assets with different betas to achieve desired portfolio risk level
                            </span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>
                                <strong>Risk Management:</strong> High-beta assets should comprise smaller portfolio portions
                            </span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>
                                <strong>Market Timing:</strong> Consider adjusting beta exposure based on market outlook
                            </span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>
                                <strong>Risk Budget:</strong> Allocate risk budget efficiently across different beta exposures
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility functions
    parseReturns(inputString) {
        if (!inputString || !inputString.trim()) return [];
        
        return inputString.split(',')
            .map(s => parseFloat(s.trim()))
            .filter(n => !isNaN(n));
    }

    calculateBeta(assetReturns, marketReturns) {
        const n = assetReturns.length;
        const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n;
        const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;
        
        let covariance = 0;
        let marketVariance = 0;
        
        for (let i = 0; i < n; i++) {
            const assetDev = assetReturns[i] - assetMean;
            const marketDev = marketReturns[i] - marketMean;
            covariance += assetDev * marketDev;
            marketVariance += marketDev * marketDev;
        }
        
        covariance /= (n - 1);
        marketVariance /= (n - 1);
        
        return marketVariance === 0 ? 0 : covariance / marketVariance;
    }

    calculateCorrelation(assetReturns, marketReturns) {
        const n = assetReturns.length;
        const assetMean = assetReturns.reduce((sum, r) => sum + r, 0) / n;
        const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n;
        
        let covariance = 0;
        let assetVariance = 0;
        let marketVariance = 0;
        
        for (let i = 0; i < n; i++) {
            const assetDev = assetReturns[i] - assetMean;
            const marketDev = marketReturns[i] - marketMean;
            covariance += assetDev * marketDev;
            assetVariance += assetDev * assetDev;
            marketVariance += marketDev * marketDev;
        }
        
        const assetStdDev = Math.sqrt(assetVariance / (n - 1));
        const marketStdDev = Math.sqrt(marketVariance / (n - 1));
        
        return (assetStdDev === 0 || marketStdDev === 0) ? 0 : 
               (covariance / (n - 1)) / (assetStdDev * marketStdDev);
    }

    getBetaInterpretation(beta) {
        if (beta < 0) {
            return `This asset moves opposite to the market. When the market goes up, this asset typically goes down.`;
        } else if (beta < 0.5) {
            return `This is a very defensive asset with low sensitivity to market movements. It's considered low-risk.`;
        } else if (beta < 0.8) {
            return `This asset is less volatile than the market and considered defensive. Good for conservative portfolios.`;
        } else if (beta < 1.2) {
            return `This asset moves roughly in line with the market. It has average systematic risk.`;
        } else if (beta < 1.5) {
            return `This asset is more volatile than the market and amplifies market movements. Higher risk, higher potential return.`;
        } else {
            return `This is a highly volatile asset that significantly amplifies market movements. Very high risk.`;
        }
    }

    getRiskFreeSourceName(source) {
        const names = {
            '10-year-treasury': '10-Year Treasury',
            '3-month-treasury': '3-Month Treasury',
            'fed-funds': 'Fed Funds Rate',
            'custom': 'Custom Rate'
        };
        return names[source] || source;
    }

    getMarketBenchmarkName(benchmark) {
        const names = {
            'sp500': 'S&P 500',
            'nasdaq': 'NASDAQ Composite',
            'russell2000': 'Russell 2000',
            'total-market': 'Total Stock Market',
            'custom': 'Custom Index'
        };
        return names[benchmark] || benchmark;
    }

    showBetaCalculationError(message) {
        const resultDiv = document.getElementById('betaCalculationResult');
        resultDiv.innerHTML = `
            <div class="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                <p class="text-sm text-red-800 dark:text-red-200">
                    ⚠️ ${message}
                </p>
            </div>
        `;
        resultDiv.classList.remove('hidden');
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('border-red-500', 'dark:border-red-400');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-600 dark:text-red-400 text-sm mt-1';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500', 'dark:border-red-400');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CAPMCalculator();
});
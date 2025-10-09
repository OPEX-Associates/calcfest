// Portfolio Allocation Calculator
class PortfolioAllocationCalculator {
    constructor() {
        this.form = document.getElementById('portfolioForm');
        this.resultsContainer = document.getElementById('portfolioResults');
        this.chartContainer = document.getElementById('chartContainer');
        this.efficientFrontierContainer = document.getElementById('efficientFrontierContainer');
        this.riskAnalysisContainer = document.getElementById('riskAnalysisContainer');
        this.assetDetailsContainer = document.getElementById('assetDetailsContainer');
        
        this.allocationChart = null;
        this.efficientFrontierChart = null;
        this.isPieChart = true;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Setup custom allocation toggle
        this.setupCustomAllocationToggle();
        
        // Setup chart type toggle
        this.setupChartToggles();
        
        // Format inputs
        this.setupInputFormatting();
    }

    setupCustomAllocationToggle() {
        const checkbox = document.getElementById('useCustomAllocation');
        const customInputs = document.getElementById('customAllocationInputs');
        const stockInput = document.getElementById('customStockAllocation');
        const bondInput = document.getElementById('customBondAllocation');
        const warning = document.getElementById('allocationWarning');

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                customInputs.classList.remove('hidden');
            } else {
                customInputs.classList.add('hidden');
                warning.classList.add('hidden');
            }
        });

        // Validate allocation totals
        const validateAllocation = () => {
            if (checkbox.checked) {
                const stockPct = parseFloat(stockInput.value) || 0;
                const bondPct = parseFloat(bondInput.value) || 0;
                const total = stockPct + bondPct;
                
                if (Math.abs(total - 100) > 0.1) {
                    warning.classList.remove('hidden');
                    warning.innerHTML = `
                        <p class="text-sm text-red-800 dark:text-red-200">
                            ⚠️ Total allocation is ${total.toFixed(1)}%. Must equal 100%.
                        </p>
                    `;
                } else {
                    warning.classList.add('hidden');
                }
            }
        };

        stockInput.addEventListener('input', () => {
            const stockPct = parseFloat(stockInput.value) || 0;
            bondInput.value = (100 - stockPct).toFixed(0);
            validateAllocation();
        });

        bondInput.addEventListener('input', () => {
            const bondPct = parseFloat(bondInput.value) || 0;
            stockInput.value = (100 - bondPct).toFixed(0);
            validateAllocation();
        });
    }

    setupChartToggles() {
        const pieBtn = document.getElementById('pieChartBtn');
        const donutBtn = document.getElementById('donutChartBtn');

        pieBtn.addEventListener('click', () => {
            this.isPieChart = true;
            this.updateChartToggle();
            this.updateAllocationChart();
        });

        donutBtn.addEventListener('click', () => {
            this.isPieChart = false;
            this.updateChartToggle();
            this.updateAllocationChart();
        });
    }

    updateChartToggle() {
        const pieBtn = document.getElementById('pieChartBtn');
        const donutBtn = document.getElementById('donutChartBtn');
        
        const activeClasses = 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700';
        const inactiveClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';

        if (this.isPieChart) {
            pieBtn.className = `px-3 py-1 text-sm rounded ${activeClasses}`;
            donutBtn.className = `px-3 py-1 text-sm rounded ${inactiveClasses}`;
        } else {
            pieBtn.className = `px-3 py-1 text-sm rounded ${inactiveClasses}`;
            donutBtn.className = `px-3 py-1 text-sm rounded ${activeClasses}`;
        }
    }

    setupInputFormatting() {
        // Currency input
        const amountInput = document.getElementById('investmentAmount');
        amountInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^\d.]/g, '');
            if (value) {
                e.target.value = this.formatNumber(value);
            }
        });

        amountInput.addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = this.formatCurrency(this.parseNumber(e.target.value));
            }
        });

        amountInput.addEventListener('focus', (e) => {
            e.target.value = this.parseNumber(e.target.value).toString();
        });

        // Age inputs
        const ageInputs = ['currentAge', 'targetAge'];
        ageInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d]/g, '');
            });
        });
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculatePortfolio();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculatePortfolio();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['currentAge', 'targetAge', 'investmentAmount'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = fieldName === 'investmentAmount' ? 
                this.parseNumber(field.value) : parseInt(field.value);

            if (!value || value <= 0) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate age logic
        const currentAge = parseInt(document.getElementById('currentAge').value);
        const targetAge = parseInt(document.getElementById('targetAge').value);
        
        if (currentAge >= targetAge) {
            if (showErrors) {
                this.showFieldError(document.getElementById('targetAge'), 'Target age must be greater than current age');
            }
            isValid = false;
        }

        // Validate custom allocation if enabled
        const useCustom = document.getElementById('useCustomAllocation').checked;
        if (useCustom) {
            const stockPct = parseFloat(document.getElementById('customStockAllocation').value) || 0;
            const bondPct = parseFloat(document.getElementById('customBondAllocation').value) || 0;
            
            if (Math.abs(stockPct + bondPct - 100) > 0.1) {
                if (showErrors) {
                    this.showFieldError(document.getElementById('customStockAllocation'), 'Allocations must total 100%');
                }
                isValid = false;
            }
        }

        return isValid;
    }

    calculatePortfolio() {
        const data = this.getFormData();
        const allocation = this.calculateOptimalAllocation(data);
        const riskMetrics = this.calculateRiskMetrics(allocation, data);
        const efficientFrontier = this.calculateEfficientFrontier(data);
        
        this.displayResults(allocation, riskMetrics, data);
        this.displayAllocationChart(allocation, data);
        this.displayEfficientFrontier(efficientFrontier, allocation);
        this.displayRiskAnalysis(riskMetrics, data);
        this.displayAssetDetails(allocation, data);
    }

    getFormData() {
        return {
            currentAge: parseInt(document.getElementById('currentAge').value) || 0,
            targetAge: parseInt(document.getElementById('targetAge').value) || 0,
            investmentAmount: this.parseNumber(document.getElementById('investmentAmount').value) || 0,
            riskTolerance: document.getElementById('riskTolerance').value,
            timeHorizon: document.getElementById('timeHorizon').value,
            investmentGoal: document.getElementById('investmentGoal').value,
            expectedStockReturn: parseFloat(document.getElementById('expectedStockReturn').value) || 8.0,
            expectedBondReturn: parseFloat(document.getElementById('expectedBondReturn').value) || 4.0,
            stockVolatility: parseFloat(document.getElementById('stockVolatility').value) || 15.0,
            bondVolatility: parseFloat(document.getElementById('bondVolatility').value) || 5.0,
            correlation: parseFloat(document.getElementById('correlation').value) || 0.1,
            useCustomAllocation: document.getElementById('useCustomAllocation').checked,
            customStockAllocation: parseFloat(document.getElementById('customStockAllocation').value) || 60,
            customBondAllocation: parseFloat(document.getElementById('customBondAllocation').value) || 40
        };
    }

    calculateOptimalAllocation(data) {
        if (data.useCustomAllocation) {
            return {
                stocks: data.customStockAllocation / 100,
                bonds: data.customBondAllocation / 100,
                isCustom: true
            };
        }

        // Calculate recommended allocation based on multiple factors
        let baseStockAllocation = 0.6; // Default 60/40

        // Age-based adjustment (rule of thumb: 100 - age = stock %)
        const yearsToRetirement = data.targetAge - data.currentAge;
        const ageBasedAllocation = Math.max(0.2, Math.min(0.9, (100 - data.currentAge) / 100));

        // Risk tolerance adjustment
        const riskAdjustments = {
            'conservative': -0.2,
            'moderate': 0,
            'aggressive': 0.2,
            'very-aggressive': 0.3
        };

        // Time horizon adjustment
        const timeAdjustments = {
            'short': -0.3,
            'medium': -0.1,
            'long': 0.1
        };

        // Goal adjustment
        const goalAdjustments = {
            'retirement': 0,
            'growth': 0.2,
            'income': -0.2,
            'preservation': -0.3,
            'education': yearsToRetirement > 10 ? 0.1 : -0.2
        };

        // Combine factors
        let stockAllocation = (ageBasedAllocation * 0.4) + (baseStockAllocation * 0.6);
        stockAllocation += riskAdjustments[data.riskTolerance] || 0;
        stockAllocation += timeAdjustments[data.timeHorizon] || 0;
        stockAllocation += goalAdjustments[data.investmentGoal] || 0;

        // Constrain to reasonable bounds
        stockAllocation = Math.max(0.1, Math.min(0.9, stockAllocation));
        const bondAllocation = 1 - stockAllocation;

        return {
            stocks: stockAllocation,
            bonds: bondAllocation,
            isCustom: false
        };
    }

    calculateRiskMetrics(allocation, data) {
        const stockReturn = data.expectedStockReturn / 100;
        const bondReturn = data.expectedBondReturn / 100;
        const stockVol = data.stockVolatility / 100;
        const bondVol = data.bondVolatility / 100;
        const correlation = data.correlation;

        // Portfolio expected return
        const expectedReturn = (allocation.stocks * stockReturn) + (allocation.bonds * bondReturn);

        // Portfolio volatility (standard deviation)
        const portfolioVariance = 
            Math.pow(allocation.stocks * stockVol, 2) +
            Math.pow(allocation.bonds * bondVol, 2) +
            2 * allocation.stocks * allocation.bonds * stockVol * bondVol * correlation;
        
        const portfolioVolatility = Math.sqrt(portfolioVariance);

        // Sharpe ratio (assuming 2% risk-free rate)
        const riskFreeRate = 0.02;
        const sharpeRatio = (expectedReturn - riskFreeRate) / portfolioVolatility;

        // Value at Risk (95% confidence, 1 year)
        const var95 = expectedReturn - (1.645 * portfolioVolatility);

        // Maximum drawdown estimate
        const maxDrawdown = portfolioVolatility * 2.5; // Rough estimate

        return {
            expectedReturn: expectedReturn * 100,
            volatility: portfolioVolatility * 100,
            sharpeRatio,
            var95: var95 * 100,
            maxDrawdown: maxDrawdown * 100,
            riskAdjustedReturn: expectedReturn / portfolioVolatility
        };
    }

    calculateEfficientFrontier(data) {
        const points = [];
        const stockReturn = data.expectedStockReturn / 100;
        const bondReturn = data.expectedBondReturn / 100;
        const stockVol = data.stockVolatility / 100;
        const bondVol = data.bondVolatility / 100;
        const correlation = data.correlation;

        // Generate efficient frontier points
        for (let stockWeight = 0; stockWeight <= 1; stockWeight += 0.05) {
            const bondWeight = 1 - stockWeight;
            
            const expectedReturn = (stockWeight * stockReturn) + (bondWeight * bondReturn);
            
            const portfolioVariance = 
                Math.pow(stockWeight * stockVol, 2) +
                Math.pow(bondWeight * bondVol, 2) +
                2 * stockWeight * bondWeight * stockVol * bondVol * correlation;
            
            const portfolioVolatility = Math.sqrt(portfolioVariance);
            
            points.push({
                risk: portfolioVolatility * 100,
                return: expectedReturn * 100,
                stockWeight: stockWeight * 100,
                bondWeight: bondWeight * 100
            });
        }

        return points;
    }

    displayResults(allocation, riskMetrics, data) {
        const stockAmount = allocation.stocks * data.investmentAmount;
        const bondAmount = allocation.bonds * data.investmentAmount;
        
        this.resultsContainer.innerHTML = `
            <!-- Portfolio Summary -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    ${allocation.isCustom ? 'Custom' : 'Recommended'} Portfolio Allocation
                </h4>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${(allocation.stocks * 100).toFixed(1)}%
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Stocks</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">
                            ${this.formatCurrency(stockAmount)}
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${(allocation.bonds * 100).toFixed(1)}%
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Bonds</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">
                            ${this.formatCurrency(bondAmount)}
                        </div>
                    </div>
                </div>
                
                ${!allocation.isCustom ? `
                <div class="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        This allocation is optimized for ${data.riskTolerance} risk tolerance with a ${data.timeHorizon}-term horizon.
                    </p>
                </div>
                ` : ''}
            </div>

            <!-- Expected Performance -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <h4 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">Expected Performance</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-green-700 dark:text-green-300">Annual Return</span>
                        <span class="font-semibold text-green-900 dark:text-green-100">${riskMetrics.expectedReturn.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-green-700 dark:text-green-300">Volatility (Risk)</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${riskMetrics.volatility.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-green-700 dark:text-green-300">Sharpe Ratio</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${riskMetrics.sharpeRatio.toFixed(2)}</span>
                    </div>
                    
                    <div class="border-t border-green-200 dark:border-green-700 pt-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-green-700 dark:text-green-300">Expected Value in ${data.targetAge - data.currentAge} Years</span>
                            <span class="font-bold text-green-900 dark:text-green-100">
                                ${this.formatCurrency(data.investmentAmount * Math.pow(1 + riskMetrics.expectedReturn / 100, data.targetAge - data.currentAge))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Risk Assessment -->
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h4 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Risk Assessment</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Risk Level</span>
                        <span class="font-semibold text-amber-900 dark:text-amber-100">${this.getRiskLevel(riskMetrics.volatility)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Value at Risk (95%)</span>
                        <span class="font-medium text-amber-800 dark:text-amber-200">${riskMetrics.var95.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Max Drawdown Est.</span>
                        <span class="font-medium text-amber-800 dark:text-amber-200">${riskMetrics.maxDrawdown.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <p class="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong> These are estimates based on historical patterns. Actual results may vary significantly.
                    </p>
                </div>
            </div>

            <!-- Rebalancing Recommendations -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Portfolio Management</h4>
                
                <div class="space-y-3">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Review allocation quarterly and rebalance when allocations drift more than 5% from targets
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Consider tax-loss harvesting opportunities in taxable accounts
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Gradually shift to more conservative allocations as you approach retirement
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Use dollar-cost averaging for regular contributions to reduce timing risk
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.resultsContainer.classList.remove('hidden');
    }

    displayAllocationChart(allocation, data) {
        this.chartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('allocationChart').getContext('2d');
        
        // Destroy existing chart
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }

        const stockAmount = allocation.stocks * data.investmentAmount;
        const bondAmount = allocation.bonds * data.investmentAmount;

        this.allocationChart = new Chart(ctx, {
            type: this.isPieChart ? 'pie' : 'doughnut',
            data: {
                labels: ['Stocks', 'Bonds'],
                datasets: [{
                    data: [stockAmount, bondAmount],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',   // Green for stocks
                        'rgba(59, 130, 246, 0.8)'   // Blue for bonds
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const percentage = ((context.parsed / data.investmentAmount) * 100).toFixed(1);
                                const amount = new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(context.parsed);
                                return `${context.label}: ${amount} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateAllocationChart() {
        if (this.allocationChart) {
            this.allocationChart.config.type = this.isPieChart ? 'pie' : 'doughnut';
            this.allocationChart.update();
        }
    }

    displayEfficientFrontier(frontierPoints, allocation) {
        this.efficientFrontierContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('efficientFrontierChart').getContext('2d');
        
        // Destroy existing chart
        if (this.efficientFrontierChart) {
            this.efficientFrontierChart.destroy();
        }

        const riskMetrics = this.calculateRiskMetrics(allocation, this.getFormData());

        this.efficientFrontierChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Efficient Frontier',
                        data: frontierPoints.map(point => ({x: point.risk, y: point.return})),
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Your Portfolio',
                        data: [{x: riskMetrics.volatility, y: riskMetrics.expectedReturn}],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 3,
                        pointRadius: 8,
                        showLine: false
                    }
                ]
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
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}% return, ${context.parsed.x.toFixed(2)}% risk`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Risk (Volatility %)'
                        },
                        min: 0
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Expected Return (%)'
                        }
                    }
                }
            }
        });
    }

    displayRiskAnalysis(riskMetrics, data) {
        this.riskAnalysisContainer.classList.remove('hidden');
        
        const riskLevel = this.getRiskLevel(riskMetrics.volatility);
        const riskColor = this.getRiskColor(riskLevel);
        
        document.getElementById('riskAnalysisContent').innerHTML = `
            <div class="space-y-4">
                <!-- Risk Level Indicator -->
                <div class="bg-${riskColor}-50 dark:bg-${riskColor}-900/20 rounded-lg p-4 border border-${riskColor}-200 dark:border-${riskColor}-700">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-${riskColor}-600 dark:text-${riskColor}-400 mb-2">
                            ${riskLevel}
                        </div>
                        <p class="text-sm text-${riskColor}-700 dark:text-${riskColor}-300">
                            Portfolio Risk Level
                        </p>
                    </div>
                </div>

                <!-- Risk Metrics Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 class="font-medium text-gray-900 dark:text-white mb-2">Volatility Analysis</h5>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Annual Volatility:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${riskMetrics.volatility.toFixed(2)}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">68% Range:</span>
                                <span class="font-medium text-gray-900 dark:text-white">
                                    ${(riskMetrics.expectedReturn - riskMetrics.volatility).toFixed(1)}% to ${(riskMetrics.expectedReturn + riskMetrics.volatility).toFixed(1)}%
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">95% Range:</span>
                                <span class="font-medium text-gray-900 dark:text-white">
                                    ${(riskMetrics.expectedReturn - 2 * riskMetrics.volatility).toFixed(1)}% to ${(riskMetrics.expectedReturn + 2 * riskMetrics.volatility).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 class="font-medium text-gray-900 dark:text-white mb-2">Risk-Adjusted Returns</h5>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Sharpe Ratio:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${riskMetrics.sharpeRatio.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Return per Unit Risk:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${riskMetrics.riskAdjustedReturn.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Quality Rating:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.getQualityRating(riskMetrics.sharpeRatio)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Risk Scenarios -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Scenario Analysis</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-green-600 dark:text-green-400 font-semibold">Optimistic (95%)</div>
                            <div class="text-gray-900 dark:text-white">
                                ${this.formatCurrency(data.investmentAmount * Math.pow(1 + (riskMetrics.expectedReturn + 2 * riskMetrics.volatility) / 100, data.targetAge - data.currentAge))}
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-blue-600 dark:text-blue-400 font-semibold">Expected (50%)</div>
                            <div class="text-gray-900 dark:text-white">
                                ${this.formatCurrency(data.investmentAmount * Math.pow(1 + riskMetrics.expectedReturn / 100, data.targetAge - data.currentAge))}
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-red-600 dark:text-red-400 font-semibold">Pessimistic (5%)</div>
                            <div class="text-gray-900 dark:text-white">
                                ${this.formatCurrency(Math.max(0, data.investmentAmount * Math.pow(1 + (riskMetrics.expectedReturn - 2 * riskMetrics.volatility) / 100, data.targetAge - data.currentAge)))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displayAssetDetails(allocation, data) {
        this.assetDetailsContainer.classList.remove('hidden');
        
        const stockAmount = allocation.stocks * data.investmentAmount;
        const bondAmount = allocation.bonds * data.investmentAmount;
        
        document.getElementById('assetDetailsContent').innerHTML = `
            <div class="space-y-6">
                <!-- Stock Allocation Details -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h5 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                        Stock Allocation: ${(allocation.stocks * 100).toFixed(1)}% (${this.formatCurrency(stockAmount)})
                    </h5>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h6 class="font-medium text-green-700 dark:text-green-300 mb-2">Recommended Breakdown</h6>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">US Large Cap:</span>
                                    <span class="text-green-800 dark:text-green-200">${(allocation.stocks * 0.4 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">US Mid/Small Cap:</span>
                                    <span class="text-green-800 dark:text-green-200">${(allocation.stocks * 0.3 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">International:</span>
                                    <span class="text-green-800 dark:text-green-200">${(allocation.stocks * 0.2 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">Emerging Markets:</span>
                                    <span class="text-green-800 dark:text-green-200">${(allocation.stocks * 0.1 * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h6 class="font-medium text-green-700 dark:text-green-300 mb-2">Dollar Amounts</h6>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">US Large Cap:</span>
                                    <span class="text-green-800 dark:text-green-200">${this.formatCurrency(stockAmount * 0.4)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">US Mid/Small Cap:</span>
                                    <span class="text-green-800 dark:text-green-200">${this.formatCurrency(stockAmount * 0.3)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">International:</span>
                                    <span class="text-green-800 dark:text-green-200">${this.formatCurrency(stockAmount * 0.2)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-green-600 dark:text-green-400">Emerging Markets:</span>
                                    <span class="text-green-800 dark:text-green-200">${this.formatCurrency(stockAmount * 0.1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bond Allocation Details -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h5 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                        Bond Allocation: ${(allocation.bonds * 100).toFixed(1)}% (${this.formatCurrency(bondAmount)})
                    </h5>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h6 class="font-medium text-blue-700 dark:text-blue-300 mb-2">Recommended Breakdown</h6>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">Intermediate Treasury:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${(allocation.bonds * 0.4 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">Corporate Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${(allocation.bonds * 0.3 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">International Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${(allocation.bonds * 0.2 * 100).toFixed(1)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">TIPS/I-Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${(allocation.bonds * 0.1 * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h6 class="font-medium text-blue-700 dark:text-blue-300 mb-2">Dollar Amounts</h6>
                            <div class="space-y-1 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">Intermediate Treasury:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(bondAmount * 0.4)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">Corporate Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(bondAmount * 0.3)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">International Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(bondAmount * 0.2)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-blue-600 dark:text-blue-400">TIPS/I-Bonds:</span>
                                    <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(bondAmount * 0.1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Implementation Tips -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Implementation Tips</h5>
                    <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>Consider low-cost index funds or ETFs for broad market exposure</span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>Use tax-advantaged accounts (401k, IRA) for bonds and REITs</span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>Keep taxable accounts for tax-efficient stock index funds</span>
                        </div>
                        <div class="flex items-start">
                            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-3 flex-shrink-0"></div>
                            <span>Rebalance quarterly or when allocations drift 5%+ from targets</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getRiskLevel(volatility) {
        if (volatility < 8) return 'Conservative';
        if (volatility < 12) return 'Moderate';
        if (volatility < 16) return 'Aggressive';
        return 'Very Aggressive';
    }

    getRiskColor(riskLevel) {
        const colors = {
            'Conservative': 'green',
            'Moderate': 'blue',
            'Aggressive': 'yellow',
            'Very Aggressive': 'red'
        };
        return colors[riskLevel] || 'gray';
    }

    getQualityRating(sharpeRatio) {
        if (sharpeRatio > 1.0) return 'Excellent';
        if (sharpeRatio > 0.5) return 'Good';
        if (sharpeRatio > 0.0) return 'Fair';
        return 'Poor';
    }

    // Utility functions
    parseNumber(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
    }

    formatNumber(value) {
        return parseFloat(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
    new PortfolioAllocationCalculator();
});
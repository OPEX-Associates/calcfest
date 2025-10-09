// Dividend Yield Calculator
class DividendYieldCalculator {
    constructor() {
        this.form = document.getElementById('dividendForm');
        this.resultsContainer = document.getElementById('dividendResults');
        this.growthChartContainer = document.getElementById('growthChartContainer');
        this.comparisonContainer = document.getElementById('comparisonContainer');
        this.incomeCalendarContainer = document.getElementById('incomeCalendarContainer');
        
        this.dividendChart = null;
        this.comparisonChart = null;
        this.showIncomeChart = true;
        this.stockCounter = 0;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Setup dividend type toggle
        this.setupDividendTypeToggle();
        
        // Setup historical data toggle
        this.setupHistoricalDataToggle();
        
        // Setup chart toggles
        this.setupChartToggles();
        
        // Setup additional stocks functionality
        this.setupAdditionalStocks();
        
        // Format inputs
        this.setupInputFormatting();
    }

    setupDividendTypeToggle() {
        const typeSelect = document.getElementById('dividendType');
        const dividendInputs = document.querySelectorAll('.dividend-input');

        typeSelect.addEventListener('change', () => {
            dividendInputs.forEach(input => input.classList.add('hidden'));
            
            const selectedType = typeSelect.value;
            const targetInput = document.getElementById(`${selectedType}Dividend`);
            if (targetInput) {
                targetInput.classList.remove('hidden');
            }
        });
    }

    setupHistoricalDataToggle() {
        const toggleBtn = document.getElementById('toggleHistoricalData');
        const section = document.getElementById('historicalDataSection');

        toggleBtn.addEventListener('click', () => {
            if (section.classList.contains('hidden')) {
                section.classList.remove('hidden');
                toggleBtn.textContent = 'Hide Historical Data';
            } else {
                section.classList.add('hidden');
                toggleBtn.textContent = 'Add Historical Data';
            }
        });
    }

    setupChartToggles() {
        const incomeBtn = document.getElementById('incomeChartBtn');
        const yieldBtn = document.getElementById('yieldChartBtn');

        incomeBtn.addEventListener('click', () => {
            this.showIncomeChart = true;
            this.updateChartToggle();
            this.updateDividendChart();
        });

        yieldBtn.addEventListener('click', () => {
            this.showIncomeChart = false;
            this.updateChartToggle();
            this.updateDividendChart();
        });
    }

    updateChartToggle() {
        const incomeBtn = document.getElementById('incomeChartBtn');
        const yieldBtn = document.getElementById('yieldChartBtn');
        
        const activeClasses = 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700';
        const inactiveClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';

        if (this.showIncomeChart) {
            incomeBtn.className = `px-3 py-1 text-sm rounded ${activeClasses}`;
            yieldBtn.className = `px-3 py-1 text-sm rounded ${inactiveClasses}`;
        } else {
            incomeBtn.className = `px-3 py-1 text-sm rounded ${inactiveClasses}`;
            yieldBtn.className = `px-3 py-1 text-sm rounded ${activeClasses}`;
        }
    }

    setupAdditionalStocks() {
        const addBtn = document.getElementById('addStockBtn');
        const container = document.getElementById('additionalStocks');
        
        addBtn.addEventListener('click', () => {
            this.stockCounter++;
            const stockDiv = document.createElement('div');
            stockDiv.className = 'grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg';
            stockDiv.id = `stock-${this.stockCounter}`;
            
            stockDiv.innerHTML = `
                <div>
                    <input type="text" placeholder="Symbol" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="symbol">
                </div>
                <div>
                    <input type="text" placeholder="Price ($)" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="price">
                </div>
                <div>
                    <input type="text" placeholder="Annual dividend ($)" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="dividend">
                </div>
                <div>
                    <input type="number" placeholder="Growth (%)" step="0.1" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="growth">
                </div>
                <div>
                    <button type="button" onclick="this.parentElement.parentElement.remove()" 
                        class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-2 rounded transition duration-200">
                        Remove
                    </button>
                </div>
            `;
            
            container.appendChild(stockDiv);
            
            // Add event listeners to new inputs
            const inputs = stockDiv.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.debounceCalculate());
            });
        });
    }

    setupInputFormatting() {
        // Currency inputs
        const currencyInputs = ['stockPrice', 'quarterlyAmount', 'monthlyAmount', 'semiAnnualAmount', 'annualAmount', 'specialAmount'];
        currencyInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d.]/g, '');
                    if (value) {
                        e.target.value = this.formatNumber(value);
                    }
                });

                input.addEventListener('blur', (e) => {
                    if (e.target.value) {
                        e.target.value = this.formatCurrency(this.parseNumber(e.target.value));
                    }
                });

                input.addEventListener('focus', (e) => {
                    e.target.value = this.parseNumber(e.target.value).toString();
                });
            }
        });

        // Number inputs
        const numberInputs = ['shares', 'projectionYears'];
        numberInputs.forEach(inputName => {
            const input = document.getElementById(inputName);
            if (input) {
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^\d]/g, '');
                });
            }
        });
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculateDividendYield();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateDividendYield();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['stockPrice', 'shares'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = this.parseNumber(field.value);

            if (!value || value <= 0) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate dividend amount based on type
        const dividendType = document.getElementById('dividendType').value;
        const dividendInput = document.getElementById(`${dividendType}Amount`);
        
        if (dividendInput) {
            const dividendValue = this.parseNumber(dividendInput.value);
            if (!dividendValue || dividendValue <= 0) {
                if (showErrors) {
                    this.showFieldError(dividendInput, 'Dividend amount is required');
                }
                isValid = false;
            }
        }

        return isValid;
    }

    calculateDividendYield() {
        const data = this.getFormData();
        const results = this.performCalculations(data);
        
        this.displayResults(results, data);
        this.displayDividendChart(results, data);
        this.displayComparisonChart(results, data);
        this.displayIncomeCalendar(results, data);
    }

    getFormData() {
        const dividendType = document.getElementById('dividendType').value;
        const dividendAmount = this.parseNumber(document.getElementById(`${dividendType}Amount`).value) || 0;
        
        const additionalStocks = this.getAdditionalStocks();
        const historicalDividends = this.parseHistoricalDividends();
        
        return {
            stockSymbol: document.getElementById('stockSymbol').value || 'Stock',
            stockPrice: this.parseNumber(document.getElementById('stockPrice').value) || 0,
            shares: parseInt(document.getElementById('shares').value) || 0,
            dividendType: dividendType,
            dividendAmount: dividendAmount,
            dividendGrowthRate: parseFloat(document.getElementById('dividendGrowthRate').value) || 0,
            projectionYears: parseInt(document.getElementById('projectionYears').value) || 10,
            reinvestDividends: document.getElementById('reinvestDividends').checked,
            historicalDividends: historicalDividends,
            additionalStocks: additionalStocks
        };
    }

    getAdditionalStocks() {
        const container = document.getElementById('additionalStocks');
        const stockDivs = container.querySelectorAll('[id^="stock-"]');
        const stocks = [];
        
        stockDivs.forEach(div => {
            const symbolInput = div.querySelector('[data-field="symbol"]');
            const priceInput = div.querySelector('[data-field="price"]');
            const dividendInput = div.querySelector('[data-field="dividend"]');
            const growthInput = div.querySelector('[data-field="growth"]');
            
            const symbol = symbolInput?.value?.trim();
            const price = this.parseNumber(priceInput?.value);
            const dividend = this.parseNumber(dividendInput?.value);
            const growth = parseFloat(growthInput?.value) || 0;
            
            if (symbol && price > 0 && dividend > 0) {
                stocks.push({
                    symbol,
                    price,
                    annualDividend: dividend,
                    growthRate: growth,
                    yield: (dividend / price) * 100
                });
            }
        });
        
        return stocks;
    }

    parseHistoricalDividends() {
        const input = document.getElementById('historicalDividends').value;
        if (!input || !input.trim()) return [];
        
        return input.split(',')
            .map(s => parseFloat(s.trim()))
            .filter(n => !isNaN(n) && n > 0);
    }

    performCalculations(data) {
        // Calculate annual dividend based on type
        let annualDividend = 0;
        switch (data.dividendType) {
            case 'quarterly':
                annualDividend = data.dividendAmount * 4;
                break;
            case 'monthly':
                annualDividend = data.dividendAmount * 12;
                break;
            case 'semi-annual':
                annualDividend = data.dividendAmount * 2;
                break;
            case 'annual':
                annualDividend = data.dividendAmount;
                break;
            case 'special':
                annualDividend = data.dividendAmount; // One-time payment
                break;
        }

        // Basic dividend metrics
        const dividendYield = (annualDividend / data.stockPrice) * 100;
        const annualIncome = annualDividend * data.shares;
        const totalInvestment = data.stockPrice * data.shares;

        // Historical analysis
        let historicalGrowthRate = null;
        let averageYield = null;
        if (data.historicalDividends.length >= 2) {
            historicalGrowthRate = this.calculateCAGR(
                data.historicalDividends[0],
                data.historicalDividends[data.historicalDividends.length - 1],
                data.historicalDividends.length - 1
            );
            averageYield = data.historicalDividends.reduce((sum, div) => sum + div, 0) / data.historicalDividends.length;
        }

        // Projection calculations
        const projections = this.calculateProjections(data, annualDividend);
        
        // Dividend frequency details
        const paymentSchedule = this.getPaymentSchedule(data.dividendType, data.dividendAmount, data.shares);

        // Quality metrics
        const qualityMetrics = this.calculateQualityMetrics(dividendYield, data.dividendGrowthRate, historicalGrowthRate);

        return {
            annualDividend,
            dividendYield,
            annualIncome,
            totalInvestment,
            historicalGrowthRate,
            averageYield,
            projections,
            paymentSchedule,
            qualityMetrics,
            yieldOnCost: dividendYield // Initial yield on cost
        };
    }

    calculateCAGR(startValue, endValue, years) {
        return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    }

    calculateProjections(data, currentAnnualDividend) {
        const projections = [];
        let currentDividend = currentAnnualDividend;
        let totalShares = data.shares;
        let cumulativeIncome = 0;
        
        for (let year = 1; year <= data.projectionYears; year++) {
            // Grow dividend
            currentDividend *= (1 + data.dividendGrowthRate / 100);
            
            // Calculate income for this year
            const yearlyIncome = currentDividend * totalShares;
            cumulativeIncome += yearlyIncome;
            
            // If reinvesting dividends
            if (data.reinvestDividends) {
                // Assume stock price grows at same rate as dividends
                const projectedStockPrice = data.stockPrice * Math.pow(1 + data.dividendGrowthRate / 100, year);
                const additionalShares = yearlyIncome / projectedStockPrice;
                totalShares += additionalShares;
            }
            
            // Yield on original cost
            const yieldOnCost = (currentDividend / data.stockPrice) * 100;
            
            projections.push({
                year: year,
                dividend: currentDividend,
                shares: totalShares,
                annualIncome: yearlyIncome,
                cumulativeIncome: cumulativeIncome,
                yieldOnCost: yieldOnCost,
                totalValue: totalShares * data.stockPrice * Math.pow(1 + data.dividendGrowthRate / 100, year)
            });
        }
        
        return projections;
    }

    getPaymentSchedule(dividendType, amount, shares) {
        const totalPerPayment = amount * shares;
        
        switch (dividendType) {
            case 'quarterly':
                return {
                    frequency: 'Quarterly',
                    paymentsPerYear: 4,
                    amountPerPayment: totalPerPayment,
                    nextPayments: ['Q1', 'Q2', 'Q3', 'Q4']
                };
            case 'monthly':
                return {
                    frequency: 'Monthly',
                    paymentsPerYear: 12,
                    amountPerPayment: totalPerPayment,
                    nextPayments: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                };
            case 'semi-annual':
                return {
                    frequency: 'Semi-Annual',
                    paymentsPerYear: 2,
                    amountPerPayment: totalPerPayment,
                    nextPayments: ['H1', 'H2']
                };
            case 'annual':
                return {
                    frequency: 'Annual',
                    paymentsPerYear: 1,
                    amountPerPayment: totalPerPayment,
                    nextPayments: ['Annual']
                };
            case 'special':
                return {
                    frequency: 'Special',
                    paymentsPerYear: 0,
                    amountPerPayment: totalPerPayment,
                    nextPayments: ['One-time']
                };
        }
    }

    calculateQualityMetrics(yield, growthRate, historicalGrowthRate) {
        let yieldCategory = 'Low';
        if (yield >= 6) yieldCategory = 'High';
        else if (yield >= 3) yieldCategory = 'Medium';

        let growthCategory = 'Low';
        if (growthRate >= 10) growthCategory = 'High';
        else if (growthRate >= 5) growthCategory = 'Medium';

        let sustainability = 'Unknown';
        if (yield < 2) sustainability = 'Very Sustainable';
        else if (yield < 4) sustainability = 'Sustainable';
        else if (yield < 6) sustainability = 'Moderate Risk';
        else if (yield < 8) sustainability = 'Higher Risk';
        else sustainability = 'Potential Yield Trap';

        return {
            yieldCategory,
            growthCategory,
            sustainability,
            consistentGrowth: historicalGrowthRate !== null && historicalGrowthRate > 0,
            balanceScore: this.calculateBalanceScore(yield, growthRate)
        };
    }

    calculateBalanceScore(yield, growthRate) {
        // Balanced dividend stocks typically have yields between 2-6% and growth 3-8%
        const yieldScore = yield >= 2 && yield <= 6 ? 1 : 0;
        const growthScore = growthRate >= 3 && growthRate <= 8 ? 1 : 0;
        const totalScore = (yieldScore + growthScore) / 2;
        
        if (totalScore >= 1) return 'Excellent Balance';
        if (totalScore >= 0.5) return 'Good Balance';
        return 'Unbalanced';
    }

    displayResults(results, data) {
        const mainStock = {
            symbol: data.stockSymbol,
            yield: results.dividendYield,
            annualDividend: results.annualDividend,
            growthRate: data.dividendGrowthRate
        };

        this.resultsContainer.innerHTML = `
            <!-- Current Dividend Yield -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <h4 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                    ${data.stockSymbol} Dividend Analysis
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-600 dark:text-green-400">
                            ${results.dividendYield.toFixed(2)}%
                        </div>
                        <div class="text-sm text-green-700 dark:text-green-300">Current Yield</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                            ${this.formatCurrency(results.annualIncome)}
                        </div>
                        <div class="text-sm text-blue-700 dark:text-blue-300">Annual Income</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                            ${results.paymentSchedule.paymentsPerYear}x
                        </div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">${results.paymentSchedule.frequency}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-green-600 dark:text-green-400">Per Share Annual:</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${this.formatCurrency(results.annualDividend)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-green-600 dark:text-green-400">Per Payment:</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${this.formatCurrency(results.paymentSchedule.amountPerPayment)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-green-600 dark:text-green-400">Total Investment:</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${this.formatCurrency(results.totalInvestment)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-green-600 dark:text-green-400">Income Yield:</span>
                        <span class="font-medium text-green-800 dark:text-green-200">${((results.annualIncome / results.totalInvestment) * 100).toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <!-- Quality Assessment -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Dividend Quality Assessment</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Yield Category</span>
                            <span class="font-semibold text-purple-900 dark:text-purple-100">${results.qualityMetrics.yieldCategory}</span>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Growth Category</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.qualityMetrics.growthCategory}</span>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Sustainability</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.qualityMetrics.sustainability}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Balance Score</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.qualityMetrics.balanceScore}</span>
                        </div>
                        
                        ${results.historicalGrowthRate !== null ? `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Historical Growth</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.historicalGrowthRate.toFixed(2)}%</span>
                        </div>
                        ` : ''}
                        
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-purple-700 dark:text-purple-300">Projected Growth</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${data.dividendGrowthRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 p-3 ${this.getQualityColorClass(results.qualityMetrics.sustainability)} rounded-lg">
                    <p class="text-sm">
                        ${this.getQualityMessage(results.qualityMetrics, results.dividendYield)}
                    </p>
                </div>
            </div>

            <!-- Future Projections -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    ${data.projectionYears}-Year Projection
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${results.projections[results.projections.length - 1].yieldOnCost.toFixed(2)}%
                        </div>
                        <div class="text-sm text-blue-700 dark:text-blue-300">Yield on Cost</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${this.formatCurrency(results.projections[results.projections.length - 1].cumulativeIncome)}
                        </div>
                        <div class="text-sm text-green-700 dark:text-green-300">Total Income</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${this.formatCurrency(results.projections[results.projections.length - 1].annualIncome)}
                        </div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">Final Year Income</div>
                    </div>
                </div>
                
                ${data.reinvestDividends ? `
                <div class="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 mb-4">
                    <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-2">DRIP Benefits</h5>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex justify-between">
                            <span class="text-blue-700 dark:text-blue-300">Final Shares:</span>
                            <span class="font-medium text-blue-900 dark:text-blue-100">${results.projections[results.projections.length - 1].shares.toFixed(0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-blue-700 dark:text-blue-300">Additional Shares:</span>
                            <span class="font-medium text-blue-900 dark:text-blue-100">${(results.projections[results.projections.length - 1].shares - data.shares).toFixed(0)}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Total Return:</span>
                        <span class="font-semibold text-blue-800 dark:text-blue-200">
                            ${(((results.projections[results.projections.length - 1].cumulativeIncome + results.projections[results.projections.length - 1].totalValue) / results.totalInvestment - 1) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Annualized Return:</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">
                            ${(Math.pow((results.projections[results.projections.length - 1].cumulativeIncome + results.projections[results.projections.length - 1].totalValue) / results.totalInvestment, 1/data.projectionYears) - 1).toFixed(3) * 100}%
                        </span>
                    </div>
                </div>
            </div>

            ${data.additionalStocks.length > 0 ? `
            <!-- Stock Comparison -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dividend Stock Comparison</h4>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-600">
                                <th class="text-left py-2 text-gray-900 dark:text-white">Stock</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Price</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Dividend</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Yield</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Growth</th>
                                <th class="text-center py-2 text-gray-900 dark:text-white">Quality</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100 dark:border-gray-600 bg-primary-50 dark:bg-primary-900/20">
                                <td class="py-2 font-medium text-gray-900 dark:text-white">${mainStock.symbol}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(data.stockPrice)}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(mainStock.annualDividend)}</td>
                                <td class="py-2 text-right font-medium text-gray-900 dark:text-white">${mainStock.yield.toFixed(2)}%</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${mainStock.growthRate.toFixed(1)}%</td>
                                <td class="py-2 text-center">
                                    <span class="px-2 py-1 text-xs rounded-full ${this.getYieldBadgeClass(mainStock.yield)}">
                                        ${this.getYieldCategory(mainStock.yield)}
                                    </span>
                                </td>
                            </tr>
                            ${data.additionalStocks.map(stock => `
                                <tr class="border-b border-gray-100 dark:border-gray-600">
                                    <td class="py-2 font-medium text-gray-900 dark:text-white">${stock.symbol}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(stock.price)}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(stock.annualDividend)}</td>
                                    <td class="py-2 text-right font-medium text-gray-900 dark:text-white">${stock.yield.toFixed(2)}%</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${stock.growthRate.toFixed(1)}%</td>
                                    <td class="py-2 text-center">
                                        <span class="px-2 py-1 text-xs rounded-full ${this.getYieldBadgeClass(stock.yield)}">
                                            ${this.getYieldCategory(stock.yield)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <!-- Income Strategy -->
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h4 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Income Strategy Insights</h4>
                
                <div class="space-y-3 text-sm">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0"></div>
                        <span class="text-amber-700 dark:text-amber-300">
                            <strong>Tax Efficiency:</strong> ${results.dividendYield < 4 ? 'Most dividends likely qualify for favorable tax rates' : 'High yield may indicate higher tax burden - consider tax-advantaged accounts'}
                        </span>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0"></div>
                        <span class="text-amber-700 dark:text-amber-300">
                            <strong>Diversification:</strong> ${data.additionalStocks.length > 0 ? `You're comparing ${data.additionalStocks.length + 1} dividend stocks for better diversification` : 'Consider adding more dividend stocks to reduce concentration risk'}
                        </span>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0"></div>
                        <span class="text-amber-700 dark:text-amber-300">
                            <strong>Reinvestment:</strong> ${data.reinvestDividends ? 'DRIP strategy can significantly boost long-term returns through compounding' : 'Consider dividend reinvestment to maximize compound growth'}
                        </span>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0"></div>
                        <span class="text-amber-700 dark:text-amber-300">
                            <strong>Monitoring:</strong> Track payout ratios, earnings growth, and debt levels to ensure dividend sustainability
                        </span>
                    </div>
                </div>
            </div>
        `;

        this.resultsContainer.classList.remove('hidden');
    }

    displayDividendChart(results, data) {
        this.growthChartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('dividendChart').getContext('2d');
        
        // Destroy existing chart
        if (this.dividendChart) {
            this.dividendChart.destroy();
        }

        const labels = results.projections.map(p => `Year ${p.year}`);
        const incomeData = results.projections.map(p => p.annualIncome);
        const yieldData = results.projections.map(p => p.yieldOnCost);
        const cumulativeData = results.projections.map(p => p.cumulativeIncome);

        this.dividendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: this.showIncomeChart ? [
                    {
                        label: 'Annual Income',
                        data: incomeData,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cumulative Income',
                        data: cumulativeData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    }
                ] : [
                    {
                        label: 'Yield on Cost',
                        data: yieldData,
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label.includes('Income')) {
                                    return context.dataset.label + ': ' + 
                                           new Intl.NumberFormat('en-US', {
                                               style: 'currency',
                                               currency: 'USD',
                                               minimumFractionDigits: 0,
                                               maximumFractionDigits: 0
                                           }).format(context.parsed.y);
                                } else {
                                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                                }
                            }
                        }
                    }
                },
                scales: this.showIncomeChart ? {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Years'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Income ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                } : {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Years'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Yield on Cost (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateDividendChart() {
        if (this.dividendChart) {
            const results = this.lastCalculatedResults;
            if (!results) return;
            
            const incomeData = results.projections.map(p => p.annualIncome);
            const yieldData = results.projections.map(p => p.yieldOnCost);
            const cumulativeData = results.projections.map(p => p.cumulativeIncome);
            
            if (this.showIncomeChart) {
                this.dividendChart.data.datasets = [
                    {
                        label: 'Annual Income',
                        data: incomeData,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cumulative Income',
                        data: cumulativeData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    }
                ];
            } else {
                this.dividendChart.data.datasets = [
                    {
                        label: 'Yield on Cost',
                        data: yieldData,
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    }
                ];
            }
            
            this.dividendChart.update();
        }
    }

    displayComparisonChart(results, data) {
        if (data.additionalStocks.length === 0) {
            this.comparisonContainer.classList.add('hidden');
            return;
        }
        
        this.comparisonContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('comparisonChart').getContext('2d');
        
        // Destroy existing chart
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }

        const allStocks = [
            { symbol: data.stockSymbol, yield: results.dividendYield, growth: data.dividendGrowthRate },
            ...data.additionalStocks.map(stock => ({ symbol: stock.symbol, yield: stock.yield, growth: stock.growthRate }))
        ];

        this.comparisonChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Dividend Stocks',
                    data: allStocks.map(stock => ({x: stock.yield, y: stock.growth, label: stock.symbol})),
                    backgroundColor: allStocks.map((stock, index) => {
                        const colors = ['rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)', 'rgb(251, 191, 36)', 'rgb(236, 72, 153)'];
                        return colors[index % colors.length];
                    }),
                    borderColor: allStocks.map((stock, index) => {
                        const colors = ['rgb(239, 68, 68)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)', 'rgb(251, 191, 36)', 'rgb(236, 72, 153)'];
                        return colors[index % colors.length];
                    }),
                    borderWidth: 2,
                    pointRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const stock = allStocks[context.dataIndex];
                                return `${stock.symbol}: ${context.parsed.x.toFixed(2)}% yield, ${context.parsed.y.toFixed(1)}% growth`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Dividend Yield (%)'
                        },
                        min: 0
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Growth Rate (%)'
                        },
                        min: 0
                    }
                }
            }
        });
    }

    displayIncomeCalendar(results, data) {
        this.incomeCalendarContainer.classList.remove('hidden');
        
        const schedule = results.paymentSchedule;
        
        document.getElementById('incomeCalendarContent').innerHTML = `
            <div class="space-y-4">
                <!-- Payment Schedule Summary -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h5 class="font-medium text-green-800 dark:text-green-200 mb-3">Payment Schedule</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                                ${schedule.frequency}
                            </div>
                            <div class="text-green-700 dark:text-green-300">Frequency</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                                ${this.formatCurrency(schedule.amountPerPayment)}
                            </div>
                            <div class="text-green-700 dark:text-green-300">Per Payment</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                                ${schedule.paymentsPerYear}
                            </div>
                            <div class="text-green-700 dark:text-green-300">Payments/Year</div>
                        </div>
                    </div>
                </div>

                <!-- Monthly Breakdown -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Expected Payment Calendar</h5>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        ${schedule.nextPayments.map((period, index) => `
                            <div class="text-center p-2 bg-white dark:bg-gray-600 rounded border">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${period}</div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">
                                    ${this.formatCurrency(schedule.amountPerPayment)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Income Growth Timeline -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-3">5-Year Income Growth</h5>
                    <div class="space-y-2">
                        ${results.projections.slice(0, 5).map(projection => `
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-blue-700 dark:text-blue-300">Year ${projection.year}:</span>
                                <div class="text-right">
                                    <span class="font-medium text-blue-900 dark:text-blue-100">
                                        ${this.formatCurrency(projection.annualIncome)}
                                    </span>
                                    <span class="text-blue-600 dark:text-blue-400 ml-2">
                                        (${projection.yieldOnCost.toFixed(2)}% on cost)
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Store results for chart updates
        this.lastCalculatedResults = results;
    }

    // Utility functions
    getQualityColorClass(sustainability) {
        if (sustainability.includes('Very Sustainable') || sustainability.includes('Sustainable')) {
            return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
        } else if (sustainability.includes('Moderate')) {
            return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
        } else {
            return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
        }
    }

    getQualityMessage(metrics, yield) {
        if (metrics.sustainability.includes('Very Sustainable')) {
            return `Excellent dividend quality. Low yield with strong growth potential suggests a sustainable and growing income stream.`;
        } else if (metrics.sustainability.includes('Sustainable')) {
            return `Good dividend quality. Moderate yield with reasonable growth indicates a balanced income investment.`;
        } else if (metrics.sustainability.includes('Moderate')) {
            return `Moderate dividend quality. Monitor payout ratios and earnings growth to ensure sustainability.`;
        } else if (metrics.sustainability.includes('Potential Yield Trap')) {
            return `⚠️ High yield warning! This may be a yield trap - investigate if the dividend is sustainable given company fundamentals.`;
        } else {
            return `Higher risk dividend. Very high yields often indicate market concerns about dividend sustainability.`;
        }
    }

    getYieldCategory(yield) {
        if (yield >= 6) return 'High';
        if (yield >= 3) return 'Medium';
        return 'Low';
    }

    getYieldBadgeClass(yield) {
        if (yield >= 6) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
        if (yield >= 3) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    }

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
    new DividendYieldCalculator();
});
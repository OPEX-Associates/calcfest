// Stock Valuation Calculator
class StockValuationCalculator {
    constructor() {
        this.form = document.getElementById('valuationForm');
        this.resultsContainer = document.getElementById('valuationResults');
        this.methodsChartContainer = document.getElementById('methodsChartContainer');
        this.sensitivityContainer = document.getElementById('sensitivityContainer');
        this.dcfDetailsContainer = document.getElementById('dcfDetailsContainer');
        
        this.methodsChart = null;
        this.sensitivityChart = null;
        this.comparableCounter = 0;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Setup comparable companies functionality
        this.setupComparableCompanies();
        
        // Format inputs
        this.setupInputFormatting();
    }

    setupComparableCompanies() {
        const addBtn = document.getElementById('addComparableBtn');
        const container = document.getElementById('comparableCompanies');
        
        addBtn.addEventListener('click', () => {
            this.comparableCounter++;
            const companyDiv = document.createElement('div');
            companyDiv.className = 'grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg';
            companyDiv.id = `comparable-${this.comparableCounter}`;
            
            companyDiv.innerHTML = `
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
                    <input type="text" placeholder="EPS ($)" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="eps">
                </div>
                <div>
                    <input type="text" placeholder="Book Value ($)" 
                        class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
                        data-field="bookValue">
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
            
            container.appendChild(companyDiv);
            
            // Add event listeners to new inputs
            const inputs = companyDiv.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.debounceCalculate());
            });
        });
    }

    setupInputFormatting() {
        // Currency inputs
        const currencyInputs = ['currentPrice', 'eps', 'dividend', 'bookValue', 'revenue'];
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
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculateValuation();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateValuation();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['currentPrice', 'eps', 'discountRate'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = this.parseNumber(field.value);

            if (!value || value <= 0) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required and must be positive');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    calculateValuation() {
        const data = this.getFormData();
        const results = this.performValuationCalculations(data);
        
        this.displayResults(results, data);
        this.displayMethodsChart(results, data);
        this.displaySensitivityAnalysis(results, data);
        this.displayDCFDetails(results, data);
    }

    getFormData() {
        const comparableCompanies = this.getComparableCompanies();
        
        return {
            stockSymbol: document.getElementById('stockSymbol').value || 'Stock',
            currentPrice: this.parseNumber(document.getElementById('currentPrice').value) || 0,
            sector: document.getElementById('sector').value,
            eps: this.parseNumber(document.getElementById('eps').value) || 0,
            dividend: this.parseNumber(document.getElementById('dividend').value) || 0,
            bookValue: this.parseNumber(document.getElementById('bookValue').value) || 0,
            revenue: this.parseNumber(document.getElementById('revenue').value) || 0,
            revenueGrowth: parseFloat(document.getElementById('revenueGrowth').value) || 0,
            earningsGrowth: parseFloat(document.getElementById('earningsGrowth').value) || 0,
            dividendGrowth: parseFloat(document.getElementById('dividendGrowth').value) || 0,
            terminalGrowth: parseFloat(document.getElementById('terminalGrowth').value) || 0,
            discountRate: parseFloat(document.getElementById('discountRate').value) || 0,
            projectionYears: parseInt(document.getElementById('projectionYears').value) || 10,
            marginOfSafety: parseInt(document.getElementById('marginOfSafety').value) || 20,
            peRatio: parseFloat(document.getElementById('peRatio').value) || 15,
            comparableCompanies: comparableCompanies
        };
    }

    getComparableCompanies() {
        const container = document.getElementById('comparableCompanies');
        const companyDivs = container.querySelectorAll('[id^="comparable-"]');
        const companies = [];
        
        companyDivs.forEach(div => {
            const symbolInput = div.querySelector('[data-field="symbol"]');
            const priceInput = div.querySelector('[data-field="price"]');
            const epsInput = div.querySelector('[data-field="eps"]');
            const bookValueInput = div.querySelector('[data-field="bookValue"]');
            const growthInput = div.querySelector('[data-field="growth"]');
            
            const symbol = symbolInput?.value?.trim();
            const price = this.parseNumber(priceInput?.value);
            const eps = this.parseNumber(epsInput?.value);
            const bookValue = this.parseNumber(bookValueInput?.value);
            const growth = parseFloat(growthInput?.value) || 0;
            
            if (symbol && price > 0 && eps > 0) {
                companies.push({
                    symbol,
                    price,
                    eps,
                    bookValue,
                    growth,
                    pe: price / eps,
                    pb: bookValue > 0 ? price / bookValue : null
                });
            }
        });
        
        return companies;
    }

    performValuationCalculations(data) {
        // 1. DCF Valuation
        const dcfValue = this.calculateDCF(data);
        
        // 2. P/E Ratio Valuation
        const peValue = this.calculatePEValuation(data);
        
        // 3. Dividend Discount Model (if dividend exists)
        const ddmValue = data.dividend > 0 ? this.calculateDDM(data) : null;
        
        // 4. Book Value Multiples
        const pbValue = data.bookValue > 0 ? this.calculatePBValuation(data) : null;
        
        // 5. Revenue Multiples
        const psValue = data.revenue > 0 ? this.calculatePSValuation(data) : null;
        
        // 6. Comparable Company Analysis
        const comparableValue = data.comparableCompanies.length > 0 ? 
            this.calculateComparableValuation(data) : null;
        
        // Calculate average fair value (weighted)
        const values = [dcfValue, peValue, ddmValue, pbValue, psValue, comparableValue].filter(v => v !== null);
        const averageFairValue = values.length > 0 ? 
            values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        
        // Apply margin of safety
        const targetPrice = averageFairValue * (1 - data.marginOfSafety / 100);
        
        // Calculate upside/downside
        const upside = ((averageFairValue - data.currentPrice) / data.currentPrice) * 100;
        const recommendation = this.getRecommendation(data.currentPrice, averageFairValue, targetPrice);
        
        return {
            dcfValue,
            peValue,
            ddmValue,
            pbValue,
            psValue,
            comparableValue,
            averageFairValue,
            targetPrice,
            upside,
            recommendation,
            currentPE: data.currentPrice / data.eps,
            currentPB: data.bookValue > 0 ? data.currentPrice / data.bookValue : null,
            currentPS: data.revenue > 0 ? data.currentPrice / data.revenue : null,
            dividendYield: data.dividend > 0 ? (data.dividend / data.currentPrice) * 100 : null
        };
    }

    calculateDCF(data) {
        const projections = [];
        let currentEPS = data.eps;
        
        // Project future cash flows (using EPS as proxy for FCF per share)
        for (let year = 1; year <= data.projectionYears; year++) {
            currentEPS *= (1 + data.earningsGrowth / 100);
            const presentValue = currentEPS / Math.pow(1 + data.discountRate / 100, year);
            projections.push({
                year,
                futureEPS: currentEPS,
                presentValue
            });
        }
        
        // Terminal value
        const terminalEPS = currentEPS * (1 + data.terminalGrowth / 100);
        const terminalValue = terminalEPS / (data.discountRate / 100 - data.terminalGrowth / 100);
        const presentTerminalValue = terminalValue / Math.pow(1 + data.discountRate / 100, data.projectionYears);
        
        // Sum all present values
        const totalPresentValue = projections.reduce((sum, p) => sum + p.presentValue, 0) + presentTerminalValue;
        
        return {
            value: totalPresentValue,
            projections,
            terminalValue,
            presentTerminalValue
        };
    }

    calculatePEValuation(data) {
        // Project future EPS and apply target P/E ratio
        const futureEPS = data.eps * Math.pow(1 + data.earningsGrowth / 100, 3); // 3-year projection
        return futureEPS * data.peRatio;
    }

    calculateDDM(data) {
        // Gordon Growth Model: D1 / (r - g)
        const nextDividend = data.dividend * (1 + data.dividendGrowth / 100);
        return nextDividend / (data.discountRate / 100 - data.dividendGrowth / 100);
    }

    calculatePBValuation(data) {
        // Use sector-average P/B ratio (simplified to 2.0 for demo)
        const sectorPB = this.getSectorPB(data.sector);
        return data.bookValue * sectorPB;
    }

    calculatePSValuation(data) {
        // Use sector-average P/S ratio
        const sectorPS = this.getSectorPS(data.sector);
        return data.revenue * sectorPS;
    }

    calculateComparableValuation(data) {
        const comparables = data.comparableCompanies;
        if (comparables.length === 0) return null;
        
        // Calculate average P/E ratio of comparables
        const avgPE = comparables.reduce((sum, comp) => sum + comp.pe, 0) / comparables.length;
        
        // Apply to current company's EPS
        return data.eps * avgPE;
    }

    getSectorPB(sector) {
        const sectorPBRatios = {
            'technology': 3.5,
            'healthcare': 2.8,
            'financials': 1.2,
            'consumer-discretionary': 2.1,
            'industrials': 2.3,
            'utilities': 1.8,
            'energy': 1.5,
            'materials': 1.9,
            'real-estate': 2.2,
            'telecommunications': 1.6,
            'consumer-staples': 2.4
        };
        return sectorPBRatios[sector] || 2.0;
    }

    getSectorPS(sector) {
        const sectorPSRatios = {
            'technology': 8.0,
            'healthcare': 4.5,
            'financials': 2.0,
            'consumer-discretionary': 1.8,
            'industrials': 1.5,
            'utilities': 2.2,
            'energy': 1.0,
            'materials': 1.2,
            'real-estate': 5.0,
            'telecommunications': 1.8,
            'consumer-staples': 1.6
        };
        return sectorPSRatios[sector] || 2.0;
    }

    getRecommendation(currentPrice, fairValue, targetPrice) {
        const margin = ((fairValue - currentPrice) / currentPrice) * 100;
        
        if (currentPrice <= targetPrice) {
            return { rating: 'Strong Buy', color: 'green', reason: 'Trading below target price with margin of safety' };
        } else if (margin > 15) {
            return { rating: 'Buy', color: 'green', reason: 'Undervalued with significant upside potential' };
        } else if (margin > 5) {
            return { rating: 'Hold', color: 'yellow', reason: 'Fairly valued with modest upside' };
        } else if (margin > -10) {
            return { rating: 'Hold', color: 'yellow', reason: 'Trading near fair value' };
        } else {
            return { rating: 'Sell', color: 'red', reason: 'Overvalued with limited upside' };
        }
    }

    displayResults(results, data) {
        const validMethods = [];
        if (results.dcfValue) validMethods.push({name: 'DCF', value: results.dcfValue.value});
        if (results.peValue) validMethods.push({name: 'P/E', value: results.peValue});
        if (results.ddmValue) validMethods.push({name: 'DDM', value: results.ddmValue});
        if (results.pbValue) validMethods.push({name: 'P/B', value: results.pbValue});
        if (results.psValue) validMethods.push({name: 'P/S', value: results.psValue});
        if (results.comparableValue) validMethods.push({name: 'Comparable', value: results.comparableValue});

        this.resultsContainer.innerHTML = `
            <!-- Valuation Summary -->
            <div class="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                    ${data.stockSymbol} Valuation Summary
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${this.formatCurrency(data.currentPrice)}
                        </div>
                        <div class="text-sm text-blue-700 dark:text-blue-300">Current Price</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${this.formatCurrency(results.averageFairValue)}
                        </div>
                        <div class="text-sm text-green-700 dark:text-green-300">Fair Value</div>
                    </div>
                    
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${this.formatCurrency(results.targetPrice)}
                        </div>
                        <div class="text-sm text-purple-700 dark:text-purple-300">Target Price</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Upside/Downside:</span>
                        <span class="font-medium ${results.upside >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                            ${results.upside >= 0 ? '+' : ''}${results.upside.toFixed(1)}%
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Margin of Safety:</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">${data.marginOfSafety}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Current P/E:</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">${results.currentPE.toFixed(1)}x</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-blue-600 dark:text-blue-400">Valuation Methods:</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">${validMethods.length}</span>
                    </div>
                </div>
            </div>

            <!-- Investment Recommendation -->
            <div class="bg-${results.recommendation.color}-50 dark:bg-${results.recommendation.color}-900/20 rounded-lg p-6 border border-${results.recommendation.color}-200 dark:border-${results.recommendation.color}-700">
                <h4 class="text-lg font-semibold text-${results.recommendation.color}-800 dark:text-${results.recommendation.color}-200 mb-4">
                    Investment Recommendation
                </h4>
                
                <div class="text-center mb-4">
                    <div class="text-3xl font-bold text-${results.recommendation.color}-600 dark:text-${results.recommendation.color}-400">
                        ${results.recommendation.rating}
                    </div>
                    <p class="text-sm text-${results.recommendation.color}-700 dark:text-${results.recommendation.color}-300 mt-2">
                        ${results.recommendation.reason}
                    </p>
                </div>
                
                <div class="bg-${results.recommendation.color}-100 dark:bg-${results.recommendation.color}-900/30 rounded-lg p-3">
                    <p class="text-sm text-${results.recommendation.color}-800 dark:text-${results.recommendation.color}-200">
                        ${this.getDetailedRecommendation(results, data)}
                    </p>
                </div>
            </div>

            <!-- Valuation Methods Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valuation Methods</h4>
                
                <div class="space-y-3">
                    ${results.dcfValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Discounted Cash Flow (DCF)</span>
                        <span class="font-semibold text-gray-900 dark:text-white">${this.formatCurrency(results.dcfValue.value)}</span>
                    </div>
                    ` : ''}
                    
                    ${results.peValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">P/E Ratio Method</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${this.formatCurrency(results.peValue)}</span>
                    </div>
                    ` : ''}
                    
                    ${results.ddmValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Dividend Discount Model</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${this.formatCurrency(results.ddmValue)}</span>
                    </div>
                    ` : ''}
                    
                    ${results.pbValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Price-to-Book Method</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${this.formatCurrency(results.pbValue)}</span>
                    </div>
                    ` : ''}
                    
                    ${results.psValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Price-to-Sales Method</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${this.formatCurrency(results.psValue)}</span>
                    </div>
                    ` : ''}
                    
                    ${results.comparableValue ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Comparable Company Analysis</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${this.formatCurrency(results.comparableValue)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div class="flex justify-between items-center">
                            <span class="font-medium text-gray-900 dark:text-white">Average Fair Value</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${this.formatCurrency(results.averageFairValue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Key Ratios -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Key Financial Ratios</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">P/E Ratio:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.currentPE.toFixed(1)}x</span>
                        </div>
                        
                        ${results.currentPB ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">P/B Ratio:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.currentPB.toFixed(1)}x</span>
                        </div>
                        ` : ''}
                        
                        ${results.currentPS ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">P/S Ratio:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.currentPS.toFixed(1)}x</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="space-y-2">
                        ${results.dividendYield ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">Dividend Yield:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${results.dividendYield.toFixed(2)}%</span>
                        </div>
                        ` : ''}
                        
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">EPS Growth:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${data.earningsGrowth.toFixed(1)}%</span>
                        </div>
                        
                        <div class="flex justify-between text-sm">
                            <span class="text-purple-600 dark:text-purple-400">Discount Rate:</span>
                            <span class="font-medium text-purple-800 dark:text-purple-200">${data.discountRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            ${data.comparableCompanies.length > 0 ? `
            <!-- Comparable Analysis -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comparable Company Analysis</h4>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-600">
                                <th class="text-left py-2 text-gray-900 dark:text-white">Company</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Price</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">EPS</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">P/E</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">P/B</th>
                                <th class="text-right py-2 text-gray-900 dark:text-white">Growth</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100 dark:border-gray-600 bg-primary-50 dark:bg-primary-900/20">
                                <td class="py-2 font-medium text-gray-900 dark:text-white">${data.stockSymbol}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(data.currentPrice)}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(data.eps)}</td>
                                <td class="py-2 text-right font-medium text-gray-900 dark:text-white">${results.currentPE.toFixed(1)}x</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${results.currentPB ? results.currentPB.toFixed(1) + 'x' : 'N/A'}</td>
                                <td class="py-2 text-right text-gray-700 dark:text-gray-300">${data.earningsGrowth.toFixed(1)}%</td>
                            </tr>
                            ${data.comparableCompanies.map(comp => `
                                <tr class="border-b border-gray-100 dark:border-gray-600">
                                    <td class="py-2 font-medium text-gray-900 dark:text-white">${comp.symbol}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(comp.price)}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(comp.eps)}</td>
                                    <td class="py-2 text-right font-medium text-gray-900 dark:text-white">${comp.pe.toFixed(1)}x</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${comp.pb ? comp.pb.toFixed(1) + 'x' : 'N/A'}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${comp.growth.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Average P/E:</strong> ${(data.comparableCompanies.reduce((sum, comp) => sum + comp.pe, 0) / data.comparableCompanies.length).toFixed(1)}x</p>
                </div>
            </div>
            ` : ''}
        `;

        this.resultsContainer.classList.remove('hidden');
    }

    displayMethodsChart(results, data) {
        this.methodsChartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('methodsChart').getContext('2d');
        
        // Destroy existing chart
        if (this.methodsChart) {
            this.methodsChart.destroy();
        }

        const methods = [];
        const values = [];
        const colors = [];
        
        if (results.dcfValue) {
            methods.push('DCF');
            values.push(results.dcfValue.value);
            colors.push('rgba(59, 130, 246, 0.8)');
        }
        if (results.peValue) {
            methods.push('P/E');
            values.push(results.peValue);
            colors.push('rgba(34, 197, 94, 0.8)');
        }
        if (results.ddmValue) {
            methods.push('DDM');
            values.push(results.ddmValue);
            colors.push('rgba(168, 85, 247, 0.8)');
        }
        if (results.pbValue) {
            methods.push('P/B');
            values.push(results.pbValue);
            colors.push('rgba(251, 191, 36, 0.8)');
        }
        if (results.psValue) {
            methods.push('P/S');
            values.push(results.psValue);
            colors.push('rgba(236, 72, 153, 0.8)');
        }
        if (results.comparableValue) {
            methods.push('Comparable');
            values.push(results.comparableValue);
            colors.push('rgba(20, 184, 166, 0.8)');
        }
        
        // Add current price and average fair value as reference lines
        methods.push('Current Price');
        values.push(data.currentPrice);
        colors.push('rgba(239, 68, 68, 0.8)');
        
        methods.push('Average Fair Value');
        values.push(results.averageFairValue);
        colors.push('rgba(16, 185, 129, 0.8)');

        this.methodsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: methods,
                datasets: [{
                    label: 'Valuation ($)',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1
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
                                return context.dataset.label + ': ' + 
                                       new Intl.NumberFormat('en-US', {
                                           style: 'currency',
                                           currency: 'USD',
                                           minimumFractionDigits: 0,
                                           maximumFractionDigits: 0
                                       }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Price per Share ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    displaySensitivityAnalysis(results, data) {
        this.sensitivityContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('sensitivityChart').getContext('2d');
        
        // Destroy existing chart
        if (this.sensitivityChart) {
            this.sensitivityChart.destroy();
        }

        // Sensitivity analysis on discount rate and growth rate
        const sensitivityData = [];
        const discountRates = [];
        const growthRates = [];
        
        for (let discount = data.discountRate - 2; discount <= data.discountRate + 2; discount += 0.5) {
            discountRates.push(discount);
        }
        
        for (let growth = data.earningsGrowth - 2; growth <= data.earningsGrowth + 2; growth += 0.5) {
            growthRates.push(growth);
        }
        
        discountRates.forEach(discount => {
            growthRates.forEach(growth => {
                const sensitiveData = {...data, discountRate: discount, earningsGrowth: growth};
                const dcfResult = this.calculateDCF(sensitiveData);
                sensitivityData.push({
                    x: discount,
                    y: growth,
                    value: dcfResult.value
                });
            });
        });

        // Create contour-like visualization using scatter plot
        this.sensitivityChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'DCF Valuation',
                    data: sensitivityData.map(point => ({
                        x: point.x,
                        y: point.y,
                        v: point.value
                    })),
                    backgroundColor: sensitivityData.map(point => {
                        const intensity = Math.min(1, point.value / (data.currentPrice * 2));
                        return `rgba(34, 197, 94, ${intensity})`;
                    }),
                    borderColor: 'rgba(34, 197, 94, 1)',
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
                                const point = sensitivityData[context.dataIndex];
                                return `Discount: ${point.x.toFixed(1)}%, Growth: ${point.y.toFixed(1)}%, Value: ${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(point.value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Discount Rate (%)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Growth Rate (%)'
                        }
                    }
                }
            }
        });
    }

    displayDCFDetails(results, data) {
        if (!results.dcfValue) {
            this.dcfDetailsContainer.classList.add('hidden');
            return;
        }
        
        this.dcfDetailsContainer.classList.remove('hidden');
        
        document.getElementById('dcfDetailsContent').innerHTML = `
            <div class="space-y-6">
                <!-- DCF Assumptions -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-3">DCF Model Assumptions</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div class="space-y-1">
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Current EPS:</span>
                                <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(data.eps)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Growth Rate:</span>
                                <span class="text-blue-800 dark:text-blue-200">${data.earningsGrowth.toFixed(1)}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Discount Rate:</span>
                                <span class="text-blue-800 dark:text-blue-200">${data.discountRate.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Projection Years:</span>
                                <span class="text-blue-800 dark:text-blue-200">${data.projectionYears}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Terminal Growth:</span>
                                <span class="text-blue-800 dark:text-blue-200">${data.terminalGrowth.toFixed(1)}%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-blue-600 dark:text-blue-400">Terminal Value:</span>
                                <span class="text-blue-800 dark:text-blue-200">${this.formatCurrency(results.dcfValue.presentTerminalValue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Year-by-Year Projections -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Year-by-Year DCF Projections</h5>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-600">
                                    <th class="text-left py-2 text-gray-900 dark:text-white">Year</th>
                                    <th class="text-right py-2 text-gray-900 dark:text-white">Future EPS</th>
                                    <th class="text-right py-2 text-gray-900 dark:text-white">Discount Factor</th>
                                    <th class="text-right py-2 text-gray-900 dark:text-white">Present Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.dcfValue.projections.slice(0, 5).map(projection => `
                                    <tr class="border-b border-gray-100 dark:border-gray-600">
                                        <td class="py-2 text-gray-900 dark:text-white">${projection.year}</td>
                                        <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(projection.futureEPS)}</td>
                                        <td class="py-2 text-right text-gray-700 dark:text-gray-300">${(1 / Math.pow(1 + data.discountRate / 100, projection.year)).toFixed(3)}</td>
                                        <td class="py-2 text-right font-medium text-gray-900 dark:text-white">${this.formatCurrency(projection.presentValue)}</td>
                                    </tr>
                                `).join('')}
                                ${results.dcfValue.projections.length > 5 ? `
                                    <tr class="border-b border-gray-100 dark:border-gray-600">
                                        <td class="py-2 text-gray-500 dark:text-gray-400 italic" colspan="4">
                                            ... and ${results.dcfValue.projections.length - 5} more years
                                        </td>
                                    </tr>
                                ` : ''}
                                <tr class="border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                                    <td class="py-2 font-medium text-gray-900 dark:text-white">Terminal</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${this.formatCurrency(results.dcfValue.terminalValue)}</td>
                                    <td class="py-2 text-right text-gray-700 dark:text-gray-300">${(1 / Math.pow(1 + data.discountRate / 100, data.projectionYears)).toFixed(3)}</td>
                                    <td class="py-2 text-right font-bold text-green-600 dark:text-green-400">${this.formatCurrency(results.dcfValue.presentTerminalValue)}</td>
                                </tr>
                                <tr class="bg-blue-50 dark:bg-blue-900/20">
                                    <td class="py-2 font-bold text-gray-900 dark:text-white" colspan="3">Total Present Value</td>
                                    <td class="py-2 text-right font-bold text-blue-600 dark:text-blue-400">${this.formatCurrency(results.dcfValue.value)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- DCF Components -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <h6 class="font-medium text-green-800 dark:text-green-200 mb-2">Explicit Period</h6>
                        <div class="text-sm space-y-1">
                            <div class="flex justify-between">
                                <span class="text-green-600 dark:text-green-400">Years 1-${data.projectionYears}:</span>
                                <span class="text-green-800 dark:text-green-200">
                                    ${this.formatCurrency(results.dcfValue.projections.reduce((sum, p) => sum + p.presentValue, 0))}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-green-600 dark:text-green-400">% of Total Value:</span>
                                <span class="text-green-800 dark:text-green-200">
                                    ${((results.dcfValue.projections.reduce((sum, p) => sum + p.presentValue, 0) / results.dcfValue.value) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <h6 class="font-medium text-purple-800 dark:text-purple-200 mb-2">Terminal Value</h6>
                        <div class="text-sm space-y-1">
                            <div class="flex justify-between">
                                <span class="text-purple-600 dark:text-purple-400">Present Value:</span>
                                <span class="text-purple-800 dark:text-purple-200">${this.formatCurrency(results.dcfValue.presentTerminalValue)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-purple-600 dark:text-purple-400">% of Total Value:</span>
                                <span class="text-purple-800 dark:text-purple-200">
                                    ${((results.dcfValue.presentTerminalValue / results.dcfValue.value) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDetailedRecommendation(results, data) {
        const upside = results.upside;
        
        if (upside > 25) {
            return `Strong upside potential of ${upside.toFixed(1)}%. The stock appears significantly undervalued across multiple valuation methods. Consider this a high-conviction investment opportunity.`;
        } else if (upside > 15) {
            return `Attractive upside of ${upside.toFixed(1)}%. The stock shows good value with reasonable margin of safety. Suitable for value-oriented portfolios.`;
        } else if (upside > 5) {
            return `Modest upside of ${upside.toFixed(1)}%. The stock is trading close to fair value. Consider for income or defensive positioning.`;
        } else if (upside > -10) {
            return `Limited upside of ${upside.toFixed(1)}%. The stock appears fairly valued to slightly overvalued. Monitor for better entry points.`;
        } else {
            return `Significant downside risk with ${Math.abs(upside).toFixed(1)}% overvaluation. The current price appears unsupported by fundamentals. Consider avoiding or taking profits.`;
        }
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
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
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
    new StockValuationCalculator();
});
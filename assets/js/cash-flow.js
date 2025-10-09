// Property Cash Flow Calculator
class CashFlowCalculator {
    constructor() {
        this.form = document.getElementById('cashFlowForm');
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.calculateCashFlow(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateCashFlow(), 300)();
            });
        });

        // Additional inputs outside the main form
        const additionalInputs = document.querySelectorAll('#propertyTax, #insurance, #maintenance, #vacancy, #propertyManagement, #otherExpenses, #interestRate, #loanTerm');
        additionalInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateCashFlow(), 300)();
            });
        });
    }

    calculateCashFlow() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get property details with proper validation
            const purchasePrice = this.parseAndValidateNumber(document.getElementById('purchasePrice').value, 'Purchase Price', 1000, 100000000);
            const downPayment = this.parseAndValidateNumber(document.getElementById('downPayment').value, 'Down Payment', 0, 99999999);
            const closingCosts = this.parseAndValidateNumber(document.getElementById('closingCosts').value, 'Closing Costs', 0, 9999999);
            const rehabCosts = this.parseAndValidateNumber(document.getElementById('rehabCosts').value, 'Rehab Costs', 0, 9999999);
            const afterRepairValue = this.parseAndValidateNumber(document.getElementById('afterRepairValue').value, 'After Repair Value', 0, 100000000);
            const monthlyRent = this.parseAndValidateNumber(document.getElementById('monthlyRent').value, 'Monthly Rent', 1, 999999);

            // Get financing details
            const interestRate = this.parseAndValidateNumber(document.getElementById('interestRate').value, 'Interest Rate', 0, 50);
            const loanTerm = this.parseAndValidateNumber(document.getElementById('loanTerm').value, 'Loan Term', 1, 50);

            // Get operating expenses
            const propertyTax = this.parseAndValidateNumber(document.getElementById('propertyTax').value, 'Property Tax', 0, 99999);
            const insurance = this.parseAndValidateNumber(document.getElementById('insurance').value, 'Insurance', 0, 99999);
            const maintenance = this.parseAndValidateNumber(document.getElementById('maintenance').value, 'Maintenance', 0, 99999);
            const vacancy = this.parseAndValidateNumber(document.getElementById('vacancy').value, 'Vacancy', 0, 99999);
            const propertyManagement = this.parseAndValidateNumber(document.getElementById('propertyManagement').value, 'Property Management', 0, 99999);
            const otherExpenses = this.parseAndValidateNumber(document.getElementById('otherExpenses').value, 'Other Expenses', 0, 99999);

            // Check for validation errors - only required fields
            if (purchasePrice === null || monthlyRent === null) {
                this.displayError('Please enter valid values for Purchase Price and Monthly Rent.');
                return;
            }

            if (downPayment === null || interestRate === null || loanTerm === null) {
                this.displayError('Please enter valid values for Down Payment, Interest Rate, and Loan Term.');
                return;
            }

            // Additional business logic validation
            if ((downPayment || 0) >= purchasePrice) {
                this.displayError('Down payment cannot be greater than or equal to the purchase price.');
                return;
            }

            // Calculate loan details
            const loanAmount = purchasePrice - (downPayment || 0);
            let monthlyMortgagePayment = 0;
            
            if (loanAmount > 0) {
                try {
                    monthlyMortgagePayment = FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
                } catch (error) {
                    this.displayError('Unable to calculate mortgage payment. Please check your loan parameters.');
                    return;
                }
            }

            // Calculate total cash invested
            const totalCashInvested = (downPayment || 0) + (closingCosts || 0) + (rehabCosts || 0);

            // Calculate monthly operating expenses
            const totalMonthlyExpenses = (propertyTax || 0) + (insurance || 0) + (maintenance || 0) + (vacancy || 0) + (propertyManagement || 0) + (otherExpenses || 0);

            // Calculate net operating income (NOI)
            const monthlyNOI = monthlyRent - totalMonthlyExpenses;
            const annualNOI = monthlyNOI * 12;

            // Calculate cash flow
            const monthlyCashFlow = monthlyNOI - monthlyMortgagePayment;
            const annualCashFlow = monthlyCashFlow * 12;

            // Calculate investment metrics
            const capRate = this.calculateCapRate(annualNOI, (afterRepairValue || 0) || purchasePrice);
            const cashOnCashReturn = totalCashInvested > 0 ? 
                FinancialCalculations.calculateCashOnCashReturn(annualCashFlow, totalCashInvested) : 0;
            const grm = FinancialCalculations.calculateGRM(purchasePrice, monthlyRent);
            const onePercentRule = (monthlyRent / purchasePrice) * 100;

            // Calculate instant equity
            const instantEquity = Math.max(0, ((afterRepairValue || 0) || purchasePrice) - purchasePrice - (rehabCosts || 0));

            // Update display
            this.updateResults({
                monthlyCashFlow: monthlyCashFlow,
                annualCashFlow: annualCashFlow,
                capRate: capRate,
                cashOnCashReturn: cashOnCashReturn,
                grm: grm,
                onePercentRule: onePercentRule,
                totalIncome: monthlyRent,
                mortgagePayment: monthlyMortgagePayment,
                totalExpenses: totalMonthlyExpenses,
                totalCashInvested: totalCashInvested,
                loanAmount: loanAmount,
                instantEquity: instantEquity
            });

            // Update URL parameters
            this.updateURL({
                price: purchasePrice,
                down: downPayment,
                closing: closingCosts,
                rehab: rehabCosts,
                arv: afterRepairValue,
                rent: monthlyRent,
                rate: interestRate,
                term: loanTerm
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating cash flow. Please verify all input values are valid numbers.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values
        if (!value || value.trim() === '') {
            return 0; // Return 0 for optional fields
        }

        // Remove commas and other formatting
        const cleanValue = value.toString().replace(/[,$%\s]/g, '');

        // Parse the number
        const num = parseFloat(cleanValue);

        // Check if it's a valid number
        if (isNaN(num)) {
            return null;
        }

        // Check range
        if (num < min || num > max) {
            return null;
        }

        return num;
    }

    clearResultsError() {
        const resultsContainer = document.getElementById('results');
        // Check if results container contains an error message
        const errorMessage = resultsContainer.querySelector('.bg-red-50, .bg-red-900');
        if (errorMessage) {
            // Clear the error and restore default structure
            this.restoreResultsStructure();
            return true;
        }
        return false;
    }

    restoreResultsStructure() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <!-- Cash Flow Summary -->
            <div class="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-gray-700 dark:to-gray-600 border border-accent-200 dark:border-gray-600 rounded-xl p-6 text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Monthly Cash Flow</h3>
                <p id="monthlyCashFlow" class="text-4xl font-bold text-accent-600 dark:text-accent-400">$575</p>
            </div>

            <!-- Key Metrics -->
            <div class="space-y-4">
                <h4 class="font-semibold text-gray-900 dark:text-white">Key Investment Metrics</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Cap Rate</span>
                        <span id="capRate" class="font-bold text-lg text-primary-600 dark:text-primary-400">8.5%</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Cash-on-Cash Return</span>
                        <span id="cashOnCashReturn" class="font-bold text-lg text-primary-600 dark:text-primary-400">8.2%</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Gross Rent Multiplier</span>
                        <span id="grm" class="font-bold text-lg text-gray-900 dark:text-white">10.0</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">1% Rule</span>
                        <span id="onePercentRule" class="font-bold text-lg text-gray-900 dark:text-white">0.83%</span>
                    </div>
                </div>
            </div>

            <!-- Monthly Breakdown -->
            <div class="space-y-4">
                <h4 class="font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h4>
                
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-green-600 dark:text-green-400">+ Rental Income</span>
                        <span id="totalIncome" class="font-medium text-green-600 dark:text-green-400">$2,500</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-red-600 dark:text-red-400">- Mortgage Payment</span>
                        <span id="mortgagePayment" class="font-medium text-red-600 dark:text-red-400">$1,265</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-red-600 dark:text-red-400">- Operating Expenses</span>
                        <span id="totalExpenses" class="font-medium text-red-600 dark:text-red-400">$1,100</span>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div class="flex justify-between font-bold">
                            <span class="text-gray-900 dark:text-white">Net Cash Flow</span>
                            <span id="netCashFlow" class="text-accent-600 dark:text-accent-400">$575</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Investment Summary -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Investment Summary</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Total Cash Invested:</span>
                        <span id="totalCashInvested" class="font-medium text-gray-900 dark:text-white">$84,000</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                        <span id="loanAmount" class="font-medium text-gray-900 dark:text-white">$240,000</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Annual Cash Flow:</span>
                        <span id="annualCashFlow" class="font-medium text-gray-900 dark:text-white">$6,900</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Equity from Day 1:</span>
                        <span id="instantEquity" class="font-medium text-gray-900 dark:text-white">$35,000</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayDefaultResults() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <p class="mb-2">Enter property details to calculate cash flow</p>
                <p class="text-sm">Results will appear here</p>
            </div>
        `;
    }

    calculateCapRate(annualNOI, propertyValue) {
        if (propertyValue <= 0) return 0;
        return (annualNOI / propertyValue) * 100;
    }

    updateResults(results) {
        // Update main cash flow display with safety check
        const monthlyCashFlowElement = document.getElementById('monthlyCashFlow');
        if (monthlyCashFlowElement) {
            monthlyCashFlowElement.textContent = this.formatCurrency(results.monthlyCashFlow);
            monthlyCashFlowElement.className = this.getCashFlowColorClass(results.monthlyCashFlow);
        }

        // Update key metrics with safety checks
        const capRateElement = document.getElementById('capRate');
        if (capRateElement) {
            capRateElement.textContent = `${results.capRate.toFixed(1)}%`;
        }

        const cashOnCashReturnElement = document.getElementById('cashOnCashReturn');
        if (cashOnCashReturnElement) {
            cashOnCashReturnElement.textContent = `${results.cashOnCashReturn.toFixed(1)}%`;
        }

        const grmElement = document.getElementById('grm');
        if (grmElement) {
            grmElement.textContent = results.grm.toFixed(1);
        }

        const onePercentElement = document.getElementById('onePercentRule');
        if (onePercentElement) {
            onePercentElement.textContent = `${results.onePercentRule.toFixed(2)}%`;
            // Color code the 1% rule
            if (results.onePercentRule >= 1.0) {
                onePercentElement.className = 'font-bold text-lg text-green-600 dark:text-green-400';
            } else if (results.onePercentRule >= 0.8) {
                onePercentElement.className = 'font-bold text-lg text-yellow-600 dark:text-yellow-400';
            } else {
                onePercentElement.className = 'font-bold text-lg text-red-600 dark:text-red-400';
            }
        }

        // Update monthly breakdown with safety checks
        const totalIncomeElement = document.getElementById('totalIncome');
        if (totalIncomeElement) {
            totalIncomeElement.textContent = this.formatCurrency(results.totalIncome);
        }

        const mortgagePaymentElement = document.getElementById('mortgagePayment');
        if (mortgagePaymentElement) {
            mortgagePaymentElement.textContent = this.formatCurrency(results.mortgagePayment);
        }

        const totalExpensesElement = document.getElementById('totalExpenses');
        if (totalExpensesElement) {
            totalExpensesElement.textContent = this.formatCurrency(results.totalExpenses);
        }

        const netCashFlowElement = document.getElementById('netCashFlow');
        if (netCashFlowElement) {
            netCashFlowElement.textContent = this.formatCurrency(results.monthlyCashFlow);
            netCashFlowElement.className = this.getCashFlowColorClass(results.monthlyCashFlow, 'text-accent-600 dark:text-accent-400');
        }

        // Update investment summary with safety checks
        const totalCashInvestedElement = document.getElementById('totalCashInvested');
        if (totalCashInvestedElement) {
            totalCashInvestedElement.textContent = this.formatCurrency(results.totalCashInvested);
        }

        const loanAmountElement = document.getElementById('loanAmount');
        if (loanAmountElement) {
            loanAmountElement.textContent = this.formatCurrency(results.loanAmount);
        }

        const annualCashFlowElement = document.getElementById('annualCashFlow');
        if (annualCashFlowElement) {
            annualCashFlowElement.textContent = this.formatCurrency(results.annualCashFlow);
        }

        const instantEquityElement = document.getElementById('instantEquity');
        if (instantEquityElement) {
            instantEquityElement.textContent = this.formatCurrency(results.instantEquity);
        }

        // Add color coding for key metrics
        this.colorCodeMetrics(results);

        // Add animation to results
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.classList.add('result-update');
            setTimeout(() => {
                resultsContainer.classList.remove('result-update');
            }, 300);
        }
    }

    getCashFlowColorClass(cashFlow, defaultClass = 'text-4xl font-bold text-accent-600 dark:text-accent-400') {
        if (cashFlow > 0) {
            return defaultClass.replace('accent', 'green');
        } else if (cashFlow < 0) {
            return defaultClass.replace('accent', 'red');
        } else {
            return defaultClass.replace('accent', 'gray');
        }
    }

    colorCodeMetrics(results) {
        // Color code cap rate with safety check
        const capRateElement = document.getElementById('capRate');
        if (capRateElement) {
            if (results.capRate >= 10) {
                capRateElement.className = 'font-bold text-lg text-green-600 dark:text-green-400';
            } else if (results.capRate >= 8) {
                capRateElement.className = 'font-bold text-lg text-yellow-600 dark:text-yellow-400';
            } else {
                capRateElement.className = 'font-bold text-lg text-red-600 dark:text-red-400';
            }
        }

        // Color code cash-on-cash return with safety check
        const cocElement = document.getElementById('cashOnCashReturn');
        if (cocElement) {
            if (results.cashOnCashReturn >= 12) {
                cocElement.className = 'font-bold text-lg text-green-600 dark:text-green-400';
            } else if (results.cashOnCashReturn >= 8) {
                cocElement.className = 'font-bold text-lg text-yellow-600 dark:text-yellow-400';
            } else {
                cocElement.className = 'font-bold text-lg text-red-600 dark:text-red-400';
            }
        }
    }

    displayError(message) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span>${message}</span>
                </div>
            </div>
        `;
    }

    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return formatter.format(amount);
    }

    updateURL(params) {
        const url = new URL(window.location);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== '') {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });

        window.history.replaceState({}, '', url);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Load values from URL parameters if present
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const paramMap = {
            'price': 'purchasePrice',
            'down': 'downPayment',
            'closing': 'closingCosts',
            'rehab': 'rehabCosts',
            'arv': 'afterRepairValue',
            'rent': 'monthlyRent',
            'rate': 'interestRate',
            'term': 'loanTerm'
        };

        Object.keys(paramMap).forEach(param => {
            const value = urlParams.get(param);
            if (value !== null) {
                const input = document.getElementById(paramMap[param]);
                if (input) {
                    input.value = value;
                }
            }
        });
    }

    // Generate sensitivity analysis
    generateSensitivityAnalysis() {
        const baseRent = parseFloat(document.getElementById('monthlyRent').value) || 2500;
        const scenarios = [];

        // Rent scenarios
        for (let i = -20; i <= 20; i += 5) {
            const rentAdjustment = i / 100;
            const adjustedRent = baseRent * (1 + rentAdjustment);
            
            // Temporarily update rent
            document.getElementById('monthlyRent').value = adjustedRent;
            
            // Calculate cash flow for this scenario
            // This is a simplified version - in a real implementation, 
            // you'd want to extract the calculation logic into a separate method
            const monthlyCashFlow = this.calculateScenarioCashFlow(adjustedRent);
            
            scenarios.push({
                rentChange: `${i > 0 ? '+' : ''}${i}%`,
                monthlyRent: adjustedRent,
                monthlyCashFlow: monthlyCashFlow
            });
        }

        // Restore original rent
        document.getElementById('monthlyRent').value = baseRent;
        
        return scenarios;
    }

    calculateScenarioCashFlow(rent) {
        // Simplified calculation for sensitivity analysis
        const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const loanTerm = parseInt(document.getElementById('loanTerm').value) || 30;
        
        const loanAmount = purchasePrice - downPayment;
        const monthlyMortgagePayment = loanAmount > 0 ? 
            FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm) : 0;
        
        // Get total operating expenses
        const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
        const insurance = parseFloat(document.getElementById('insurance').value) || 0;
        const maintenance = parseFloat(document.getElementById('maintenance').value) || 0;
        const vacancy = parseFloat(document.getElementById('vacancy').value) || 0;
        const propertyManagement = parseFloat(document.getElementById('propertyManagement').value) || 0;
        const otherExpenses = parseFloat(document.getElementById('otherExpenses').value) || 0;
        
        const totalMonthlyExpenses = propertyTax + insurance + maintenance + vacancy + propertyManagement + otherExpenses;
        const monthlyNOI = rent - totalMonthlyExpenses;
        
        return monthlyNOI - monthlyMortgagePayment;
    }
}

// Analytics tracking for cash flow calculator
function trackCashFlowCalculation(results) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'cash_flow_calculation', {
            'purchase_price': parseFloat(document.getElementById('purchasePrice').value),
            'monthly_rent': parseFloat(document.getElementById('monthlyRent').value),
            'monthly_cash_flow': results.monthlyCashFlow,
            'cap_rate': results.capRate,
            'cash_on_cash_return': results.cashOnCashReturn
        });
    }
}

// Investment analysis utilities
function getInvestmentRecommendation(results) {
    const recommendations = [];
    
    if (results.monthlyCashFlow > 0) {
        recommendations.push('✅ Positive cash flow - This property generates monthly income');
    } else {
        recommendations.push('⚠️ Negative cash flow - This property requires monthly contributions');
    }
    
    if (results.capRate >= 10) {
        recommendations.push('✅ Excellent cap rate (>10%) - Strong income relative to property value');
    } else if (results.capRate >= 8) {
        recommendations.push('⚡ Good cap rate (8-10%) - Decent income relative to property value');
    } else {
        recommendations.push('⚠️ Low cap rate (<8%) - Consider if appreciation potential justifies low income');
    }
    
    if (results.onePercentRule >= 1.0) {
        recommendations.push('✅ Meets 1% rule - Monthly rent is at least 1% of purchase price');
    } else {
        recommendations.push('⚠️ Below 1% rule - Monthly rent is less than 1% of purchase price');
    }
    
    if (results.cashOnCashReturn >= 12) {
        recommendations.push('✅ Excellent cash-on-cash return (>12%) - Great return on invested capital');
    } else if (results.cashOnCashReturn >= 8) {
        recommendations.push('⚡ Good cash-on-cash return (8-12%) - Solid return on invested capital');
    } else {
        recommendations.push('⚠️ Low cash-on-cash return (<8%) - Consider other investment opportunities');
    }
    
    return recommendations;
}

function calculateBreakEvenAnalysis() {
    const currentExpenses = parseFloat(document.getElementById('propertyTax').value) +
                           parseFloat(document.getElementById('insurance').value) +
                           parseFloat(document.getElementById('maintenance').value) +
                           parseFloat(document.getElementById('vacancy').value) +
                           parseFloat(document.getElementById('propertyManagement').value) +
                           parseFloat(document.getElementById('otherExpenses').value);
    
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    
    const loanAmount = purchasePrice - downPayment;
    const monthlyMortgagePayment = loanAmount > 0 ? 
        FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm) : 0;
    
    const breakEvenRent = currentExpenses + monthlyMortgagePayment;
    
    return {
        breakEvenRent: breakEvenRent,
        currentRent: parseFloat(document.getElementById('monthlyRent').value),
        surplus: parseFloat(document.getElementById('monthlyRent').value) - breakEvenRent
    };
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new CashFlowCalculator();
    
    // Load URL parameters if present
    calculator.loadFromURL();
    
    // Set global reference for debugging
    window.cashFlowCalculator = calculator;
});

// Export functionality
function exportCashFlowAnalysis() {
    const results = {
        propertyDetails: {
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            downPayment: parseFloat(document.getElementById('downPayment').value),
            closingCosts: parseFloat(document.getElementById('closingCosts').value),
            rehabCosts: parseFloat(document.getElementById('rehabCosts').value),
            afterRepairValue: parseFloat(document.getElementById('afterRepairValue').value),
            monthlyRent: parseFloat(document.getElementById('monthlyRent').value)
        },
        financing: {
            interestRate: parseFloat(document.getElementById('interestRate').value),
            loanTerm: parseInt(document.getElementById('loanTerm').value),
            loanAmount: document.getElementById('loanAmount').textContent,
            monthlyPayment: document.getElementById('mortgagePayment').textContent
        },
        expenses: {
            propertyTax: parseFloat(document.getElementById('propertyTax').value),
            insurance: parseFloat(document.getElementById('insurance').value),
            maintenance: parseFloat(document.getElementById('maintenance').value),
            vacancy: parseFloat(document.getElementById('vacancy').value),
            propertyManagement: parseFloat(document.getElementById('propertyManagement').value),
            otherExpenses: parseFloat(document.getElementById('otherExpenses').value)
        },
        results: {
            monthlyCashFlow: document.getElementById('monthlyCashFlow').textContent,
            annualCashFlow: document.getElementById('annualCashFlow').textContent,
            capRate: document.getElementById('capRate').textContent,
            cashOnCashReturn: document.getElementById('cashOnCashReturn').textContent,
            grm: document.getElementById('grm').textContent,
            onePercentRule: document.getElementById('onePercentRule').textContent,
            totalCashInvested: document.getElementById('totalCashInvested').textContent,
            instantEquity: document.getElementById('instantEquity').textContent
        },
        calculatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'property-cash-flow-analysis.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
/**
 * BRRRR Calculator
 * Buy, Rehab, Rent, Refinance, Repeat strategy analysis
 */

class BRRRRCalculator {
    constructor() {
        this.initializeEventListeners();
        this.displayDefaultResults();
    }

    initializeEventListeners() {
        // Input field event listeners
        const inputs = [
            'purchasePrice', 'closingCosts', 'rehabCosts', 'afterRepairValue',
            'monthlyRent', 'monthlyExpenses', 'refinanceLTV', 'interestRate', 'loanTerm'
        ];
        
        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('input', () => this.calculateBRRRR());
            }
        });

        // Load URL parameters on page load
        this.loadFromURL();
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
            <!-- Cash Recycling Summary -->
            <div class="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-gray-700 dark:to-gray-600 border border-accent-200 dark:border-gray-600 rounded-xl p-6 text-center mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cash Recycled</h3>
                <p id="cashRecycled" class="text-4xl font-bold text-accent-600 dark:text-accent-400">$15,000</p>
                <p id="recyclingRate" class="text-sm text-gray-600 dark:text-gray-400 mt-2">75% of Investment Recovered</p>
            </div>

            <!-- Investment Summary -->
            <div class="space-y-4 mb-6">
                <h4 class="font-semibold text-gray-900 dark:text-white">Investment Summary</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Total Cash Invested</span>
                        <span id="totalInvested" class="font-bold text-lg text-gray-900 dark:text-white">$178,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Property Value (ARV)</span>
                        <span id="propertyARV" class="font-bold text-lg text-gray-900 dark:text-white">$200,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Refinance Loan Amount</span>
                        <span id="loanAmount" class="font-bold text-lg text-primary-600 dark:text-primary-400">$150,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Cash Remaining Invested</span>
                        <span id="cashLeftIn" class="font-bold text-lg text-accent-600 dark:text-accent-400">$28,000</span>
                    </div>
                </div>
            </div>

            <!-- Cash Flow Analysis -->
            <div class="space-y-4 mb-6">
                <h4 class="font-semibold text-gray-900 dark:text-white">Monthly Cash Flow</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Rental Income</span>
                        <span id="rentalIncome" class="font-bold text-lg text-green-600 dark:text-green-400">$1,500</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Mortgage Payment</span>
                        <span id="mortgagePayment" class="font-bold text-lg text-red-600 dark:text-red-400">$930</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Operating Expenses</span>
                        <span id="operatingExpenses" class="font-bold text-lg text-red-600 dark:text-red-400">$400</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-t-2 border-gray-300 dark:border-gray-600">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">Net Cash Flow</span>
                        <span id="netCashFlow" class="font-bold text-lg text-accent-600 dark:text-accent-400">$170</span>
                    </div>
                </div>
            </div>

            <!-- Return Metrics -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Return Metrics</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="text-center">
                        <p class="text-gray-600 dark:text-gray-400">Cash-on-Cash ROI</p>
                        <p id="cashOnCashROI" class="font-bold text-lg text-primary-600 dark:text-primary-400">7.3%</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-600 dark:text-gray-400">Total ROI</p>
                        <p id="totalROI" class="font-bold text-lg text-accent-600 dark:text-accent-400">22.5%</p>
                    </div>
                </div>
            </div>
        `;
    }

    calculateBRRRR() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get input values with proper validation
            const purchasePrice = this.parseAndValidateNumber(
                document.getElementById('purchasePrice').value, 
                'Purchase Price', 
                1000, 
                10000000
            );
            const closingCosts = this.parseAndValidateNumber(
                document.getElementById('closingCosts').value, 
                'Closing Costs', 
                0, 
                100000
            );
            const rehabCosts = this.parseAndValidateNumber(
                document.getElementById('rehabCosts').value, 
                'Rehab Costs', 
                0, 
                1000000
            );
            const afterRepairValue = this.parseAndValidateNumber(
                document.getElementById('afterRepairValue').value, 
                'After Repair Value', 
                1000, 
                10000000
            );
            const monthlyRent = this.parseAndValidateNumber(
                document.getElementById('monthlyRent').value, 
                'Monthly Rent', 
                100, 
                50000
            );
            const monthlyExpenses = this.parseAndValidateNumber(
                document.getElementById('monthlyExpenses').value, 
                'Monthly Expenses', 
                0, 
                10000
            );
            const refinanceLTV = this.parseAndValidateNumber(
                document.getElementById('refinanceLTV').value, 
                'Refinance LTV', 
                50, 
                90
            );
            const interestRate = this.parseAndValidateNumber(
                document.getElementById('interestRate').value, 
                'Interest Rate', 
                3, 
                15
            );
            const loanTerm = this.parseAndValidateNumber(
                document.getElementById('loanTerm').value, 
                'Loan Term', 
                10, 
                30
            );

            // Validate required inputs
            if (purchasePrice === null || purchasePrice === 0) {
                this.displayError('Please enter a valid purchase price.');
                return;
            }

            if (afterRepairValue === null || afterRepairValue === 0) {
                this.displayError('Please enter a valid after repair value (ARV).');
                return;
            }

            if (monthlyRent === null || monthlyRent === 0) {
                this.displayError('Please enter a valid monthly rental income.');
                return;
            }

            if (refinanceLTV === null || interestRate === null || loanTerm === null) {
                this.displayError('Please enter valid refinance parameters (LTV, interest rate, and loan term).');
                return;
            }

            // Business logic validation
            if (afterRepairValue <= purchasePrice + (rehabCosts || 0)) {
                this.displayError('After Repair Value should be greater than Purchase Price + Rehab Costs for a profitable BRRRR deal.');
                return;
            }

            // Calculate total cash invested
            const totalCashInvested = purchasePrice + (closingCosts || 0) + (rehabCosts || 0);

            // Calculate refinance loan amount
            const refinanceLoanAmount = afterRepairValue * (refinanceLTV / 100);

            // Calculate cash recycled (pulled out)
            const cashRecycled = Math.min(refinanceLoanAmount, totalCashInvested);
            const cashLeftInDeal = totalCashInvested - cashRecycled;
            const recyclingRate = totalCashInvested > 0 ? (cashRecycled / totalCashInvested) * 100 : 0;

            // Calculate monthly mortgage payment
            const monthlyInterestRate = interestRate / 100 / 12;
            const numberOfPayments = loanTerm * 12;
            let monthlyMortgagePayment = 0;
            
            if (refinanceLoanAmount > 0) {
                monthlyMortgagePayment = this.calculateMonthlyPayment(
                    refinanceLoanAmount, 
                    monthlyInterestRate, 
                    numberOfPayments
                );
            }

            // Calculate monthly cash flow
            const netMonthlyCashFlow = monthlyRent - (monthlyExpenses || 0) - monthlyMortgagePayment;

            // Calculate annual cash flow
            const annualCashFlow = netMonthlyCashFlow * 12;

            // Calculate return metrics
            const cashOnCashROI = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : 0;
            const instantEquity = afterRepairValue - refinanceLoanAmount;
            const totalROI = totalCashInvested > 0 ? ((instantEquity + cashRecycled - totalCashInvested) / totalCashInvested) * 100 : 0;

            // Update display with comprehensive safety checks
            this.updateResults({
                cashRecycled: cashRecycled,
                recyclingRate: recyclingRate,
                totalCashInvested: totalCashInvested,
                afterRepairValue: afterRepairValue,
                refinanceLoanAmount: refinanceLoanAmount,
                cashLeftInDeal: cashLeftInDeal,
                monthlyRent: monthlyRent,
                monthlyMortgagePayment: monthlyMortgagePayment,
                monthlyExpenses: monthlyExpenses || 0,
                netMonthlyCashFlow: netMonthlyCashFlow,
                cashOnCashROI: cashOnCashROI,
                totalROI: totalROI
            });

            // Update URL parameters
            this.updateURL({
                purchase: purchasePrice,
                closing: closingCosts || 0,
                rehab: rehabCosts || 0,
                arv: afterRepairValue,
                rent: monthlyRent,
                expenses: monthlyExpenses || 0,
                ltv: refinanceLTV,
                rate: interestRate,
                term: loanTerm
            });

        } catch (error) {
            console.error('BRRRR calculation error:', error);
            this.displayError('An error occurred while calculating the BRRRR analysis. Please check your inputs and try again.');
        }
    }

    calculateMonthlyPayment(principal, monthlyRate, numberOfPayments) {
        if (monthlyRate === 0) {
            return principal / numberOfPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
               (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    updateResults(results) {
        // Update cash recycling display with safety check
        const cashRecycledElement = document.getElementById('cashRecycled');
        if (cashRecycledElement) {
            cashRecycledElement.textContent = this.formatCurrency(results.cashRecycled);
            cashRecycledElement.className = this.getCashRecycledColorClass(results.recyclingRate);
        }

        const recyclingRateElement = document.getElementById('recyclingRate');
        if (recyclingRateElement) {
            recyclingRateElement.textContent = `${results.recyclingRate.toFixed(1)}% of Investment Recovered`;
        }

        // Update investment summary with safety checks
        const totalInvestedElement = document.getElementById('totalInvested');
        if (totalInvestedElement) {
            totalInvestedElement.textContent = this.formatCurrency(results.totalCashInvested);
        }

        const propertyARVElement = document.getElementById('propertyARV');
        if (propertyARVElement) {
            propertyARVElement.textContent = this.formatCurrency(results.afterRepairValue);
        }

        const loanAmountElement = document.getElementById('loanAmount');
        if (loanAmountElement) {
            loanAmountElement.textContent = this.formatCurrency(results.refinanceLoanAmount);
        }

        const cashLeftInElement = document.getElementById('cashLeftIn');
        if (cashLeftInElement) {
            cashLeftInElement.textContent = this.formatCurrency(results.cashLeftInDeal);
        }

        // Update cash flow analysis with safety checks
        const rentalIncomeElement = document.getElementById('rentalIncome');
        if (rentalIncomeElement) {
            rentalIncomeElement.textContent = this.formatCurrency(results.monthlyRent);
        }

        const mortgagePaymentElement = document.getElementById('mortgagePayment');
        if (mortgagePaymentElement) {
            mortgagePaymentElement.textContent = this.formatCurrency(results.monthlyMortgagePayment);
        }

        const operatingExpensesElement = document.getElementById('operatingExpenses');
        if (operatingExpensesElement) {
            operatingExpensesElement.textContent = this.formatCurrency(results.monthlyExpenses);
        }

        const netCashFlowElement = document.getElementById('netCashFlow');
        if (netCashFlowElement) {
            netCashFlowElement.textContent = this.formatCurrency(results.netMonthlyCashFlow);
            netCashFlowElement.className = this.getCashFlowColorClass(results.netMonthlyCashFlow);
        }

        // Update return metrics with safety checks
        const cashOnCashROIElement = document.getElementById('cashOnCashROI');
        if (cashOnCashROIElement) {
            cashOnCashROIElement.textContent = `${results.cashOnCashROI.toFixed(1)}%`;
        }

        const totalROIElement = document.getElementById('totalROI');
        if (totalROIElement) {
            totalROIElement.textContent = `${results.totalROI.toFixed(1)}%`;
        }

        // Add animation to results
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.classList.add('result-update');
            setTimeout(() => {
                resultsContainer.classList.remove('result-update');
            }, 300);
        }
    }

    getCashRecycledColorClass(recyclingRate) {
        if (recyclingRate >= 90) {
            return 'text-4xl font-bold text-green-600 dark:text-green-400';
        } else if (recyclingRate >= 75) {
            return 'text-4xl font-bold text-accent-600 dark:text-accent-400';
        } else if (recyclingRate >= 50) {
            return 'text-4xl font-bold text-yellow-600 dark:text-yellow-400';
        } else {
            return 'text-4xl font-bold text-red-600 dark:text-red-400';
        }
    }

    getCashFlowColorClass(cashFlow) {
        if (cashFlow > 0) {
            return 'font-bold text-lg text-accent-600 dark:text-accent-400';
        } else {
            return 'font-bold text-lg text-red-600 dark:text-red-400';
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

    displayDefaultResults() {
        // Only calculate if there are actual input values
        const purchasePrice = document.getElementById('purchasePrice').value;
        const afterRepairValue = document.getElementById('afterRepairValue').value;
        
        if (purchasePrice && afterRepairValue) {
            this.calculateBRRRR();
        }
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
            if (params[key] !== null && params[key] !== '' && params[key] !== 0) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });

        window.history.replaceState({}, '', url);
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const paramMap = {
            'purchase': 'purchasePrice',
            'closing': 'closingCosts',
            'rehab': 'rehabCosts',
            'arv': 'afterRepairValue',
            'rent': 'monthlyRent',
            'expenses': 'monthlyExpenses',
            'ltv': 'refinanceLTV',
            'rate': 'interestRate',
            'term': 'loanTerm'
        };

        Object.keys(paramMap).forEach(urlParam => {
            const value = urlParams.get(urlParam);
            if (value) {
                const element = document.getElementById(paramMap[urlParam]);
                if (element) {
                    element.value = value;
                }
            }
        });

        // Calculate after loading URL parameters
        if (urlParams.has('purchase') || urlParams.has('arv')) {
            this.calculateBRRRR();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BRRRRCalculator();
});
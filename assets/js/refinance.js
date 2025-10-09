// Refinance Calculator
class RefinanceCalculator {
    constructor() {
        this.form = document.getElementById('refinanceForm');
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.calculateRefinance(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateRefinance(), 300)();
            });
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateRefinance();
        });

        // Export functionality
        document.getElementById('exportAnalysis').addEventListener('click', () => this.exportAnalysis());
        document.getElementById('shareResults').addEventListener('click', () => this.shareResults());
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

    calculateRefinance() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get and validate all inputs
            const currentBalance = this.parseAndValidateNumber(document.getElementById('currentBalance').value, 'Current Balance', 1000, 50000000);
            const currentRate = this.parseAndValidateNumber(document.getElementById('currentRate').value, 'Current Rate', 0, 50);
            const remainingYears = this.parseAndValidateNumber(document.getElementById('remainingYears').value, 'Remaining Years', 1, 40);
            const newRate = this.parseAndValidateNumber(document.getElementById('newRate').value, 'New Rate', 0, 50);
            const newLoanTerm = this.parseAndValidateNumber(document.getElementById('newLoanTerm').value, 'New Loan Term', 1, 50);
            const closingCosts = this.parseAndValidateNumber(document.getElementById('closingCosts').value, 'Closing Costs', 0, 999999);
            const cashOut = this.parseAndValidateNumber(document.getElementById('cashOut').value, 'Cash Out', 0, 9999999);

            // Check for validation errors
            if ([currentBalance, currentRate, remainingYears, newRate, newLoanTerm, closingCosts, cashOut].some(val => val === null)) {
                this.displayError('An error occurred while calculating refinance analysis. Please verify all input values are valid numbers.');
                return;
            }

            // Perform refinance analysis
            const analysis = this.performRefinanceAnalysis({
                currentBalance,
                currentRate,
                remainingYears,
                newRate,
                newLoanTerm,
                closingCosts,
                cashOut
            });

            // Update the display
            this.updateResults(analysis);

            // Update URL parameters
            this.updateURL({
                balance: currentBalance,
                currentRate: currentRate,
                newRate: newRate,
                term: newLoanTerm
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating refinance analysis. Please verify all input values are valid.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values for optional fields
        if (!value || value.trim() === '') {
            return fieldName === 'Cash Out' || fieldName === 'Closing Costs' ? 0 : null;
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
            <!-- Recommendation -->
            <div class="text-center p-4 rounded-lg" id="recommendationDisplay">
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommendation</div>
                <div id="recommendation" class="text-2xl font-bold text-primary-600 dark:text-primary-400">Calculating...</div>
                <div id="reasonText" class="text-sm text-gray-900 dark:text-white mt-1">-</div>
            </div>

            <!-- Monthly Payment Comparison -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Monthly Payment Comparison</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Current Payment</span>
                        <span id="currentPayment" class="text-lg font-bold text-red-600 dark:text-red-400">$1,799</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">New Payment</span>
                        <span id="newPayment" class="text-lg font-bold text-green-600 dark:text-green-400">$1,599</span>
                    </div>
                    
                    <div class="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Savings</span>
                        <span id="monthlySavings" class="text-xl font-bold text-green-600 dark:text-green-400">$200</span>
                    </div>
                </div>
            </div>

            <!-- Break-even Analysis -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Break-even Analysis</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Break-even Time</span>
                        <span id="breakEvenTime" class="text-lg font-bold text-accent-600 dark:text-accent-400">18 months</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Closing Costs</span>
                        <span id="totalClosingCosts" class="text-lg font-bold text-gray-900 dark:text-white">$3,500</span>
                    </div>
                </div>
            </div>

            <!-- Long-term Savings -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Total Savings</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interest Saved</span>
                        <span id="interestSaved" class="text-lg font-bold text-green-600 dark:text-green-400">$45,000</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Net Savings (After Costs)</span>
                        <span id="netSavings" class="text-xl font-bold text-green-600 dark:text-green-400">$41,500</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Lifetime Savings</span>
                        <span id="lifetimeSavings" class="text-lg font-bold text-gray-900 dark:text-white">$65,000</span>
                    </div>
                </div>
            </div>

            <!-- Key Stats -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Key Statistics</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Rate Reduction:</span>
                        <span id="rateReduction" class="font-medium text-gray-900 dark:text-white">1.00%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">New Loan Amount:</span>
                        <span id="newLoanAmount" class="font-medium text-gray-900 dark:text-white">$253,500</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Time to Recoup Costs:</span>
                        <span id="recoupTime" class="font-medium text-gray-900 dark:text-white">18 months</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayDefaultResults() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <p class="mb-2">Enter loan details to analyze refinancing options</p>
                <p class="text-sm">Detailed analysis and recommendations will appear here</p>
            </div>
        `;
    }

    performRefinanceAnalysis(params) {
        const {
            currentBalance,
            currentRate,
            remainingYears,
            newRate,
            newLoanTerm,
            closingCosts,
            cashOut
        } = params;

        // Calculate current monthly payment
        let currentMonthlyPayment;
        try {
            currentMonthlyPayment = FinancialCalculations.calculateMonthlyPayment(currentBalance, currentRate, remainingYears);
        } catch (error) {
            throw new Error('Unable to calculate current monthly payment');
        }

        // Calculate new loan amount (current balance + cash out + closing costs if rolled in)
        const newLoanAmount = currentBalance + cashOut;
        
        // Calculate new monthly payment
        let newMonthlyPayment;
        try {
            newMonthlyPayment = FinancialCalculations.calculateMonthlyPayment(newLoanAmount, newRate, newLoanTerm);
        } catch (error) {
            throw new Error('Unable to calculate new monthly payment');
        }

        // Calculate monthly savings
        const monthlySavings = currentMonthlyPayment - newMonthlyPayment;

        // Calculate break-even time
        const breakEvenMonths = closingCosts > 0 ? Math.ceil(closingCosts / Math.abs(monthlySavings)) : 0;
        const breakEvenYears = Math.floor(breakEvenMonths / 12);
        const breakEvenRemainingMonths = breakEvenMonths % 12;

        // Calculate total interest for current loan
        const totalCurrentInterest = (currentMonthlyPayment * remainingYears * 12) - currentBalance;

        // Calculate total interest for new loan
        const totalNewInterest = (newMonthlyPayment * newLoanTerm * 12) - newLoanAmount;

        // Calculate interest difference
        const interestSaved = totalCurrentInterest - totalNewInterest;

        // Net savings (interest saved minus closing costs)
        const netSavings = interestSaved - closingCosts;

        // Calculate lifetime savings (considering remaining term)
        const currentLifetimePayments = currentMonthlyPayment * remainingYears * 12;
        const newLifetimePayments = (newMonthlyPayment * newLoanTerm * 12) + closingCosts;
        const lifetimeSavings = currentLifetimePayments - newLifetimePayments;

        // Rate reduction
        const rateReduction = currentRate - newRate;

        // Determine recommendation
        let recommendation = '';
        let recommendationClass = '';
        let reasonText = '';

        if (rateReduction <= 0) {
            recommendation = 'Not Recommended';
            recommendationClass = 'text-red-600 dark:text-red-400';
            reasonText = 'New rate is not lower than current rate';
        } else if (breakEvenMonths > remainingYears * 12) {
            recommendation = 'Not Recommended';
            recommendationClass = 'text-red-600 dark:text-red-400';
            reasonText = 'Break-even time exceeds remaining loan term';
        } else if (netSavings <= 0) {
            recommendation = 'Not Recommended';
            recommendationClass = 'text-red-600 dark:text-red-400';
            reasonText = 'Total costs exceed potential savings';
        } else if (breakEvenMonths <= 24) {
            recommendation = 'Highly Recommended';
            recommendationClass = 'text-green-600 dark:text-green-400';
            reasonText = `Break-even in ${this.formatBreakEvenTime(breakEvenMonths)}`;
        } else if (breakEvenMonths <= 60) {
            recommendation = 'Recommended';
            recommendationClass = 'text-blue-600 dark:text-blue-400';
            reasonText = `Break-even in ${this.formatBreakEvenTime(breakEvenMonths)}`;
        } else {
            recommendation = 'Consider Carefully';
            recommendationClass = 'text-yellow-600 dark:text-yellow-400';
            reasonText = `Long break-even period: ${this.formatBreakEvenTime(breakEvenMonths)}`;
        }

        return {
            currentMonthlyPayment,
            newMonthlyPayment,
            monthlySavings,
            breakEvenMonths,
            breakEvenYears,
            breakEvenRemainingMonths,
            totalCurrentInterest,
            totalNewInterest,
            interestSaved,
            netSavings,
            lifetimeSavings,
            rateReduction,
            newLoanAmount,
            totalClosingCosts: closingCosts,
            recommendation,
            recommendationClass,
            reasonText
        };
    }

    formatBreakEvenTime(months) {
        if (months <= 0) return 'Immediate';
        
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        if (years === 0) {
            return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        } else if (remainingMonths === 0) {
            return `${years} year${years !== 1 ? 's' : ''}`;
        } else {
            return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        }
    }

    updateResults(analysis) {
        // Add safety checks for DOM elements
        const recommendationEl = document.getElementById('recommendation');
        const reasonTextEl = document.getElementById('reasonText');
        const recommendationDisplayEl = document.getElementById('recommendationDisplay');
        const currentPaymentEl = document.getElementById('currentPayment');
        const newPaymentEl = document.getElementById('newPayment');

        if (!recommendationEl || !reasonTextEl || !recommendationDisplayEl || !currentPaymentEl || !newPaymentEl) {
            console.warn('Some required DOM elements are missing, restoring structure');
            this.restoreResultsStructure();
            // Retry after restoration
            return this.updateResults(analysis);
        }

        // Update recommendation
        recommendationEl.textContent = analysis.recommendation;
        recommendationEl.className = `text-2xl font-bold ${analysis.recommendationClass}`;
        reasonTextEl.textContent = analysis.reasonText;

        // Update display background based on recommendation
        if (analysis.recommendation.includes('Highly Recommended')) {
            recommendationDisplayEl.className = 'text-center p-4 rounded-lg bg-green-50 dark:bg-green-900';
        } else if (analysis.recommendation.includes('Recommended')) {
            recommendationDisplayEl.className = 'text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900';
        } else if (analysis.recommendation.includes('Consider')) {
            recommendationDisplayEl.className = 'text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900';
        } else {
            recommendationDisplayEl.className = 'text-center p-4 rounded-lg bg-red-50 dark:bg-red-900';
        }

        // Update monthly payment comparison with safety checks
        if (currentPaymentEl) currentPaymentEl.textContent = this.formatCurrency(analysis.currentMonthlyPayment);
        if (newPaymentEl) newPaymentEl.textContent = this.formatCurrency(analysis.newMonthlyPayment);
        
        const monthlySavingsEl = document.getElementById('monthlySavings');
        if (monthlySavingsEl) {
            if (analysis.monthlySavings >= 0) {
                monthlySavingsEl.textContent = this.formatCurrency(analysis.monthlySavings);
                monthlySavingsEl.className = 'text-xl font-bold text-green-600 dark:text-green-400';
            } else {
                monthlySavingsEl.textContent = this.formatCurrency(Math.abs(analysis.monthlySavings)) + ' increase';
                monthlySavingsEl.className = 'text-xl font-bold text-red-600 dark:text-red-400';
            }
        }

        // Update break-even analysis with safety checks
        const breakEvenTimeEl = document.getElementById('breakEvenTime');
        const totalClosingCostsEl = document.getElementById('totalClosingCosts');
        
        if (breakEvenTimeEl) breakEvenTimeEl.textContent = this.formatBreakEvenTime(analysis.breakEvenMonths);
        if (totalClosingCostsEl) totalClosingCostsEl.textContent = this.formatCurrency(analysis.totalClosingCosts);

        // Update total savings with safety checks
        const interestSavedEl = document.getElementById('interestSaved');
        if (interestSavedEl) interestSavedEl.textContent = this.formatCurrency(Math.max(0, analysis.interestSaved));
        
        const netSavingsEl = document.getElementById('netSavings');
        if (netSavingsEl) {
            if (analysis.netSavings >= 0) {
                netSavingsEl.textContent = this.formatCurrency(analysis.netSavings);
                netSavingsEl.className = 'text-xl font-bold text-green-600 dark:text-green-400';
            } else {
                netSavingsEl.textContent = this.formatCurrency(Math.abs(analysis.netSavings)) + ' loss';
                netSavingsEl.className = 'text-xl font-bold text-red-600 dark:text-red-400';
            }
        }

        const lifetimeSavingsEl = document.getElementById('lifetimeSavings');
        if (lifetimeSavingsEl) {
            if (analysis.lifetimeSavings >= 0) {
                lifetimeSavingsEl.textContent = this.formatCurrency(analysis.lifetimeSavings);
                lifetimeSavingsEl.className = 'text-lg font-bold text-green-600 dark:text-green-400';
            } else {
                lifetimeSavingsEl.textContent = this.formatCurrency(Math.abs(analysis.lifetimeSavings)) + ' additional cost';
                lifetimeSavingsEl.className = 'text-lg font-bold text-red-600 dark:text-red-400';
            }
        }

        // Update key statistics with safety checks
        const rateReductionEl = document.getElementById('rateReduction');
        const newLoanAmountEl = document.getElementById('newLoanAmount');
        const recoupTimeEl = document.getElementById('recoupTime');
        
        if (rateReductionEl) rateReductionEl.textContent = `${analysis.rateReduction.toFixed(3)}%`;
        if (newLoanAmountEl) newLoanAmountEl.textContent = this.formatCurrency(analysis.newLoanAmount);
        if (recoupTimeEl) recoupTimeEl.textContent = this.formatBreakEvenTime(analysis.breakEvenMonths);

        // Update cost-benefit analysis with safety checks
        const benefitMonthlyPaymentEl = document.getElementById('benefitMonthlyPayment');
        const benefitInterestSavingsEl = document.getElementById('benefitInterestSavings');
        const benefitRateImprovementEl = document.getElementById('benefitRateImprovement');
        const totalBenefitsEl = document.getElementById('totalBenefits');
        
        if (benefitMonthlyPaymentEl) {
            benefitMonthlyPaymentEl.textContent = analysis.monthlySavings >= 0 ? 
                `${this.formatCurrency(analysis.monthlySavings)}/month` : 'None';
        }
        if (benefitInterestSavingsEl) benefitInterestSavingsEl.textContent = this.formatCurrency(Math.max(0, analysis.interestSaved));
        if (benefitRateImprovementEl) benefitRateImprovementEl.textContent = `${analysis.rateReduction.toFixed(3)}%`;
        if (totalBenefitsEl) totalBenefitsEl.textContent = this.formatCurrency(Math.max(0, analysis.interestSaved));

        const costClosingCostsEl = document.getElementById('costClosingCosts');
        const costAdditionalInterestEl = document.getElementById('costAdditionalInterest');
        const costOpportunityEl = document.getElementById('costOpportunity');
        const totalCostsEl = document.getElementById('totalCosts');
        
        if (costClosingCostsEl) costClosingCostsEl.textContent = this.formatCurrency(analysis.totalClosingCosts);
        if (costAdditionalInterestEl) costAdditionalInterestEl.textContent = this.formatCurrency(Math.max(0, analysis.totalNewInterest - analysis.totalCurrentInterest));
        if (costOpportunityEl) costOpportunityEl.textContent = '$0'; // Simplified for now
        if (totalCostsEl) totalCostsEl.textContent = this.formatCurrency(analysis.totalClosingCosts + Math.max(0, analysis.totalNewInterest - analysis.totalCurrentInterest));
    }

    exportAnalysis() {
        const results = {
            currentLoan: {
                balance: parseFloat(document.getElementById('currentBalance').value),
                rate: parseFloat(document.getElementById('currentRate').value),
                remainingYears: parseInt(document.getElementById('remainingYears').value),
                monthlyPayment: document.getElementById('currentPayment').textContent
            },
            newLoan: {
                rate: parseFloat(document.getElementById('newRate').value),
                term: parseInt(document.getElementById('newLoanTerm').value),
                monthlyPayment: document.getElementById('newPayment').textContent,
                closingCosts: parseFloat(document.getElementById('closingCosts').value)
            },
            analysis: {
                recommendation: document.getElementById('recommendation').textContent,
                monthlySavings: document.getElementById('monthlySavings').textContent,
                breakEvenTime: document.getElementById('breakEvenTime').textContent,
                interestSaved: document.getElementById('interestSaved').textContent,
                netSavings: document.getElementById('netSavings').textContent
            },
            calculatedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'refinance-analysis.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    shareResults() {
        const params = new URLSearchParams(window.location.search);
        const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
        
        if (navigator.share) {
            navigator.share({
                title: 'Refinance Analysis Results',
                text: 'Check out my refinance analysis results',
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Analysis URL copied to clipboard!');
            });
        }
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

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RefinanceCalculator();
});
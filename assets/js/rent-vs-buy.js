// Rent vs Buy Calculator
class RentVsBuyCalculator {
    constructor() {
        this.form = document.getElementById('rentVsBuyForm');
        this.yearlyData = [];
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.calculateComparison(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateComparison(), 300)();
            });
        });

        // Additional inputs not in the main form
        const additionalInputs = [
            'monthlyRent', 'rentIncrease', 'securityDeposit', 'rentersInsurance', 'movingCosts',
            'timeframe', 'homeAppreciation', 'investmentReturn', 'taxBracket'
        ];
        
        additionalInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    this.debounce(() => this.calculateComparison(), 300)();
                });
            }
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateComparison();
        });

        // Export functionality
        document.getElementById('exportResults').addEventListener('click', () => this.exportResults());
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

    calculateComparison() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get and validate all inputs
            const homePrice = this.parseAndValidateNumber(document.getElementById('homePrice').value, 'Home Price', 50000, 50000000);
            const downPayment = this.parseAndValidateNumber(document.getElementById('downPayment').value, 'Down Payment', 0, 999999999);
            const interestRate = this.parseAndValidateNumber(document.getElementById('interestRate').value, 'Interest Rate', 0, 50);
            const loanTerm = this.parseAndValidateNumber(document.getElementById('loanTerm').value, 'Loan Term', 1, 50);
            const closingCosts = this.parseAndValidateNumber(document.getElementById('closingCosts').value, 'Closing Costs', 0, 999999);
            const propertyTax = this.parseAndValidateNumber(document.getElementById('propertyTax').value, 'Property Tax', 0, 999999);
            const homeInsurance = this.parseAndValidateNumber(document.getElementById('homeInsurance').value, 'Home Insurance', 0, 99999);
            const maintenance = this.parseAndValidateNumber(document.getElementById('maintenance').value, 'Maintenance', 0, 99999);
            
            const monthlyRent = this.parseAndValidateNumber(document.getElementById('monthlyRent').value, 'Monthly Rent', 100, 99999);
            const rentIncrease = this.parseAndValidateNumber(document.getElementById('rentIncrease').value, 'Rent Increase', 0, 20);
            const securityDeposit = this.parseAndValidateNumber(document.getElementById('securityDeposit').value, 'Security Deposit', 0, 99999);
            const rentersInsurance = this.parseAndValidateNumber(document.getElementById('rentersInsurance').value, 'Renters Insurance', 0, 9999);
            const movingCosts = this.parseAndValidateNumber(document.getElementById('movingCosts').value, 'Moving Costs', 0, 99999);
            
            const timeframe = this.parseAndValidateNumber(document.getElementById('timeframe').value, 'Timeframe', 1, 50);
            const homeAppreciation = this.parseAndValidateNumber(document.getElementById('homeAppreciation').value, 'Home Appreciation', 0, 20);
            const investmentReturn = this.parseAndValidateNumber(document.getElementById('investmentReturn').value, 'Investment Return', 0, 50);
            const taxBracket = this.parseAndValidateNumber(document.getElementById('taxBracket').value, 'Tax Bracket', 0, 50);

            // Check for validation errors
            if ([homePrice, downPayment, interestRate, loanTerm, closingCosts, propertyTax, 
                 homeInsurance, maintenance, monthlyRent, rentIncrease, securityDeposit, 
                 rentersInsurance, movingCosts, timeframe, homeAppreciation, investmentReturn, 
                 taxBracket].some(val => val === null)) {
                this.displayError('An error occurred while calculating the comparison. Please verify all input values are valid numbers.');
                return;
            }

            // Additional business logic validation
            if (downPayment >= homePrice) {
                this.displayError('Down payment cannot be greater than or equal to the home price');
                return;
            }

            // Calculate loan details
            const loanAmount = homePrice - downPayment;
            let monthlyMortgagePayment = 0;
            
            if (loanAmount > 0) {
                try {
                    monthlyMortgagePayment = FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
                } catch (error) {
                    this.displayError('Unable to calculate mortgage payment. Please check your loan parameters.');
                    return;
                }
            }

            // Perform the rent vs buy analysis
            const analysis = this.performAnalysis({
                homePrice,
                downPayment,
                loanAmount,
                monthlyMortgagePayment,
                interestRate,
                loanTerm,
                closingCosts,
                propertyTax,
                homeInsurance,
                maintenance,
                monthlyRent,
                rentIncrease,
                securityDeposit,
                rentersInsurance,
                movingCosts,
                timeframe,
                homeAppreciation,
                investmentReturn,
                taxBracket
            });

            // Update the display
            this.updateResults(analysis);
            this.generateYearlyBreakdown(analysis);

            // Update URL parameters
            this.updateURL({
                price: homePrice,
                down: downPayment,
                rate: interestRate,
                rent: monthlyRent,
                years: timeframe
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating the comparison. Please verify all input values are valid.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values for optional fields
        if (!value || value.trim() === '') {
            return 0;
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
            <!-- Winner Display -->
            <div class="text-center p-4 rounded-lg" id="winnerDisplay">
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Financial Winner</div>
                <div id="winner" class="text-2xl font-bold text-primary-600 dark:text-primary-400">Calculating...</div>
                <div id="savings" class="text-lg text-gray-900 dark:text-white mt-1">-</div>
            </div>

            <!-- Cost Comparison -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Total Cost Comparison</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Buying Total Cost</span>
                        <span id="buyingCost" class="text-lg font-bold text-red-600 dark:text-red-400">$0</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Renting Total Cost</span>
                        <span id="rentingCost" class="text-lg font-bold text-blue-600 dark:text-blue-400">$0</span>
                    </div>
                </div>
            </div>

            <!-- Net Worth Impact -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Net Worth Impact</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Buying Net Worth</span>
                        <span id="buyingNetWorth" class="text-lg font-bold text-gray-900 dark:text-white">$0</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Renting Net Worth</span>
                        <span id="rentingNetWorth" class="text-lg font-bold text-gray-900 dark:text-white">$0</span>
                    </div>
                </div>
            </div>

            <!-- Break-even Analysis -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Break-even Analysis</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Break-even Time</span>
                        <span id="breakEvenTime" class="text-lg font-bold text-accent-600 dark:text-accent-400">-</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Payment Difference</span>
                        <span id="monthlyDifference" class="text-lg font-bold text-gray-900 dark:text-white">$0</span>
                    </div>
                </div>
            </div>

            <!-- Key Factors -->
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Key Factors</h3>
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Home Equity Built</span>
                        <span id="equityBuilt" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                    
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Tax Savings (Buying)</span>
                        <span id="taxSavings" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                    
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Investment Returns (Renting)</span>
                        <span id="investmentGains" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayDefaultResults() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <p class="mb-2">Enter property and rental details to compare rent vs buy</p>
                <p class="text-sm">Comprehensive analysis will appear here</p>
            </div>
        `;
    }

    performAnalysis(params) {
        const {
            homePrice, downPayment, loanAmount, monthlyMortgagePayment, interestRate, loanTerm,
            closingCosts, propertyTax, homeInsurance, maintenance,
            monthlyRent, rentIncrease, securityDeposit, rentersInsurance, movingCosts,
            timeframe, homeAppreciation, investmentReturn, taxBracket
        } = params;

        // Calculate monthly costs
        const monthlyPropertyTax = propertyTax / 12;
        const monthlyHomeInsurance = homeInsurance / 12;
        const monthlyMaintenance = maintenance / 12;
        const monthlyRentersInsurance = rentersInsurance / 12;

        const totalMonthlyBuyingCost = monthlyMortgagePayment + monthlyPropertyTax + monthlyHomeInsurance + monthlyMaintenance;

        // Calculate year-by-year analysis
        const yearlyAnalysis = [];
        let currentRent = monthlyRent;
        let homeValue = homePrice;
        let mortgageBalance = loanAmount;
        let cumulativeBuyingCost = downPayment + closingCosts;
        let cumulativeRentingCost = securityDeposit + movingCosts;
        let investedDownPayment = downPayment + closingCosts;

        // Generate amortization schedule for accurate interest/principal split
        const amortizationSchedule = loanAmount > 0 ? 
            FinancialCalculations.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, new Date()) : [];

        for (let year = 1; year <= timeframe; year++) {
            // Update home value
            homeValue *= (1 + homeAppreciation / 100);
            
            // Update rent
            currentRent *= (1 + rentIncrease / 100);
            
            // Calculate annual costs
            const annualBuyingCost = totalMonthlyBuyingCost * 12;
            const annualRentingCost = currentRent * 12 + monthlyRentersInsurance * 12;
            
            cumulativeBuyingCost += annualBuyingCost;
            cumulativeRentingCost += annualRentingCost;

            // Calculate mortgage balance and principal payments for this year
            let annualPrincipalPayment = 0;
            let annualInterestPayment = 0;
            
            if (amortizationSchedule.length > 0) {
                const startPayment = (year - 1) * 12;
                const endPayment = Math.min(year * 12, amortizationSchedule.length);
                
                for (let i = startPayment; i < endPayment; i++) {
                    if (amortizationSchedule[i]) {
                        annualPrincipalPayment += amortizationSchedule[i].principalPayment;
                        annualInterestPayment += amortizationSchedule[i].interestPayment;
                    }
                }
                
                if (endPayment < amortizationSchedule.length) {
                    mortgageBalance = amortizationSchedule[endPayment - 1].remainingBalance;
                } else {
                    mortgageBalance = 0;
                }
            }

            // Calculate tax benefits (mortgage interest deduction)
            const taxSavings = annualInterestPayment * (taxBracket / 100);
            const adjustedBuyingCost = cumulativeBuyingCost - taxSavings;

            // Calculate investment growth for down payment
            investedDownPayment *= (1 + investmentReturn / 100);

            // Calculate net worth positions
            const homeEquity = homeValue - mortgageBalance;
            const buyingNetWorth = homeEquity - adjustedBuyingCost;
            const rentingNetWorth = investedDownPayment - cumulativeRentingCost;

            yearlyAnalysis.push({
                year,
                homeValue,
                mortgageBalance,
                homeEquity,
                cumulativeBuyingCost: adjustedBuyingCost,
                cumulativeRentingCost,
                buyingNetWorth,
                rentingNetWorth,
                netWorthDifference: buyingNetWorth - rentingNetWorth,
                annualRent: currentRent * 12,
                taxSavings,
                investedDownPayment
            });
        }

        // Calculate final results
        const finalYear = yearlyAnalysis[yearlyAnalysis.length - 1];
        const isBuyingBetter = finalYear.buyingNetWorth > finalYear.rentingNetWorth;
        const netWorthDifference = Math.abs(finalYear.buyingNetWorth - finalYear.rentingNetWorth);
        
        // Find break-even point
        let breakEvenYear = null;
        for (let i = 0; i < yearlyAnalysis.length; i++) {
            if (yearlyAnalysis[i].buyingNetWorth > yearlyAnalysis[i].rentingNetWorth) {
                breakEvenYear = yearlyAnalysis[i].year;
                break;
            }
        }

        // Calculate monthly payment difference
        const monthlyDifference = totalMonthlyBuyingCost - (monthlyRent + monthlyRentersInsurance);

        return {
            isBuyingBetter,
            netWorthDifference,
            breakEvenYear,
            monthlyDifference,
            finalYear,
            yearlyAnalysis,
            totalBuyingCost: finalYear.cumulativeBuyingCost,
            totalRentingCost: finalYear.cumulativeRentingCost,
            equityBuilt: finalYear.homeEquity,
            totalTaxSavings: yearlyAnalysis.reduce((sum, year) => sum + year.taxSavings, 0),
            finalInvestmentValue: finalYear.investedDownPayment
        };
    }

    updateResults(analysis) {
        // Add safety checks for DOM elements
        const winnerEl = document.getElementById('winner');
        const savingsEl = document.getElementById('savings');
        const winnerDisplayEl = document.getElementById('winnerDisplay');
        const buyingCostEl = document.getElementById('buyingCost');
        const rentingCostEl = document.getElementById('rentingCost');

        if (!winnerEl || !savingsEl || !winnerDisplayEl || !buyingCostEl || !rentingCostEl) {
            console.warn('Some required DOM elements are missing, restoring structure');
            this.restoreResultsStructure();
            // Retry after restoration
            return this.updateResults(analysis);
        }

        // Update winner display
        if (analysis.isBuyingBetter) {
            winnerEl.textContent = 'Buying';
            winnerEl.className = 'text-2xl font-bold text-green-600 dark:text-green-400';
            savingsEl.textContent = `Saves ${this.formatCurrency(analysis.netWorthDifference)}`;
            winnerDisplayEl.className = 'text-center p-4 rounded-lg bg-green-50 dark:bg-green-900';
        } else {
            winnerEl.textContent = 'Renting';
            winnerEl.className = 'text-2xl font-bold text-blue-600 dark:text-blue-400';
            savingsEl.textContent = `Saves ${this.formatCurrency(analysis.netWorthDifference)}`;
            winnerDisplayEl.className = 'text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900';
        }

        // Update cost comparison with safety checks
        if (buyingCostEl) buyingCostEl.textContent = this.formatCurrency(analysis.totalBuyingCost);
        if (rentingCostEl) rentingCostEl.textContent = this.formatCurrency(analysis.totalRentingCost);

        // Update net worth impact with safety checks
        const buyingNetWorthEl = document.getElementById('buyingNetWorth');
        const rentingNetWorthEl = document.getElementById('rentingNetWorth');
        if (buyingNetWorthEl) buyingNetWorthEl.textContent = this.formatCurrency(analysis.finalYear.buyingNetWorth);
        if (rentingNetWorthEl) rentingNetWorthEl.textContent = this.formatCurrency(analysis.finalYear.rentingNetWorth);

        // Update break-even analysis with safety checks
        const breakEvenTimeEl = document.getElementById('breakEvenTime');
        if (breakEvenTimeEl) {
            breakEvenTimeEl.textContent = analysis.breakEvenYear ? 
                `${analysis.breakEvenYear} years` : 'Never (in timeframe)';
        }
        
        const monthlyDiffEl = document.getElementById('monthlyDifference');
        if (monthlyDiffEl) {
            const monthlyDiff = analysis.monthlyDifference;
            if (monthlyDiff > 0) {
                monthlyDiffEl.textContent = `+${this.formatCurrency(monthlyDiff)} (buying costs more)`;
                monthlyDiffEl.className = 'text-lg font-bold text-red-600 dark:text-red-400';
            } else {
                monthlyDiffEl.textContent = `${this.formatCurrency(Math.abs(monthlyDiff))} (renting costs more)`;
                monthlyDiffEl.className = 'text-lg font-bold text-green-600 dark:text-green-400';
            }
        }

        // Update key factors with safety checks
        const equityBuiltEl = document.getElementById('equityBuilt');
        const taxSavingsEl = document.getElementById('taxSavings');
        const investmentGainsEl = document.getElementById('investmentGains');
        
        if (equityBuiltEl) equityBuiltEl.textContent = this.formatCurrency(analysis.equityBuilt);
        if (taxSavingsEl) taxSavingsEl.textContent = this.formatCurrency(analysis.totalTaxSavings);
        if (investmentGainsEl) {
            const downPaymentEl = document.getElementById('downPayment');
            const closingCostsEl = document.getElementById('closingCosts');
            const downPayment = downPaymentEl ? parseFloat(downPaymentEl.value) || 0 : 0;
            const closingCosts = closingCostsEl ? parseFloat(closingCostsEl.value) || 0 : 0;
            investmentGainsEl.textContent = this.formatCurrency(analysis.finalInvestmentValue - downPayment - closingCosts);
        }
    }

    generateYearlyBreakdown(analysis) {
        const tbody = document.getElementById('breakdownBody');
        tbody.innerHTML = '';

        analysis.yearlyAnalysis.forEach(yearData => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            const netWorthDiffClass = yearData.netWorthDifference >= 0 ? 
                'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${yearData.year}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(yearData.cumulativeBuyingCost)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(yearData.cumulativeRentingCost)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(yearData.homeValue)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(yearData.mortgageBalance)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${netWorthDiffClass}">${this.formatCurrency(yearData.netWorthDifference)}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }

    exportResults() {
        if (this.yearlyData.length === 0) return;

        const headers = ['Year', 'Buying Cost', 'Renting Cost', 'Home Value', 'Mortgage Balance', 'Net Worth Difference'];
        const csvContent = [
            headers.join(','),
            ...this.yearlyData.map(row => [
                row.year,
                row.cumulativeBuyingCost.toFixed(2),
                row.cumulativeRentingCost.toFixed(2),
                row.homeValue.toFixed(2),
                row.mortgageBalance.toFixed(2),
                row.netWorthDifference.toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rent-vs-buy-analysis.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    shareResults() {
        const params = new URLSearchParams(window.location.search);
        const shareUrl = window.location.origin + window.location.pathname + '?' + params.toString();
        
        if (navigator.share) {
            navigator.share({
                title: 'Rent vs Buy Analysis Results',
                text: 'Check out my rent vs buy analysis results',
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
    new RentVsBuyCalculator();
});
class MortgageComparisonCalculator {
    constructor() {
        this.form = document.getElementById('mortgageComparisonForm');
        this.quickResults = document.getElementById('quickResults');
        this.detailedComparison = document.getElementById('detailedComparison');
        
        this.bindEvents();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateComparison();
        });

        // Real-time calculations on input change
        this.form.addEventListener('input', () => {
            if (this.isFormValid()) {
                this.calculateComparison();
            }
        });

        // Toggle different rates section
        document.getElementById('differentRates').addEventListener('change', (e) => {
            const separateRatesSection = document.getElementById('separateRatesSection');
            if (e.target.checked) {
                separateRatesSection.classList.remove('hidden');
                // Set default values if empty
                if (!document.getElementById('rate15').value) {
                    const baseRate = parseFloat(document.getElementById('interestRate').value) || 6.5;
                    document.getElementById('rate15').value = (baseRate - 0.25).toFixed(2);
                    document.getElementById('rate30').value = (baseRate + 0.25).toFixed(2);
                }
            } else {
                separateRatesSection.classList.add('hidden');
            }
            if (this.isFormValid()) {
                this.calculateComparison();
            }
        });

        // Format loan amount input
        const loanAmountInput = document.getElementById('loanAmount');
        loanAmountInput.addEventListener('input', (e) => {
            this.formatCurrencyInput(e.target);
        });
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d]/g, '');
        if (value) {
            value = parseInt(value).toLocaleString();
        }
        input.value = value;
    }

    parseCurrencyInput(input) {
        return parseFloat(input.value.replace(/[^\d.]/g, '')) || 0;
    }

    isFormValid() {
        const loanAmount = this.parseCurrencyInput(document.getElementById('loanAmount'));
        const differentRates = document.getElementById('differentRates').checked;
        
        if (differentRates) {
            const rate15 = parseFloat(document.getElementById('rate15').value);
            const rate30 = parseFloat(document.getElementById('rate30').value);
            return loanAmount > 0 && rate15 > 0 && rate30 > 0;
        } else {
            const interestRate = parseFloat(document.getElementById('interestRate').value);
            return loanAmount > 0 && interestRate > 0;
        }
    }

    calculateComparison() {
        if (!this.isFormValid()) return;

        // Get input values
        const loanAmount = this.parseCurrencyInput(document.getElementById('loanAmount'));
        const differentRates = document.getElementById('differentRates').checked;
        
        let rate15, rate30;
        if (differentRates) {
            rate15 = parseFloat(document.getElementById('rate15').value) / 100;
            rate30 = parseFloat(document.getElementById('rate30').value) / 100;
        } else {
            const baseRate = parseFloat(document.getElementById('interestRate').value) / 100;
            rate15 = baseRate;
            rate30 = baseRate;
        }

        // Calculate 30-year mortgage
        const mortgage30 = this.calculateMortgage(loanAmount, rate30, 30);
        
        // Calculate 15-year mortgage
        const mortgage15 = this.calculateMortgage(loanAmount, rate15, 15);

        // Calculate comparison metrics
        const comparison = this.calculateComparisonMetrics(mortgage15, mortgage30);

        // Display results
        this.displayResults({
            mortgage15,
            mortgage30,
            comparison,
            rates: { rate15: rate15 * 100, rate30: rate30 * 100 }
        });
    }

    calculateMortgage(principal, annualRate, years) {
        const monthlyRate = annualRate / 12;
        const numberOfPayments = years * 12;
        
        let monthlyPayment;
        if (monthlyRate === 0) {
            monthlyPayment = principal / numberOfPayments;
        } else {
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        }

        const totalPaid = monthlyPayment * numberOfPayments;
        const totalInterest = totalPaid - principal;

        return {
            monthlyPayment,
            totalPaid,
            totalInterest,
            numberOfPayments,
            years
        };
    }

    calculateComparisonMetrics(mortgage15, mortgage30) {
        const interestSavings = mortgage30.totalInterest - mortgage15.totalInterest;
        const extraMonthlyPayment = mortgage15.monthlyPayment - mortgage30.monthlyPayment;
        const yearsSaved = mortgage30.years - mortgage15.years;

        // Calculate investment scenarios for the extra monthly payment
        const monthlyInvestment = extraMonthlyPayment;
        const investmentPeriod = 30; // years
        
        const investment7 = this.calculateFutureValue(monthlyInvestment, 0.07, investmentPeriod);
        const investment8 = this.calculateFutureValue(monthlyInvestment, 0.08, investmentPeriod);
        const investment10 = this.calculateFutureValue(monthlyInvestment, 0.10, investmentPeriod);

        return {
            interestSavings,
            extraMonthlyPayment,
            yearsSaved,
            investments: {
                rate7: investment7,
                rate8: investment8,
                rate10: investment10
            }
        };
    }

    calculateFutureValue(monthlyPayment, annualRate, years) {
        const monthlyRate = annualRate / 12;
        const numberOfPayments = years * 12;
        
        if (monthlyRate === 0) {
            return monthlyPayment * numberOfPayments;
        }
        
        return monthlyPayment * (Math.pow(1 + monthlyRate, numberOfPayments) - 1) / monthlyRate;
    }

    displayResults(results) {
        const { mortgage15, mortgage30, comparison, rates } = results;

        // Update quick results panel
        this.quickResults.innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">30-Year Mortgage</h4>
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${this.formatCurrency(mortgage30.monthlyPayment)}</p>
                    <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">Monthly payment</p>
                    <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">Total interest: ${this.formatCurrency(mortgage30.totalInterest)}</p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">15-Year Mortgage</h4>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">${this.formatCurrency(mortgage15.monthlyPayment)}</p>
                    <p class="text-sm text-green-700 dark:text-green-300 mt-1">Monthly payment</p>
                    <p class="text-xs text-green-600 dark:text-green-400 mt-2">Total interest: ${this.formatCurrency(mortgage15.totalInterest)}</p>
                </div>
                
                <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3">15-Year Saves</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm text-green-700 dark:text-green-300">Interest:</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${this.formatCurrency(comparison.interestSavings)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-green-700 dark:text-green-300">Time:</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${comparison.yearsSaved} years</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update detailed results
        this.updateDetailedResults(results);
        
        // Show detailed results section
        this.detailedComparison.classList.remove('hidden');
    }

    updateDetailedResults(results) {
        const { mortgage15, mortgage30, comparison, rates } = results;

        // Update 30-year mortgage details
        document.getElementById('payment30').textContent = this.formatCurrency(mortgage30.monthlyPayment);
        document.getElementById('interest30').textContent = this.formatCurrency(mortgage30.totalInterest);
        document.getElementById('total30').textContent = this.formatCurrency(mortgage30.totalPaid);
        document.getElementById('rate30Display').textContent = rates.rate30.toFixed(2) + '%';

        // Update 15-year mortgage details
        document.getElementById('payment15').textContent = this.formatCurrency(mortgage15.monthlyPayment);
        document.getElementById('interest15').textContent = this.formatCurrency(mortgage15.totalInterest);
        document.getElementById('total15').textContent = this.formatCurrency(mortgage15.totalPaid);
        document.getElementById('rate15Display').textContent = rates.rate15.toFixed(2) + '%';

        // Update savings summary
        document.getElementById('interestSavings').textContent = this.formatCurrency(comparison.interestSavings);
        document.getElementById('extraMonthly').textContent = this.formatCurrency(comparison.extraMonthlyPayment);
        document.getElementById('yearsSaved').textContent = comparison.yearsSaved + ' years';

        // Update investment analysis
        document.getElementById('extraMonthlyInvest').textContent = this.formatCurrency(comparison.extraMonthlyPayment);
        document.getElementById('investment7').textContent = this.formatCurrency(comparison.investments.rate7);
        document.getElementById('investment8').textContent = this.formatCurrency(comparison.investments.rate8);
        document.getElementById('investment10').textContent = this.formatCurrency(comparison.investments.rate10);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MortgageComparisonCalculator();
});
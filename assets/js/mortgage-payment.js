// Mortgage Payment Calculator
class MortgagePaymentCalculator {
    constructor() {
        this.form = document.getElementById('mortgageForm');
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.calculatePayment(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.handleInputChange(input);
                this.debounce(() => this.calculatePayment(), 300)();
            });
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculatePayment();
        });

        // Sync down payment amount and percentage
        this.setupDownPaymentSync();
    }

    setupDownPaymentSync() {
        const homePriceInput = document.getElementById('homePrice');
        const downPaymentInput = document.getElementById('downPayment');
        const downPaymentPercentInput = document.getElementById('downPaymentPercent');

        // Update percentage when amount changes
        downPaymentInput.addEventListener('input', () => {
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const downPayment = parseFloat(downPaymentInput.value) || 0;
            
            if (homePrice > 0) {
                const percentage = (downPayment / homePrice) * 100;
                downPaymentPercentInput.value = percentage.toFixed(1);
            }
        });

        // Update amount when percentage changes
        downPaymentPercentInput.addEventListener('input', () => {
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const percentage = parseFloat(downPaymentPercentInput.value) || 0;
            
            const downPayment = (homePrice * percentage) / 100;
            downPaymentInput.value = Math.round(downPayment);
        });

        // Update both when home price changes
        homePriceInput.addEventListener('input', () => {
            const homePrice = parseFloat(homePriceInput.value) || 0;
            const percentage = parseFloat(downPaymentPercentInput.value) || 0;
            
            const downPayment = (homePrice * percentage) / 100;
            downPaymentInput.value = Math.round(downPayment);
        });
    }

    handleInputChange(input) {
        // Auto-calculate PMI based on down payment percentage
        if (input.id === 'downPaymentPercent' || input.id === 'downPayment' || input.id === 'homePrice') {
            this.updatePMI();
        }

        // Validate input
        this.validateInput(input);
    }

    updatePMI() {
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        const pmiInput = document.getElementById('pmi');
        
        const downPaymentPercent = (downPayment / homePrice) * 100;
        
        if (downPaymentPercent < 20 && homePrice > 0) {
            // Estimate PMI as 0.5% of loan amount annually, divided by 12
            const loanAmount = homePrice - downPayment;
            const estimatedPMI = (loanAmount * 0.005) / 12;
            pmiInput.value = Math.round(estimatedPMI);
        } else {
            pmiInput.value = 0;
        }
    }

    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        
        // Always clear previous error states first
        input.classList.remove('border-red-500', 'ring-red-500');
        this.clearError(input);

        // Only validate if there's a value
        if (input.value.trim() !== '') {
            // Check if it's a valid number
            if (isNaN(value)) {
                this.showError(input, 'Please enter a valid number');
                return false;
            }
            
            // Check minimum value (but be more specific for home price)
            if (min !== undefined && value < min) {
                if (input.id === 'homePrice') {
                    this.showError(input, `Home price must be at least $${min.toLocaleString()}`);
                } else {
                    this.showError(input, `Value must be at least ${min.toLocaleString()}`);
                }
                return false;
            }
            
            // Check maximum value  
            if (max !== undefined && value > max) {
                this.showError(input, `Value must be no more than ${max.toLocaleString()}`);
                return false;
            }

            // Additional specific validations
            if (input.id === 'homePrice' && value === 0) {
                this.showError(input, 'Please enter a valid home price');
                return false;
            }
        }

        return true;
    }

    showError(input, message) {
        input.classList.add('border-red-500', 'ring-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 dark:text-red-400 mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    clearError(input) {
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    calculatePayment() {
        try {
            // Clear any previous error display first
            this.clearResultsError();
            
            // Get form values with proper validation
            const homePrice = this.parseAndValidateNumber(document.getElementById('homePrice').value, 'Home Price', 1000, 100000000);
            const downPayment = this.parseAndValidateNumber(document.getElementById('downPayment').value, 'Down Payment', 0, 99999999);
            const interestRate = this.parseAndValidateNumber(document.getElementById('interestRate').value, 'Interest Rate', 0, 50);
            const loanTerm = this.parseAndValidateNumber(document.getElementById('loanTerm').value, 'Loan Term', 1, 50);
            const propertyTax = this.parseAndValidateNumber(document.getElementById('propertyTax').value, 'Property Tax', 0, 999999);
            const homeInsurance = this.parseAndValidateNumber(document.getElementById('homeInsurance').value, 'Home Insurance', 0, 999999);
            const pmi = this.parseAndValidateNumber(document.getElementById('pmi').value, 'PMI', 0, 99999);

            // Check for validation errors - if any are null, don't proceed but don't show duplicate error
            if (homePrice === null || downPayment === null || interestRate === null || 
                loanTerm === null || propertyTax === null || homeInsurance === null || pmi === null) {
                return; // Individual field validation errors already displayed
            }

            // Additional business logic validation
            if (downPayment >= homePrice) {
                this.displayError('Down payment cannot be greater than or equal to the home price');
                return;
            }

            const loanAmount = homePrice - downPayment;
            
            if (loanAmount <= 0) {
                this.displayError('Loan amount must be greater than $0. Please adjust your home price or down payment.');
                return;
            }

            if (loanAmount < 1000) {
                this.displayError('Loan amount must be at least $1,000 for meaningful calculations.');
                return;
            }

            // Calculate monthly payment (Principal & Interest)
            const monthlyPI = FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            
            // Validate calculated payment
            if (!isFinite(monthlyPI) || isNaN(monthlyPI) || monthlyPI < 0) {
                this.displayError('Unable to calculate payment with the provided values. Please check your inputs.');
                return;
            }

            // Calculate monthly taxes and insurance
            const monthlyPropertyTax = propertyTax / 12;
            const monthlyInsurance = homeInsurance / 12;

            // Calculate total monthly payment
            const totalMonthlyPayment = monthlyPI + monthlyPropertyTax + monthlyInsurance + pmi;

            // Calculate total interest and total cost
            const totalPayments = monthlyPI * (loanTerm * 12);
            const totalInterest = totalPayments - loanAmount;
            const totalCost = totalPayments + downPayment;

            // Update display
            this.updateResults({
                totalPayment: totalMonthlyPayment,
                principalInterest: monthlyPI,
                monthlyPropertyTax: monthlyPropertyTax,
                monthlyInsurance: monthlyInsurance,
                monthlyPMI: pmi,
                loanAmount: loanAmount,
                totalInterest: totalInterest,
                totalCost: totalCost
            });

            // Update URL parameters
            this.updateURL({
                price: homePrice,
                down: downPayment,
                rate: interestRate,
                term: loanTerm,
                tax: propertyTax,
                insurance: homeInsurance,
                pmi: pmi
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating the payment. Please verify all input values are valid numbers.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values
        if (!value || value.trim() === '') {
            return 0; // Return 0 for optional fields, required field validation handled elsewhere
        }

        // Parse the number
        const num = parseFloat(value);

        // Check if it's a valid number
        if (isNaN(num)) {
            // Don't show results error for individual field issues
            return null;
        }

        // Check range
        if (num < min) {
            // Don't show results error for individual field issues  
            return null;
        }

        if (num > max) {
            // Don't show results error for individual field issues
            return null;
        }

        return num;
    }

    clearResultsError() {
        const resultsContainer = document.getElementById('results');
        // Check if results container contains an error message
        const errorMessage = resultsContainer.querySelector('.bg-red-50, .bg-red-900');
        if (errorMessage) {
            // Restore the original results display
            this.displayDefaultResults();
        }
    }

    displayDefaultResults() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Monthly Payment</span>
                <span id="totalPayment" class="text-2xl font-bold text-primary-600 dark:text-primary-400">$0</span>
            </div>
            
            <div class="space-y-3 mt-4">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Principal & Interest</span>
                    <span id="principalInterest" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Property Tax</span>
                    <span id="monthlyPropertyTax" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Home Insurance</span>
                    <span id="monthlyInsurance" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-400">PMI</span>
                    <span id="monthlyPMI" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Summary</h3>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Loan Amount</span>
                        <span id="loanAmount" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Total Interest</span>
                        <span id="totalInterest" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
                        <span id="totalCost" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateResults(results) {
        // Update main payment display
        document.getElementById('totalPayment').textContent = this.formatCurrency(results.totalPayment);
        document.getElementById('principalInterest').textContent = this.formatCurrency(results.principalInterest);
        document.getElementById('monthlyPropertyTax').textContent = this.formatCurrency(results.monthlyPropertyTax);
        document.getElementById('monthlyInsurance').textContent = this.formatCurrency(results.monthlyInsurance);
        document.getElementById('monthlyPMI').textContent = this.formatCurrency(results.monthlyPMI);

        // Update loan summary
        document.getElementById('loanAmount').textContent = this.formatCurrency(results.loanAmount);
        document.getElementById('totalInterest').textContent = this.formatCurrency(results.totalInterest);
        document.getElementById('totalCost').textContent = this.formatCurrency(results.totalCost);

        // Add animation to results
        const resultsContainer = document.getElementById('results');
        resultsContainer.classList.add('result-update');
        setTimeout(() => {
            resultsContainer.classList.remove('result-update');
        }, 300);
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
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
            'price': 'homePrice',
            'down': 'downPayment',
            'rate': 'interestRate',
            'term': 'loanTerm',
            'tax': 'propertyTax',
            'insurance': 'homeInsurance',
            'pmi': 'pmi'
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

        // Recalculate down payment percentage after loading URL params
        const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
        const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
        
        if (homePrice > 0) {
            const percentage = (downPayment / homePrice) * 100;
            document.getElementById('downPaymentPercent').value = percentage.toFixed(1);
        }
    }
}

// Analytics tracking for mortgage calculator
function trackMortgageCalculation(results) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'mortgage_calculation', {
            'loan_amount': results.loanAmount,
            'interest_rate': parseFloat(document.getElementById('interestRate').value),
            'loan_term': parseInt(document.getElementById('loanTerm').value),
            'monthly_payment': results.totalPayment
        });
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new MortgagePaymentCalculator();
    
    // Load URL parameters if present
    calculator.loadFromURL();
    
    // Set global reference for debugging
    window.mortgageCalculator = calculator;
});

// Print functionality
function printResults() {
    window.print();
}

// Export calculation data
function exportToJSON() {
    const results = {
        homePrice: parseFloat(document.getElementById('homePrice').value),
        downPayment: parseFloat(document.getElementById('downPayment').value),
        interestRate: parseFloat(document.getElementById('interestRate').value),
        loanTerm: parseInt(document.getElementById('loanTerm').value),
        propertyTax: parseFloat(document.getElementById('propertyTax').value),
        homeInsurance: parseFloat(document.getElementById('homeInsurance').value),
        pmi: parseFloat(document.getElementById('pmi').value),
        calculatedAt: new Date().toISOString(),
        results: {
            totalPayment: document.getElementById('totalPayment').textContent,
            principalInterest: document.getElementById('principalInterest').textContent,
            loanAmount: document.getElementById('loanAmount').textContent,
            totalInterest: document.getElementById('totalInterest').textContent,
            totalCost: document.getElementById('totalCost').textContent
        }
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mortgage-calculation.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
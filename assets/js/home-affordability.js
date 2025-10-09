// Home Affordability Calculator
class HomeAffordabilityCalculator {
    constructor() {
        this.form = document.getElementById('affordabilityForm');
        this.dtiSlider = document.getElementById('dtiRatio');
        this.dtiValue = document.getElementById('dtiValue');
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.setupDTISlider();
        this.calculateAffordability(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateAffordability(), 300)();
            });
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateAffordability();
        });
    }

    setupDTISlider() {
        if (!this.dtiSlider || !this.dtiValue) return;

        // Update DTI value display
        this.dtiSlider.addEventListener('input', () => {
            this.dtiValue.textContent = this.dtiSlider.value;
            this.updateSliderColor();
        });

        // Set initial value and color
        this.dtiValue.textContent = this.dtiSlider.value;
        this.updateSliderColor();
    }

    updateSliderColor() {
        const value = parseInt(this.dtiSlider.value);
        let colorClass = '';
        
        if (value <= 28) {
            colorClass = 'bg-green-500';
        } else if (value <= 36) {
            colorClass = 'bg-yellow-500';
        } else {
            colorClass = 'bg-red-500';
        }

        // Update slider thumb color (this would require custom CSS for full browser support)
        this.dtiSlider.className = `w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer ${colorClass}`;
    }

    calculateAffordability() {
        try {
            // Clear any previous results errors
            this.clearResultsError();
            
            // Get form values with proper validation
            const annualIncome = this.parseAndValidateNumber(document.getElementById('annualIncome').value, 'Annual Income', 1, 100000000);
            const monthlyDebt = this.parseAndValidateNumber(document.getElementById('monthlyDebt').value, 'Monthly Debt', 0, 999999);
            const downPayment = this.parseAndValidateNumber(document.getElementById('downPayment').value, 'Down Payment', 0, 99999999);
            const interestRate = this.parseAndValidateNumber(document.getElementById('interestRate').value, 'Interest Rate', 0, 50);
            const loanTerm = this.parseAndValidateNumber(document.getElementById('loanTerm').value, 'Loan Term', 1, 50);
            const propertyTaxRate = this.parseAndValidateNumber(document.getElementById('propertyTaxRate').value, 'Property Tax Rate', 0, 10);
            const homeInsurance = this.parseAndValidateNumber(document.getElementById('homeInsurance').value, 'Home Insurance', 0, 999999);
            const dtiRatio = this.parseAndValidateNumber(document.getElementById('dtiRatio').value, 'DTI Ratio', 1, 65);

            // Check for validation errors - if any are null, don't proceed
            if (annualIncome === null || monthlyDebt === null || downPayment === null || 
                interestRate === null || loanTerm === null || propertyTaxRate === null || 
                homeInsurance === null || dtiRatio === null) {
                this.displayError('An error occurred while calculating affordability. Please verify all input values are valid numbers.');
                return;
            }

            // Additional validation for required minimum values
            if (annualIncome <= 0) {
                this.displayError('Annual income must be greater than $0.');
                return;
            }

            if (interestRate <= 0) {
                this.displayError('Interest rate must be greater than 0%.');
                return;
            }

            if (interestRate > 0 && interestRate < 0.01) {
                this.displayError('Interest rate appears too low. Please verify the rate.');
                return;
            }

            // Calculate monthly income
            const monthlyIncome = annualIncome / 12;

            // Check for realistic income scenarios
            if (annualIncome < 10000) {
                this.displayError('Annual income appears too low for mortgage qualification. Please verify the amount.');
                return;
            }

            if (monthlyIncome <= monthlyDebt) {
                this.displayError('Monthly debt payments exceed monthly income. Please review your inputs.');
                return;
            }

            // Calculate maximum monthly housing payment based on front-end DTI
            const maxHousingPayment = (monthlyIncome * dtiRatio) / 100;

            if (maxHousingPayment <= 100) {
                this.displayError('Calculated affordable payment is too low for realistic home purchase. Consider increasing income or reducing debt.');
                return;
            }

            // Calculate monthly insurance
            const monthlyInsurance = homeInsurance / 12;

            // Use iterative approach to find maximum home price
            const result = this.findMaxHomePrice(
                maxHousingPayment,
                downPayment,
                interestRate,
                loanTerm,
                propertyTaxRate,
                monthlyInsurance
            );

            if (!result) {
                this.displayError('Unable to calculate affordability with current parameters. Try adjusting your down payment or DTI ratio.');
                return;
            }

            // Calculate DTI ratios
            const frontEndDTI = (result.totalMonthlyPayment / monthlyIncome) * 100;
            const backEndDTI = ((result.totalMonthlyPayment + monthlyDebt) / monthlyIncome) * 100;
            const remainingIncome = monthlyIncome - result.totalMonthlyPayment - monthlyDebt;

            // Update display
            this.updateResults({
                maxHomePrice: result.homePrice,
                loanAmount: result.loanAmount,
                monthlyPayment: result.principalInterest,
                principalInterest: result.principalInterest,
                monthlyPropertyTax: result.monthlyPropertyTax,
                monthlyInsurance: monthlyInsurance,
                totalPITI: result.totalMonthlyPayment,
                frontEndDTI: frontEndDTI,
                backEndDTI: backEndDTI,
                remainingIncome: remainingIncome
            });

            // Update URL parameters
            this.updateURL({
                income: annualIncome,
                debt: monthlyDebt,
                down: downPayment,
                rate: interestRate,
                term: loanTerm,
                tax: propertyTaxRate,
                insurance: homeInsurance,
                dti: dtiRatio
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating affordability. Please verify all input values are valid numbers.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values
        if (!value || value.trim() === '') {
            // For required fields, return null to trigger validation error
            if (fieldName === 'Annual Income' || fieldName === 'Interest Rate' || fieldName === 'Loan Term' || fieldName === 'DTI Ratio') {
                return null;
            }
            // For optional fields, return 0
            return 0;
        }

        // Parse the number
        const num = parseFloat(value);

        // Check if it's a valid number
        if (isNaN(num)) {
            return null;
        }

        // Check range
        if (num < min) {
            return null;
        }

        if (num > max) {
            return null;
        }

        return num;
    }

    clearResultsError() {
        const resultsContainer = document.getElementById('results');
        // Check if results container contains an error message
        const errorMessage = resultsContainer.querySelector('.bg-red-50, .bg-red-900');
        if (errorMessage) {
            // Remove the error message and restore default results display
            errorMessage.remove();
            this.restoreResultsStructure();
            return true;
        }
        return false;
    }

    restoreResultsStructure() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-gray-700 dark:to-gray-600 border border-accent-200 dark:border-gray-600 rounded-xl p-6 text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Maximum Home Price</h3>
                <p id="maxHomePrice" class="text-4xl font-bold text-accent-600 dark:text-accent-400">$0</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-primary-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Loan Amount</h4>
                    <p id="loanAmount" class="text-xl font-bold text-primary-600 dark:text-primary-400">$0</p>
                </div>
                <div class="bg-primary-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Monthly Payment</h4>
                    <p id="monthlyPayment" class="text-xl font-bold text-primary-600 dark:text-primary-400">$0</p>
                </div>
            </div>

            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">Payment Breakdown</h4>
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Principal & Interest</span>
                    <span id="principalInterest" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Property Tax</span>
                    <span id="monthlyPropertyTax" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Home Insurance</span>
                    <span id="monthlyInsurance" class="font-medium text-gray-900 dark:text-white">$0</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Total PITI</span>
                    <span id="totalPITI" class="font-bold text-lg text-gray-900 dark:text-white">$0</span>
                </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">DTI Analysis</h4>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Front-end DTI:</span>
                        <span id="frontEndDTI" class="font-medium text-gray-900 dark:text-white">0%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Back-end DTI:</span>
                        <span id="backEndDTI" class="font-medium text-gray-900 dark:text-white">0%</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Available Monthly Income:</span>
                        <span id="remainingIncome" class="font-medium text-gray-900 dark:text-white">$0</span>
                    </div>
                </div>
            </div>
        `;
    }

    findMaxHomePrice(maxHousingPayment, downPayment, interestRate, loanTerm, propertyTaxRate, monthlyInsurance) {
        let low = downPayment + 1; // Minimum home price
        let high = 10000000; // Maximum home price to search
        let bestResult = null;
        
        // Binary search for maximum affordable home price
        while (low <= high) {
            const midPrice = Math.floor((low + high) / 2);
            const loanAmount = midPrice - downPayment;
            
            if (loanAmount <= 0) {
                low = midPrice + 1;
                continue;
            }

            // Calculate monthly payment components
            const principalInterest = FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            const monthlyPropertyTax = (midPrice * propertyTaxRate / 100) / 12;
            const totalMonthlyPayment = principalInterest + monthlyPropertyTax + monthlyInsurance;

            if (totalMonthlyPayment <= maxHousingPayment) {
                // This price is affordable, try higher
                bestResult = {
                    homePrice: midPrice,
                    loanAmount: loanAmount,
                    principalInterest: principalInterest,
                    monthlyPropertyTax: monthlyPropertyTax,
                    totalMonthlyPayment: totalMonthlyPayment
                };
                low = midPrice + 1;
            } else {
                // This price is too high, try lower
                high = midPrice - 1;
            }
        }

        return bestResult;
    }

    updateResults(results) {
        // Safety checks - make sure all elements exist
        const elements = [
            'maxHomePrice', 'loanAmount', 'monthlyPayment', 
            'principalInterest', 'monthlyPropertyTax', 'monthlyInsurance', 'totalPITI',
            'frontEndDTI', 'backEndDTI', 'remainingIncome'
        ];
        
        const missingElements = elements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.log('Missing result elements:', missingElements);
            this.restoreResultsStructure();
        }

        // Update main affordability display
        document.getElementById('maxHomePrice').textContent = this.formatCurrency(results.maxHomePrice);
        document.getElementById('loanAmount').textContent = this.formatCurrency(results.loanAmount);
        document.getElementById('monthlyPayment').textContent = this.formatCurrency(results.monthlyPayment);

        // Update payment breakdown
        document.getElementById('principalInterest').textContent = this.formatCurrency(results.principalInterest);
        document.getElementById('monthlyPropertyTax').textContent = this.formatCurrency(results.monthlyPropertyTax);
        document.getElementById('monthlyInsurance').textContent = this.formatCurrency(results.monthlyInsurance);
        document.getElementById('totalPITI').textContent = this.formatCurrency(results.totalPITI);

        // Update DTI analysis
        document.getElementById('frontEndDTI').textContent = `${results.frontEndDTI.toFixed(1)}%`;
        document.getElementById('backEndDTI').textContent = `${results.backEndDTI.toFixed(1)}%`;
        document.getElementById('remainingIncome').textContent = this.formatCurrency(Math.max(0, results.remainingIncome));

        // Add color coding for DTI ratios
        this.updateDTIColors(results.frontEndDTI, results.backEndDTI);

        // Add animation to results
        const resultsContainer = document.getElementById('results');
        resultsContainer.classList.add('result-update');
        setTimeout(() => {
            resultsContainer.classList.remove('result-update');
        }, 300);
    }

    updateDTIColors(frontEndDTI, backEndDTI) {
        const frontEndElement = document.getElementById('frontEndDTI');
        const backEndElement = document.getElementById('backEndDTI');

        // Front-end DTI color coding
        frontEndElement.className = this.getDTIColorClass(frontEndDTI, 28, 36);
        
        // Back-end DTI color coding
        backEndElement.className = this.getDTIColorClass(backEndDTI, 36, 43);
    }

    getDTIColorClass(ratio, goodThreshold, warningThreshold) {
        if (ratio <= goodThreshold) {
            return 'font-medium text-green-600 dark:text-green-400';
        } else if (ratio <= warningThreshold) {
            return 'font-medium text-yellow-600 dark:text-yellow-400';
        } else {
            return 'font-medium text-red-600 dark:text-red-400';
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
            'income': 'annualIncome',
            'debt': 'monthlyDebt',
            'down': 'downPayment',
            'rate': 'interestRate',
            'term': 'loanTerm',
            'tax': 'propertyTaxRate',
            'insurance': 'homeInsurance',
            'dti': 'dtiRatio'
        };

        Object.keys(paramMap).forEach(param => {
            const value = urlParams.get(param);
            if (value !== null) {
                const input = document.getElementById(paramMap[param]);
                if (input) {
                    input.value = value;
                    
                    // Special handling for DTI slider
                    if (param === 'dti') {
                        this.dtiValue.textContent = value;
                        this.updateSliderColor();
                    }
                }
            }
        });
    }

    // Generate affordability scenarios
    generateScenarios() {
        const baseIncome = parseFloat(document.getElementById('annualIncome').value) || 75000;
        const baseDebt = parseFloat(document.getElementById('monthlyDebt').value) || 500;
        const baseDownPayment = parseFloat(document.getElementById('downPayment').value) || 50000;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 6.5;

        const scenarios = [
            { name: 'Conservative (25% DTI)', dti: 25 },
            { name: 'Conventional (28% DTI)', dti: 28 },
            { name: 'Aggressive (36% DTI)', dti: 36 },
            { name: 'Maximum (43% DTI)', dti: 43 }
        ];

        const results = scenarios.map(scenario => {
            const monthlyIncome = baseIncome / 12;
            const maxHousingPayment = (monthlyIncome * scenario.dti) / 100;
            const result = this.findMaxHomePrice(maxHousingPayment, baseDownPayment, interestRate, 30, 1.5, 100);
            
            return {
                ...scenario,
                maxPrice: result ? result.homePrice : 0,
                monthlyPayment: result ? result.totalMonthlyPayment : 0
            };
        });

        return results;
    }
}

// Analytics tracking for affordability calculator
function trackAffordabilityCalculation(results) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'affordability_calculation', {
            'annual_income': parseFloat(document.getElementById('annualIncome').value),
            'max_home_price': results.maxHomePrice,
            'dti_ratio': parseFloat(document.getElementById('dtiRatio').value),
            'down_payment': parseFloat(document.getElementById('downPayment').value)
        });
    }
}

// Utility functions for affordability analysis
function getAffordabilityAdvice(frontEndDTI, backEndDTI) {
    const advice = [];

    if (frontEndDTI > 28) {
        advice.push('Consider increasing your down payment or looking at less expensive homes to improve your front-end DTI ratio.');
    }

    if (backEndDTI > 36) {
        advice.push('Your back-end DTI is high. Consider paying down existing debts before buying a home.');
    }

    if (frontEndDTI <= 25 && backEndDTI <= 30) {
        advice.push('Excellent! Your DTI ratios indicate you\'re in a strong financial position for homebuying.');
    }

    return advice;
}

function calculateRecommendedEmergencyFund(monthlyPayment) {
    // Recommend 3-6 months of housing payments
    return {
        conservative: monthlyPayment * 6,
        moderate: monthlyPayment * 4,
        minimum: monthlyPayment * 3
    };
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new HomeAffordabilityCalculator();
    
    // Load URL parameters if present
    calculator.loadFromURL();
    
    // Set global reference for debugging
    window.affordabilityCalculator = calculator;
});

// Export functionality
function exportAffordabilityResults() {
    const results = {
        personalInfo: {
            annualIncome: parseFloat(document.getElementById('annualIncome').value),
            monthlyDebt: parseFloat(document.getElementById('monthlyDebt').value),
            downPayment: parseFloat(document.getElementById('downPayment').value),
            dtiRatio: parseFloat(document.getElementById('dtiRatio').value)
        },
        loanDetails: {
            interestRate: parseFloat(document.getElementById('interestRate').value),
            loanTerm: parseInt(document.getElementById('loanTerm').value),
            propertyTaxRate: parseFloat(document.getElementById('propertyTaxRate').value),
            homeInsurance: parseFloat(document.getElementById('homeInsurance').value)
        },
        results: {
            maxHomePrice: document.getElementById('maxHomePrice').textContent,
            loanAmount: document.getElementById('loanAmount').textContent,
            monthlyPayment: document.getElementById('monthlyPayment').textContent,
            frontEndDTI: document.getElementById('frontEndDTI').textContent,
            backEndDTI: document.getElementById('backEndDTI').textContent,
            remainingIncome: document.getElementById('remainingIncome').textContent
        },
        calculatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'home-affordability-analysis.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
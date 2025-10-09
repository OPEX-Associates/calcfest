// Main JavaScript for Finance CalcFest
class FinanceCalcHub {
    constructor() {
        this.init();
    }

    init() {
        this.setupDarkMode();
        this.setupMobileMenu();
        this.setupFormValidation();
        this.setupSmoothScrolling();
        this.setupTooltips();
        this.setupAnalytics();
    }

    // Dark Mode Toggle
    setupDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        const html = document.documentElement;

        // Check for saved theme preference or default to 'light'
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            html.classList.add('dark');
            this.updateDarkModeIcon(darkModeIcon, true);
        }

        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDark = html.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                this.updateDarkModeIcon(darkModeIcon, isDark);
            });
        }
    }

    updateDarkModeIcon(icon, isDark) {
        if (!icon) return;
        
        if (isDark) {
            icon.innerHTML = `
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            `;
        } else {
            icon.innerHTML = `
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            `;
        }
    }

    // Mobile Menu Toggle
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    }

    // Form Validation
    setupFormValidation() {
        const forms = document.querySelectorAll('form[data-calculator]');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[type="number"], input[type="text"]');
            
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    this.validateInput(e.target);
                    this.debounce(() => this.calculateResults(form), 300)();
                });

                input.addEventListener('blur', (e) => {
                    this.validateInput(e.target);
                });
            });
        });
    }

    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        
        // Remove previous error states
        input.classList.remove('border-red-500', 'ring-red-500');
        
        // Check if required field is empty
        if (input.required && !input.value.trim()) {
            this.showInputError(input, 'This field is required');
            return false;
        }

        // Check numeric validation
        if (input.type === 'number' && input.value) {
            if (isNaN(value)) {
                this.showInputError(input, 'Please enter a valid number');
                return false;
            }
            
            if (min !== undefined && value < min) {
                this.showInputError(input, `Value must be at least ${min}`);
                return false;
            }
            
            if (max !== undefined && value > max) {
                this.showInputError(input, `Value must be no more than ${max}`);
                return false;
            }
        }

        this.clearInputError(input);
        return true;
    }

    showInputError(input, message) {
        input.classList.add('border-red-500', 'ring-red-500');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 dark:text-red-400 mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    clearInputError(input) {
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Tooltips
    setupTooltips() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
        
        tooltipTriggers.forEach(trigger => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg opacity-0 pointer-events-none transition-opacity duration-200';
            tooltip.textContent = trigger.getAttribute('data-tooltip');
            
            trigger.style.position = 'relative';
            trigger.appendChild(tooltip);

            trigger.addEventListener('mouseenter', () => {
                tooltip.classList.remove('opacity-0');
                tooltip.classList.add('opacity-100');
            });

            trigger.addEventListener('mouseleave', () => {
                tooltip.classList.remove('opacity-100');
                tooltip.classList.add('opacity-0');
            });
        });
    }

    // Analytics Setup (placeholder for future implementation)
    setupAnalytics() {
        // Track calculator usage
        const calculatorForms = document.querySelectorAll('form[data-calculator]');
        
        calculatorForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const calculatorName = form.getAttribute('data-calculator');
                this.trackEvent('calculator_used', {
                    calculator_name: calculatorName,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }

    trackEvent(eventName, data) {
        // Placeholder for analytics tracking
        console.log('Event tracked:', eventName, data);
        
        // Example: Google Analytics 4
        // gtag('event', eventName, data);
        
        // Example: Custom analytics
        // analytics.track(eventName, data);
    }

    // Utility Functions
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

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatPercent(rate, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(rate / 100);
    }

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    // URL Parameter Management
    updateURLParams(params) {
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

    getURLParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        
        return params;
    }

    // Calculator Results Template
    displayResults(containerId, results) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        container.classList.add('result-update');

        Object.keys(results).forEach(key => {
            const result = results[key];
            const resultElement = this.createResultElement(result);
            container.appendChild(resultElement);
        });

        // Remove animation class after animation completes
        setTimeout(() => {
            container.classList.remove('result-update');
        }, 300);
    }

    createResultElement(result) {
        const div = document.createElement('div');
        div.className = 'result-item flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';

        const label = document.createElement('span');
        label.className = 'result-label text-sm font-medium text-gray-600 dark:text-gray-400';
        label.textContent = result.label;

        const value = document.createElement('span');
        value.className = this.getResultValueClass(result.type);
        value.textContent = this.formatResultValue(result.value, result.format);

        div.appendChild(label);
        div.appendChild(value);

        return div;
    }

    getResultValueClass(type) {
        const baseClass = 'font-bold';
        
        switch (type) {
            case 'large':
                return `${baseClass} text-2xl text-primary-600 dark:text-primary-400`;
            case 'success':
                return `${baseClass} text-lg text-green-600 dark:text-green-400`;
            case 'warning':
                return `${baseClass} text-lg text-yellow-600 dark:text-yellow-400`;
            case 'danger':
                return `${baseClass} text-lg text-red-600 dark:text-red-400`;
            default:
                return `${baseClass} text-lg text-gray-900 dark:text-white`;
        }
    }

    formatResultValue(value, format) {
        switch (format) {
            case 'currency':
                return this.formatCurrency(value);
            case 'percent':
                return this.formatPercent(value);
            case 'number':
                return this.formatNumber(value);
            default:
                return value;
        }
    }

    // Error Handling
    showError(message, containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(message);
            return;
        }

        container.innerHTML = `
            <div class="error-message bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span>${message}</span>
                </div>
            </div>
        `;
    }

    clearError(containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    // Common calculation placeholder (to be overridden by specific calculators)
    calculateResults(form) {
        // This method should be overridden by specific calculator implementations
        console.log('Calculate results method should be implemented by specific calculator');
    }
}

// Financial Calculation Utilities
class FinancialCalculations {
    // Monthly Payment Calculation (PMT)
    static calculateMonthlyPayment(principal, annualRate, years) {
        // Input validation
        if (principal <= 0 || years <= 0) {
            throw new Error('Principal and years must be positive numbers');
        }

        if (annualRate < 0 || annualRate > 100) {
            throw new Error('Interest rate must be between 0 and 100');
        }

        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        // Handle zero interest rate case
        if (monthlyRate === 0 || annualRate === 0) {
            return principal / numPayments;
        }
        
        // Standard PMT formula
        const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments);
        const denominator = Math.pow(1 + monthlyRate, numPayments) - 1;
        
        // Additional validation to prevent division by zero or invalid results
        if (denominator === 0 || !isFinite(numerator) || !isFinite(denominator)) {
            throw new Error('Unable to calculate payment with provided parameters');
        }
        
        const monthlyPayment = principal * (numerator / denominator);
        
        // Final validation of result
        if (!isFinite(monthlyPayment) || isNaN(monthlyPayment) || monthlyPayment <= 0) {
            throw new Error('Calculated payment is invalid');
        }
        
        return monthlyPayment;
    }

    // Present Value Calculation
    static calculatePresentValue(futureValue, annualRate, years) {
        const rate = annualRate / 100;
        return futureValue / Math.pow(1 + rate, years);
    }

    // Future Value Calculation
    static calculateFutureValue(presentValue, annualRate, years, monthlyContribution = 0) {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        const futureValuePrincipal = presentValue * Math.pow(1 + monthlyRate, numPayments);
        
        if (monthlyContribution > 0) {
            const futureValueContributions = monthlyContribution * 
                ((Math.pow(1 + monthlyRate, numPayments) - 1) / monthlyRate);
            return futureValuePrincipal + futureValueContributions;
        }
        
        return futureValuePrincipal;
    }

    // Amortization Schedule Generation
    static generateAmortizationSchedule(principal, annualRate, years, startDate = new Date()) {
        const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, years);
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        
        const schedule = [];
        let remainingBalance = principal;
        let currentDate = new Date(startDate);
        
        for (let i = 1; i <= numPayments; i++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance -= principalPayment;
            
            // Ensure remaining balance doesn't go negative due to rounding
            if (remainingBalance < 0.01) {
                remainingBalance = 0;
            }
            
            schedule.push({
                paymentNumber: i,
                date: new Date(currentDate),
                monthlyPayment: monthlyPayment,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                remainingBalance: remainingBalance
            });
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return schedule;
    }

    // Cap Rate Calculation
    static calculateCapRate(netOperatingIncome, propertyValue) {
        return (netOperatingIncome / propertyValue) * 100;
    }

    // Cash-on-Cash Return
    static calculateCashOnCashReturn(annualCashFlow, totalCashInvested) {
        return (annualCashFlow / totalCashInvested) * 100;
    }

    // Gross Rent Multiplier
    static calculateGRM(propertyPrice, monthlyRent) {
        return propertyPrice / (monthlyRent * 12);
    }

    // Debt-to-Income Ratio
    static calculateDTI(monthlyDebtPayments, monthlyGrossIncome) {
        return (monthlyDebtPayments / monthlyGrossIncome) * 100;
    }

    // Loan-to-Value Ratio
    static calculateLTV(loanAmount, propertyValue) {
        return (loanAmount / propertyValue) * 100;
    }

    // Compound Interest Calculation
    static calculateCompoundInterest(principal, annualRate, compoundingFrequency, years) {
        const rate = annualRate / 100;
        return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeCalcHub = new FinanceCalcHub();
    window.FinancialCalculations = FinancialCalculations;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FinanceCalcHub, FinancialCalculations };
}
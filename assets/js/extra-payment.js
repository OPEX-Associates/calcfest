class ExtraPaymentCalculator {
    constructor() {
        this.form = document.getElementById('extraPaymentForm');
        this.resultsContainer = document.getElementById('calculationResults');
        this.detailedResults = document.getElementById('detailedResults');
        
        this.bindEvents();
        this.setDefaultDates();
        this.updatePaymentTypeDisplay();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculatePayments();
        });

        // Real-time calculations on input change
        this.form.addEventListener('input', (e) => {
            if (e.target.name === 'paymentType') {
                this.updatePaymentTypeDisplay();
            }
            if (this.isFormValid()) {
                this.calculatePayments();
            }
        });

        // Payment type radio button styling
        this.form.addEventListener('change', (e) => {
            if (e.target.name === 'paymentType') {
                this.updatePaymentTypeStyles();
                this.updatePaymentTypeDisplay();
            }
        });

        // Format currency inputs
        const currencyInputs = ['loanAmount', 'extraAmount'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });
        });
    }

    setDefaultDates() {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
        
        document.getElementById('startDate').value = currentMonth;
        document.getElementById('startMonth').value = currentMonth;
    }

    updatePaymentTypeDisplay() {
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        const startPaymentMonth = document.getElementById('startPaymentMonth');
        
        if (paymentType === 'onetime') {
            startPaymentMonth.classList.remove('hidden');
            document.querySelector('label[for="startMonth"]').textContent = 'One-Time Payment Date';
        } else if (paymentType === 'monthly' || paymentType === 'yearly') {
            startPaymentMonth.classList.remove('hidden');
            document.querySelector('label[for="startMonth"]').textContent = 'Start Extra Payments';
        }
    }

    updatePaymentTypeStyles() {
        const radioButtons = document.querySelectorAll('input[name="paymentType"]');
        radioButtons.forEach(radio => {
            const container = radio.parentElement.querySelector('div');
            if (radio.checked) {
                container.className = container.className.replace(/border-gray-\d+/g, 'border-green-500')
                    .replace(/dark:border-gray-\d+/g, 'dark:border-green-400')
                    + ' bg-green-100 dark:bg-green-900/30';
            } else {
                container.className = container.className.replace(/border-green-\d+/g, 'border-gray-200')
                    .replace(/dark:border-green-\d+/g, 'dark:border-gray-700')
                    .replace(/bg-green-\d+/g, '')
                    .replace(/dark:bg-green-\S+/g, '') + ' hover:border-green-300 dark:hover:border-green-600';
            }
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
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const loanTerm = parseInt(document.getElementById('loanTerm').value);
        const extraAmount = this.parseCurrencyInput(document.getElementById('extraAmount'));

        return loanAmount > 0 && interestRate > 0 && loanTerm > 0 && extraAmount > 0;
    }

    calculatePayments() {
        if (!this.isFormValid()) return;

        // Get input values
        const loanAmount = this.parseCurrencyInput(document.getElementById('loanAmount'));
        const annualInterestRate = parseFloat(document.getElementById('interestRate').value) / 100;
        const loanTermYears = parseInt(document.getElementById('loanTerm').value);
        const startDate = new Date(document.getElementById('startDate').value + '-01');
        const extraAmount = this.parseCurrencyInput(document.getElementById('extraAmount'));
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        const startExtraDate = new Date(document.getElementById('startMonth').value + '-01');

        // Calculate standard monthly payment
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfMonthlyPayments = loanTermYears * 12;
        
        const monthlyPayment = this.calculateMonthlyPayment(
            loanAmount, 
            monthlyInterestRate, 
            numberOfMonthlyPayments
        );

        // Calculate standard amortization schedule
        const standardSchedule = this.calculateAmortizationSchedule(
            loanAmount, 
            monthlyInterestRate, 
            monthlyPayment, 
            startDate,
            0, // no extra payment
            'monthly',
            startExtraDate
        );

        // Calculate amortization schedule with extra payments
        const extraSchedule = this.calculateAmortizationSchedule(
            loanAmount, 
            monthlyInterestRate, 
            monthlyPayment, 
            startDate,
            extraAmount,
            paymentType,
            startExtraDate
        );

        // Calculate savings
        const savings = this.calculateSavings(standardSchedule, extraSchedule);

        // Display results
        this.displayResults({
            monthlyPayment,
            extraAmount,
            paymentType,
            standardSchedule,
            extraSchedule,
            savings
        });
    }

    calculateMonthlyPayment(principal, monthlyRate, numberOfPayments) {
        if (monthlyRate === 0) {
            return principal / numberOfPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
               (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    calculateAmortizationSchedule(principal, monthlyRate, payment, startDate, extraAmount, extraType, extraStartDate) {
        let balance = principal;
        let totalInterest = 0;
        let paymentCount = 0;
        let currentDate = new Date(startDate);
        
        const payments = [];
        const maxPayments = 480; // Safety limit (40 years)

        while (balance > 0.01 && paymentCount < maxPayments) {
            const interestPayment = balance * monthlyRate;
            let principalPayment = payment - interestPayment;
            
            // Calculate extra payment for this month
            let currentExtraPayment = 0;
            if (currentDate >= extraStartDate) {
                if (extraType === 'monthly') {
                    currentExtraPayment = extraAmount;
                } else if (extraType === 'yearly' && currentDate.getMonth() === extraStartDate.getMonth()) {
                    currentExtraPayment = extraAmount;
                } else if (extraType === 'onetime' && 
                          currentDate.getFullYear() === extraStartDate.getFullYear() && 
                          currentDate.getMonth() === extraStartDate.getMonth()) {
                    currentExtraPayment = extraAmount;
                }
            }

            // Add extra payment to principal
            principalPayment += currentExtraPayment;
            
            // Handle final payment
            if (principalPayment > balance) {
                principalPayment = balance;
                currentExtraPayment = Math.max(0, principalPayment - (payment - interestPayment));
                payment = principalPayment + interestPayment;
            }
            
            balance -= principalPayment;
            totalInterest += interestPayment;
            paymentCount++;

            payments.push({
                paymentNumber: paymentCount,
                payment: payment,
                principal: principalPayment - currentExtraPayment,
                extraPayment: currentExtraPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                date: new Date(currentDate)
            });

            // Advance date
            currentDate.setMonth(currentDate.getMonth() + 1);

            if (balance <= 0.01) break;
        }

        return {
            payments,
            totalPayments: paymentCount,
            totalInterest,
            totalPaid: principal + totalInterest + (extraType === 'monthly' ? extraAmount * paymentCount : 
                      extraType === 'yearly' ? extraAmount * Math.ceil(paymentCount / 12) : extraAmount),
            payoffDate: payments[payments.length - 1]?.date || currentDate
        };
    }

    calculateSavings(standardSchedule, extraSchedule) {
        const interestSavings = standardSchedule.totalInterest - extraSchedule.totalInterest;
        const paymentsSaved = standardSchedule.totalPayments - extraSchedule.totalPayments;
        
        // Calculate time saved in years
        const standardPayoffTime = standardSchedule.payoffDate.getTime();
        const extraPayoffTime = extraSchedule.payoffDate.getTime();
        const timeSavedMs = standardPayoffTime - extraPayoffTime;
        const timeSavedYears = timeSavedMs / (1000 * 60 * 60 * 24 * 365.25);

        return {
            interestSavings,
            paymentsSaved,
            timeSavedYears
        };
    }

    displayResults(results) {
        const {
            monthlyPayment,
            extraAmount,
            paymentType,
            standardSchedule,
            extraSchedule,
            savings
        } = results;

        // Format extra payment display based on type
        let extraPaymentDisplay = '';
        if (paymentType === 'monthly') {
            extraPaymentDisplay = `+${this.formatCurrency(extraAmount)}/month`;
        } else if (paymentType === 'yearly') {
            extraPaymentDisplay = `+${this.formatCurrency(extraAmount)}/year`;
        } else {
            extraPaymentDisplay = `+${this.formatCurrency(extraAmount)} one-time`;
        }

        // Update quick results panel
        this.resultsContainer.innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Standard Payment</h4>
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${this.formatCurrency(monthlyPayment)}</p>
                    <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">Monthly payment only</p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">With Extra Payment</h4>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">${this.formatCurrency(monthlyPayment)}</p>
                    <p class="text-sm text-green-700 dark:text-green-300 mt-1">${extraPaymentDisplay}</p>
                </div>
                
                <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-800/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3">You Save</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-sm text-green-700 dark:text-green-300">Interest:</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${this.formatCurrency(savings.interestSavings)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-green-700 dark:text-green-300">Time:</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${this.formatYears(savings.timeSavedYears)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update detailed results
        this.updateDetailedResults(results);
        
        // Show detailed results section
        this.detailedResults.classList.remove('hidden');
    }

    updateDetailedResults(results) {
        const {
            monthlyPayment,
            extraAmount,
            paymentType,
            standardSchedule,
            extraSchedule,
            savings
        } = results;

        // Calculate effective monthly payment for display
        let effectiveMonthlyPayment = monthlyPayment;
        if (paymentType === 'monthly') {
            effectiveMonthlyPayment += extraAmount;
        }

        // Update standard payment details
        document.getElementById('standardPayment').textContent = this.formatCurrency(monthlyPayment);
        document.getElementById('standardTotalPayments').textContent = standardSchedule.totalPayments.toLocaleString();
        document.getElementById('standardTotalInterest').textContent = this.formatCurrency(standardSchedule.totalInterest);
        document.getElementById('standardPayoffDate').textContent = this.formatDate(standardSchedule.payoffDate);

        // Update extra payment details
        document.getElementById('extraPayment').textContent = this.formatCurrency(effectiveMonthlyPayment);
        document.getElementById('extraTotalPayments').textContent = extraSchedule.totalPayments.toLocaleString();
        document.getElementById('extraTotalInterest').textContent = this.formatCurrency(extraSchedule.totalInterest);
        document.getElementById('extraPayoffDate').textContent = this.formatDate(extraSchedule.payoffDate);

        // Update savings summary
        document.getElementById('interestSavings').textContent = this.formatCurrency(savings.interestSavings);
        document.getElementById('timeSaved').textContent = this.formatYears(savings.timeSavedYears);
        document.getElementById('paymentsSaved').textContent = savings.paymentsSaved.toLocaleString();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short'
        }).format(date);
    }

    formatYears(years) {
        const wholeYears = Math.floor(years);
        const months = Math.round((years - wholeYears) * 12);
        
        if (wholeYears === 0) {
            return `${months} months`;
        } else if (months === 0) {
            return `${wholeYears} years`;
        } else {
            return `${wholeYears}.${Math.round(months/12*10)} years`;
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExtraPaymentCalculator();
});
class BiweeklyMortgageCalculator {
    constructor() {
        this.form = document.getElementById('biweeklyForm');
        this.resultsContainer = document.getElementById('calculationResults');
        this.detailedResults = document.getElementById('detailedResults');
        
        this.bindEvents();
        this.setDefaultDate();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculatePayments();
        });

        // Real-time calculations on input change
        this.form.addEventListener('input', () => {
            if (this.isFormValid()) {
                this.calculatePayments();
            }
        });

        // Format loan amount input
        const loanAmountInput = document.getElementById('loanAmount');
        loanAmountInput.addEventListener('input', (e) => {
            this.formatCurrencyInput(e.target);
        });
    }

    setDefaultDate() {
        const startDateInput = document.getElementById('startDate');
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
        startDateInput.value = currentMonth;
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

        return loanAmount > 0 && interestRate > 0 && loanTerm > 0;
    }

    calculatePayments() {
        if (!this.isFormValid()) return;

        // Get input values
        const loanAmount = this.parseCurrencyInput(document.getElementById('loanAmount'));
        const annualInterestRate = parseFloat(document.getElementById('interestRate').value) / 100;
        const loanTermYears = parseInt(document.getElementById('loanTerm').value);
        const startDate = new Date(document.getElementById('startDate').value + '-01');

        // Calculate monthly payment
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfMonthlyPayments = loanTermYears * 12;
        
        const monthlyPayment = this.calculateMonthlyPayment(
            loanAmount, 
            monthlyInterestRate, 
            numberOfMonthlyPayments
        );

        // Calculate biweekly payment (half of monthly)
        const biweeklyPayment = monthlyPayment / 2;

        // Calculate payoff schedules
        const monthlySchedule = this.calculateAmortizationSchedule(
            loanAmount, 
            monthlyInterestRate, 
            monthlyPayment, 
            'monthly',
            startDate
        );

        const biweeklySchedule = this.calculateAmortizationSchedule(
            loanAmount, 
            annualInterestRate / 26, // Biweekly interest rate
            biweeklyPayment, 
            'biweekly',
            startDate
        );

        // Calculate savings
        const savings = this.calculateSavings(monthlySchedule, biweeklySchedule);

        // Display results
        this.displayResults({
            monthlyPayment,
            biweeklyPayment,
            monthlySchedule,
            biweeklySchedule,
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

    calculateAmortizationSchedule(principal, periodicRate, payment, frequency, startDate) {
        let balance = principal;
        let totalInterest = 0;
        let paymentCount = 0;
        let currentDate = new Date(startDate);
        
        const payments = [];
        const maxPayments = frequency === 'monthly' ? 360 : 780; // Safety limit

        while (balance > 0.01 && paymentCount < maxPayments) {
            const interestPayment = balance * periodicRate;
            let principalPayment = payment - interestPayment;
            
            // Handle final payment
            if (principalPayment > balance) {
                principalPayment = balance;
                payment = principalPayment + interestPayment;
            }
            
            balance -= principalPayment;
            totalInterest += interestPayment;
            paymentCount++;

            payments.push({
                paymentNumber: paymentCount,
                payment: payment,
                principal: principalPayment,
                interest: interestPayment,
                balance: Math.max(0, balance),
                date: new Date(currentDate)
            });

            // Advance date
            if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                currentDate.setDate(currentDate.getDate() + 14);
            }

            if (balance <= 0.01) break;
        }

        return {
            payments,
            totalPayments: paymentCount,
            totalInterest,
            totalPaid: principal + totalInterest,
            payoffDate: payments[payments.length - 1]?.date || currentDate
        };
    }

    calculateSavings(monthlySchedule, biweeklySchedule) {
        const interestSavings = monthlySchedule.totalInterest - biweeklySchedule.totalInterest;
        const paymentsSaved = monthlySchedule.totalPayments - biweeklySchedule.totalPayments;
        
        // Calculate time saved in years and months
        const monthlyPayoffTime = monthlySchedule.payoffDate.getTime();
        const biweeklyPayoffTime = biweeklySchedule.payoffDate.getTime();
        const timeSavedMs = monthlyPayoffTime - biweeklyPayoffTime;
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
            biweeklyPayment,
            monthlySchedule,
            biweeklySchedule,
            savings
        } = results;

        // Update quick results panel
        this.resultsContainer.innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Monthly Payment</h4>
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${this.formatCurrency(monthlyPayment)}</p>
                    <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">12 payments/year</p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 dark:text-green-100 mb-2">Biweekly Payment</h4>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">${this.formatCurrency(biweeklyPayment)}</p>
                    <p class="text-sm text-green-700 dark:text-green-300 mt-1">26 payments/year</p>
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
            biweeklyPayment,
            monthlySchedule,
            biweeklySchedule,
            savings
        } = results;

        // Update monthly payment details
        document.getElementById('monthlyPayment').textContent = this.formatCurrency(monthlyPayment);
        document.getElementById('monthlyTotalPayments').textContent = monthlySchedule.totalPayments.toLocaleString();
        document.getElementById('monthlyTotalInterest').textContent = this.formatCurrency(monthlySchedule.totalInterest);
        document.getElementById('monthlyPayoffDate').textContent = this.formatDate(monthlySchedule.payoffDate);

        // Update biweekly payment details
        document.getElementById('biweeklyPayment').textContent = this.formatCurrency(biweeklyPayment);
        document.getElementById('biweeklyTotalPayments').textContent = biweeklySchedule.totalPayments.toLocaleString();
        document.getElementById('biweeklyTotalInterest').textContent = this.formatCurrency(biweeklySchedule.totalInterest);
        document.getElementById('biweeklyPayoffDate').textContent = this.formatDate(biweeklySchedule.payoffDate);

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
    new BiweeklyMortgageCalculator();
});
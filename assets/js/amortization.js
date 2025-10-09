// Amortization Schedule Calculator
class AmortizationCalculator {
    constructor() {
        this.form = document.getElementById('amortizationForm');
        this.schedule = [];
        this.currentPage = 1;
        this.rowsPerPage = 12;
        this.viewMode = 'monthly'; // 'monthly' or 'yearly'
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupEventListeners();
        this.setDefaultDate();
        this.calculateSchedule(); // Calculate with default values
    }

    setupEventListeners() {
        // Add input event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debounce(() => this.calculateSchedule(), 300)();
            });
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateSchedule();
        });

        // View mode buttons
        document.getElementById('viewAll').addEventListener('click', () => this.setViewMode('monthly'));
        document.getElementById('viewYearly').addEventListener('click', () => this.setViewMode('yearly'));
        
        // Search functionality
        document.getElementById('searchPayment').addEventListener('click', () => this.toggleSearch());
        document.getElementById('paymentNumber').addEventListener('input', (e) => {
            const paymentNum = parseInt(e.target.value);
            if (paymentNum && paymentNum > 0) {
                this.jumpToPayment(paymentNum);
            }
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Export functionality
        document.getElementById('exportCSV').addEventListener('click', () => this.exportToCSV());
        document.getElementById('exportPDF').addEventListener('click', () => this.printSchedule());
    }

    setDefaultDate() {
        const today = new Date();
        // Set to first day of next month
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const dateString = nextMonth.toISOString().split('T')[0];
        document.getElementById('startDate').value = dateString;
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

    calculateSchedule() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get form values with proper validation
            const loanAmount = this.parseAndValidateNumber(document.getElementById('loanAmount').value, 'Loan Amount', 1000, 100000000);
            const interestRate = this.parseAndValidateNumber(document.getElementById('interestRate').value, 'Interest Rate', 0, 50);
            const loanTerm = this.parseAndValidateNumber(document.getElementById('loanTerm').value, 'Loan Term', 1, 50);
            const extraPayment = this.parseAndValidateNumber(document.getElementById('extraPayment').value, 'Extra Payment', 0, 99999);
            const startDateValue = document.getElementById('startDate').value;

            // Check for validation errors
            if (loanAmount === null || interestRate === null || loanTerm === null || extraPayment === null) {
                this.displayError('An error occurred while calculating the schedule. Please verify all input values are valid numbers.');
                return;
            }

            if (!startDateValue) {
                this.displayError('Please select a start date');
                return;
            }

            const startDate = new Date(startDateValue);
            if (isNaN(startDate.getTime())) {
                this.displayError('Please enter a valid start date');
                return;
            }

            // Calculate monthly payment
            let monthlyPayment;
            try {
                monthlyPayment = FinancialCalculations.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            } catch (error) {
                this.displayError('Unable to calculate payment with provided parameters');
                return;
            }

            // Generate amortization schedule
            this.schedule = this.generateAmortizationSchedule(
                loanAmount, 
                interestRate, 
                loanTerm, 
                startDate, 
                extraPayment
            );

            // Calculate summary information
            const summary = this.calculateSummary(this.schedule, loanAmount, extraPayment);

            // Update display
            this.updateSummary(summary);
            this.displaySchedule();

            // Update URL parameters
            this.updateURL({
                amount: loanAmount,
                rate: interestRate,
                term: loanTerm,
                extra: extraPayment,
                start: startDateValue
            });

        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('An error occurred while calculating the schedule. Please verify all input values are valid.');
        }
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values for optional fields
        if (!value || value.trim() === '') {
            return fieldName === 'Extra Payment' ? 0 : null;
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
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Payment</span>
                <span id="monthlyPayment" class="text-2xl font-bold text-primary-600 dark:text-primary-400">$1,799</span>
            </div>
            
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total of Payments</span>
                <span id="totalPayments" class="text-lg font-bold text-gray-900 dark:text-white">$647,514</span>
            </div>
            
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interest</span>
                <span id="totalInterest" class="text-lg font-bold text-red-600 dark:text-red-400">$347,514</span>
            </div>
            
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Interest as % of Total</span>
                <span id="interestPercentage" class="text-lg font-bold text-gray-900 dark:text-white">53.7%</span>
            </div>

            <!-- Extra Payment Benefits -->
            <div id="extraPaymentBenefits" class="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg" style="display: none;">
                <h3 class="text-sm font-bold text-green-800 dark:text-green-200 mb-2">Extra Payment Benefits</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-green-700 dark:text-green-300">Interest Saved:</span>
                        <span id="interestSaved" class="font-bold text-green-800 dark:text-green-200">$0</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-green-700 dark:text-green-300">Time Saved:</span>
                        <span id="timeSaved" class="font-bold text-green-800 dark:text-green-200">0 months</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayDefaultResults() {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <p class="mb-2">Enter loan details to generate amortization schedule</p>
                <p class="text-sm">Complete payment breakdown will appear here</p>
            </div>
        `;
    }

    generateAmortizationSchedule(principal, annualRate, years, startDate, extraPayment = 0) {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        const monthlyPayment = FinancialCalculations.calculateMonthlyPayment(principal, annualRate, years);
        
        const schedule = [];
        let remainingBalance = principal;
        let currentDate = new Date(startDate);
        let paymentNumber = 1;
        
        while (remainingBalance > 0.01 && paymentNumber <= numPayments * 2) { // Safety limit
            const interestPayment = remainingBalance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Add extra payment to principal
            if (extraPayment > 0) {
                principalPayment += extraPayment;
            }
            
            // Ensure we don't overpay
            if (principalPayment > remainingBalance) {
                principalPayment = remainingBalance;
                const actualPayment = interestPayment + principalPayment;
                
                schedule.push({
                    paymentNumber: paymentNumber,
                    date: new Date(currentDate),
                    monthlyPayment: actualPayment,
                    principalPayment: principalPayment,
                    interestPayment: interestPayment,
                    remainingBalance: 0
                });
                break;
            }
            
            remainingBalance -= principalPayment;
            
            schedule.push({
                paymentNumber: paymentNumber,
                date: new Date(currentDate),
                monthlyPayment: monthlyPayment + extraPayment,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                remainingBalance: remainingBalance
            });
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            paymentNumber++;
        }
        
        return schedule;
    }

    calculateSummary(schedule, originalLoanAmount, extraPayment) {
        const totalPayments = schedule.reduce((sum, payment) => sum + payment.monthlyPayment, 0);
        const totalInterest = schedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
        const interestPercentage = (totalInterest / totalPayments) * 100;
        
        let summary = {
            monthlyPayment: schedule.length > 0 ? schedule[0].monthlyPayment - extraPayment : 0,
            totalPayments: totalPayments,
            totalInterest: totalInterest,
            interestPercentage: interestPercentage,
            totalMonths: schedule.length
        };

        // Calculate extra payment benefits if applicable
        if (extraPayment > 0) {
            const baseMonthlyPayment = summary.monthlyPayment;
            const baseSchedule = this.generateAmortizationSchedule(
                originalLoanAmount,
                parseFloat(document.getElementById('interestRate').value),
                parseInt(document.getElementById('loanTerm').value),
                new Date(document.getElementById('startDate').value),
                0
            );
            
            const baseTotalInterest = baseSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
            const interestSaved = baseTotalInterest - totalInterest;
            const timeSaved = baseSchedule.length - schedule.length;
            
            summary.extraPaymentBenefits = {
                interestSaved: interestSaved,
                timeSaved: timeSaved
            };
        }

        return summary;
    }

    updateSummary(summary) {
        // Add safety checks for DOM elements
        const monthlyPaymentEl = document.getElementById('monthlyPayment');
        const totalPaymentsEl = document.getElementById('totalPayments');
        const totalInterestEl = document.getElementById('totalInterest');
        const interestPercentageEl = document.getElementById('interestPercentage');
        
        if (!monthlyPaymentEl || !totalPaymentsEl || !totalInterestEl || !interestPercentageEl) {
            console.warn('Some required DOM elements are missing, restoring structure');
            this.restoreResultsStructure();
            // Retry after restoration
            return this.updateSummary(summary);
        }

        monthlyPaymentEl.textContent = this.formatCurrency(summary.monthlyPayment);
        totalPaymentsEl.textContent = this.formatCurrency(summary.totalPayments);
        totalInterestEl.textContent = this.formatCurrency(summary.totalInterest);
        interestPercentageEl.textContent = `${summary.interestPercentage.toFixed(1)}%`;

        // Show/hide extra payment benefits
        const benefitsDiv = document.getElementById('extraPaymentBenefits');
        if (benefitsDiv && summary.extraPaymentBenefits) {
            const interestSavedEl = document.getElementById('interestSaved');
            const timeSavedEl = document.getElementById('timeSaved');
            
            if (interestSavedEl && timeSavedEl) {
                interestSavedEl.textContent = this.formatCurrency(summary.extraPaymentBenefits.interestSaved);
                timeSavedEl.textContent = `${summary.extraPaymentBenefits.timeSaved} months`;
                benefitsDiv.style.display = 'block';
            }
        } else if (benefitsDiv) {
            benefitsDiv.style.display = 'none';
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.currentPage = 1;
        
        // Update button states
        const buttons = ['viewAll', 'viewYearly'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            btn.className = btn.className.replace('text-primary-600 dark:text-primary-400', 'text-gray-600 dark:text-gray-400');
        });
        
        const activeBtn = mode === 'monthly' ? 'viewAll' : 'viewYearly';
        const activeBtnEl = document.getElementById(activeBtn);
        activeBtnEl.className = activeBtnEl.className.replace('text-gray-600 dark:text-gray-400', 'text-primary-600 dark:text-primary-400');
        
        this.displaySchedule();
    }

    displaySchedule() {
        const tbody = document.getElementById('scheduleBody');
        tbody.innerHTML = '';

        if (this.schedule.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No data to display</td></tr>';
            return;
        }

        let displayData = this.schedule;
        
        if (this.viewMode === 'yearly') {
            displayData = this.aggregateByYear();
        }

        // Pagination
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const pageData = displayData.slice(startIndex, endIndex);

        pageData.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            if (this.viewMode === 'yearly') {
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Year ${row.year}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${row.payments} payments</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.totalPayment)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.totalPrincipal)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.totalInterest)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.endingBalance)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${row.paymentNumber}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatDate(row.date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.monthlyPayment)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">${this.formatCurrency(row.principalPayment)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">${this.formatCurrency(row.interestPayment)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${this.formatCurrency(row.remainingBalance)}</td>
                `;
            }
            
            tbody.appendChild(tr);
        });

        this.updatePagination(displayData.length);
    }

    aggregateByYear() {
        const yearlyData = [];
        let currentYear = null;
        let yearData = null;

        this.schedule.forEach(payment => {
            const year = payment.date.getFullYear();
            
            if (year !== currentYear) {
                if (yearData) {
                    yearlyData.push(yearData);
                }
                currentYear = year;
                yearData = {
                    year: year,
                    payments: 0,
                    totalPayment: 0,
                    totalPrincipal: 0,
                    totalInterest: 0,
                    endingBalance: 0
                };
            }
            
            yearData.payments++;
            yearData.totalPayment += payment.monthlyPayment;
            yearData.totalPrincipal += payment.principalPayment;
            yearData.totalInterest += payment.interestPayment;
            yearData.endingBalance = payment.remainingBalance;
        });
        
        if (yearData) {
            yearlyData.push(yearData);
        }

        return yearlyData;
    }

    updatePagination(totalRows) {
        const totalPages = Math.ceil(totalRows / this.rowsPerPage);
        const startRow = (this.currentPage - 1) * this.rowsPerPage + 1;
        const endRow = Math.min(this.currentPage * this.rowsPerPage, totalRows);

        document.getElementById('currentRange').textContent = `${startRow}-${endRow}`;
        document.getElementById('totalPayments').textContent = totalRows;

        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displaySchedule();
        }
    }

    nextPage() {
        const displayData = this.viewMode === 'yearly' ? this.aggregateByYear() : this.schedule;
        const totalPages = Math.ceil(displayData.length / this.rowsPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displaySchedule();
        }
    }

    toggleSearch() {
        const searchBox = document.getElementById('searchBox');
        searchBox.classList.toggle('hidden');
        if (!searchBox.classList.contains('hidden')) {
            document.getElementById('paymentNumber').focus();
        }
    }

    jumpToPayment(paymentNumber) {
        if (paymentNumber < 1 || paymentNumber > this.schedule.length) {
            return;
        }

        this.viewMode = 'monthly';
        this.setViewMode('monthly');
        
        const pageNumber = Math.ceil(paymentNumber / this.rowsPerPage);
        this.currentPage = pageNumber;
        this.displaySchedule();

        // Highlight the specific row
        setTimeout(() => {
            const rows = document.querySelectorAll('#scheduleBody tr');
            const rowIndex = (paymentNumber - 1) % this.rowsPerPage;
            if (rows[rowIndex]) {
                rows[rowIndex].classList.add('bg-yellow-100', 'dark:bg-yellow-900');
                rows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    rows[rowIndex].classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
                }, 3000);
            }
        }, 100);
    }

    exportToCSV() {
        if (this.schedule.length === 0) return;

        const headers = ['Payment Number', 'Date', 'Payment Amount', 'Principal', 'Interest', 'Remaining Balance'];
        const csvContent = [
            headers.join(','),
            ...this.schedule.map(row => [
                row.paymentNumber,
                this.formatDate(row.date),
                row.monthlyPayment.toFixed(2),
                row.principalPayment.toFixed(2),
                row.interestPayment.toFixed(2),
                row.remainingBalance.toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'amortization-schedule.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    printSchedule() {
        window.print();
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

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
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
    new AmortizationCalculator();
});
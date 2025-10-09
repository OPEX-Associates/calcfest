/**
 * Amortization Schedule Calculator
 * Generates detailed payment schedules with principal, interest, and balance breakdowns
 */

class AmortizationScheduleCalculator {
    constructor() {
        this.form = document.getElementById('amortizationForm');
        this.scheduleData = [];
        this.currentView = 'monthly';
        this.initializeEventListeners();
        this.formatInputs();
        this.setDefaultDate();
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Real-time calculation on input change
            const inputs = ['loanAmount', 'interestRate', 'loanTerm', 'startDate'];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => this.handleInputChange());
                }
            });
        }

        // View toggle buttons
        const monthlyBtn = document.getElementById('viewMonthly');
        const yearlyBtn = document.getElementById('viewYearly');
        const exportBtn = document.getElementById('exportSchedule');

        if (monthlyBtn) {
            monthlyBtn.addEventListener('click', () => this.switchView('monthly'));
        }
        if (yearlyBtn) {
            yearlyBtn.addEventListener('click', () => this.switchView('yearly'));
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }
    }

    formatInputs() {
        // Format currency input
        const loanAmountInput = document.getElementById('loanAmount');
        if (loanAmountInput) {
            loanAmountInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
            });
        }
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d]/g, '');
        if (value) {
            value = parseInt(value).toLocaleString();
        }
        input.value = value;
    }

    setDefaultDate() {
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const formattedDate = nextMonth.toISOString().slice(0, 7); // YYYY-MM format
            startDateInput.value = formattedDate;
        }
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button styling
        const monthlyBtn = document.getElementById('viewMonthly');
        const yearlyBtn = document.getElementById('viewYearly');
        
        if (view === 'monthly') {
            monthlyBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            monthlyBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
            yearlyBtn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            yearlyBtn.classList.add('text-gray-600', 'dark:text-gray-400');
        } else {
            yearlyBtn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            yearlyBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
            monthlyBtn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            monthlyBtn.classList.add('text-gray-600', 'dark:text-gray-400');
        }
        
        // Redisplay schedule with new view
        if (this.scheduleData.length > 0) {
            this.displaySchedule();
        }
    }

    handleInputChange() {
        // Debounce calculation
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            this.calculateAndDisplay();
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        this.calculateAndDisplay();
    }

    parseNumber(value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
        }
        return parseFloat(value) || 0;
    }

    calculateMonthlyPayment(principal, rate, years) {
        const monthlyRate = rate / 100 / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    generateAmortizationSchedule(loanAmount, interestRate, loanTerm, startDate) {
        const monthlyPayment = this.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanTerm * 12;
        
        const schedule = [];
        let remainingBalance = loanAmount;
        let totalInterest = 0;
        let totalPrincipal = 0;
        
        const currentDate = new Date(startDate + '-01');
        
        for (let payment = 1; payment <= totalPayments; payment++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            
            remainingBalance -= principalPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            
            // Ensure remaining balance doesn't go negative due to rounding
            if (remainingBalance < 0.01) {
                remainingBalance = 0;
            }
            
            schedule.push({
                paymentNumber: payment,
                date: new Date(currentDate),
                monthlyPayment,
                principalPayment,
                interestPayment,
                remainingBalance,
                totalInterest,
                totalPrincipal
            });
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        return schedule;
    }

    generateYearlySchedule(monthlySchedule) {
        const yearlySchedule = [];
        let currentYear = null;
        let yearlyData = null;
        
        monthlySchedule.forEach(payment => {
            const year = payment.date.getFullYear();
            
            if (year !== currentYear) {
                if (yearlyData) {
                    yearlySchedule.push(yearlyData);
                }
                
                currentYear = year;
                yearlyData = {
                    year,
                    startDate: new Date(payment.date),
                    endDate: new Date(payment.date),
                    paymentsCount: 0,
                    totalPayments: 0,
                    totalPrincipal: 0,
                    totalInterest: 0,
                    startingBalance: payment.remainingBalance + payment.principalPayment,
                    endingBalance: 0
                };
            }
            
            yearlyData.endDate = new Date(payment.date);
            yearlyData.paymentsCount++;
            yearlyData.totalPayments += payment.monthlyPayment;
            yearlyData.totalPrincipal += payment.principalPayment;
            yearlyData.totalInterest += payment.interestPayment;
            yearlyData.endingBalance = payment.remainingBalance;
        });
        
        if (yearlyData) {
            yearlySchedule.push(yearlyData);
        }
        
        return yearlySchedule;
    }

    calculateAndDisplay() {
        const loanAmount = this.parseNumber(document.getElementById('loanAmount').value);
        const interestRate = this.parseNumber(document.getElementById('interestRate').value);
        const loanTerm = this.parseNumber(document.getElementById('loanTerm').value);
        const startDate = document.getElementById('startDate').value;

        if (!loanAmount || !interestRate || !loanTerm || !startDate) {
            this.showError('Please fill in all required fields.');
            return;
        }

        try {
            this.scheduleData = this.generateAmortizationSchedule(loanAmount, interestRate, loanTerm, startDate);
            
            const monthlyPayment = this.scheduleData[0].monthlyPayment;
            const totalInterest = this.scheduleData[this.scheduleData.length - 1].totalInterest;
            const totalPayments = monthlyPayment * this.scheduleData.length;
            
            this.displaySummary(monthlyPayment, totalInterest, totalPayments);
            this.displaySchedule();
            
            // Show export button
            document.getElementById('exportSchedule').classList.remove('hidden');
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    displaySummary(monthlyPayment, totalInterest, totalPayments) {
        const summaryElement = document.getElementById('quickSummary');
        if (summaryElement) {
            summaryElement.classList.remove('hidden');
            
            document.getElementById('summaryPayment').textContent = this.formatCurrency(monthlyPayment);
            document.getElementById('summaryTotalInterest').textContent = this.formatCurrency(totalInterest);
            document.getElementById('summaryTotalPayments').textContent = this.formatCurrency(totalPayments);
        }
    }

    displaySchedule() {
        const scheduleContent = document.getElementById('scheduleContent');
        if (!scheduleContent) return;

        if (this.currentView === 'monthly') {
            this.displayMonthlySchedule();
        } else {
            this.displayYearlySchedule();
        }
    }

    displayMonthlySchedule() {
        const scheduleContent = document.getElementById('scheduleContent');
        
        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Principal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                        ${this.scheduleData.map((payment, index) => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 12 === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
                                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    ${payment.paymentNumber}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${payment.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${this.formatCurrency(payment.monthlyPayment)}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${this.formatCurrency(payment.principalPayment)}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${this.formatCurrency(payment.interestPayment)}
                                </td>
                                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    ${this.formatCurrency(payment.remainingBalance)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        scheduleContent.innerHTML = tableHTML;
    }

    displayYearlySchedule() {
        const scheduleContent = document.getElementById('scheduleContent');
        const yearlyData = this.generateYearlySchedule(this.scheduleData);
        
        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payments</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Paid</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Principal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ending Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                        ${yearlyData.map(year => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    ${year.year}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${year.paymentsCount}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    ${this.formatCurrency(year.totalPayments)}
                                </td>
                                <td class="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                                    ${this.formatCurrency(year.totalPrincipal)}
                                </td>
                                <td class="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                    ${this.formatCurrency(year.totalInterest)}
                                </td>
                                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    ${this.formatCurrency(year.endingBalance)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        scheduleContent.innerHTML = tableHTML;
    }

    exportToCSV() {
        if (this.scheduleData.length === 0) {
            alert('No schedule data to export. Please generate a schedule first.');
            return;
        }

        let csvContent = '';
        
        if (this.currentView === 'monthly') {
            csvContent = 'Payment Number,Date,Monthly Payment,Principal,Interest,Remaining Balance\n';
            this.scheduleData.forEach(payment => {
                csvContent += `${payment.paymentNumber},`;
                csvContent += `${payment.date.toLocaleDateString()},`;
                csvContent += `${payment.monthlyPayment.toFixed(2)},`;
                csvContent += `${payment.principalPayment.toFixed(2)},`;
                csvContent += `${payment.interestPayment.toFixed(2)},`;
                csvContent += `${payment.remainingBalance.toFixed(2)}\n`;
            });
        } else {
            const yearlyData = this.generateYearlySchedule(this.scheduleData);
            csvContent = 'Year,Payments Count,Total Paid,Principal,Interest,Ending Balance\n';
            yearlyData.forEach(year => {
                csvContent += `${year.year},`;
                csvContent += `${year.paymentsCount},`;
                csvContent += `${year.totalPayments.toFixed(2)},`;
                csvContent += `${year.totalPrincipal.toFixed(2)},`;
                csvContent += `${year.totalInterest.toFixed(2)},`;
                csvContent += `${year.endingBalance.toFixed(2)}\n`;
            });
        }

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `amortization-schedule-${this.currentView}-${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showError(message) {
        const scheduleContent = document.getElementById('scheduleContent');
        if (scheduleContent) {
            scheduleContent.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400 py-16">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-lg">${message}</p>
                </div>
            `;
        }
        
        // Hide summary and export button on error
        const summaryElement = document.getElementById('quickSummary');
        if (summaryElement) {
            summaryElement.classList.add('hidden');
        }
        
        document.getElementById('exportSchedule').classList.add('hidden');
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AmortizationScheduleCalculator();
});
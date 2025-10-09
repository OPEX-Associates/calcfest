/**
 * Debt-to-Income Ratio Calculator
 * Calculates front-end and back-end DTI ratios for mortgage qualification
 */

class DTICalculator {
    constructor() {
        this.form = document.getElementById('dtiForm');
        this.initializeEventListeners();
        this.formatInputs();
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Real-time calculation on input change
            const inputs = ['grossIncome', 'otherIncome', 'housingPayment', 'homeInsurance', 
                          'creditCards', 'carLoans', 'studentLoans', 'otherDebts'];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => this.handleInputChange());
                }
            });
        }
    }

    formatInputs() {
        // Format currency inputs
        const currencyInputs = ['grossIncome', 'otherIncome', 'housingPayment', 'homeInsurance', 
                              'creditCards', 'carLoans', 'studentLoans', 'otherDebts'];
        
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.formatCurrencyInput(e.target);
                });
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

    handleInputChange() {
        // Debounce calculation
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            this.calculateAndDisplay();
        }, 300);
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

    calculateDTI() {
        // Income
        const grossIncome = this.parseNumber(document.getElementById('grossIncome').value);
        const otherIncome = this.parseNumber(document.getElementById('otherIncome').value);
        const totalIncome = grossIncome + otherIncome;

        // Housing expenses (Front-end DTI)
        const housingPayment = this.parseNumber(document.getElementById('housingPayment').value);
        const homeInsurance = this.parseNumber(document.getElementById('homeInsurance').value);
        const totalHousingExpenses = housingPayment + homeInsurance;

        // Other debts
        const creditCards = this.parseNumber(document.getElementById('creditCards').value);
        const carLoans = this.parseNumber(document.getElementById('carLoans').value);
        const studentLoans = this.parseNumber(document.getElementById('studentLoans').value);
        const otherDebts = this.parseNumber(document.getElementById('otherDebts').value);
        const totalOtherDebts = creditCards + carLoans + studentLoans + otherDebts;

        // Total monthly debt payments (Back-end DTI)
        const totalMonthlyDebts = totalHousingExpenses + totalOtherDebts;

        // Calculate DTI ratios
        const frontEndDTI = totalIncome > 0 ? (totalHousingExpenses / totalIncome) * 100 : 0;
        const backEndDTI = totalIncome > 0 ? (totalMonthlyDebts / totalIncome) * 100 : 0;

        return {
            totalIncome,
            grossIncome,
            otherIncome,
            totalHousingExpenses,
            housingPayment,
            homeInsurance,
            totalOtherDebts,
            creditCards,
            carLoans,
            studentLoans,
            otherDebts,
            totalMonthlyDebts,
            frontEndDTI,
            backEndDTI
        };
    }

    getLoanQualification(frontEndDTI, backEndDTI) {
        const qualifications = [];

        // Conventional loan
        if (frontEndDTI <= 28 && backEndDTI <= 36) {
            qualifications.push({
                type: 'Conventional',
                status: 'Excellent',
                color: 'green',
                description: 'Strong qualification for conventional loans'
            });
        } else if (frontEndDTI <= 32 && backEndDTI <= 43) {
            qualifications.push({
                type: 'Conventional',
                status: 'Possible',
                color: 'yellow',
                description: 'May qualify with compensating factors'
            });
        } else {
            qualifications.push({
                type: 'Conventional',
                status: 'Challenging',
                color: 'red',
                description: 'DTI exceeds typical conventional loan limits'
            });
        }

        // FHA loan
        if (frontEndDTI <= 31 && backEndDTI <= 43) {
            qualifications.push({
                type: 'FHA',
                status: 'Excellent',
                color: 'green',
                description: 'Strong qualification for FHA loans'
            });
        } else if (frontEndDTI <= 40 && backEndDTI <= 50) {
            qualifications.push({
                type: 'FHA',
                status: 'Possible',
                color: 'yellow',
                description: 'May qualify with strong credit and reserves'
            });
        } else {
            qualifications.push({
                type: 'FHA',
                status: 'Challenging',
                color: 'red',
                description: 'DTI exceeds FHA loan limits'
            });
        }

        // VA loan
        if (backEndDTI <= 41) {
            qualifications.push({
                type: 'VA',
                status: 'Excellent',
                color: 'green',
                description: 'Strong qualification for VA loans'
            });
        } else if (backEndDTI <= 50) {
            qualifications.push({
                type: 'VA',
                status: 'Possible',
                color: 'yellow',
                description: 'May qualify with residual income analysis'
            });
        } else {
            qualifications.push({
                type: 'VA',
                status: 'Challenging',
                color: 'red',
                description: 'DTI exceeds typical VA loan limits'
            });
        }

        return qualifications;
    }

    getDTIStatus(ratio, type) {
        if (type === 'front-end') {
            if (ratio <= 28) return { status: 'Excellent', color: 'green' };
            if (ratio <= 31) return { status: 'Good', color: 'blue' };
            if (ratio <= 36) return { status: 'Fair', color: 'yellow' };
            return { status: 'Poor', color: 'red' };
        } else {
            if (ratio <= 36) return { status: 'Excellent', color: 'green' };
            if (ratio <= 43) return { status: 'Good', color: 'blue' };
            if (ratio <= 50) return { status: 'Fair', color: 'yellow' };
            return { status: 'Poor', color: 'red' };
        }
    }

    calculateAndDisplay() {
        const grossIncome = this.parseNumber(document.getElementById('grossIncome').value);

        if (!grossIncome) {
            this.showError('Please enter your gross monthly income.');
            return;
        }

        try {
            const results = this.calculateDTI();
            this.displayResults(results);
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    displayResults(results) {
        const dtiResults = document.getElementById('dtiResults');
        if (!dtiResults) return;

        const frontEndStatus = this.getDTIStatus(results.frontEndDTI, 'front-end');
        const backEndStatus = this.getDTIStatus(results.backEndDTI, 'back-end');
        const qualifications = this.getLoanQualification(results.frontEndDTI, results.backEndDTI);

        dtiResults.innerHTML = `
            <div class="space-y-6">
                <!-- DTI Ratios -->
                <div class="space-y-4">
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Front-End DTI</span>
                            <span class="text-lg font-bold text-${frontEndStatus.color}-600 dark:text-${frontEndStatus.color}-400">
                                ${results.frontEndDTI.toFixed(1)}%
                            </span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div class="bg-${frontEndStatus.color}-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${Math.min(results.frontEndDTI, 100)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>0%</span>
                            <span class="text-${frontEndStatus.color}-600 dark:text-${frontEndStatus.color}-400 font-medium">
                                ${frontEndStatus.status}
                            </span>
                            <span>50%</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            ${this.formatCurrency(results.totalHousingExpenses)} ÷ ${this.formatCurrency(results.totalIncome)}
                        </p>
                    </div>

                    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Back-End DTI</span>
                            <span class="text-lg font-bold text-${backEndStatus.color}-600 dark:text-${backEndStatus.color}-400">
                                ${results.backEndDTI.toFixed(1)}%
                            </span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div class="bg-${backEndStatus.color}-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${Math.min(results.backEndDTI, 100)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>0%</span>
                            <span class="text-${backEndStatus.color}-600 dark:text-${backEndStatus.color}-400 font-medium">
                                ${backEndStatus.status}
                            </span>
                            <span>60%</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            ${this.formatCurrency(results.totalMonthlyDebts)} ÷ ${this.formatCurrency(results.totalIncome)}
                        </p>
                    </div>
                </div>

                <!-- Income Breakdown -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Monthly Income</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Gross Income:</span>
                            <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.grossIncome)}</span>
                        </div>
                        ${results.otherIncome > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Other Income:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.otherIncome)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between border-t pt-2">
                            <span class="text-gray-900 dark:text-white font-semibold">Total Income:</span>
                            <span class="font-bold text-green-600 dark:text-green-400">${this.formatCurrency(results.totalIncome)}</span>
                        </div>
                    </div>
                </div>

                <!-- Debt Breakdown -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Monthly Debt Payments</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Housing:</span>
                            <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.totalHousingExpenses)}</span>
                        </div>
                        ${results.creditCards > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Credit Cards:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.creditCards)}</span>
                            </div>
                        ` : ''}
                        ${results.carLoans > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Car Loans:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.carLoans)}</span>
                            </div>
                        ` : ''}
                        ${results.studentLoans > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Student Loans:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.studentLoans)}</span>
                            </div>
                        ` : ''}
                        ${results.otherDebts > 0 ? `
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Other Debts:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.otherDebts)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between border-t pt-2">
                            <span class="text-gray-900 dark:text-white font-semibold">Total Debts:</span>
                            <span class="font-bold text-amber-600 dark:text-amber-400">${this.formatCurrency(results.totalMonthlyDebts)}</span>
                        </div>
                    </div>
                </div>

                <!-- Loan Qualification -->
                <div class="space-y-3">
                    <h4 class="font-semibold text-gray-900 dark:text-white">Loan Qualification Outlook</h4>
                    ${qualifications.map(qual => `
                        <div class="bg-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-50 dark:bg-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-900/20 rounded-lg p-3 border border-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-200 dark:border-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-800">
                            <div class="flex justify-between items-center">
                                <span class="font-medium text-gray-900 dark:text-white">${qual.type} Loan</span>
                                <span class="text-sm font-semibold text-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-600 dark:text-${qual.color === 'green' ? 'green' : qual.color === 'yellow' ? 'yellow' : 'red'}-400">
                                    ${qual.status}
                                </span>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${qual.description}</p>
                        </div>
                    `).join('')}
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

    showError(message) {
        const dtiResults = document.getElementById('dtiResults');
        if (dtiResults) {
            dtiResults.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DTICalculator();
});
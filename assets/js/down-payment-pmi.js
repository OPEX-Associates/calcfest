/**
 * Down Payment & PMI Calculator
 * Calculates down payment amounts, PMI costs, and removal scenarios
 */

class DownPaymentPMICalculator {
    constructor() {
        this.form = document.getElementById('downPaymentForm');
        this.initializeEventListeners();
        this.formatInputs();
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Real-time calculation on input change
            const inputs = ['homePrice', 'downPayment', 'interestRate', 'loanTerm', 'pmiRate', 'pmiRemovalThreshold'];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', () => this.handleInputChange());
                }
            });

            // Down payment quick select buttons
            document.querySelectorAll('.down-payment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleDownPaymentSelect(e));
            });
        }
    }

    formatInputs() {
        // Format currency inputs
        const homePriceInput = document.getElementById('homePrice');
        const downPaymentInput = document.getElementById('downPayment');

        if (homePriceInput) {
            homePriceInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
                this.updateDownPaymentPercent();
            });
        }

        if (downPaymentInput) {
            downPaymentInput.addEventListener('input', (e) => {
                this.formatCurrencyInput(e.target);
                this.updateDownPaymentPercent();
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

    updateDownPaymentPercent() {
        const homePrice = this.parseNumber(document.getElementById('homePrice').value);
        const downPayment = this.parseNumber(document.getElementById('downPayment').value);
        const percentElement = document.getElementById('downPaymentPercent');

        if (homePrice > 0 && downPayment >= 0) {
            const percent = (downPayment / homePrice * 100);
            percentElement.textContent = percent.toFixed(1) + '%';
        } else {
            percentElement.textContent = '0%';
        }
    }

    handleDownPaymentSelect(e) {
        e.preventDefault();
        const percent = parseFloat(e.target.dataset.percent);
        const homePrice = this.parseNumber(document.getElementById('homePrice').value);
        
        if (homePrice > 0) {
            const downPayment = homePrice * (percent / 100);
            document.getElementById('downPayment').value = Math.round(downPayment).toLocaleString();
            this.updateDownPaymentPercent();
            
            // Update button styling
            document.querySelectorAll('.down-payment-btn').forEach(btn => {
                btn.classList.remove('bg-primary-500', 'text-white', 'border-primary-500');
                btn.classList.add('border-gray-300', 'dark:border-gray-600');
            });
            e.target.classList.add('bg-primary-500', 'text-white', 'border-primary-500');
            e.target.classList.remove('border-gray-300', 'dark:border-gray-600');
            
            this.calculateAndDisplay();
        }
    }

    handleInputChange() {
        this.updateDownPaymentPercent();
        
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

    calculateMonthlyPayment(principal, rate, years) {
        const monthlyRate = rate / 100 / 12;
        const numPayments = years * 12;
        
        if (monthlyRate === 0) {
            return principal / numPayments;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    calculatePMIRemoval(loanAmount, monthlyPayment, interestRate, pmiRemovalLTV, homePrice) {
        const targetBalance = homePrice * (pmiRemovalLTV / 100);
        const monthlyRate = interestRate / 100 / 12;
        
        let balance = loanAmount;
        let payments = 0;
        
        while (balance > targetBalance && payments < 360) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            payments++;
            
            if (payments > 360) break; // Safety check
        }
        
        return {
            payments,
            years: payments / 12,
            remainingBalance: balance
        };
    }

    calculateScenarios(homePrice, interestRate, loanTerm, pmiRate) {
        const scenarios = [3, 5, 10, 15, 20, 25].map(percent => {
            const downPayment = homePrice * (percent / 100);
            const loanAmount = homePrice - downPayment;
            const ltv = (loanAmount / homePrice) * 100;
            const pmiRequired = ltv > 80;
            
            const monthlyPI = this.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
            const monthlyPMI = pmiRequired ? (loanAmount * (pmiRate / 100) / 12) : 0;
            const totalMonthly = monthlyPI + monthlyPMI;
            
            let pmiRemovalInfo = null;
            let totalPMICost = 0;
            
            if (pmiRequired) {
                pmiRemovalInfo = this.calculatePMIRemoval(loanAmount, monthlyPI, interestRate, 78, homePrice);
                totalPMICost = monthlyPMI * pmiRemovalInfo.payments;
            }
            
            return {
                downPaymentPercent: percent,
                downPayment,
                loanAmount,
                ltv,
                pmiRequired,
                monthlyPI,
                monthlyPMI,
                totalMonthly,
                pmiRemovalInfo,
                totalPMICost
            };
        });
        
        return scenarios;
    }

    calculateAndDisplay() {
        const homePrice = this.parseNumber(document.getElementById('homePrice').value);
        const downPayment = this.parseNumber(document.getElementById('downPayment').value);
        const interestRate = this.parseNumber(document.getElementById('interestRate').value);
        const loanTerm = this.parseNumber(document.getElementById('loanTerm').value);
        const pmiRate = this.parseNumber(document.getElementById('pmiRate').value);
        const pmiRemovalThreshold = this.parseNumber(document.getElementById('pmiRemovalThreshold').value);

        if (!homePrice || !downPayment || downPayment > homePrice || !interestRate || !loanTerm) {
            this.showError('Please fill in all required fields with valid values.');
            return;
        }

        try {
            const results = this.calculateDownPaymentPMI(
                homePrice, downPayment, interestRate, loanTerm, pmiRate, pmiRemovalThreshold
            );
            
            this.displayResults(results);
            this.displayDetailedAnalysis(results);
            this.displayScenarios(homePrice, interestRate, loanTerm, pmiRate);
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    calculateDownPaymentPMI(homePrice, downPayment, interestRate, loanTerm, pmiRate, pmiRemovalThreshold) {
        const loanAmount = homePrice - downPayment;
        const ltv = (loanAmount / homePrice) * 100;
        const pmiRequired = ltv > 80;
        
        // Monthly payments
        const monthlyPI = this.calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
        const monthlyPMI = pmiRequired ? (loanAmount * (pmiRate / 100) / 12) : 0;
        const totalMonthly = monthlyPI + monthlyPMI;
        
        // PMI removal calculation
        let pmiRemovalInfo = null;
        let totalPMICost = 0;
        
        if (pmiRequired) {
            pmiRemovalInfo = this.calculatePMIRemoval(loanAmount, monthlyPI, interestRate, pmiRemovalThreshold, homePrice);
            totalPMICost = monthlyPMI * pmiRemovalInfo.payments;
        }
        
        // Principal needed to reach PMI removal threshold
        const targetBalance = homePrice * (pmiRemovalThreshold / 100);
        const principalNeeded = Math.max(0, loanAmount - targetBalance);
        
        return {
            homePrice,
            downPayment,
            downPaymentPercent: (downPayment / homePrice) * 100,
            loanAmount,
            ltv,
            pmiRequired,
            monthlyPI,
            monthlyPMI,
            totalMonthly,
            pmiRemovalInfo,
            totalPMICost,
            principalNeeded,
            pmiRemovalThreshold
        };
    }

    displayResults(results) {
        const quickResults = document.getElementById('quickResults');
        if (!quickResults) return;

        quickResults.innerHTML = `
            <div class="space-y-4">
                <div class="text-center">
                    <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        ${this.formatCurrency(results.totalMonthly)}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total Monthly Payment</div>
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">P&I Payment:</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.monthlyPI)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">PMI Payment:</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.monthlyPMI)}</span>
                    </div>
                    <div class="flex justify-between border-t pt-3">
                        <span class="text-gray-600 dark:text-gray-400">LTV Ratio:</span>
                        <span class="font-medium ${results.ltv > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}">${results.ltv.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold ${results.pmiRequired ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}">
                            ${results.pmiRequired ? 'PMI Required' : 'No PMI Required'}
                        </div>
                        ${results.pmiRequired ? `
                            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Total PMI Cost: ${this.formatCurrency(results.totalPMICost)}
                            </div>
                        ` : `
                            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Congratulations! 20%+ down payment
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    displayDetailedAnalysis(results) {
        // Update summary cards
        document.getElementById('summaryHomePrice').textContent = this.formatCurrency(results.homePrice);
        document.getElementById('summaryDownPayment').textContent = this.formatCurrency(results.downPayment);
        document.getElementById('summaryLoanAmount').textContent = this.formatCurrency(results.loanAmount);
        document.getElementById('summaryLTV').textContent = results.ltv.toFixed(1) + '%';
        
        document.getElementById('monthlyPI').textContent = this.formatCurrency(results.monthlyPI);
        document.getElementById('monthlyPMI').textContent = this.formatCurrency(results.monthlyPMI);
        document.getElementById('totalMonthly').textContent = this.formatCurrency(results.totalMonthly);
        
        document.getElementById('pmiRequired').textContent = results.pmiRequired ? 'Yes' : 'No';
        document.getElementById('totalPMICost').textContent = this.formatCurrency(results.totalPMICost);
        
        if (results.pmiRequired && results.pmiRemovalInfo) {
            const removalDate = new Date();
            removalDate.setMonth(removalDate.getMonth() + results.pmiRemovalInfo.payments);
            document.getElementById('pmiRemovalDate').textContent = removalDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short' 
            });
            
            // PMI removal timeline
            document.getElementById('currentLTV').textContent = results.ltv.toFixed(1) + '%';
            document.getElementById('targetLTV').textContent = results.pmiRemovalThreshold + '%';
            document.getElementById('paymentsUntilRemoval').textContent = results.pmiRemovalInfo.payments;
            document.getElementById('yearsUntilRemoval').textContent = results.pmiRemovalInfo.years.toFixed(1);
            document.getElementById('principalNeeded').textContent = this.formatCurrency(results.principalNeeded);
            
            // Progress bar
            const progressPercent = Math.max(0, Math.min(100, ((80 - results.ltv) / (80 - results.pmiRemovalThreshold)) * 100));
            document.getElementById('ltvProgress').style.width = progressPercent + '%';
        } else {
            document.getElementById('pmiRemovalDate').textContent = 'N/A';
        }
        
        // Show detailed analysis
        document.getElementById('detailedAnalysis').classList.remove('hidden');
    }

    displayScenarios(homePrice, interestRate, loanTerm, pmiRate) {
        const scenarios = this.calculateScenarios(homePrice, interestRate, loanTerm, pmiRate);
        const tableBody = document.getElementById('scenariosTable');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = scenarios.map(scenario => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                        ${this.formatCurrency(scenario.downPayment)}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${scenario.downPaymentPercent}%
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${scenario.ltv.toFixed(1)}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        scenario.pmiRequired 
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                            : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    }">
                        ${scenario.pmiRequired ? 'Yes' : 'No'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${this.formatCurrency(scenario.totalMonthly)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${scenario.pmiRequired ? this.formatCurrency(scenario.totalPMICost) : 'N/A'}
                </td>
            </tr>
        `).join('');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    showError(message) {
        const quickResults = document.getElementById('quickResults');
        if (quickResults) {
            quickResults.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <p>${message}</p>
                </div>
            `;
        }
        
        // Hide detailed analysis on error
        const detailedAnalysis = document.getElementById('detailedAnalysis');
        if (detailedAnalysis) {
            detailedAnalysis.classList.add('hidden');
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DownPaymentPMICalculator();
});
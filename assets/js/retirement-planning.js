// Retirement Planning Calculator
class RetirementPlanningCalculator {
    constructor() {
        this.form = document.getElementById('retirementForm');
        this.resultsContainer = document.getElementById('retirementResults');
        this.chartContainer = document.getElementById('chartContainer');
        this.projectionsContainer = document.getElementById('projectionsContainer');
        this.chart = null;
        this.chartData = null;
        this.showRealValues = false;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Format inputs
        this.setupInputFormatting();
        
        // Chart toggle buttons
        this.setupChartToggles();
    }

    setupInputFormatting() {
        // Currency inputs
        const currencyInputs = ['currentSavings', 'monthlyContribution', 'socialSecurity', 'pension', 'partTimeIncome', 'otherIncome', 'currentExpenses', 'healthcareCosts', 'leisureTravel'];
        currencyInputs.forEach(inputName => {
            const input = this.form.querySelector(`[name="${inputName}"]`);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d.]/g, '');
                    if (value) {
                        const parts = value.split('.');
                        if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        if (parts[1] && parts[1].length > 2) {
                            value = parts[0] + '.' + parts[1].substring(0, 2);
                        }
                        e.target.value = this.formatNumber(value);
                    }
                });

                input.addEventListener('blur', (e) => {
                    if (e.target.value) {
                        e.target.value = this.formatCurrency(this.parseNumber(e.target.value));
                    }
                });

                input.addEventListener('focus', (e) => {
                    e.target.value = this.parseNumber(e.target.value).toString();
                });
            }
        });

        // Percentage inputs
        const percentageInputs = ['expectedReturn', 'inflationRate', 'expenseRatio'];
        percentageInputs.forEach(inputName => {
            const input = this.form.querySelector(`[name="${inputName}"]`);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^\d.]/g, '');
                    if (value) {
                        const parts = value.split('.');
                        if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                        }
                        if (parts[1] && parts[1].length > 3) {
                            value = parts[0] + '.' + parts[1].substring(0, 3);
                        }
                        e.target.value = value;
                    }
                });
            }
        });

        // Age inputs
        const ageInputs = ['currentAge', 'retirementAge', 'lifeExpectancy'];
        ageInputs.forEach(inputName => {
            const input = this.form.querySelector(`[name="${inputName}"]`);
            if (input) {
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^\d]/g, '');
                });
            }
        });
    }

    setupChartToggles() {
        const nominalBtn = document.getElementById('nominalBtn');
        const realBtn = document.getElementById('realBtn');

        if (nominalBtn && realBtn) {
            nominalBtn.addEventListener('click', () => {
                this.showRealValues = false;
                this.updateChartToggle();
                this.updateChart();
            });

            realBtn.addEventListener('click', () => {
                this.showRealValues = true;
                this.updateChartToggle();
                this.updateChart();
            });
        }
    }

    updateChartToggle() {
        const nominalBtn = document.getElementById('nominalBtn');
        const realBtn = document.getElementById('realBtn');
        
        const activeClasses = 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700';
        const inactiveClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';

        if (this.showRealValues) {
            nominalBtn.className = `px-4 py-2 text-sm rounded-lg ${inactiveClasses}`;
            realBtn.className = `px-4 py-2 text-sm rounded-lg ${activeClasses}`;
        } else {
            nominalBtn.className = `px-4 py-2 text-sm rounded-lg ${activeClasses}`;
            realBtn.className = `px-4 py-2 text-sm rounded-lg ${inactiveClasses}`;
        }
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculateRetirement();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateRetirement();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['currentAge', 'retirementAge', 'lifeExpectancy', 'monthlyContribution', 'expectedReturn', 'currentExpenses'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            const value = fieldName === 'expectedReturn' ? 
                this.parsePercentage(field.value) : this.parseNumber(field.value);

            if (!value || value <= 0) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate age logic
        const currentAge = this.parseNumber(this.form.currentAge.value);
        const retirementAge = this.parseNumber(this.form.retirementAge.value);
        const lifeExpectancy = this.parseNumber(this.form.lifeExpectancy.value);
        
        if (currentAge >= retirementAge) {
            if (showErrors) {
                this.showFieldError(this.form.retirementAge, 'Retirement age must be greater than current age');
            }
            isValid = false;
        }

        if (retirementAge >= lifeExpectancy) {
            if (showErrors) {
                this.showFieldError(this.form.lifeExpectancy, 'Life expectancy must be greater than retirement age');
            }
            isValid = false;
        }

        if (currentAge > 100 || retirementAge > 100 || lifeExpectancy > 120) {
            if (showErrors) {
                this.showFieldError(this.form.lifeExpectancy, 'Ages must be realistic');
            }
            isValid = false;
        }

        return isValid;
    }

    calculateRetirement() {
        const data = this.getFormData();
        const results = this.performCalculations(data);
        this.displayResults(results, data);
        this.displayChart(results);
        this.displayProjections(results);
    }

    getFormData() {
        return {
            currentAge: this.parseNumber(this.form.currentAge.value) || 0,
            retirementAge: this.parseNumber(this.form.retirementAge.value) || 0,
            lifeExpectancy: this.parseNumber(this.form.lifeExpectancy.value) || 0,
            currentSavings: this.parseNumber(this.form.currentSavings.value) || 0,
            monthlyContribution: this.parseNumber(this.form.monthlyContribution.value) || 0,
            expectedReturn: this.parsePercentage(this.form.expectedReturn.value) || 0,
            inflationRate: this.parsePercentage(this.form.inflationRate.value) || 0,
            socialSecurity: this.parseNumber(this.form.socialSecurity.value) || 0,
            pension: this.parseNumber(this.form.pension.value) || 0,
            partTimeIncome: this.parseNumber(this.form.partTimeIncome.value) || 0,
            otherIncome: this.parseNumber(this.form.otherIncome.value) || 0,
            currentExpenses: this.parseNumber(this.form.currentExpenses.value) || 0,
            expenseRatio: this.parsePercentage(this.form.expenseRatio.value) || 80,
            healthcareCosts: this.parseNumber(this.form.healthcareCosts.value) || 0,
            leisureTravel: this.parseNumber(this.form.leisureTravel.value) || 0
        };
    }

    performCalculations(data) {
        const yearsToRetirement = data.retirementAge - data.currentAge;
        const yearsInRetirement = data.lifeExpectancy - data.retirementAge;
        
        // Calculate retirement savings at retirement
        const retirementSavings = this.calculateFutureValue(
            data.currentSavings,
            data.monthlyContribution,
            data.expectedReturn / 100,
            yearsToRetirement
        );

        // Calculate monthly expenses in retirement
        const baseRetirementExpenses = (data.currentExpenses * data.expenseRatio) / 100;
        const totalMonthlyExpenses = baseRetirementExpenses + data.healthcareCosts + data.leisureTravel;

        // Calculate total monthly income from other sources
        const totalOtherIncome = data.socialSecurity + data.pension + data.partTimeIncome + data.otherIncome;

        // Calculate required withdrawal from savings
        const monthlyShortfall = Math.max(0, totalMonthlyExpenses - totalOtherIncome);
        const annualShortfall = monthlyShortfall * 12;

        // Calculate if savings will last through retirement
        const withdrawalRate = retirementSavings > 0 ? (annualShortfall / retirementSavings) * 100 : 0;
        const safeWithdrawalRate = 4; // 4% rule

        // Project year-by-year retirement
        const retirementYears = this.projectRetirementYears(
            retirementSavings,
            annualShortfall,
            totalOtherIncome * 12,
            totalMonthlyExpenses * 12,
            data.expectedReturn / 100,
            data.inflationRate / 100,
            yearsInRetirement,
            data.retirementAge
        );

        const lastYear = retirementYears[retirementYears.length - 1];
        const moneyLastsUntil = this.calculateMoneyDuration(retirementYears);

        return {
            yearsToRetirement,
            yearsInRetirement,
            retirementSavings,
            totalMonthlyExpenses,
            totalOtherIncome,
            monthlyShortfall,
            annualShortfall,
            withdrawalRate,
            safeWithdrawalRate,
            retirementYears,
            moneyLastsUntil,
            finalBalance: lastYear ? lastYear.endBalance : 0,
            isOnTrack: withdrawalRate <= safeWithdrawalRate && moneyLastsUntil >= data.lifeExpectancy,
            shortfallAmount: this.calculateShortfall(data, retirementSavings, annualShortfall),
            realRetirementSavings: data.inflationRate > 0 ? 
                retirementSavings / Math.pow(1 + data.inflationRate / 100, yearsToRetirement) : retirementSavings
        };
    }

    calculateFutureValue(present, monthlyPayment, monthlyRate, years) {
        const months = years * 12;
        const monthlyInterestRate = monthlyRate / 12;
        
        // Future value of present amount
        const futurePresentValue = present * Math.pow(1 + monthlyInterestRate, months);
        
        // Future value of annuity (monthly contributions)
        const futureAnnuityValue = monthlyPayment * 
            ((Math.pow(1 + monthlyInterestRate, months) - 1) / monthlyInterestRate);
        
        return futurePresentValue + futureAnnuityValue;
    }

    projectRetirementYears(startingBalance, annualWithdrawal, otherIncome, totalExpenses, returnRate, inflationRate, years, startAge) {
        const retirementYears = [];
        let currentBalance = startingBalance;
        let currentWithdrawal = annualWithdrawal;
        let currentOtherIncome = otherIncome;
        let currentExpenses = totalExpenses;

        for (let year = 0; year < years; year++) {
            const age = startAge + year;
            const startBalance = currentBalance;
            
            // Calculate investment return
            const investmentReturn = currentBalance * returnRate;
            
            // Apply withdrawal
            const actualWithdrawal = Math.min(currentWithdrawal, currentBalance + investmentReturn);
            const endBalance = Math.max(0, currentBalance + investmentReturn - actualWithdrawal);
            
            // Calculate real values
            const realBalance = endBalance / Math.pow(1 + inflationRate, year + 1);
            const realIncome = (currentOtherIncome + actualWithdrawal) / Math.pow(1 + inflationRate, year + 1);
            const realExpenses = currentExpenses / Math.pow(1 + inflationRate, year + 1);
            
            retirementYears.push({
                year: year + 1,
                age,
                startBalance,
                investmentReturn,
                withdrawal: actualWithdrawal,
                otherIncome: currentOtherIncome,
                totalIncome: currentOtherIncome + actualWithdrawal,
                totalExpenses: currentExpenses,
                netCashFlow: (currentOtherIncome + actualWithdrawal) - currentExpenses,
                endBalance,
                realBalance,
                realIncome,
                realExpenses
            });

            // Update for next year (inflation adjustments)
            currentBalance = endBalance;
            currentWithdrawal *= (1 + inflationRate);
            currentOtherIncome *= (1 + inflationRate);
            currentExpenses *= (1 + inflationRate);
            
            // Stop if money runs out
            if (currentBalance <= 0 && actualWithdrawal < currentWithdrawal) {
                break;
            }
        }

        return retirementYears;
    }

    calculateMoneyDuration(retirementYears) {
        const lastYearWithMoney = retirementYears.find(year => year.endBalance <= 1000);
        return lastYearWithMoney ? lastYearWithMoney.age : 
               retirementYears[retirementYears.length - 1]?.age || 0;
    }

    calculateShortfall(data, retirementSavings, annualShortfall) {
        const yearsInRetirement = data.lifeExpectancy - data.retirementAge;
        const totalNeeded = annualShortfall * yearsInRetirement;
        const currentProjection = retirementSavings;
        return Math.max(0, totalNeeded - currentProjection);
    }

    displayResults(results, data) {
        const readinessStatus = this.getReadinessStatus(results);
        const monthlyIncomeFromSavings = results.retirementSavings * 0.04 / 12; // 4% rule monthly

        this.resultsContainer.innerHTML = `
            <!-- Retirement Readiness -->
            <div class="bg-gradient-to-r from-${readinessStatus.color}-50 to-${readinessStatus.color}-100 dark:from-${readinessStatus.color}-900/20 dark:to-${readinessStatus.color}-800/20 rounded-lg p-6 border border-${readinessStatus.color}-200 dark:border-${readinessStatus.color}-700">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-${readinessStatus.color}-800 dark:text-${readinessStatus.color}-200 mb-2">Retirement Readiness</h4>
                    <div class="text-3xl font-bold text-${readinessStatus.color}-900 dark:text-${readinessStatus.color}-100 mb-2">
                        ${readinessStatus.status}
                    </div>
                    <p class="text-sm text-${readinessStatus.color}-700 dark:text-${readinessStatus.color}-300">
                        ${readinessStatus.description}
                    </p>
                </div>
            </div>

            <!-- Projected Savings -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Projected Retirement Savings</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700 dark:text-blue-300">At Retirement (Age ${data.retirementAge})</span>
                        <span class="font-semibold text-blue-900 dark:text-blue-100">${this.formatCurrency(results.retirementSavings)}</span>
                    </div>
                    
                    ${data.inflationRate > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700 dark:text-blue-300">Real Purchasing Power</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">${this.formatCurrency(results.realRetirementSavings)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700 dark:text-blue-300">Monthly Income (4% Rule)</span>
                        <span class="font-medium text-blue-800 dark:text-blue-200">${this.formatCurrency(monthlyIncomeFromSavings)}</span>
                    </div>
                </div>
            </div>

            <!-- Income vs Expenses -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Retirement Budget</h4>
                
                <div class="space-y-4">
                    <!-- Income Sources -->
                    <div>
                        <h5 class="font-medium text-gray-900 dark:text-white mb-2">Income Sources</h5>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Savings Withdrawal</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(results.monthlyShortfall)}</span>
                            </div>
                            ${data.socialSecurity > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Social Security</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.socialSecurity)}</span>
                            </div>` : ''}
                            ${data.pension > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Pension</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.pension)}</span>
                            </div>` : ''}
                            ${data.partTimeIncome > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Part-time Work</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.partTimeIncome)}</span>
                            </div>` : ''}
                            ${data.otherIncome > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Other Income</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.otherIncome)}</span>
                            </div>` : ''}
                            <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                                <div class="flex justify-between font-medium">
                                    <span class="text-gray-900 dark:text-white">Total Income</span>
                                    <span class="text-green-600 dark:text-green-400">${this.formatCurrency(results.totalOtherIncome + results.monthlyShortfall)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Expenses -->
                    <div>
                        <h5 class="font-medium text-gray-900 dark:text-white mb-2">Monthly Expenses</h5>
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Basic Living (${data.expenseRatio}% of current)</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency((data.currentExpenses * data.expenseRatio) / 100)}</span>
                            </div>
                            ${data.healthcareCosts > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Healthcare</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.healthcareCosts)}</span>
                            </div>` : ''}
                            ${data.leisureTravel > 0 ? `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">Leisure & Travel</span>
                                <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.leisureTravel)}</span>
                            </div>` : ''}
                            <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                                <div class="flex justify-between font-medium">
                                    <span class="text-gray-900 dark:text-white">Total Expenses</span>
                                    <span class="text-red-600 dark:text-red-400">${this.formatCurrency(results.totalMonthlyExpenses)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Withdrawal Analysis -->
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h4 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Withdrawal Analysis</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Annual Withdrawal Rate</span>
                        <span class="font-semibold text-amber-900 dark:text-amber-100">${results.withdrawalRate.toFixed(1)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Safe Withdrawal Rate</span>
                        <span class="font-medium text-amber-800 dark:text-amber-200">${results.safeWithdrawalRate}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Money Lasts Until Age</span>
                        <span class="font-semibold text-amber-900 dark:text-amber-100">${results.moneyLastsUntil}</span>
                    </div>
                    
                    ${results.withdrawalRate > results.safeWithdrawalRate ? `
                    <div class="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mt-3">
                        <p class="text-sm text-red-800 dark:text-red-200">
                            ⚠️ Your withdrawal rate exceeds the safe 4% rule. Consider saving more or reducing expenses.
                        </p>
                    </div>
                    ` : `
                    <div class="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 mt-3">
                        <p class="text-sm text-green-800 dark:text-green-200">
                            ✅ Your withdrawal rate is within safe limits for a sustainable retirement.
                        </p>
                    </div>
                    `}
                </div>
            </div>

            <!-- Key Insights -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Key Insights</h4>
                
                <div class="space-y-3">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            You have ${results.yearsToRetirement} years to save ${this.formatCurrency(data.monthlyContribution)} monthly
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Other income sources cover ${((results.totalOtherIncome / results.totalMonthlyExpenses) * 100).toFixed(0)}% 
                            of your retirement expenses
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            ${results.finalBalance > 0 ? 
                                `You'll have ${this.formatCurrency(results.finalBalance)} remaining at age ${data.lifeExpectancy}` :
                                `Your savings may be depleted before age ${data.lifeExpectancy}`
                            }
                        </p>
                    </div>

                    ${results.shortfallAmount > 0 ? `
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Consider saving an additional ${this.formatCurrency(results.shortfallAmount / (results.yearsToRetirement * 12))} 
                            monthly to meet your retirement goals
                        </p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Store chart data for toggle functionality
        this.chartData = results;
    }

    getReadinessStatus(results) {
        if (results.isOnTrack && results.withdrawalRate <= 3.5) {
            return { status: 'Excellent', color: 'green', description: 'You\'re well prepared for retirement' };
        } else if (results.isOnTrack) {
            return { status: 'On Track', color: 'blue', description: 'Your retirement plan looks solid' };
        } else if (results.withdrawalRate <= 6) {
            return { status: 'Needs Improvement', color: 'yellow', description: 'Some adjustments needed to your plan' };
        } else {
            return { status: 'At Risk', color: 'red', description: 'Significant changes needed for retirement security' };
        }
    }

    displayChart(results) {
        this.chartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('retirementChart').getContext('2d');
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = results.retirementYears.map(data => `Age ${data.age}`);
        const incomeData = results.retirementYears.map(data => 
            this.showRealValues ? data.realIncome / 12 : data.totalIncome / 12
        );
        const expenseData = results.retirementYears.map(data => 
            this.showRealValues ? data.realExpenses / 12 : data.totalExpenses / 12
        );
        const balanceData = results.retirementYears.map(data => 
            this.showRealValues ? data.realBalance : data.endBalance
        );

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Monthly Income',
                        data: incomeData,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Monthly Expenses',
                        data: expenseData,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Portfolio Balance',
                        data: balanceData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + 
                                       new Intl.NumberFormat('en-US', {
                                           style: 'currency',
                                           currency: 'USD',
                                           minimumFractionDigits: 0,
                                           maximumFractionDigits: 0
                                       }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Age'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Monthly Amount'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Portfolio Balance'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toLocaleString() + 'K';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateChart() {
        if (this.chart && this.chartData) {
            const incomeData = this.chartData.retirementYears.map(data => 
                this.showRealValues ? data.realIncome / 12 : data.totalIncome / 12
            );
            const expenseData = this.chartData.retirementYears.map(data => 
                this.showRealValues ? data.realExpenses / 12 : data.totalExpenses / 12
            );
            const balanceData = this.chartData.retirementYears.map(data => 
                this.showRealValues ? data.realBalance : data.endBalance
            );
            
            this.chart.data.datasets[0].data = incomeData;
            this.chart.data.datasets[1].data = expenseData;
            this.chart.data.datasets[2].data = balanceData;
            this.chart.update();
        }
    }

    displayProjections(results) {
        this.projectionsContainer.classList.remove('hidden');
        
        const tbody = document.getElementById('projectionsBody');
        
        // Group by decades for summary view
        const decades = [];
        for (let i = 0; i < results.retirementYears.length; i += 10) {
            const decadeData = results.retirementYears.slice(i, i + 10);
            if (decadeData.length > 0) {
                const firstYear = decadeData[0];
                const lastYear = decadeData[decadeData.length - 1];
                const avgIncome = decadeData.reduce((sum, year) => sum + year.totalIncome, 0) / decadeData.length;
                const avgExpenses = decadeData.reduce((sum, year) => sum + year.totalExpenses, 0) / decadeData.length;
                const avgCashFlow = decadeData.reduce((sum, year) => sum + year.netCashFlow, 0) / decadeData.length;
                
                decades.push({
                    ageRange: `${firstYear.age}-${lastYear.age}`,
                    portfolioValue: lastYear.endBalance,
                    annualIncome: avgIncome,
                    annualExpenses: avgExpenses,
                    netCashFlow: avgCashFlow,
                    status: avgCashFlow >= 0 ? 'Surplus' : lastYear.endBalance > 0 ? 'Sustainable' : 'Shortfall'
                });
            }
        }
        
        tbody.innerHTML = decades.map(decade => `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="py-3 px-4 text-gray-900 dark:text-white">${decade.ageRange}</td>
                <td class="py-3 px-4 text-right text-gray-900 dark:text-white">${this.formatCurrency(decade.portfolioValue)}</td>
                <td class="py-3 px-4 text-right text-green-600 dark:text-green-400">${this.formatCurrency(decade.annualIncome)}</td>
                <td class="py-3 px-4 text-right text-red-600 dark:text-red-400">${this.formatCurrency(decade.annualExpenses)}</td>
                <td class="py-3 px-4 text-right font-semibold ${decade.netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${this.formatCurrency(decade.netCashFlow)}</td>
                <td class="py-3 px-4 text-right">
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusClass(decade.status)}">
                        ${decade.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getStatusClass(status) {
        const classes = {
            'Surplus': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
            'Sustainable': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
            'Shortfall': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
        };
        return classes[status] || classes.Shortfall;
    }

    // Utility functions
    parseNumber(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
    }

    parsePercentage(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
    }

    formatNumber(value) {
        return parseFloat(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('border-red-500', 'dark:border-red-400');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-600 dark:text-red-400 text-sm mt-1';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500', 'dark:border-red-400');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RetirementPlanningCalculator();
});
// 401k Calculator
class FourOhOneKCalculator {
    constructor() {
        this.form = document.getElementById('401kForm');
        this.resultsContainer = document.getElementById('401kResults');
        this.chartContainer = document.getElementById('chartContainer');
        this.breakdownContainer = document.getElementById('breakdownContainer');
        this.chart = null;
        this.chartData = null;
        this.showContributionsOnly = false;
        this.CONTRIBUTION_LIMITS = {
            2025: {
                employee: 23000,
                catchup: 7500,
                total: 69000
            }
        };
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
        const currencyInputs = ['currentBalance', 'annualSalary'];
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
        const percentageInputs = ['contributionPercent', 'employerMatch', 'matchLimit', 'salaryGrowth', 'returnRate', 'currentTaxRate', 'retirementTaxRate', 'inflationRate'];
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
        const ageInputs = ['currentAge', 'retirementAge'];
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
        const totalBtn = document.getElementById('totalBtn');
        const contributionsBtn = document.getElementById('contributionsBtn');

        if (totalBtn && contributionsBtn) {
            totalBtn.addEventListener('click', () => {
                this.showContributionsOnly = false;
                this.updateChartToggle();
                this.updateChart();
            });

            contributionsBtn.addEventListener('click', () => {
                this.showContributionsOnly = true;
                this.updateChartToggle();
                this.updateChart();
            });
        }
    }

    updateChartToggle() {
        const totalBtn = document.getElementById('totalBtn');
        const contributionsBtn = document.getElementById('contributionsBtn');
        
        const activeClasses = 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700';
        const inactiveClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';

        if (this.showContributionsOnly) {
            totalBtn.className = `px-4 py-2 text-sm rounded-lg ${inactiveClasses}`;
            contributionsBtn.className = `px-4 py-2 text-sm rounded-lg ${activeClasses}`;
        } else {
            totalBtn.className = `px-4 py-2 text-sm rounded-lg ${activeClasses}`;
            contributionsBtn.className = `px-4 py-2 text-sm rounded-lg ${inactiveClasses}`;
        }
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculate401k();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculate401k();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['currentAge', 'retirementAge', 'annualSalary', 'contributionPercent', 'returnRate'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            const value = ['contributionPercent', 'returnRate'].includes(fieldName) ? 
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
        
        if (currentAge >= retirementAge) {
            if (showErrors) {
                this.showFieldError(this.form.retirementAge, 'Retirement age must be greater than current age');
            }
            isValid = false;
        }

        if (currentAge > 100 || retirementAge > 100) {
            if (showErrors) {
                this.showFieldError(this.form.retirementAge, 'Ages must be realistic');
            }
            isValid = false;
        }

        // Validate contribution percentage
        const contributionPercent = this.parsePercentage(this.form.contributionPercent.value);
        if (contributionPercent > 100) {
            if (showErrors) {
                this.showFieldError(this.form.contributionPercent, 'Contribution cannot exceed 100%');
            }
            isValid = false;
        }

        return isValid;
    }

    calculate401k() {
        const data = this.getFormData();
        const results = this.performCalculations(data);
        this.displayResults(results, data);
        this.displayChart(results);
        this.displayBreakdown(results);
    }

    getFormData() {
        return {
            currentAge: this.parseNumber(this.form.currentAge.value) || 0,
            retirementAge: this.parseNumber(this.form.retirementAge.value) || 0,
            currentBalance: this.parseNumber(this.form.currentBalance.value) || 0,
            annualSalary: this.parseNumber(this.form.annualSalary.value) || 0,
            contributionPercent: this.parsePercentage(this.form.contributionPercent.value) || 0,
            employerMatch: this.parsePercentage(this.form.employerMatch.value) || 0,
            matchLimit: this.parsePercentage(this.form.matchLimit.value) || 0,
            salaryGrowth: this.parsePercentage(this.form.salaryGrowth.value) || 0,
            returnRate: this.parsePercentage(this.form.returnRate.value) || 0,
            currentTaxRate: this.parsePercentage(this.form.currentTaxRate.value) || 0,
            retirementTaxRate: this.parsePercentage(this.form.retirementTaxRate.value) || 0,
            inflationRate: this.parsePercentage(this.form.inflationRate.value) || 0
        };
    }

    performCalculations(data) {
        const yearsToRetirement = data.retirementAge - data.currentAge;
        const yearlyData = [];
        
        let currentBalance = data.currentBalance;
        let currentSalary = data.annualSalary;
        let totalEmployeeContributions = 0;
        let totalEmployerMatch = 0;
        let totalTaxSavings = 0;
        let totalInterestEarned = 0;

        // Calculate year by year
        for (let year = 0; year < yearsToRetirement; year++) {
            const age = data.currentAge + year;
            
            // Calculate contributions
            const employeeContribution = this.calculateEmployeeContribution(currentSalary, data.contributionPercent, age);
            const employerMatch = this.calculateEmployerMatch(employeeContribution, currentSalary, data.employerMatch, data.matchLimit);
            const totalYearlyContribution = employeeContribution + employerMatch;
            
            // Calculate tax savings
            const taxSavings = (employeeContribution * data.currentTaxRate) / 100;
            
            // Calculate growth
            const startBalance = currentBalance;
            const interestEarned = (currentBalance + totalYearlyContribution / 2) * (data.returnRate / 100);
            const endBalance = currentBalance + totalYearlyContribution + interestEarned;
            
            // Update totals
            totalEmployeeContributions += employeeContribution;
            totalEmployerMatch += employerMatch;
            totalTaxSavings += taxSavings;
            totalInterestEarned += interestEarned;
            
            yearlyData.push({
                year: year + 1,
                age: age,
                salary: currentSalary,
                employeeContribution,
                employerMatch,
                totalContribution: totalYearlyContribution,
                taxSavings,
                startBalance,
                interestEarned,
                endBalance,
                cumulativeContributions: totalEmployeeContributions + totalEmployerMatch,
                cumulativeEmployeeContributions: totalEmployeeContributions,
                cumulativeEmployerMatch: totalEmployerMatch,
                cumulativeTaxSavings: totalTaxSavings
            });
            
            // Update for next year
            currentBalance = endBalance;
            currentSalary *= (1 + data.salaryGrowth / 100);
        }

        const finalBalance = currentBalance;
        const finalRealValue = data.inflationRate > 0 ? 
            finalBalance / Math.pow(1 + data.inflationRate / 100, yearsToRetirement) : finalBalance;

        // Calculate retirement income estimates
        const monthlyIncome = this.calculateMonthlyIncome(finalBalance, data.retirementAge);
        const monthlyAfterTax = monthlyIncome * (1 - data.retirementTaxRate / 100);

        return {
            finalBalance,
            finalRealValue,
            totalEmployeeContributions,
            totalEmployerMatch,
            totalTaxSavings,
            totalInterestEarned,
            yearlyData,
            yearsToRetirement,
            monthlyIncome,
            monthlyAfterTax,
            currentContributionLimit: this.getCurrentContributionLimit(data.currentAge),
            isMaxingOut: this.isMaxingOut(data.annualSalary, data.contributionPercent, data.currentAge)
        };
    }

    calculateEmployeeContribution(salary, percent, age) {
        const baseContribution = (salary * percent) / 100;
        const limit = this.getCurrentContributionLimit(age);
        return Math.min(baseContribution, limit);
    }

    calculateEmployerMatch(employeeContribution, salary, matchPercent, matchLimit) {
        if (matchPercent === 0) return 0;
        
        const employeePercent = (employeeContribution / salary) * 100;
        const eligiblePercent = Math.min(employeePercent, matchLimit);
        return (salary * eligiblePercent * matchPercent) / 100 / 100; // Divide by 100 twice for percentage of percentage
    }

    getCurrentContributionLimit(age) {
        const limits = this.CONTRIBUTION_LIMITS[2025];
        return age >= 50 ? limits.employee + limits.catchup : limits.employee;
    }

    isMaxingOut(salary, percent, age) {
        const contribution = (salary * percent) / 100;
        const limit = this.getCurrentContributionLimit(age);
        return contribution >= limit;
    }

    calculateMonthlyIncome(balance, retirementAge) {
        // Use 4% rule adjusted for age
        const withdrawalRate = retirementAge < 65 ? 0.035 : 0.04;
        return (balance * withdrawalRate) / 12;
    }

    displayResults(results, data) {
        const employerMatchValue = results.totalEmployerMatch;
        const totalReturn = ((results.finalBalance / (data.currentBalance + results.totalEmployeeContributions + results.totalEmployerMatch)) - 1) * 100;

        this.resultsContainer.innerHTML = `
            <!-- Final Balance -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">401k Balance at Retirement</h4>
                    <div class="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                        ${this.formatCurrency(results.finalBalance)}
                    </div>
                    <p class="text-sm text-green-700 dark:text-green-300">
                        At age ${data.retirementAge} (${results.yearsToRetirement} years)
                    </p>
                    ${data.inflationRate > 0 ? `
                    <p class="text-sm text-green-600 dark:text-green-400 mt-2">
                        Purchasing power: ${this.formatCurrency(results.finalRealValue)}
                    </p>
                    ` : ''}
                </div>
            </div>

            <!-- Monthly Income -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Estimated Monthly Income</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700 dark:text-blue-300">Before Taxes</span>
                        <span class="font-semibold text-blue-900 dark:text-blue-100">${this.formatCurrency(results.monthlyIncome)}</span>
                    </div>
                    
                    ${data.retirementTaxRate > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700 dark:text-blue-300">After Taxes (${data.retirementTaxRate}%)</span>
                        <span class="font-semibold text-blue-900 dark:text-blue-100">${this.formatCurrency(results.monthlyAfterTax)}</span>
                    </div>
                    ` : ''}
                    
                    <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Based on 4% withdrawal rule
                    </p>
                </div>
            </div>

            <!-- Contribution Breakdown -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contribution Summary</h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Your Contributions</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.totalEmployeeContributions)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Employer Match</span>
                        <span class="font-medium text-green-600 dark:text-green-400">${this.formatCurrency(results.totalEmployerMatch)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Investment Growth</span>
                        <span class="font-medium text-blue-600 dark:text-blue-400">${this.formatCurrency(results.totalInterestEarned)}</span>
                    </div>
                    
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-900 dark:text-white">Total Value</span>
                            <span class="font-bold text-lg text-gray-900 dark:text-white">${this.formatCurrency(results.finalBalance)}</span>
                        </div>
                    </div>
                </div>

                <!-- Visual breakdown -->
                <div class="mt-6">
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                        ${this.getContributionBreakdownBars(data.currentBalance, results.totalEmployeeContributions, results.totalEmployerMatch, results.totalInterestEarned)}
                    </div>
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span>Initial</span>
                        <span>Your $</span>
                        <span>Match</span>
                        <span>Growth</span>
                    </div>
                </div>
            </div>

            <!-- Tax Benefits -->
            ${data.currentTaxRate > 0 ? `
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-700">
                <h4 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Tax Benefits</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Total Tax Savings</span>
                        <span class="font-semibold text-amber-900 dark:text-amber-100">${this.formatCurrency(results.totalTaxSavings)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-amber-700 dark:text-amber-300">Annual Tax Savings</span>
                        <span class="font-medium text-amber-800 dark:text-amber-200">${this.formatCurrency(results.totalTaxSavings / results.yearsToRetirement)}</span>
                    </div>
                    
                    <p class="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Based on ${data.currentTaxRate}% current tax rate
                    </p>
                </div>
            </div>
            ` : ''}

            <!-- Key Insights -->
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h4 class="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">Key Insights</h4>
                
                <div class="space-y-3">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Employer match adds ${this.formatCurrency(employerMatchValue)} in free money over ${results.yearsToRetirement} years
                        </p>
                    </div>
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Your ${data.contributionPercent}% contribution equals 
                            ${this.formatCurrency((data.annualSalary * data.contributionPercent) / 100)} annually
                        </p>
                    </div>
                    
                    ${results.isMaxingOut ? `
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            ✅ You're maximizing your annual contribution limit!
                        </p>
                    </div>
                    ` : `
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-yellow-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            You could contribute up to ${this.formatCurrency(results.currentContributionLimit)} annually 
                            (current limit: ${this.formatCurrency(results.currentContributionLimit)})
                        </p>
                    </div>
                    `}
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-purple-700 dark:text-purple-300">
                            Investment growth accounts for ${((results.totalInterestEarned / results.finalBalance) * 100).toFixed(1)}% 
                            of your final balance
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Store chart data for toggle functionality
        this.chartData = results;
    }

    getContributionBreakdownBars(initial, employee, employer, growth) {
        const total = initial + employee + employer + growth;
        const initialPct = (initial / total) * 100;
        const employeePct = (employee / total) * 100;
        const employerPct = (employer / total) * 100;
        const growthPct = (growth / total) * 100;

        let html = '';
        if (initial > 0) {
            html += `<div class="bg-gray-500 h-4 rounded-l-full" style="width: ${initialPct}%"></div>`;
        }
        html += `<div class="bg-blue-500 h-4 ${initial > 0 ? '' : 'rounded-l-full'}" style="width: ${employeePct}%"></div>`;
        html += `<div class="bg-green-500 h-4" style="width: ${employerPct}%"></div>`;
        html += `<div class="bg-purple-500 h-4 rounded-r-full" style="width: ${growthPct}%"></div>`;

        return html;
    }

    displayChart(results) {
        this.chartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('401kChart').getContext('2d');
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = results.yearlyData.map(data => `Age ${data.age}`);
        const balanceData = results.yearlyData.map(data => data.endBalance);
        const contributionsData = results.yearlyData.map(data => data.cumulativeContributions);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '401k Balance',
                        data: this.showContributionsOnly ? contributionsData : balanceData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Total Contributions',
                        data: contributionsData,
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        hidden: this.showContributionsOnly
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
                        display: true,
                        title: {
                            display: true,
                            text: 'Account Value'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
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
            const balanceData = this.chartData.yearlyData.map(data => data.endBalance);
            const contributionsData = this.chartData.yearlyData.map(data => data.cumulativeContributions);
            
            this.chart.data.datasets[0].data = this.showContributionsOnly ? contributionsData : balanceData;
            this.chart.data.datasets[1].hidden = this.showContributionsOnly;
            this.chart.update();
        }
    }

    displayBreakdown(results) {
        this.breakdownContainer.classList.remove('hidden');
        
        const tbody = document.getElementById('contributionBody');
        
        // Show every 5 years for readability
        const filteredData = results.yearlyData.filter((data, index) => 
            index === 0 || (index + 1) % 5 === 0 || index === results.yearlyData.length - 1
        );
        
        tbody.innerHTML = filteredData.map(data => `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="py-3 px-4 text-gray-900 dark:text-white">${data.age}</td>
                <td class="py-3 px-4 text-right text-gray-900 dark:text-white">${this.formatCurrency(data.salary)}</td>
                <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400">${this.formatCurrency(data.employeeContribution)}</td>
                <td class="py-3 px-4 text-right text-green-600 dark:text-green-400">${this.formatCurrency(data.employerMatch)}</td>
                <td class="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">${this.formatCurrency(data.endBalance)}</td>
                <td class="py-3 px-4 text-right text-amber-600 dark:text-amber-400">${this.formatCurrency(data.taxSavings)}</td>
            </tr>
        `).join('');
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
    new FourOhOneKCalculator();
});
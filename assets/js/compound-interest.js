// Compound Interest Calculator
class CompoundInterestCalculator {
    constructor() {
        this.form = document.getElementById('compoundInterestForm');
        this.resultsContainer = document.getElementById('compoundResults');
        this.chartContainer = document.getElementById('chartContainer');
        this.breakdownContainer = document.getElementById('breakdownContainer');
        this.chart = null;
        this.chartData = null;
        this.showRealValue = false;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Format currency and percentage inputs
        this.setupInputFormatting();
        
        // Chart toggle buttons
        this.setupChartToggles();
    }

    setupInputFormatting() {
        // Currency inputs
        const currencyInputs = ['principal', 'contributionAmount'];
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
        const percentageInputs = ['interestRate', 'inflationRate', 'contributionGrowth'];
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

        // Years input
        const yearsInput = this.form.querySelector('[name="timeYears"]');
        if (yearsInput) {
            yearsInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d]/g, '');
            });
        }
    }

    setupChartToggles() {
        const nominalBtn = document.getElementById('nominalBtn');
        const realBtn = document.getElementById('realBtn');

        if (nominalBtn && realBtn) {
            nominalBtn.addEventListener('click', () => {
                this.showRealValue = false;
                this.updateChartToggle();
                this.updateChart();
            });

            realBtn.addEventListener('click', () => {
                this.showRealValue = true;
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

        if (this.showRealValue) {
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
                this.calculateCompoundInterest();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateCompoundInterest();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['principal', 'interestRate', 'timeYears'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            const value = fieldName === 'interestRate' ? 
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

        // Validate reasonable ranges
        const interestRate = this.parsePercentage(this.form.interestRate.value);
        if (interestRate > 50) {
            if (showErrors) {
                this.showFieldError(this.form.interestRate, 'Interest rate seems unusually high');
            }
            isValid = false;
        }

        const timeYears = this.parseNumber(this.form.timeYears.value);
        if (timeYears > 100) {
            if (showErrors) {
                this.showFieldError(this.form.timeYears, 'Time period cannot exceed 100 years');
            }
            isValid = false;
        }

        return isValid;
    }

    calculateCompoundInterest() {
        const data = this.getFormData();
        const results = this.performCalculations(data);
        this.displayResults(results, data);
        this.displayChart(results);
        this.displayBreakdown(results);
    }

    getFormData() {
        return {
            principal: this.parseNumber(this.form.principal.value) || 0,
            interestRate: this.parsePercentage(this.form.interestRate.value) || 0,
            timeYears: this.parseNumber(this.form.timeYears.value) || 0,
            contributionAmount: this.parseNumber(this.form.contributionAmount.value) || 0,
            contributionFrequency: this.form.contributionFrequency.value,
            compoundingFrequency: this.form.compoundingFrequency.value,
            inflationRate: this.parsePercentage(this.form.inflationRate.value) || 0,
            contributionGrowth: this.parsePercentage(this.form.contributionGrowth.value) || 0
        };
    }

    performCalculations(data) {
        // Get compounding periods per year
        const compoundingPeriods = this.getCompoundingPeriods(data.compoundingFrequency);
        const contributionPeriods = this.getContributionPeriods(data.contributionFrequency);
        
        // Calculate year-by-year breakdown
        const yearlyData = [];
        let currentBalance = data.principal;
        let totalContributions = data.principal;
        let totalInterest = 0;
        let currentContribution = data.contributionAmount;

        for (let year = 1; year <= data.timeYears; year++) {
            const yearData = this.calculateYear(
                currentBalance,
                currentContribution,
                data.interestRate,
                data.inflationRate,
                compoundingPeriods,
                contributionPeriods,
                year
            );

            currentBalance = yearData.endBalance;
            totalContributions += yearData.yearlyContributions;
            totalInterest += yearData.interestEarned;

            yearlyData.push({
                year: year,
                startBalance: yearData.startBalance,
                contribution: yearData.yearlyContributions,
                interestEarned: yearData.interestEarned,
                endBalance: yearData.endBalance,
                realValue: yearData.realValue,
                cumulativeContributions: totalContributions,
                cumulativeInterest: totalInterest
            });

            // Increase contribution for next year if growth rate specified
            if (data.contributionGrowth > 0) {
                currentContribution *= (1 + data.contributionGrowth / 100);
            }
        }

        const finalBalance = currentBalance;
        const finalRealValue = data.inflationRate > 0 ? 
            finalBalance / Math.pow(1 + data.inflationRate / 100, data.timeYears) : finalBalance;

        return {
            finalBalance,
            finalRealValue,
            totalContributions,
            totalInterest,
            yearlyData,
            effectiveRate: this.calculateEffectiveRate(data.interestRate, compoundingPeriods),
            realReturn: data.inflationRate > 0 ? data.interestRate - data.inflationRate : null
        };
    }

    calculateYear(startBalance, contribution, annualRate, inflationRate, compoundingPeriods, contributionPeriods, year) {
        const periodicRate = annualRate / 100 / compoundingPeriods;
        const periodicContribution = contribution / contributionPeriods;
        
        let balance = startBalance;
        let yearlyContributions = 0;
        let interestEarned = 0;

        // Calculate for each compounding period in the year
        for (let period = 1; period <= compoundingPeriods; period++) {
            // Add contribution if it's time
            if (contributionPeriods > 0 && period % (compoundingPeriods / contributionPeriods) === 0) {
                balance += periodicContribution;
                yearlyContributions += periodicContribution;
            }

            // Calculate interest
            const periodInterest = balance * periodicRate;
            balance += periodInterest;
            interestEarned += periodInterest;
        }

        const realValue = inflationRate > 0 ? 
            balance / Math.pow(1 + inflationRate / 100, year) : balance;

        return {
            startBalance,
            yearlyContributions,
            interestEarned,
            endBalance: balance,
            realValue
        };
    }

    getCompoundingPeriods(frequency) {
        const periods = {
            'daily': 365,
            'monthly': 12,
            'quarterly': 4,
            'annually': 1
        };
        return periods[frequency] || 12;
    }

    getContributionPeriods(frequency) {
        const periods = {
            'monthly': 12,
            'quarterly': 4,
            'annually': 1,
            'none': 0
        };
        return periods[frequency] || 0;
    }

    calculateEffectiveRate(nominalRate, compoundingPeriods) {
        return (Math.pow(1 + nominalRate / 100 / compoundingPeriods, compoundingPeriods) - 1) * 100;
    }

    displayResults(results, data) {
        const totalReturn = ((results.finalBalance / data.principal) - 1) * 100;
        const realReturn = data.inflationRate > 0 ? 
            ((results.finalRealValue / data.principal) - 1) * 100 : null;

        this.resultsContainer.innerHTML = `
            <!-- Final Balance -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Final Balance</h4>
                    <div class="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                        ${this.formatCurrency(results.finalBalance)}
                    </div>
                    <p class="text-sm text-green-700 dark:text-green-300">
                        After ${data.timeYears} years
                    </p>
                    ${data.inflationRate > 0 ? `
                    <p class="text-sm text-green-600 dark:text-green-400 mt-2">
                        Real value: ${this.formatCurrency(results.finalRealValue)}
                    </p>
                    ` : ''}
                </div>
            </div>

            <!-- Growth Breakdown -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Breakdown</h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Initial Investment</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(data.principal)}</span>
                    </div>
                    
                    ${data.contributionAmount > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Total Contributions</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.totalContributions - data.principal)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Interest Earned</span>
                        <span class="font-medium text-green-600 dark:text-green-400">${this.formatCurrency(results.totalInterest)}</span>
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
                        ${this.getBalanceBreakdownBars(data.principal, results.totalContributions - data.principal, results.totalInterest)}
                    </div>
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span>Initial</span>
                        ${data.contributionAmount > 0 ? '<span>Contributions</span>' : ''}
                        <span>Interest</span>
                    </div>
                </div>
            </div>

            <!-- Return Analysis -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Return Analysis</h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Effective Annual Rate</span>
                        <span class="font-medium text-gray-900 dark:text-white">${results.effectiveRate.toFixed(2)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Total Return</span>
                        <span class="font-medium text-green-600 dark:text-green-400">${totalReturn.toFixed(1)}%</span>
                    </div>
                    
                    ${data.inflationRate > 0 ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Real Return (Inflation-Adjusted)</span>
                        <span class="font-medium text-blue-600 dark:text-blue-400">${realReturn.toFixed(1)}%</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Real Interest Rate</span>
                        <span class="font-medium text-gray-900 dark:text-white">${results.realReturn.toFixed(1)}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Key Insights -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Key Insights</h4>
                
                <div class="space-y-3">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            Interest earned (${this.formatCurrency(results.totalInterest)}) represents 
                            ${((results.totalInterest / results.finalBalance) * 100).toFixed(1)}% of your final balance
                        </p>
                    </div>
                    
                    ${data.contributionAmount > 0 ? `
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            Regular contributions of ${this.formatCurrency(data.contributionAmount)} ${data.contributionFrequency} 
                            add ${this.formatCurrency(results.totalContributions - data.principal)} over ${data.timeYears} years
                        </p>
                    </div>
                    ` : ''}
                    
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            ${data.compoundingFrequency.charAt(0).toUpperCase() + data.compoundingFrequency.slice(1)} compounding 
                            generates an effective rate of ${results.effectiveRate.toFixed(2)}% vs ${data.interestRate}% nominal
                        </p>
                    </div>

                    ${data.inflationRate > 0 ? `
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 flex-shrink-0"></div>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            Inflation at ${data.inflationRate}% reduces your purchasing power to 
                            ${this.formatCurrency(results.finalRealValue)} in today's dollars
                        </p>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Investment Timeline -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline Milestones</h4>
                
                <div class="space-y-3">
                    ${this.generateMilestones(results.yearlyData, data.principal).map(milestone => `
                        <div class="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-600">
                            <span class="text-sm font-medium text-gray-900 dark:text-white">${milestone.description}</span>
                            <span class="text-sm text-primary-600 dark:text-primary-400">Year ${milestone.year}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Store chart data for toggle functionality
        this.chartData = results;
    }

    getBalanceBreakdownBars(initial, contributions, interest) {
        const total = initial + contributions + interest;
        const initialPct = (initial / total) * 100;
        const contributionsPct = (contributions / total) * 100;
        const interestPct = (interest / total) * 100;

        let html = `<div class="bg-blue-500 h-4 rounded-l-full" style="width: ${initialPct}%"></div>`;
        if (contributions > 0) {
            html += `<div class="bg-purple-500 h-4" style="width: ${contributionsPct}%"></div>`;
        }
        html += `<div class="bg-green-500 h-4 ${contributions > 0 ? '' : 'rounded-l-full'} rounded-r-full" style="width: ${interestPct}%"></div>`;

        return html;
    }

    generateMilestones(yearlyData, principal) {
        const milestones = [];
        const targets = [principal * 2, principal * 5, principal * 10];
        const descriptions = ['Double your money', 'Reach 5x initial investment', 'Reach 10x initial investment'];

        targets.forEach((target, index) => {
            const yearData = yearlyData.find(data => data.endBalance >= target);
            if (yearData) {
                milestones.push({
                    description: descriptions[index],
                    year: yearData.year
                });
            }
        });

        return milestones;
    }

    displayChart(results) {
        this.chartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = results.yearlyData.map(data => `Year ${data.year}`);
        const nominalData = results.yearlyData.map(data => data.endBalance);
        const realData = results.yearlyData.map(data => data.realValue);
        const contributionsData = results.yearlyData.map(data => data.cumulativeContributions);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Value',
                        data: this.showRealValue ? realData : nominalData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Contributions',
                        data: contributionsData,
                        borderColor: 'rgb(168, 85, 247)',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
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
                            text: 'Time'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: this.showRealValue ? 'Value (Real Purchasing Power)' : 'Value'
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
            const realData = this.chartData.yearlyData.map(data => data.realValue);
            const nominalData = this.chartData.yearlyData.map(data => data.endBalance);
            
            this.chart.data.datasets[0].data = this.showRealValue ? realData : nominalData;
            this.chart.options.scales.y.title.text = this.showRealValue ? 'Value (Real Purchasing Power)' : 'Value';
            this.chart.update();
        }
    }

    displayBreakdown(results) {
        this.breakdownContainer.classList.remove('hidden');
        
        const tbody = document.getElementById('breakdownBody');
        tbody.innerHTML = results.yearlyData.map(data => `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="py-3 px-4 text-gray-900 dark:text-white">${data.year}</td>
                <td class="py-3 px-4 text-right text-gray-900 dark:text-white">${this.formatCurrency(data.contribution)}</td>
                <td class="py-3 px-4 text-right text-green-600 dark:text-green-400">${this.formatCurrency(data.interestEarned)}</td>
                <td class="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">${this.formatCurrency(data.endBalance)}</td>
                <td class="py-3 px-4 text-right text-blue-600 dark:text-blue-400">${this.formatCurrency(data.realValue)}</td>
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
    new CompoundInterestCalculator();
});
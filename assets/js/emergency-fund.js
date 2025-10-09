// Emergency Fund Calculator
class EmergencyFundCalculator {
    constructor() {
        this.form = document.getElementById('emergencyFundForm');
        this.resultsContainer = document.getElementById('emergencyResults');
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debounceCalculate());
        });

        // Format currency inputs
        this.setupCurrencyInputs();
    }

    setupCurrencyInputs() {
        const currencyInputs = this.form.querySelectorAll('input[type="text"]');
        currencyInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d.]/g, '');
                if (value) {
                    // Prevent multiple decimal points
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    // Limit to 2 decimal places
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
        });
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.validateForm(false)) {
                this.calculateEmergencyFund();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm(true)) {
            this.calculateEmergencyFund();
        }
    }

    validateForm(showErrors = false) {
        const requiredFields = ['housing'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            const value = this.parseNumber(field.value);

            if (!value || value <= 0) {
                if (showErrors) {
                    this.showFieldError(field, 'This field is required');
                }
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    calculateEmergencyFund() {
        const data = this.getFormData();
        const results = this.performCalculations(data);
        this.displayResults(results, data);
    }

    getFormData() {
        return {
            // Monthly expenses
            housing: this.parseNumber(this.form.housing.value) || 0,
            utilities: this.parseNumber(this.form.utilities.value) || 0,
            food: this.parseNumber(this.form.food.value) || 0,
            transportation: this.parseNumber(this.form.transportation.value) || 0,
            insurance: this.parseNumber(this.form.insurance.value) || 0,
            debtPayments: this.parseNumber(this.form.debtPayments.value) || 0,
            otherExpenses: this.parseNumber(this.form.otherExpenses.value) || 0,
            
            // Personal circumstances
            jobStability: this.form.jobStability.value,
            dependents: parseInt(this.form.dependents.value),
            incomeEarners: parseInt(this.form.incomeEarners.value),
            healthStatus: this.form.healthStatus.value,
            
            // Current savings
            currentSavings: this.parseNumber(this.form.currentSavings.value) || 0,
            monthlySavings: this.parseNumber(this.form.monthlySavings.value) || 0
        };
    }

    performCalculations(data) {
        // Calculate total monthly expenses
        const monthlyExpenses = data.housing + data.utilities + data.food + 
                               data.transportation + data.insurance + 
                               data.debtPayments + data.otherExpenses;

        // Determine base months needed based on circumstances
        let baseMonths = this.calculateBaseMonths(data);
        
        // Apply adjustments based on personal circumstances
        let adjustedMonths = this.applyCircumstanceAdjustments(baseMonths, data);
        
        // Calculate emergency fund targets
        const minimumFund = monthlyExpenses * Math.max(3, adjustedMonths - 1);
        const recommendedFund = monthlyExpenses * adjustedMonths;
        const idealFund = monthlyExpenses * Math.min(12, adjustedMonths + 2);

        // Calculate savings progress and timeline
        const currentCoverage = data.currentSavings / monthlyExpenses;
        const shortfall = Math.max(0, recommendedFund - data.currentSavings);
        const timeToGoal = data.monthlySavings > 0 ? Math.ceil(shortfall / data.monthlySavings) : null;

        // Calculate risk assessment
        const riskLevel = this.assessRiskLevel(data, currentCoverage, adjustedMonths);
        
        return {
            monthlyExpenses,
            adjustedMonths,
            minimumFund,
            recommendedFund,
            idealFund,
            currentCoverage,
            shortfall,
            timeToGoal,
            riskLevel,
            recommendations: this.generateRecommendations(data, currentCoverage, adjustedMonths)
        };
    }

    calculateBaseMonths(data) {
        // Base recommendation starts at 6 months
        let months = 6;

        // Adjust based on job stability
        switch (data.jobStability) {
            case 'stable':
                months = 3;
                break;
            case 'somewhat-stable':
                months = 6;
                break;
            case 'variable':
                months = 9;
                break;
            case 'unstable':
                months = 12;
                break;
        }

        return months;
    }

    applyCircumstanceAdjustments(baseMonths, data) {
        let adjustedMonths = baseMonths;

        // Adjust for dependents
        if (data.dependents >= 3) {
            adjustedMonths += 2;
        } else if (data.dependents >= 1) {
            adjustedMonths += 1;
        }

        // Adjust for income earners
        if (data.incomeEarners === 1) {
            adjustedMonths += 1;
        } else if (data.incomeEarners >= 3) {
            adjustedMonths -= 1;
        }

        // Adjust for health status
        switch (data.healthStatus) {
            case 'young-healthy':
                adjustedMonths -= 1;
                break;
            case 'health-concerns':
                adjustedMonths += 2;
                break;
            case 'older':
                adjustedMonths += 3;
                break;
        }

        // Keep within reasonable bounds
        return Math.max(3, Math.min(18, adjustedMonths));
    }

    assessRiskLevel(data, currentCoverage, targetMonths) {
        if (currentCoverage >= targetMonths) {
            return { level: 'low', color: 'green', text: 'Well Protected' };
        } else if (currentCoverage >= targetMonths * 0.7) {
            return { level: 'moderate', color: 'yellow', text: 'Getting There' };
        } else if (currentCoverage >= 1) {
            return { level: 'high', color: 'orange', text: 'Basic Coverage' };
        } else {
            return { level: 'critical', color: 'red', text: 'Vulnerable' };
        }
    }

    generateRecommendations(data, currentCoverage, targetMonths) {
        const recommendations = [];

        // Coverage-based recommendations
        if (currentCoverage < 1) {
            recommendations.push({
                priority: 'high',
                text: 'Start with a $1,000 mini emergency fund as your first goal.'
            });
        }

        if (currentCoverage < targetMonths * 0.5) {
            recommendations.push({
                priority: 'high',
                text: 'Consider temporarily reducing non-essential expenses to build your emergency fund faster.'
            });
        }

        // Savings strategy recommendations
        if (data.monthlySavings < data.housing * 0.1) {
            recommendations.push({
                priority: 'medium',
                text: 'Try to save at least 10% of your housing costs monthly for emergencies.'
            });
        }

        // Job stability recommendations
        if (data.jobStability === 'variable' || data.jobStability === 'unstable') {
            recommendations.push({
                priority: 'high',
                text: 'With variable income, consider saving more during high-income months.'
            });
        }

        // Family situation recommendations
        if (data.dependents > 0 && data.incomeEarners === 1) {
            recommendations.push({
                priority: 'high',
                text: 'As a single-income household with dependents, prioritize building a larger emergency fund.'
            });
        }

        // Health-based recommendations
        if (data.healthStatus === 'health-concerns' || data.healthStatus === 'older') {
            recommendations.push({
                priority: 'medium',
                text: 'Consider additional savings for potential medical expenses not covered by insurance.'
            });
        }

        // Account placement recommendations
        recommendations.push({
            priority: 'low',
            text: 'Keep your emergency fund in a high-yield savings account for easy access and growth.'
        });

        return recommendations;
    }

    displayResults(results, data) {
        const progressPercentage = Math.min(100, (data.currentSavings / results.recommendedFund) * 100);
        const coverageColor = this.getCoverageColor(results.currentCoverage, results.adjustedMonths);

        this.resultsContainer.innerHTML = `
            <!-- Emergency Fund Target -->
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <div class="text-center">
                    <h4 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Recommended Emergency Fund</h4>
                    <div class="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                        ${this.formatCurrency(results.recommendedFund)}
                    </div>
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                        ${results.adjustedMonths} months of expenses
                    </p>
                </div>
            </div>

            <!-- Current Coverage -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Coverage</h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Progress to Goal</span>
                        <span class="text-sm font-medium text-gray-900 dark:text-white">${progressPercentage.toFixed(1)}%</span>
                    </div>
                    
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div class="bg-gradient-to-r from-${coverageColor}-500 to-${coverageColor}-600 h-3 rounded-full transition-all duration-500" 
                             style="width: ${Math.min(100, progressPercentage)}%"></div>
                    </div>
                    
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Current: ${this.formatCurrency(data.currentSavings)}</span>
                        <span class="text-gray-600 dark:text-gray-400">Goal: ${this.formatCurrency(results.recommendedFund)}</span>
                    </div>
                </div>

                <div class="mt-4 p-3 rounded-lg ${this.getRiskBgClass(results.riskLevel.level)}">
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-${results.riskLevel.color}-500 mr-2"></div>
                        <span class="text-sm font-medium text-${results.riskLevel.color}-800 dark:text-${results.riskLevel.color}-200">
                            ${results.riskLevel.text}
                        </span>
                    </div>
                    <p class="text-xs text-${results.riskLevel.color}-700 dark:text-${results.riskLevel.color}-300 mt-1">
                        ${results.currentCoverage.toFixed(1)} months of expenses covered
                    </p>
                </div>
            </div>

            <!-- Fund Targets -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emergency Fund Targets</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <div>
                            <span class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Minimum</span>
                            <p class="text-xs text-yellow-700 dark:text-yellow-300">Basic protection</p>
                        </div>
                        <span class="font-semibold text-yellow-900 dark:text-yellow-100">${this.formatCurrency(results.minimumFund)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700">
                        <div>
                            <span class="text-sm font-medium text-blue-800 dark:text-blue-200">Recommended</span>
                            <p class="text-xs text-blue-700 dark:text-blue-300">Ideal for your situation</p>
                        </div>
                        <span class="font-semibold text-blue-900 dark:text-blue-100">${this.formatCurrency(results.recommendedFund)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div>
                            <span class="text-sm font-medium text-green-800 dark:text-green-200">Ideal</span>
                            <p class="text-xs text-green-700 dark:text-green-300">Maximum security</p>
                        </div>
                        <span class="font-semibold text-green-900 dark:text-green-100">${this.formatCurrency(results.idealFund)}</span>
                    </div>
                </div>
            </div>

            ${results.shortfall > 0 ? `
            <!-- Savings Timeline -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Savings Plan</h4>
                
                <div class="space-y-4">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Amount Needed</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(results.shortfall)}</span>
                    </div>
                    
                    ${data.monthlySavings > 0 ? `
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</span>
                        <span class="font-medium text-gray-900 dark:text-white">${this.formatCurrency(data.monthlySavings)}</span>
                    </div>
                    
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Time to Goal</span>
                        <span class="font-medium text-primary-600 dark:text-primary-400">
                            ${results.timeToGoal} months
                        </span>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <p class="text-sm text-blue-800 dark:text-blue-200">
                            💡 At ${this.formatCurrency(data.monthlySavings)} per month, you'll reach your emergency fund goal 
                            by <strong>${this.getTargetDate(results.timeToGoal)}</strong>
                        </p>
                    </div>
                    ` : `
                    <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                        <p class="text-sm text-amber-800 dark:text-amber-200">
                            💡 Enter your monthly savings capacity to see timeline to goal
                        </p>
                    </div>
                    `}
                </div>
            </div>
            ` : ''}

            <!-- Recommendations -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personalized Recommendations</h4>
                
                <div class="space-y-3">
                    ${results.recommendations.map(rec => `
                        <div class="flex items-start p-3 rounded-lg ${this.getPriorityBgClass(rec.priority)}">
                            <div class="w-2 h-2 rounded-full ${this.getPriorityColor(rec.priority)} mt-2 mr-3 flex-shrink-0"></div>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${rec.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Monthly Breakdown -->
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Expenses Breakdown</h4>
                
                <div class="space-y-3">
                    ${data.housing > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Housing</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.housing)}</span>
                    </div>` : ''}
                    ${data.utilities > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Utilities & Phone</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.utilities)}</span>
                    </div>` : ''}
                    ${data.food > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Food & Groceries</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.food)}</span>
                    </div>` : ''}
                    ${data.transportation > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Transportation</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.transportation)}</span>
                    </div>` : ''}
                    ${data.insurance > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Insurance</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.insurance)}</span>
                    </div>` : ''}
                    ${data.debtPayments > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Debt Payments</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.debtPayments)}</span>
                    </div>` : ''}
                    ${data.otherExpenses > 0 ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Other Expenses</span>
                        <span class="text-gray-900 dark:text-white">${this.formatCurrency(data.otherExpenses)}</span>
                    </div>` : ''}
                    
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                        <div class="flex justify-between font-semibold">
                            <span class="text-gray-900 dark:text-white">Total Monthly Expenses</span>
                            <span class="text-gray-900 dark:text-white">${this.formatCurrency(results.monthlyExpenses)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCoverageColor(coverage, target) {
        if (coverage >= target) return 'green';
        if (coverage >= target * 0.7) return 'yellow';
        if (coverage >= 1) return 'orange';
        return 'red';
    }

    getRiskBgClass(level) {
        const classes = {
            'low': 'bg-green-50 dark:bg-green-900/20',
            'moderate': 'bg-yellow-50 dark:bg-yellow-900/20',
            'high': 'bg-orange-50 dark:bg-orange-900/20',
            'critical': 'bg-red-50 dark:bg-red-900/20'
        };
        return classes[level] || classes.critical;
    }

    getPriorityBgClass(priority) {
        const classes = {
            'high': 'bg-red-50 dark:bg-red-900/20',
            'medium': 'bg-yellow-50 dark:bg-yellow-900/20',
            'low': 'bg-blue-50 dark:bg-blue-900/20'
        };
        return classes[priority] || classes.low;
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'bg-red-500',
            'medium': 'bg-yellow-500',
            'low': 'bg-blue-500'
        };
        return colors[priority] || colors.low;
    }

    getTargetDate(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long'
        });
    }

    // Utility functions
    parseNumber(value) {
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
    new EmergencyFundCalculator();
});
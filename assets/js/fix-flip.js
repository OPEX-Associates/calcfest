/**
 * Fix & Flip Calculator
 * Calculates house flipping profit, ROI, and comprehensive cost analysis
 */

class FixFlipCalculator {
    constructor() {
        this.form = document.getElementById('fixFlipForm');
        this.resultsContainer = document.getElementById('calculationResults');
        this.initialize();
    }

    initialize() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Add real-time calculation on input changes
            const inputs = this.form.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.debounce(() => this.calculateIfValid(), 300));
            });

            // Load from URL parameters
            this.loadFromUrlParams();
        }
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    handleSubmit(e) {
        e.preventDefault();
        this.calculate();
    }

    calculateIfValid() {
        const requiredInputs = ['purchasePrice', 'renovationBudget', 'holdingPeriod', 'salePrice'];
        const isValid = requiredInputs.every(id => {
            const value = this.parseAndValidateNumber(document.getElementById(id).value);
            return value > 0;
        });

        if (isValid) {
            this.calculate();
        }
    }

    parseAndValidateNumber(value) {
        if (!value) return 0;
        const parsed = typeof value === 'string' ? 
            parseFloat(value.replace(/[$,%]/g, '')) : parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    getFormData() {
        return {
            // Acquisition costs
            purchasePrice: this.parseAndValidateNumber(document.getElementById('purchasePrice').value),
            closingCosts: this.parseAndValidateNumber(document.getElementById('closingCosts').value),
            inspectionAppraisal: this.parseAndValidateNumber(document.getElementById('inspectionAppraisal').value),
            otherAcquisition: this.parseAndValidateNumber(document.getElementById('otherAcquisition').value),
            
            // Renovation costs
            renovationBudget: this.parseAndValidateNumber(document.getElementById('renovationBudget').value),
            contingencyRate: this.parseAndValidateNumber(document.getElementById('contingencyRate').value),
            permits: this.parseAndValidateNumber(document.getElementById('permits').value),
            materials: this.parseAndValidateNumber(document.getElementById('materials').value),
            
            // Holding costs
            holdingPeriod: this.parseAndValidateNumber(document.getElementById('holdingPeriod').value),
            interestRate: this.parseAndValidateNumber(document.getElementById('interestRate').value),
            propertyTaxes: this.parseAndValidateNumber(document.getElementById('propertyTaxes').value),
            insurance: this.parseAndValidateNumber(document.getElementById('insurance').value),
            utilities: this.parseAndValidateNumber(document.getElementById('utilities').value),
            otherHolding: this.parseAndValidateNumber(document.getElementById('otherHolding').value),
            
            // Sale information
            salePrice: this.parseAndValidateNumber(document.getElementById('salePrice').value),
            realtorCommission: this.parseAndValidateNumber(document.getElementById('realtorCommission').value),
            sellingCosts: this.parseAndValidateNumber(document.getElementById('sellingCosts').value),
            otherSelling: this.parseAndValidateNumber(document.getElementById('otherSelling').value)
        };
    }

    calculate() {
        try {
            const data = this.getFormData();
            
            // Validate required fields
            if (!data.purchasePrice || !data.renovationBudget || !data.holdingPeriod || !data.salePrice) {
                this.showError('Please fill in all required fields (Purchase Price, Renovation Budget, Holding Period, Sale Price)');
                return;
            }

            const results = this.calculateFixFlip(data);
            this.displayResults(results);
            this.updateUrlParams(data);
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showError('An error occurred during calculation. Please check your inputs.');
        }
    }

    calculateFixFlip(data) {
        // Calculate total acquisition costs
        const totalAcquisitionCosts = data.purchasePrice + data.closingCosts + 
                                    data.inspectionAppraisal + data.otherAcquisition;

        // Calculate total renovation costs with contingency
        const baseCosts = data.renovationBudget + data.permits + data.materials;
        const contingencyAmount = baseCosts * (data.contingencyRate / 100);
        const totalRenovationCosts = baseCosts + contingencyAmount;

        // Calculate holding costs
        const monthlyHoldingCosts = data.propertyTaxes + data.insurance + data.utilities + data.otherHolding;
        const totalMonthlyHolding = monthlyHoldingCosts * data.holdingPeriod;
        
        // Calculate interest costs (on acquisition + renovation costs)
        const loanAmount = totalAcquisitionCosts + totalRenovationCosts;
        const monthlyInterestRate = (data.interestRate / 100) / 12;
        const totalInterestCosts = loanAmount * monthlyInterestRate * data.holdingPeriod;
        
        const totalHoldingCosts = totalMonthlyHolding + totalInterestCosts;

        // Calculate selling costs
        const realtorCommissionAmount = data.salePrice * (data.realtorCommission / 100);
        const totalSellingCosts = realtorCommissionAmount + data.sellingCosts + data.otherSelling;

        // Calculate totals
        const totalCosts = totalAcquisitionCosts + totalRenovationCosts + totalHoldingCosts + totalSellingCosts;
        const grossProfit = data.salePrice - totalCosts;
        const totalInvestment = totalAcquisitionCosts + totalRenovationCosts;

        // Calculate ROI and profit margin
        const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
        const profitMargin = data.salePrice > 0 ? (grossProfit / data.salePrice) * 100 : 0;

        // Calculate 70% rule compliance
        const seventyPercentRule = data.salePrice * 0.70;
        const currentInvestment = data.purchasePrice + data.renovationBudget;
        const seventyPercentCompliant = currentInvestment <= seventyPercentRule;

        // Calculate monthly breakdown
        const monthlyHoldingBreakdown = {
            propertyTaxes: data.propertyTaxes,
            insurance: data.insurance,
            utilities: data.utilities,
            otherHolding: data.otherHolding,
            interest: totalInterestCosts / data.holdingPeriod,
            total: monthlyHoldingCosts + (totalInterestCosts / data.holdingPeriod)
        };

        return {
            acquisition: {
                purchasePrice: data.purchasePrice,
                closingCosts: data.closingCosts,
                inspectionAppraisal: data.inspectionAppraisal,
                otherAcquisition: data.otherAcquisition,
                total: totalAcquisitionCosts
            },
            renovation: {
                baseCosts: baseCosts,
                contingencyRate: data.contingencyRate,
                contingencyAmount: contingencyAmount,
                total: totalRenovationCosts
            },
            holding: {
                monthlyBreakdown: monthlyHoldingBreakdown,
                holdingPeriod: data.holdingPeriod,
                totalInterest: totalInterestCosts,
                totalMonthly: totalMonthlyHolding,
                total: totalHoldingCosts
            },
            selling: {
                salePrice: data.salePrice,
                realtorCommission: data.realtorCommission,
                realtorCommissionAmount: realtorCommissionAmount,
                otherCosts: data.sellingCosts + data.otherSelling,
                total: totalSellingCosts
            },
            summary: {
                totalCosts: totalCosts,
                totalInvestment: totalInvestment,
                grossProfit: grossProfit,
                roi: roi,
                profitMargin: profitMargin,
                seventyPercentRule: seventyPercentRule,
                seventyPercentCompliant: seventyPercentCompliant,
                currentInvestment: currentInvestment
            }
        };
    }

    displayResults(results) {
        const { acquisition, renovation, holding, selling, summary } = results;
        
        const profitClass = summary.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const roiClass = summary.roi >= 20 ? 'text-green-600 dark:text-green-400' : 
                        summary.roi >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 
                        'text-red-600 dark:text-red-400';
        const ruleClass = summary.seventyPercentCompliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

        this.resultsContainer.innerHTML = `
            <!-- Profit Summary -->
            <div class="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-primary-200 dark:border-gray-600">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Profit Analysis</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Sale Price:</span>
                        <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(selling.salePrice)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Total Costs:</span>
                        <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(summary.totalCosts)}</span>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-900 dark:text-white">Net Profit:</span>
                            <span class="text-xl font-bold ${profitClass}">
                                ${summary.grossProfit >= 0 ? '+' : ''}$${this.formatNumber(summary.grossProfit)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ROI Metrics -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-green-200 dark:border-gray-600">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Return Metrics</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Total Investment:</span>
                        <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(summary.totalInvestment)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">ROI:</span>
                        <span class="text-lg font-bold ${roiClass}">${this.formatNumber(summary.roi, 1)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Profit Margin:</span>
                        <span class="font-medium ${profitClass}">${this.formatNumber(summary.profitMargin, 1)}%</span>
                    </div>
                </div>
            </div>

            <!-- 70% Rule Check -->
            <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-yellow-200 dark:border-gray-600">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">70% Rule Analysis</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">70% of ARV:</span>
                        <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(summary.seventyPercentRule)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Your Investment:</span>
                        <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(summary.currentInvestment)}</span>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-gray-900 dark:text-white">Status:</span>
                            <span class="font-bold ${ruleClass}">
                                ${summary.seventyPercentCompliant ? '✓ Compliant' : '✗ Over Budget'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cost Breakdown -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Cost Breakdown</h4>
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Acquisition:</span>
                            <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(acquisition.total)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Renovation:</span>
                            <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(renovation.total)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Holding (${holding.holdingPeriod}mo):</span>
                            <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(holding.total)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">Selling:</span>
                            <span class="font-medium text-gray-900 dark:text-white">$${this.formatNumber(selling.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Monthly Holding Costs -->
            <div class="bg-purple-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Monthly Holding Costs</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Property Taxes:</span>
                        <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.propertyTaxes)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Insurance:</span>
                        <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.insurance)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Utilities:</span>
                        <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.utilities)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Interest:</span>
                        <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.interest)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Other:</span>
                        <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.otherHolding)}</span>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div class="flex justify-between font-medium">
                            <span class="text-gray-900 dark:text-white">Total Monthly:</span>
                            <span class="text-gray-900 dark:text-white">$${this.formatNumber(holding.monthlyBreakdown.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatNumber(num, decimals = 0) {
        return Math.abs(num).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-red-700 dark:text-red-400">${message}</span>
                </div>
            </div>
        `;
    }

    updateUrlParams(data) {
        const params = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
            if (value > 0) {
                params.set(key, value.toString());
            }
        });
        
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    loadFromUrlParams() {
        const params = new URLSearchParams(window.location.search);
        let hasParams = false;

        params.forEach((value, key) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
                hasParams = true;
            }
        });

        if (hasParams) {
            setTimeout(() => this.calculateIfValid(), 100);
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FixFlipCalculator();
});
/**
 * Cap Rate Calculator
 * Calculates capitalization rate for real estate investment properties
 */

class CapRateCalculator {
    constructor() {
        this.initializeEventListeners();
        this.displayDefaultResults();
    }

    initializeEventListeners() {
        // Input field event listeners
        const inputs = ['propertyValue', 'annualRent', 'operatingExpenses'];
        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('input', () => this.calculateCapRate());
                // Removed blur event listener that was causing fields to clear
            }
        });

        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateCapRate());
        }

        // Load URL parameters on page load
        this.loadFromURL();
    }

    parseAndValidateNumber(value, fieldName, min = 0, max = Infinity) {
        // Handle empty values
        if (!value || value.trim() === '') {
            return 0; // Return 0 for optional fields
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
            <!-- Cap Rate Display -->
            <div class="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-gray-700 dark:to-gray-600 border border-accent-200 dark:border-gray-600 rounded-xl p-6 text-center mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Capitalization Rate</h3>
                <p id="capRateResult" class="text-4xl font-bold text-accent-600 dark:text-accent-400">7.3%</p>
                <p id="capRateRating" class="text-sm text-gray-600 dark:text-gray-400 mt-2">Good Investment</p>
            </div>

            <!-- Calculation Breakdown -->
            <div class="space-y-4">
                <h4 class="font-semibold text-gray-900 dark:text-white">Calculation Breakdown</h4>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Annual Rental Income</span>
                        <span id="incomeDisplay" class="font-bold text-lg text-green-600 dark:text-green-400">$30,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Annual Operating Expenses</span>
                        <span id="expensesDisplay" class="font-bold text-lg text-red-600 dark:text-red-400">$8,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Net Operating Income (NOI)</span>
                        <span id="noiDisplay" class="font-bold text-lg text-accent-600 dark:text-accent-400">$22,000</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Property Value</span>
                        <span id="valueDisplay" class="font-bold text-lg text-gray-900 dark:text-white">$300,000</span>
                    </div>
                </div>
            </div>

            <!-- Cap Rate Guidelines -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-6">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Cap Rate Guidelines</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Excellent (8%+):</span>
                        <span class="font-medium text-green-600 dark:text-green-400">High return, higher risk</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Good (6-8%):</span>
                        <span class="font-medium text-accent-600 dark:text-accent-400">Balanced return and risk</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Fair (4-6%):</span>
                        <span class="font-medium text-yellow-600 dark:text-yellow-400">Lower return, safer investment</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Poor (<4%):</span>
                        <span class="font-medium text-red-600 dark:text-red-400">Low return, may not be profitable</span>
                    </div>
                </div>
            </div>
        `;
    }

    calculateCapRate() {
        try {
            // Clear any previous results errors
            this.clearResultsError();

            // Get input values with proper validation
            const propertyValue = this.parseAndValidateNumber(
                document.getElementById('propertyValue').value, 
                'Property Value', 
                1000, 
                100000000
            );
            const annualRent = this.parseAndValidateNumber(
                document.getElementById('annualRent').value, 
                'Annual Rental Income', 
                0, 
                10000000
            );
            const operatingExpenses = this.parseAndValidateNumber(
                document.getElementById('operatingExpenses').value, 
                'Operating Expenses', 
                0, 
                10000000
            );

            // Validate required inputs
            if (propertyValue === null || propertyValue === 0) {
                this.displayError('Please enter a valid property value greater than $1,000.');
                return;
            }

            if (annualRent === null) {
                this.displayError('Please enter a valid annual rental income.');
                return;
            }

            // Calculate Net Operating Income (NOI)
            const netOperatingIncome = annualRent - (operatingExpenses || 0);

            // Calculate Cap Rate
            const capRate = (netOperatingIncome / propertyValue) * 100;

            // Update display with comprehensive safety checks
            this.updateResults({
                capRate: capRate,
                propertyValue: propertyValue,
                annualRent: annualRent,
                operatingExpenses: operatingExpenses || 0,
                netOperatingIncome: netOperatingIncome
            });

            // Update URL parameters
            this.updateURL({
                value: propertyValue,
                rent: annualRent,
                expenses: operatingExpenses || 0
            });

        } catch (error) {
            console.error('Cap rate calculation error:', error);
            this.displayError('An error occurred while calculating the cap rate. Please check your inputs and try again.');
        }
    }

    updateResults(results) {
        // Update cap rate display with safety check
        const capRateElement = document.getElementById('capRateResult');
        if (capRateElement) {
            capRateElement.textContent = `${results.capRate.toFixed(1)}%`;
            capRateElement.className = this.getCapRateColorClass(results.capRate);
        }

        // Update cap rate rating with safety check
        const capRateRatingElement = document.getElementById('capRateRating');
        if (capRateRatingElement) {
            capRateRatingElement.textContent = this.getCapRateRating(results.capRate);
        }

        // Update breakdown values with safety checks
        const incomeDisplayElement = document.getElementById('incomeDisplay');
        if (incomeDisplayElement) {
            incomeDisplayElement.textContent = this.formatCurrency(results.annualRent);
        }

        const expensesDisplayElement = document.getElementById('expensesDisplay');
        if (expensesDisplayElement) {
            expensesDisplayElement.textContent = this.formatCurrency(results.operatingExpenses);
        }

        const noiDisplayElement = document.getElementById('noiDisplay');
        if (noiDisplayElement) {
            noiDisplayElement.textContent = this.formatCurrency(results.netOperatingIncome);
        }

        const valueDisplayElement = document.getElementById('valueDisplay');
        if (valueDisplayElement) {
            valueDisplayElement.textContent = this.formatCurrency(results.propertyValue);
        }

        // Add animation to results
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.classList.add('result-update');
            setTimeout(() => {
                resultsContainer.classList.remove('result-update');
            }, 300);
        }
    }

    getCapRateColorClass(capRate) {
        if (capRate >= 8) {
            return 'text-4xl font-bold text-green-600 dark:text-green-400';
        } else if (capRate >= 6) {
            return 'text-4xl font-bold text-accent-600 dark:text-accent-400';
        } else if (capRate >= 4) {
            return 'text-4xl font-bold text-yellow-600 dark:text-yellow-400';
        } else {
            return 'text-4xl font-bold text-red-600 dark:text-red-400';
        }
    }

    getCapRateRating(capRate) {
        if (capRate >= 8) {
            return 'Excellent Investment';
        } else if (capRate >= 6) {
            return 'Good Investment';
        } else if (capRate >= 4) {
            return 'Fair Investment';
        } else if (capRate >= 0) {
            return 'Poor Investment';
        } else {
            return 'Negative Cash Flow';
        }
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

    displayDefaultResults() {
        // Don't auto-populate input fields to avoid interfering with user input
        // Just show the default results structure
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            // Results are already showing default values from the HTML
            // Only calculate if there are actual input values
            const propertyValue = document.getElementById('propertyValue').value;
            const annualRent = document.getElementById('annualRent').value;
            
            if (propertyValue && annualRent) {
                this.calculateCapRate();
            }
        }
    }

    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return formatter.format(amount);
    }

    formatNumberForInput(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    updateURL(params) {
        const url = new URL(window.location);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== '' && params[key] !== 0) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });

        window.history.replaceState({}, '', url);
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const paramMap = {
            'value': 'propertyValue',
            'rent': 'annualRent',
            'expenses': 'operatingExpenses'
        };

        Object.keys(paramMap).forEach(urlParam => {
            const value = urlParams.get(urlParam);
            if (value) {
                const element = document.getElementById(paramMap[urlParam]);
                if (element) {
                    element.value = value; // Just set the raw value without formatting
                }
            }
        });

        // Calculate after loading URL parameters
        if (urlParams.has('value') || urlParams.has('rent')) {
            this.calculateCapRate();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CapRateCalculator();
});
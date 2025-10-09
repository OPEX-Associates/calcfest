// Risk Assessment Calculator
class RiskAssessmentCalculator {
    constructor() {
        this.form = document.getElementById('riskForm');
        this.resultsContainer = document.getElementById('riskResults');
        this.chartContainer = document.getElementById('riskChartContainer');
        this.portfolioAnalysisContainer = document.getElementById('portfolioAnalysis');
        this.allocationContainer = document.getElementById('recommendedAllocation');
        this.tipsContainer = document.getElementById('riskTips');
        
        this.riskChart = null;
        this.allocationChart = null;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Add real-time calculation on input change
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.debounceCalculate());
        });

        // Setup allocation validation
        this.setupAllocationValidation();
        
        // Format inputs
        this.setupInputFormatting();
    }

    setupAllocationValidation() {
        const allocationInputs = ['stockAllocation', 'bondAllocation', 'cashAllocation', 'alternativeAllocation'];
        const geoAllocationInputs = ['domesticAllocation', 'internationalAllocation'];
        
        allocationInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', () => this.validateAllocations(allocationInputs, 'Asset'));
        });
        
        geoAllocationInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', () => this.validateAllocations(geoAllocationInputs, 'Geographic'));
        });
    }

    validateAllocations(inputIds, type) {
        const total = inputIds.reduce((sum, id) => {
            const value = parseFloat(document.getElementById(id).value) || 0;
            return sum + value;
        }, 0);
        
        // Remove existing warnings
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            this.clearFieldError(input);
        });
        
        if (total > 100) {
            inputIds.forEach(id => {
                const input = document.getElementById(id);
                this.showFieldError(input, `${type} allocation exceeds 100%`);
            });
        }
    }

    setupInputFormatting() {
        const portfolioValueInput = document.getElementById('portfolioValue');
        
        portfolioValueInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^\d.]/g, '');
            if (value) {
                e.target.value = this.formatNumber(value);
            }
        });

        portfolioValueInput.addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = this.formatCurrency(this.parseNumber(e.target.value));
            }
        });

        portfolioValueInput.addEventListener('focus', (e) => {
            e.target.value = this.parseNumber(e.target.value).toString();
        });
    }

    debounceCalculate() {
        clearTimeout(this.calculateTimeout);
        this.calculateTimeout = setTimeout(() => {
            if (this.hasMinimumInputs()) {
                this.calculateRiskAssessment();
            }
        }, 500);
    }

    handleSubmit(e) {
        e.preventDefault();
        if (this.validateForm()) {
            this.calculateRiskAssessment();
        }
    }

    hasMinimumInputs() {
        const age = document.getElementById('age').value;
        const experience = document.getElementById('experience').value;
        const timeline = document.getElementById('timeline').value;
        
        return age && experience && timeline;
    }

    validateForm() {
        const requiredFields = ['age', 'experience', 'timeline', 'riskCapacity', 'volatilityComfort', 'investmentGoals'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = field.value.trim();

            if (!value) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validate age range
        const age = parseInt(document.getElementById('age').value);
        if (age && (age < 18 || age > 100)) {
            this.showFieldError(document.getElementById('age'), 'Age must be between 18 and 100');
            isValid = false;
        }

        return isValid;
    }

    calculateRiskAssessment() {
        const data = this.getFormData();
        const riskProfile = this.calculateRiskProfile(data);
        const portfolioAnalysis = this.analyzePortfolio(data);
        const recommendations = this.generateRecommendations(riskProfile, data);
        
        this.displayResults(riskProfile, data);
        this.displayRiskChart(riskProfile);
        this.displayPortfolioAnalysis(portfolioAnalysis, data);
        this.displayRecommendedAllocation(riskProfile);
        this.displayRiskTips(recommendations, riskProfile);
    }

    getFormData() {
        return {
            age: parseInt(document.getElementById('age').value) || 0,
            experience: document.getElementById('experience').value,
            timeline: document.getElementById('timeline').value,
            riskCapacity: document.getElementById('riskCapacity').value,
            volatilityComfort: document.getElementById('volatilityComfort').value,
            investmentGoals: document.getElementById('investmentGoals').value,
            portfolioValue: this.parseNumber(document.getElementById('portfolioValue').value) || 0,
            stockAllocation: parseFloat(document.getElementById('stockAllocation').value) || 0,
            bondAllocation: parseFloat(document.getElementById('bondAllocation').value) || 0,
            cashAllocation: parseFloat(document.getElementById('cashAllocation').value) || 0,
            alternativeAllocation: parseFloat(document.getElementById('alternativeAllocation').value) || 0,
            domesticAllocation: parseFloat(document.getElementById('domesticAllocation').value) || 0,
            internationalAllocation: parseFloat(document.getElementById('internationalAllocation').value) || 0
        };
    }

    calculateRiskProfile(data) {
        let riskScore = 0;
        const factors = {};
        
        // Age factor (0-20 points)
        if (data.age <= 30) {
            factors.age = { score: 20, description: 'Young age allows for higher risk tolerance' };
        } else if (data.age <= 40) {
            factors.age = { score: 16, description: 'Good time horizon for moderate to high risk' };
        } else if (data.age <= 50) {
            factors.age = { score: 12, description: 'Moderate risk tolerance approaching mid-career' };
        } else if (data.age <= 60) {
            factors.age = { score: 8, description: 'Lower risk tolerance as retirement approaches' };
        } else {
            factors.age = { score: 4, description: 'Conservative approach recommended for retirement' };
        }
        riskScore += factors.age.score;
        
        // Experience factor (0-15 points)
        const experienceScores = {
            'beginner': { score: 3, description: 'Limited experience suggests conservative approach' },
            'novice': { score: 6, description: 'Some experience allows for modest risk' },
            'intermediate': { score: 10, description: 'Good experience supports moderate risk' },
            'experienced': { score: 13, description: 'Strong experience allows higher risk tolerance' },
            'expert': { score: 15, description: 'Expert level supports sophisticated risk strategies' }
        };
        factors.experience = experienceScores[data.experience] || { score: 0, description: 'No experience data' };
        riskScore += factors.experience.score;
        
        // Timeline factor (0-20 points)
        const timelineScores = {
            'short': { score: 5, description: 'Short timeline requires capital preservation' },
            'medium': { score: 10, description: 'Medium timeline allows balanced approach' },
            'long': { score: 16, description: 'Long timeline supports growth strategies' },
            'retirement': { score: 20, description: 'Very long timeline allows maximum growth focus' }
        };
        factors.timeline = timelineScores[data.timeline] || { score: 0, description: 'No timeline data' };
        riskScore += factors.timeline.score;
        
        // Risk capacity factor (0-15 points)
        const capacityScores = {
            'low': { score: 3, description: 'Limited financial capacity requires caution' },
            'moderate': { score: 7, description: 'Moderate capacity supports balanced risk' },
            'high': { score: 12, description: 'High capacity allows for growth strategies' },
            'very-high': { score: 15, description: 'Very high capacity supports aggressive strategies' }
        };
        factors.capacity = capacityScores[data.riskCapacity] || { score: 0, description: 'No capacity data' };
        riskScore += factors.capacity.score;
        
        // Volatility comfort factor (0-15 points)
        const volatilityScores = {
            'very-low': { score: 2, description: 'Very low volatility tolerance' },
            'low': { score: 5, description: 'Low volatility tolerance requires stability' },
            'moderate': { score: 8, description: 'Moderate volatility tolerance' },
            'high': { score: 12, description: 'High volatility tolerance supports growth' },
            'very-high': { score: 15, description: 'Very high volatility tolerance' }
        };
        factors.volatility = volatilityScores[data.volatilityComfort] || { score: 0, description: 'No volatility data' };
        riskScore += factors.volatility.score;
        
        // Investment goals factor (0-15 points)
        const goalScores = {
            'preservation': { score: 3, description: 'Capital preservation prioritizes safety' },
            'income': { score: 6, description: 'Income focus requires moderate risk' },
            'balanced': { score: 9, description: 'Balanced approach allows moderate risk' },
            'growth': { score: 12, description: 'Growth focus supports higher risk' },
            'aggressive': { score: 15, description: 'Aggressive growth requires high risk tolerance' }
        };
        factors.goals = goalScores[data.investmentGoals] || { score: 0, description: 'No goals data' };
        riskScore += factors.goals.score;
        
        // Determine risk profile
        const maxScore = 100;
        const riskPercentage = (riskScore / maxScore) * 100;
        
        let riskLevel, riskDescription, riskColor;
        if (riskPercentage <= 20) {
            riskLevel = 'Very Conservative';
            riskDescription = 'Focus on capital preservation with minimal volatility';
            riskColor = 'blue';
        } else if (riskPercentage <= 40) {
            riskLevel = 'Conservative';
            riskDescription = 'Emphasis on stability with modest growth potential';
            riskColor = 'green';
        } else if (riskPercentage <= 60) {
            riskLevel = 'Moderate';
            riskDescription = 'Balanced approach between growth and stability';
            riskColor = 'yellow';
        } else if (riskPercentage <= 80) {
            riskLevel = 'Aggressive';
            riskDescription = 'Growth-oriented with higher volatility tolerance';
            riskColor = 'orange';
        } else {
            riskLevel = 'Very Aggressive';
            riskDescription = 'Maximum growth focus with high risk tolerance';
            riskColor = 'red';
        }
        
        return {
            score: riskScore,
            maxScore,
            percentage: riskPercentage,
            level: riskLevel,
            description: riskDescription,
            color: riskColor,
            factors
        };
    }

    analyzePortfolio(data) {
        if (!data.portfolioValue || data.portfolioValue <= 0) {
            return null;
        }
        
        const totalAllocation = data.stockAllocation + data.bondAllocation + 
                              data.cashAllocation + data.alternativeAllocation;
        
        const geoTotal = data.domesticAllocation + data.internationalAllocation;
        
        if (totalAllocation === 0) {
            return null;
        }
        
        // Calculate portfolio risk metrics
        const portfolioRisk = this.calculatePortfolioRisk(data);
        const diversificationScore = this.calculateDiversificationScore(data);
        const allocationAnalysis = this.analyzeAllocation(data);
        
        return {
            totalAllocation,
            geoTotal,
            portfolioRisk,
            diversificationScore,
            allocationAnalysis,
            recommendations: this.getPortfolioRecommendations(data, portfolioRisk, diversificationScore)
        };
    }

    calculatePortfolioRisk(data) {
        // Simplified portfolio risk calculation based on asset allocation
        // Using historical standard deviations
        const riskWeights = {
            stock: 0.16,      // ~16% annual standard deviation
            bond: 0.05,       // ~5% annual standard deviation
            cash: 0.01,       // ~1% annual standard deviation
            alternative: 0.20  // ~20% annual standard deviation
        };
        
        const totalAllocation = data.stockAllocation + data.bondAllocation + 
                              data.cashAllocation + data.alternativeAllocation;
        
        if (totalAllocation === 0) return 0;
        
        const weightedRisk = (
            (data.stockAllocation / totalAllocation) * riskWeights.stock +
            (data.bondAllocation / totalAllocation) * riskWeights.bond +
            (data.cashAllocation / totalAllocation) * riskWeights.cash +
            (data.alternativeAllocation / totalAllocation) * riskWeights.alternative
        );
        
        return weightedRisk * 100; // Convert to percentage
    }

    calculateDiversificationScore(data) {
        let score = 0;
        const maxScore = 100;
        
        const totalAllocation = data.stockAllocation + data.bondAllocation + 
                              data.cashAllocation + data.alternativeAllocation;
        
        if (totalAllocation === 0) return 0;
        
        // Asset class diversification (40 points)
        const assetClasses = [
            data.stockAllocation,
            data.bondAllocation,
            data.cashAllocation,
            data.alternativeAllocation
        ].filter(allocation => allocation > 0);
        
        if (assetClasses.length >= 3) score += 40;
        else if (assetClasses.length === 2) score += 25;
        else score += 10;
        
        // No single asset class dominance (30 points)
        const maxAllocation = Math.max(data.stockAllocation, data.bondAllocation, 
                                     data.cashAllocation, data.alternativeAllocation);
        const maxPercentage = maxAllocation / totalAllocation * 100;
        
        if (maxPercentage <= 70) score += 30;
        else if (maxPercentage <= 80) score += 20;
        else if (maxPercentage <= 90) score += 10;
        
        // Geographic diversification (30 points)
        const geoTotal = data.domesticAllocation + data.internationalAllocation;
        if (geoTotal > 0) {
            const domesticPercentage = data.domesticAllocation / geoTotal * 100;
            const internationalPercentage = data.internationalAllocation / geoTotal * 100;
            
            if (internationalPercentage >= 20 && internationalPercentage <= 50) {
                score += 30;
            } else if (internationalPercentage >= 10) {
                score += 20;
            } else if (internationalPercentage > 0) {
                score += 10;
            }
        }
        
        return Math.min(score, maxScore);
    }

    analyzeAllocation(data) {
        const analysis = {
            strengths: [],
            weaknesses: [],
            suggestions: []
        };
        
        const totalAllocation = data.stockAllocation + data.bondAllocation + 
                              data.cashAllocation + data.alternativeAllocation;
        
        if (totalAllocation === 0) {
            analysis.weaknesses.push('No portfolio allocation specified');
            return analysis;
        }
        
        const stockPercentage = (data.stockAllocation / totalAllocation) * 100;
        const bondPercentage = (data.bondAllocation / totalAllocation) * 100;
        const cashPercentage = (data.cashAllocation / totalAllocation) * 100;
        
        // Analyze stock allocation
        if (stockPercentage >= 60) {
            analysis.strengths.push('Strong growth potential with significant stock allocation');
        } else if (stockPercentage <= 30) {
            analysis.weaknesses.push('Limited growth potential with low stock allocation');
            analysis.suggestions.push('Consider increasing stock allocation for long-term growth');
        }
        
        // Analyze bond allocation
        if (bondPercentage >= 20 && bondPercentage <= 50) {
            analysis.strengths.push('Good stability with appropriate bond allocation');
        } else if (bondPercentage > 60) {
            analysis.weaknesses.push('Overly conservative with excessive bond allocation');
            analysis.suggestions.push('Consider reducing bonds for better growth potential');
        }
        
        // Analyze cash allocation
        if (cashPercentage > 20) {
            analysis.weaknesses.push('Excessive cash allocation may hurt long-term returns');
            analysis.suggestions.push('Consider investing excess cash for better returns');
        } else if (cashPercentage >= 5) {
            analysis.strengths.push('Appropriate cash buffer for liquidity needs');
        }
        
        // Geographic diversification
        const geoTotal = data.domesticAllocation + data.internationalAllocation;
        if (geoTotal > 0) {
            const internationalPercentage = (data.internationalAllocation / geoTotal) * 100;
            if (internationalPercentage >= 20) {
                analysis.strengths.push('Good geographic diversification');
            } else if (internationalPercentage > 0) {
                analysis.suggestions.push('Consider increasing international exposure for better diversification');
            } else {
                analysis.weaknesses.push('No international diversification');
                analysis.suggestions.push('Add international investments to reduce geographic risk');
            }
        }
        
        return analysis;
    }

    getPortfolioRecommendations(data, portfolioRisk, diversificationScore) {
        const recommendations = [];
        
        if (portfolioRisk > 15) {
            recommendations.push({
                type: 'warning',
                title: 'High Portfolio Risk',
                message: 'Your portfolio has high volatility. Consider adding bonds or cash for stability.'
            });
        } else if (portfolioRisk < 5) {
            recommendations.push({
                type: 'info',
                title: 'Low Portfolio Risk',
                message: 'Your portfolio is very conservative. Consider adding stocks for growth potential.'
            });
        }
        
        if (diversificationScore < 50) {
            recommendations.push({
                type: 'warning',
                title: 'Poor Diversification',
                message: 'Your portfolio lacks diversification. Spread investments across more asset classes.'
            });
        } else if (diversificationScore >= 80) {
            recommendations.push({
                type: 'success',
                title: 'Excellent Diversification',
                message: 'Your portfolio shows excellent diversification across asset classes.'
            });
        }
        
        return recommendations;
    }

    generateRecommendations(riskProfile, data) {
        const recommendations = {
            primary: [],
            secondary: [],
            actions: []
        };
        
        // Primary recommendations based on risk level
        switch (riskProfile.level) {
            case 'Very Conservative':
                recommendations.primary.push('Focus on high-quality bonds and stable value funds');
                recommendations.primary.push('Maintain 3-6 months of emergency funds in cash');
                recommendations.primary.push('Consider FDIC-insured CDs for guaranteed returns');
                break;
                
            case 'Conservative':
                recommendations.primary.push('Maintain 70-80% bonds and 20-30% stocks');
                recommendations.primary.push('Focus on dividend-paying stocks for income');
                recommendations.primary.push('Consider bond ladders for steady income');
                break;
                
            case 'Moderate':
                recommendations.primary.push('Balance 50-60% stocks and 40-50% bonds');
                recommendations.primary.push('Diversify across domestic and international markets');
                recommendations.primary.push('Consider target-date funds for automatic rebalancing');
                break;
                
            case 'Aggressive':
                recommendations.primary.push('Maintain 70-80% stocks and 20-30% bonds');
                recommendations.primary.push('Include growth stocks and international exposure');
                recommendations.primary.push('Consider small-cap and emerging market funds');
                break;
                
            case 'Very Aggressive':
                recommendations.primary.push('Focus on 80-90% stocks with growth orientation');
                recommendations.primary.push('Include alternative investments like REITs');
                recommendations.primary.push('Consider sector-specific and emerging market ETFs');
                break;
        }
        
        // Secondary recommendations
        recommendations.secondary.push('Rebalance portfolio quarterly to maintain target allocation');
        recommendations.secondary.push('Review and adjust risk tolerance annually');
        recommendations.secondary.push('Consider tax-advantaged accounts for retirement savings');
        recommendations.secondary.push('Dollar-cost average into positions to reduce timing risk');
        
        // Action items
        if (data.age < 40) {
            recommendations.actions.push('Maximize 401(k) contributions, especially with employer match');
        }
        
        if (data.timeline === 'retirement') {
            recommendations.actions.push('Consider increasing savings rate to 15-20% of income');
        }
        
        recommendations.actions.push('Build emergency fund before aggressive investing');
        recommendations.actions.push('Consider consulting with a fee-only financial advisor');
        
        return recommendations;
    }

    displayResults(riskProfile, data) {
        this.resultsContainer.innerHTML = `
            <!-- Risk Profile Summary -->
            <div class="bg-gradient-to-r from-${riskProfile.color}-50 to-${riskProfile.color}-100 dark:from-${riskProfile.color}-900/20 dark:to-${riskProfile.color}-800/20 rounded-lg p-6 border border-${riskProfile.color}-200 dark:border-${riskProfile.color}-700 mb-6">
                <div class="text-center mb-4">
                    <h4 class="text-2xl font-bold text-${riskProfile.color}-800 dark:text-${riskProfile.color}-200 mb-2">
                        ${riskProfile.level}
                    </h4>
                    <p class="text-${riskProfile.color}-700 dark:text-${riskProfile.color}-300">
                        ${riskProfile.description}
                    </p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-lg font-semibold text-${riskProfile.color}-800 dark:text-${riskProfile.color}-200">
                            ${riskProfile.score}/${riskProfile.maxScore}
                        </div>
                        <div class="text-sm text-${riskProfile.color}-600 dark:text-${riskProfile.color}-400">Risk Score</div>
                    </div>
                    <div>
                        <div class="text-lg font-semibold text-${riskProfile.color}-800 dark:text-${riskProfile.color}-200">
                            ${riskProfile.percentage.toFixed(1)}%
                        </div>
                        <div class="text-sm text-${riskProfile.color}-600 dark:text-${riskProfile.color}-400">Risk Tolerance</div>
                    </div>
                    <div>
                        <div class="text-lg font-semibold text-${riskProfile.color}-800 dark:text-${riskProfile.color}-200">
                            ${data.age} years
                        </div>
                        <div class="text-sm text-${riskProfile.color}-600 dark:text-${riskProfile.color}-400">Age Factor</div>
                    </div>
                </div>
            </div>

            <!-- Risk Factors Breakdown -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h5 class="font-medium text-gray-900 dark:text-white mb-4">Risk Factor Analysis</h5>
                <div class="space-y-3">
                    ${Object.entries(riskProfile.factors).map(([key, factor]) => `
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="font-medium text-gray-900 dark:text-white capitalize">${key}:</span>
                                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">${factor.description}</span>
                            </div>
                            <div class="text-right">
                                <span class="font-semibold text-gray-900 dark:text-white">${factor.score}</span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">/20</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.resultsContainer.classList.remove('hidden');
    }

    displayRiskChart(riskProfile) {
        this.chartContainer.classList.remove('hidden');
        
        const ctx = document.getElementById('riskChart').getContext('2d');
        
        // Destroy existing chart
        if (this.riskChart) {
            this.riskChart.destroy();
        }

        const factorNames = Object.keys(riskProfile.factors).map(key => {
            return key.charAt(0).toUpperCase() + key.slice(1);
        });
        const factorScores = Object.values(riskProfile.factors).map(factor => factor.score);
        const maxScores = new Array(factorNames.length).fill(20);

        this.riskChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: factorNames,
                datasets: [
                    {
                        label: 'Your Risk Score',
                        data: factorScores,
                        backgroundColor: `rgba(59, 130, 246, 0.2)`,
                        borderColor: `rgba(59, 130, 246, 1)`,
                        borderWidth: 2,
                        pointBackgroundColor: `rgba(59, 130, 246, 1)`,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    },
                    {
                        label: 'Maximum Score',
                        data: maxScores,
                        backgroundColor: `rgba(156, 163, 175, 0.1)`,
                        borderColor: `rgba(156, 163, 175, 0.5)`,
                        borderWidth: 1,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 20,
                        ticks: {
                            stepSize: 5
                        }
                    }
                }
            }
        });
    }

    displayPortfolioAnalysis(portfolioAnalysis, data) {
        if (!portfolioAnalysis) {
            this.portfolioAnalysisContainer.classList.add('hidden');
            return;
        }
        
        this.portfolioAnalysisContainer.classList.remove('hidden');
        
        document.getElementById('portfolioAnalysisContent').innerHTML = `
            <!-- Portfolio Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h6 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Portfolio Risk</h6>
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${portfolioAnalysis.portfolioRisk.toFixed(1)}%
                    </div>
                    <p class="text-sm text-blue-700 dark:text-blue-300">Annual volatility</p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h6 class="font-medium text-green-800 dark:text-green-200 mb-2">Diversification</h6>
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${portfolioAnalysis.diversificationScore}/100
                    </div>
                    <p class="text-sm text-green-700 dark:text-green-300">Diversification score</p>
                </div>
                
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <h6 class="font-medium text-purple-800 dark:text-purple-200 mb-2">Portfolio Value</h6>
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${this.formatCurrency(data.portfolioValue)}
                    </div>
                    <p class="text-sm text-purple-700 dark:text-purple-300">Total invested</p>
                </div>
            </div>

            <!-- Current Allocation -->
            <div class="mb-6">
                <h6 class="font-medium text-gray-900 dark:text-white mb-3">Current Asset Allocation</h6>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${data.stockAllocation}%</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Stocks</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${data.bondAllocation}%</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Bonds</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${data.cashAllocation}%</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Cash</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${data.alternativeAllocation}%</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Alternatives</div>
                    </div>
                </div>
            </div>

            <!-- Analysis Results -->
            <div class="space-y-4">
                ${portfolioAnalysis.allocationAnalysis.strengths.length > 0 ? `
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h6 class="font-medium text-green-800 dark:text-green-200 mb-2">Portfolio Strengths</h6>
                    <ul class="text-sm text-green-700 dark:text-green-300 space-y-1">
                        ${portfolioAnalysis.allocationAnalysis.strengths.map(strength => `<li>• ${strength}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${portfolioAnalysis.allocationAnalysis.weaknesses.length > 0 ? `
                <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                    <h6 class="font-medium text-red-800 dark:text-red-200 mb-2">Areas for Improvement</h6>
                    <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                        ${portfolioAnalysis.allocationAnalysis.weaknesses.map(weakness => `<li>• ${weakness}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${portfolioAnalysis.allocationAnalysis.suggestions.length > 0 ? `
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h6 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Suggestions</h6>
                    <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        ${portfolioAnalysis.allocationAnalysis.suggestions.map(suggestion => `<li>• ${suggestion}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>

            <!-- Portfolio Recommendations -->
            ${portfolioAnalysis.recommendations.length > 0 ? `
            <div class="mt-6">
                <h6 class="font-medium text-gray-900 dark:text-white mb-3">Portfolio Recommendations</h6>
                <div class="space-y-3">
                    ${portfolioAnalysis.recommendations.map(rec => `
                        <div class="bg-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-50 dark:bg-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-900/20 rounded-lg p-4 border border-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-200 dark:border-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-700">
                            <h6 class="font-medium text-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-800 dark:text-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-200 mb-1">
                                ${rec.title}
                            </h6>
                            <p class="text-sm text-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-700 dark:text-${rec.type === 'warning' ? 'yellow' : rec.type === 'success' ? 'green' : 'blue'}-300">
                                ${rec.message}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
    }

    displayRecommendedAllocation(riskProfile) {
        this.allocationContainer.classList.remove('hidden');
        
        // Get recommended allocation based on risk profile
        const recommendedAllocation = this.getRecommendedAllocation(riskProfile);
        
        const ctx = document.getElementById('allocationChart').getContext('2d');
        
        // Destroy existing chart
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }

        this.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: recommendedAllocation.labels,
                datasets: [{
                    data: recommendedAllocation.data,
                    backgroundColor: recommendedAllocation.colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('allocationDetails').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                ${recommendedAllocation.labels.map((label, index) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-4 h-4 rounded" style="background-color: ${recommendedAllocation.colors[index]}"></div>
                            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-white">${label}</span>
                        </div>
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">${recommendedAllocation.data[index]}%</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h6 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Allocation Strategy</h6>
                <p class="text-sm text-blue-700 dark:text-blue-300">
                    ${recommendedAllocation.strategy}
                </p>
            </div>
        `;
    }

    getRecommendedAllocation(riskProfile) {
        const allocations = {
            'Very Conservative': {
                labels: ['Bonds', 'Cash', 'Stocks'],
                data: [70, 20, 10],
                colors: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                strategy: 'Focus on capital preservation with minimal volatility. Emphasizes high-quality bonds and cash equivalents.'
            },
            'Conservative': {
                labels: ['Bonds', 'Stocks', 'Cash'],
                data: [60, 30, 10],
                colors: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                strategy: 'Balanced approach favoring stability with modest growth potential through dividend-paying stocks.'
            },
            'Moderate': {
                labels: ['Stocks', 'Bonds', 'Cash'],
                data: [60, 35, 5],
                colors: ['rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                strategy: 'Balanced portfolio seeking growth while maintaining stability through diversified holdings.'
            },
            'Aggressive': {
                labels: ['Stocks', 'Bonds', 'Alternatives'],
                data: [75, 20, 5],
                colors: ['rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(168, 85, 247, 0.8)'],
                strategy: 'Growth-oriented portfolio with higher volatility tolerance and alternative investments.'
            },
            'Very Aggressive': {
                labels: ['Stocks', 'Alternatives', 'Bonds'],
                data: [85, 10, 5],
                colors: ['rgba(239, 68, 68, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(34, 197, 94, 0.8)'],
                strategy: 'Maximum growth focus with high risk tolerance, including alternative investments and minimal bonds.'
            }
        };
        
        return allocations[riskProfile.level] || allocations['Moderate'];
    }

    displayRiskTips(recommendations, riskProfile) {
        this.tipsContainer.classList.remove('hidden');
        
        document.getElementById('riskTipsContent').innerHTML = `
            <!-- Primary Recommendations -->
            <div class="mb-6">
                <h5 class="font-medium text-gray-900 dark:text-white mb-3">Primary Recommendations for ${riskProfile.level} Investors</h5>
                <div class="space-y-2">
                    ${recommendations.primary.map(rec => `
                        <div class="flex items-start">
                            <div class="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${rec}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Secondary Recommendations -->
            <div class="mb-6">
                <h5 class="font-medium text-gray-900 dark:text-white mb-3">General Best Practices</h5>
                <div class="space-y-2">
                    ${recommendations.secondary.map(rec => `
                        <div class="flex items-start">
                            <div class="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${rec}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Action Items -->
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <h5 class="font-medium text-yellow-800 dark:text-yellow-200 mb-3">Action Items</h5>
                <div class="space-y-2">
                    ${recommendations.actions.map(action => `
                        <div class="flex items-start">
                            <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p class="text-sm text-yellow-700 dark:text-yellow-300">${action}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
    new RiskAssessmentCalculator();
});
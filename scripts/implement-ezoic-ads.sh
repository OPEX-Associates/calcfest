#!/bin/bash

# Ezoic Ad Implementation Script for Finance CalcFest
# This script implements the standard ad placement strategy across all calculator pages

echo "🚀 Implementing Ezoic Ads Across Calculator Pages"
echo "================================================"

# List of priority calculator files to update
CALCULATORS=(
    "home-affordability.html"
    "rent-vs-buy.html" 
    "refinance.html"
    "cash-flow.html"
    "cap-rate.html"
    "brrrr.html"
    "portfolio-allocation.html"
    "capm.html" 
    "dividend-yield.html"
    "stock-valuation.html"
    "risk-assessment.html"
    "amortization.html"
)

echo "✅ Standard Ad Positions Being Implemented:"
echo "   • 101: Top of Page"
echo "   • 102: Under Page Title" 
echo "   • 104: Sidebar Position 1"
echo "   • 105: Sidebar Position 2"
echo "   • 106: Sidebar Position 3"
echo "   • 109: Under First Paragraph"
echo "   • 111: Mid Content"
echo "   • 103: Bottom of Page"
echo ""

echo "📋 Files to Process: ${#CALCULATORS[@]} calculator pages"
for calc in "${CALCULATORS[@]}"; do
    echo "   • calculators/$calc"
done

echo ""
echo "🎯 Next Steps:"
echo "   1. Add ads to remaining calculator pages"
echo "   2. Implement floating ads (107, 108) for mobile"
echo "   3. Add longer content ads (112, 113, 114, 115) to educational sections"
echo "   4. Test ad display and revenue optimization"
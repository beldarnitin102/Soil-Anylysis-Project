// Seed.js - Database seeding utilities for SoilScope
// This file provides sample data and database initialization functions

// Sample soil analysis data
const sampleSoilData = {
    ph: 6.8,
    moisture: 45,
    nitrogen: 78,
    phosphorus: 52,
    potassium: 48,
    organicMatter: 3.2,
    temperature: 22,
    conductivity: 1.2
};

// Sample crop recommendations
const sampleCrops = [
    { name: "Corn", match: 95, emoji: "🌽", season: "Summer" },
    { name: "Wheat", match: 88, emoji: "🌾", season: "Winter" },
    { name: "Carrots", match: 82, emoji: "🥕", season: "Fall" },
    { name: "Tomatoes", match: 79, emoji: "🍅", season: "Summer" },
    { name: "Potatoes", match: 85, emoji: "🥔", season: "Spring" }
];

// Sample fertilizer recommendations
const sampleFertilizers = [
    {
        name: "Phosphorus Boost",
        priority: "High",
        recommendation: "Apply 15-30-15 NPK fertilizer",
        timing: "Early spring"
    },
    {
        name: "Potassium Support",
        priority: "Medium",
        recommendation: "Add potash supplement",
        timing: "Mid-season"
    },
    {
        name: "Organic Matter",
        priority: "Recommended",
        recommendation: "Add compost for long-term health",
        timing: "Fall preparation"
    }
];

// Sample knowledge base entries for the chatbot
const sampleKnowledgeBase = [
    {
        question_pattern: "what.*ph.*ideal|ideal.*ph.*level",
        reply_text: "The ideal pH level for most crops is between 6.0-7.0. This range ensures optimal nutrient availability and root health.",
        category: "pH Management",
        level: "basic"
    },
    {
        question_pattern: "how.*improve.*soil.*fertility",
        reply_text: "To improve soil fertility: 1) Add organic compost, 2) Use cover crops, 3) Rotate crops annually, 4) Test soil regularly, 5) Apply balanced fertilizers based on soil test results.",
        category: "Soil Health",
        level: "intermediate"
    },
    {
        question_pattern: "best.*crops.*clay.*soil",
        reply_text: "Clay soils work well for: rice, wheat, soybeans, and root vegetables like carrots and beets. These crops can handle the dense, moisture-retentive nature of clay soil.",
        category: "Crop Selection",
        level: "intermediate"
    }
];

// Function to generate random soil analysis data
function generateRandomSoilData() {
    return {
        ph: (Math.random() * 3 + 5.5).toFixed(1), // 5.5-8.5
        moisture: Math.floor(Math.random() * 50 + 25), // 25-75%
        nitrogen: Math.floor(Math.random() * 60 + 30), // 30-90%
        phosphorus: Math.floor(Math.random() * 70 + 20), // 20-90%
        potassium: Math.floor(Math.random() * 60 + 25), // 25-85%
        organicMatter: (Math.random() * 4 + 1).toFixed(1), // 1-5%
        temperature: Math.floor(Math.random() * 15 + 15), // 15-30°C
        conductivity: (Math.random() * 2 + 0.5).toFixed(1) // 0.5-2.5 dS/m
    };
}

// Function to get crop recommendations based on soil data
function getCropRecommendations(soilData) {
    const recommendations = [...sampleCrops];
    
    // Adjust match percentages based on soil conditions
    recommendations.forEach(crop => {
        let adjustment = 0;
        
        // pH adjustments
        if (soilData.ph >= 6.0 && soilData.ph <= 7.0) {
            adjustment += 10; // Optimal pH range
        } else if (soilData.ph < 5.5 || soilData.ph > 8.0) {
            adjustment -= 15; // Poor pH range
        }
        
        // Moisture adjustments
        if (soilData.moisture >= 40 && soilData.moisture <= 60) {
            adjustment += 5; // Good moisture
        } else if (soilData.moisture < 25 || soilData.moisture > 80) {
            adjustment -= 10; // Poor moisture
        }
        
        // Apply adjustment and ensure it stays within reasonable bounds
        crop.match = Math.max(20, Math.min(100, crop.match + adjustment));
    });
    
    // Sort by match percentage
    return recommendations.sort((a, b) => b.match - a.match);
}

// Export functions and data for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampleSoilData,
        sampleCrops,
        sampleFertilizers,
        sampleKnowledgeBase,
        generateRandomSoilData,
        getCropRecommendations
    };
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.SeedData = {
        sampleSoilData,
        sampleCrops,
        sampleFertilizers,
        sampleKnowledgeBase,
        generateRandomSoilData,
        getCropRecommendations
    };
}

console.log('Seed.js loaded successfully - Sample data and utilities available');

// AI Controller for Frontend
class AIController {
  constructor() {
    this.isLoading = false
  }

  // AI Route Safety Analysis
  async analyzeRoute() {
    const origin = document.getElementById("routeOrigin").value.trim()
    const destination = document.getElementById("routeDestination").value.trim()

    if (!origin || !destination) {
      alert("Please enter both origin and destination cities.")
      return
    }

    try {
      this.setLoading(true)

      const response = await window.apiService.post("/ai/route-safety", {
        origin,
        destination,
        departureDate: new Date().toISOString(),
        aircraft: "Boeing 777", // Default aircraft
      })

      if (response.success) {
        this.displayRouteAnalysis(response.data)
      }
    } catch (error) {
      console.error("AI Route Analysis Error:", error)
      alert("Error analyzing route. Please try again.")
    } finally {
      this.setLoading(false)
    }
  }

  // Display AI Route Analysis Results
  displayRouteAnalysis(data) {
    const analysisDiv = document.getElementById("routeAnalysis")

    const riskColor = this.getRiskColor(data.riskLevel)
    const safetyBadge = `<span class="safety-badge" style="background: ${riskColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">${data.riskLevel} Risk</span>`

    analysisDiv.innerHTML = `
      <div class="ai-analysis">
        <h4>🤖 AI Route Safety Analysis: ${data.route}</h4>
        
        <div class="safety-score">
          <div class="score-circle">
            <div class="score-number">${data.safetyScore}</div>
            <div class="score-label">Safety Score</div>
          </div>
          ${safetyBadge}
        </div>

        <div class="analysis-grid">
          <div class="analysis-item">
            <h5>🌤️ Weather Analysis</h5>
            <div>Score: ${data.analysis.weather.score}/100</div>
            <div>Impact: ${data.analysis.weather.impact.join(", ")}</div>
          </div>
          
          <div class="analysis-item">
            <h5>✈️ Air Traffic</h5>
            <div>Score: ${Math.round(data.analysis.airTraffic.score)}/100</div>
            <div>Congestion: ${data.analysis.airTraffic.congestionLevel}</div>
          </div>
          
          <div class="analysis-item">
            <h5>🌍 Geopolitical</h5>
            <div>Score: ${data.analysis.geopolitical.score}/100</div>
            <div>Risk Level: ${data.analysis.geopolitical.riskLevel}</div>
          </div>
          
          <div class="analysis-item">
            <h5>🔧 Technical</h5>
            <div>Score: ${data.analysis.technical.score}/100</div>
            <div>Aircraft: ${data.analysis.technical.aircraftReliability}% reliable</div>
          </div>
        </div>

        <div class="recommendations">
          <h5>📋 AI Recommendations:</h5>
          <ul>
            ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>

        ${
          data.alternativeRoutes.length > 0
            ? `
          <div class="alternative-routes">
            <h5>🔄 Alternative Routes:</h5>
            ${data.alternativeRoutes
              .map(
                (route) => `
              <div class="route-option">
                <strong>${route.route}</strong> 
                <span class="safety-score">(Safety: ${route.safetyScore})</span>
                <br>
                <small>Additional time: +${route.additionalTime.toFixed(1)} hours</small>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `

    analysisDiv.classList.remove("hidden")
  }

  // AI Dynamic Pricing Analysis
  async analyzePricing(flightNumber) {
    try {
      const response = await window.apiService.post("/ai/dynamic-pricing", {
        flightNumber: flightNumber || "IA123",
        route: "Dhaka-Dubai",
        aircraft: "Boeing 777",
        departureDate: new Date().toISOString(),
        currentDemand: "High",
      })

      if (response.success) {
        this.displayPricingAnalysis(response.data)
      }
    } catch (error) {
      console.error("AI Pricing Analysis Error:", error)
    }
  }

  // Display AI Pricing Analysis
  displayPricingAnalysis(data) {
    const modal = document.createElement("div")
    modal.className = "modal ai-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>🤖 AI Dynamic Pricing Analysis</h3>
          <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="pricing-recommendations">
            <h4>💰 Optimal Pricing</h4>
            <div class="price-grid">
              <div class="price-class">
                <span>Economy</span>
                <span class="price">৳${data.priceOptimization.economy.toLocaleString()}</span>
              </div>
              <div class="price-class">
                <span>Business</span>
                <span class="price">৳${data.priceOptimization.business.toLocaleString()}</span>
              </div>
              <div class="price-class">
                <span>First Class</span>
                <span class="price">৳${data.priceOptimization.firstClass.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="revenue-projection">
            <h4>📊 Revenue Projection</h4>
            <div>Expected: ৳${data.revenueProjection.expected.toLocaleString()}</div>
            <div>Range: ৳${data.revenueProjection.low.toLocaleString()} - ৳${data.revenueProjection.high.toLocaleString()}</div>
          </div>

          <div class="market-insights">
            <h4>📈 Market Analysis</h4>
            <ul>
              ${data.pricingRecommendations.map((rec) => `<li>${rec}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  // AI Flight Delay Prediction
  async predictDelay(flightNumber) {
    try {
      const response = await window.apiService.post("/ai/delay-prediction", {
        flightNumber: flightNumber || "IA123",
        departureTime: new Date().toISOString(),
        aircraft: "Boeing 777",
        origin: "Dhaka",
        destination: "Dubai",
      })

      if (response.success) {
        this.displayDelayPrediction(response.data)
      }
    } catch (error) {
      console.error("AI Delay Prediction Error:", error)
    }
  }

  // Display Delay Prediction
  displayDelayPrediction(data) {
    const probabilityPercentage = Math.round(data.delayProbability * 100)
    const probabilityColor = this.getDelayColor(data.delayProbability)

    alert(`
🤖 AI Delay Prediction for ${data.flightNumber}:

📊 Delay Probability: ${probabilityPercentage}%
⏱️ Expected Delay: ${Math.round(data.expectedDelay)} minutes
🎯 Confidence: ${Math.round(data.confidenceLevel * 100)}%

🔍 Risk Factors:
${data.riskFactors.join("\n")}

💡 Recommendations:
${data.recommendations.join("\n")}
    `)
  }

  // AI Passenger Flow Optimization
  async optimizePassengerFlow() {
    try {
      const response = await window.apiService.post("/ai/passenger-flow", {
        terminalId: "Terminal-1",
        timeSlot: new Date().getHours() + ":00",
        expectedPassengers: 2500,
        flightSchedule: [],
      })

      if (response.success) {
        this.displayFlowOptimization(response.data)
      }
    } catch (error) {
      console.error("AI Passenger Flow Error:", error)
    }
  }

  // AI Maintenance Prediction
  async predictMaintenance(aircraft) {
    try {
      const response = await window.apiService.post("/ai/maintenance-prediction", {
        aircraft: aircraft || "Boeing 777",
        flightHours: 8500,
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        flightHistory: [],
      })

      if (response.success) {
        this.displayMaintenancePrediction(response.data)
      }
    } catch (error) {
      console.error("AI Maintenance Prediction Error:", error)
    }
  }

  // Utility methods
  getRiskColor(riskLevel) {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "#10b981"
      case "medium":
        return "#f59e0b"
      case "high":
        return "#ef4444"
      case "critical":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }

  getDelayColor(probability) {
    if (probability < 0.2) return "#10b981"
    if (probability < 0.5) return "#f59e0b"
    return "#ef4444"
  }

  setLoading(loading) {
    this.isLoading = loading
    const button = document.querySelector(".ai-analyze-btn")
    if (button) {
      button.disabled = loading
      button.textContent = loading ? "Analyzing..." : "Analyze Route"
    }
  }
}

// Create global AI controller instance
window.aiController = new AIController()

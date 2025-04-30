// Statistiekfuncties voor de aanwezigheidsapp

/**
 * Genereer samenvattende statistieken voor de aanwezigheidsdata
 * @param {Array} attendanceData - Array met aanwezigheidsgegevens
 * @returns {Object} Statistiekenobject
 */
function generateStatistics(attendanceData) {
  if (!attendanceData || attendanceData.length === 0) {
    return {
      totalAttendance: 0,
      uniqueVisitors: 0,
      genderDistribution: { M: 0, V: 0, X: 0 },
      ageGroups: { '0-12': 0, '13-18': 0, '19-25': 0, '26-35': 0, '36-50': 0, '51+': 0 },
      topActivities: [],
      topMunicipalities: [],
      attendanceByMonth: {},
      firstTimeVisitors: 0,
      returningVisitors: 0
    };
  }

  // Kopieer data om te voorkomen dat sorteeracties de originele data beïnvloeden
  const data = [...attendanceData];
  
  // Hulpfunctie voor leeftijdsgroep bepaling
  const getAgeGroup = (age) => {
    if (age <= 12) return '0-12';
    if (age <= 18) return '13-18';
    if (age <= 25) return '19-25';
    if (age <= 35) return '26-35';
    if (age <= 50) return '36-50';
    return '51+';
  };

  // Verzamel unieke bezoekers op basis van naam en gemeente
  const uniqueVisitorMap = new Map();
  data.forEach(entry => {
    const visitorKey = `${entry.firstName.toLowerCase()}_${entry.municipality.toLowerCase()}`;
    
    if (!uniqueVisitorMap.has(visitorKey)) {
      uniqueVisitorMap.set(visitorKey, {
        name: entry.firstName,
        municipality: entry.municipality,
        gender: entry.gender,
        age: entry.age,
        visits: []
      });
    }
    
    // Voeg bezoek toe aan bezoekersgeschiedenis
    uniqueVisitorMap.get(visitorKey).visits.push({
      date: entry.date,
      activity: entry.activity,
      id: entry.id
    });
  });
  
  // Converteer map naar array van unieke bezoekers
  const uniqueVisitors = Array.from(uniqueVisitorMap.values());
  
  // Sorteer bezoeken op datum
  uniqueVisitors.forEach(visitor => {
    visitor.visits.sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  
  // Bereken eerste en terugkerende bezoekers
  const firstTimeVisitors = uniqueVisitors.filter(visitor => visitor.visits.length === 1).length;
  const returningVisitors = uniqueVisitors.filter(visitor => visitor.visits.length > 1).length;

  // Geslachtsverdeling
  const genderDistribution = {
    M: 0,
    V: 0,
    X: 0
  };
  
  uniqueVisitors.forEach(visitor => {
    if (visitor.gender in genderDistribution) {
      genderDistribution[visitor.gender]++;
    }
  });

  // Leeftijdsgroepen
  const ageGroups = {
    '0-12': 0,
    '13-18': 0,
    '19-25': 0,
    '26-35': 0,
    '36-50': 0,
    '51+': 0
  };
  
  uniqueVisitors.forEach(visitor => {
    const group = getAgeGroup(visitor.age);
    ageGroups[group]++;
  });

  // Populairste activiteiten
  const activityCount = {};
  data.forEach(entry => {
    if (!activityCount[entry.activity]) {
      activityCount[entry.activity] = 0;
    }
    activityCount[entry.activity]++;
  });
  
  const topActivities = Object.entries(activityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([activity, count]) => ({ activity, count }));

  // Populairste gemeenten
  const municipalityCount = {};
  data.forEach(entry => {
    if (!municipalityCount[entry.municipality]) {
      municipalityCount[entry.municipality] = 0;
    }
    municipalityCount[entry.municipality]++;
  });
  
  const topMunicipalities = Object.entries(municipalityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([municipality, count]) => ({ municipality, count }));

  // Aanwezigheid per maand
  const attendanceByMonth = {};
  data.forEach(entry => {
    const date = new Date(entry.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!attendanceByMonth[monthYear]) {
      attendanceByMonth[monthYear] = 0;
    }
    attendanceByMonth[monthYear]++;
  });

  return {
    totalAttendance: data.length,
    uniqueVisitors: uniqueVisitors.length,
    genderDistribution,
    ageGroups,
    topActivities,
    topMunicipalities,
    attendanceByMonth,
    firstTimeVisitors,
    returningVisitors
  };
}

/**
 * Genereer HTML voor een staafdiagram op basis van gegevens
 * @param {Object} data - Object met labels en waarden
 * @param {string} title - Titel van het diagram
 * @returns {string} HTML voor het diagram
 */
function generateBarChart(data, title) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const maxValue = Math.max(...values);
  
  let chartHTML = `
    <div class="chart">
      <h3>${title}</h3>
      <div class="chart-container">
  `;
  
  labels.forEach((label, index) => {
    const value = values[index];
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    chartHTML += `
      <div class="chart-bar-container">
        <div class="chart-label">${label}</div>
        <div class="chart-bar">
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="chart-value">${value}</div>
      </div>
    `;
  });
  
  chartHTML += `
      </div>
    </div>
  `;
  
  return chartHTML;
}

/**
 * Genereer HTML voor een cirkeldiagram op basis van gegevens
 * @param {Object} data - Object met labels en waarden
 * @param {string} title - Titel van het diagram
 * @returns {string} HTML voor het diagram
 */
function generatePieChart(data, title) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const total = values.reduce((sum, value) => sum + value, 0);
  
  let chartHTML = `
    <div class="pie-chart">
      <h3>${title}</h3>
      <div class="pie-container">
        <svg viewBox="0 0 100 100" class="pie">
  `;
  
  let cumulativePercentage = 0;
  const colors = ['#4a6fa5', '#6a89cc', '#82ccdd', '#60a3bc', '#3742fa', '#1e90ff', '#70a1ff'];
  
  values.forEach((value, index) => {
    if (value === 0) return;
    
    const percentage = (value / total) * 100;
    const startX = Math.cos(2 * Math.PI * cumulativePercentage / 100) * 50 + 50;
    const startY = Math.sin(2 * Math.PI * cumulativePercentage / 100) * 50 + 50;
    
    cumulativePercentage += percentage;
    
    const endX = Math.cos(2 * Math.PI * cumulativePercentage / 100) * 50 + 50;
    const endY = Math.sin(2 * Math.PI * cumulativePercentage / 100) * 50 + 50;
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    
    chartHTML += `
      <path d="M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z" 
            fill="${colors[index % colors.length]}" />
    `;
  });
  
  chartHTML += `
        </svg>
        <div class="pie-legend">
  `;
  
  labels.forEach((label, index) => {
    if (values[index] === 0) return;
    
    const percentage = Math.round((values[index] / total) * 100);
    
    chartHTML += `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${colors[index % colors.length]}"></span>
        <span class="legend-label">${label}: ${values[index]} (${percentage}%)</span>
      </div>
    `;
  });
  
  chartHTML += `
        </div>
      </div>
    </div>
  `;
  
  return chartHTML;
}

/**
 * Genereer HTML voor een lijndiagram op basis van maandelijkse gegevens
 * @param {Object} monthData - Object met maanden en waarden
 * @param {string} title - Titel van het diagram
 * @returns {string} HTML voor het diagram
 */
function generateLineChart(monthData, title) {
  const months = Object.keys(monthData).sort();
  const values = months.map(month => monthData[month]);
  const maxValue = Math.max(...values);
  
  let chartHTML = `
    <div class="line-chart">
      <h3>${title}</h3>
      <div class="line-chart-container">
        <svg viewBox="0 0 100 50" class="line-graph">
          <!-- X-as -->
          <line x1="0" y1="45" x2="100" y2="45" stroke="#333" stroke-width="0.5" />
          
          <!-- Y-as -->
          <line x1="0" y1="0" x2="0" y2="45" stroke="#333" stroke-width="0.5" />
  `;
  
  // Teken de lijn
  let pathData = '';
  
  months.forEach((month, index) => {
    const x = (index / (months.length - 1)) * 95;
    const y = maxValue > 0 ? 45 - (monthData[month] / maxValue) * 40 : 45;
    
    if (index === 0) {
      pathData += `M ${x} ${y} `;
    } else {
      pathData += `L ${x} ${y} `;
    }
    
    // Teken punt
    chartHTML += `<circle cx="${x}" cy="${y}" r="1" fill="#4a6fa5" />`;
    
    // X-as label (maand)
    const label = month.split('-')[1]; // Alleen maandnummer
    chartHTML += `<text x="${x}" y="49" font-size="3" text-anchor="middle">${label}</text>`;
  });
  
  // Voeg het pad toe
  chartHTML += `<path d="${pathData}" fill="none" stroke="#4a6fa5" stroke-width="1" />`;
  
  // Y-as labels
  for (let i = 0; i <= 4; i++) {
    const y = 45 - (i * 10);
    const value = Math.round((i / 4) * maxValue);
    chartHTML += `
      <line x1="-1" y1="${y}" x2="0" y2="${y}" stroke="#333" stroke-width="0.5" />
      <text x="-3" y="${y + 1}" font-size="3" text-anchor="end">${value}</text>
    `;
  }
  
  chartHTML += `
        </svg>
      </div>
    </div>
  `;
  
  return chartHTML;
}

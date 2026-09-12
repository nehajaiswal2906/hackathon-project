/**
 * Corridor Opportunity Finder
 * Interactive Commercial District Expansion & Format Matcher
 * 100% Real Dataset Logic (NYC & Dallas-Fort Worth)
 */

(function () {
  'use strict';

  // Application State
  const state = {
    activeMetro: 'nyc',
    datasets: {
      nyc: null,
      dfw: null
    },
    activeArchetypeId: null,
    rankingMetric: 'opportunity',
    boroughFilter: 'all',
    tierFilter: 'all',
    searchQuery: '',
    comparisonList: [],
    activeView: 'cards',
    map: null,
    markersGroup: null,
    placesLayerGroup: null,
    selectedCorridorForDetail: null
  };

  // DOM Elements
  const el = {
    // Metro Switcher
    metroBtnNyc: document.getElementById('metroBtnNyc'),
    metroBtnDfw: document.getElementById('metroBtnDfw'),
    geometryWarningBanner: document.getElementById('geometryWarningBanner'),
    nycCountBadge: document.getElementById('nycCountBadge'),
    dfwCountBadge: document.getElementById('dfwCountBadge'),
    
    // Archetype & Ranking Controls
    archetypeSelect: document.getElementById('archetypeSelect'),
    rankingMetricSelect: document.getElementById('rankingMetricSelect'),
    archetypeCategoryPill: document.getElementById('archetypeCategoryPill'),
    archetypeName: document.getElementById('archetypeName'),
    archetypeMission: document.getElementById('archetypeMission'),
    archetypeGate: document.getElementById('archetypeGate'),
    archetypeSignals: document.getElementById('archetypeSignals'),
    
    // Filters
    boroughFilter: document.getElementById('boroughFilter'),
    tierFilter: document.getElementById('tierFilter'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    
    // KPI Strip
    kpiTotalCorridors: document.getElementById('kpiTotalCorridors'),
    kpiStrongFits: document.getElementById('kpiStrongFits'),
    kpiTopCorridor: document.getElementById('kpiTopCorridor'),
    kpiAvgWhitespace: document.getElementById('kpiAvgWhitespace'),
    kpiAvgCafes: document.getElementById('kpiAvgCafes'),
    
    // View Switcher
    viewTabCards: document.getElementById('viewTabCards'),
    viewTabMap: document.getElementById('viewTabMap'),
    viewTabMethodology: document.getElementById('viewTabMethodology'),
    cardsView: document.getElementById('cardsView'),
    mapView: document.getElementById('mapView'),
    methodologyView: document.getElementById('methodologyView'),
    cardsCountLabel: document.getElementById('cardsCountLabel'),
    sortInfoPill: document.getElementById('sortInfoPill'),
    
    // Grid & Notices
    corridorsGrid: document.getElementById('corridorsGrid'),
    noResultsNotice: document.getElementById('noResultsNotice'),
    
    // Map
    corridorMap: document.getElementById('corridorMap'),
    mapSidebarContent: document.getElementById('mapSidebarContent'),
    
    // Compare Elements
    openCompareBtn: document.getElementById('openCompareBtn'),
    compareCount: document.getElementById('compareCount'),
    compareModalOverlay: document.getElementById('compareModalOverlay'),
    closeCompareModalBtn: document.getElementById('closeCompareModalBtn'),
    closeCompareFooterBtn: document.getElementById('closeCompareFooterBtn'),
    clearCompareBtn: document.getElementById('clearCompareBtn'),
    comparisonTable: document.getElementById('comparisonTable'),
    compareArchetypeTitle: document.getElementById('compareArchetypeTitle'),
    
    // Detail Modal Elements
    detailModalOverlay: document.getElementById('detailModalOverlay'),
    closeDetailModalBtn: document.getElementById('closeDetailModalBtn'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCompareToggleBtn: document.getElementById('modalCompareToggleBtn'),
    modalBorough: document.getElementById('modalBorough'),
    modalTierPill: document.getElementById('modalTierPill'),
    modalRankBadge: document.getElementById('modalRankBadge'),
    modalCorridorName: document.getElementById('modalCorridorName'),
    modalNeighborhoods: document.getElementById('modalNeighborhoods'),
    modalCharacter: document.getElementById('modalCharacter'),
    modalWhyBox: document.getElementById('modalWhyBox'),
    modalFitScore: document.getElementById('modalFitScore'),
    modalFitPercent: document.getElementById('modalFitPercent'),
    modalOppScore: document.getElementById('modalOppScore'),
    modalWhitespace: document.getElementById('modalWhitespace'),
    modalCafeCount: document.getElementById('modalCafeCount'),
    modalContributionsContent: document.getElementById('modalContributionsContent'),
    modalAudiencesList: document.getElementById('modalAudiencesList'),
    modalAnchorsList: document.getElementById('modalAnchorsList'),
    modalSpecialZonesList: document.getElementById('modalSpecialZonesList'),
    modalPlacesCount: document.getElementById('modalPlacesCount'),
    modalPlacesChips: document.getElementById('modalPlacesChips')
  };

  // =========================================================================
  // 1. Data Fetching & Initialization
  // =========================================================================
  async function init() {
    setupEventListeners();
    await loadMetroData('nyc');
    await loadMetroData('dfw');
    
    // Set initial view
    switchMetro('nyc');
  }

  async function loadMetroData(metroKey) {
    try {
      const response = await fetch(`data/${metroKey}.json`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      state.datasets[metroKey] = data;

      if (metroKey === 'nyc') el.nycCountBadge.textContent = data.corridors_count;
      if (metroKey === 'dfw') el.dfwCountBadge.textContent = data.corridors_count;
    } catch (err) {
      console.error(`Failed to load ${metroKey} dataset:`, err);
    }
  }

  // =========================================================================
  // 2. Metro & Archetype Handling
  // =========================================================================
  function switchMetro(metroKey) {
    state.activeMetro = metroKey;
    state.boroughFilter = 'all';
    state.tierFilter = 'all';
    state.searchQuery = '';
    el.searchInput.value = '';
    el.clearSearchBtn.style.display = 'none';

    // Update active tab buttons
    if (metroKey === 'nyc') {
      el.metroBtnNyc.classList.add('active');
      el.metroBtnDfw.classList.remove('active');
      el.geometryWarningBanner.style.display = 'none';
    } else {
      el.metroBtnDfw.classList.add('active');
      el.metroBtnNyc.classList.remove('active');
      el.geometryWarningBanner.style.display = 'block';
    }

    const metroData = state.datasets[metroKey];
    if (!metroData) return;

    // Populate Archetypes Dropdown
    populateArchetypes(metroData.archetypes);

    // Populate Borough/District Filter
    populateBoroughs(metroData.corridors);

    // Render Everything
    render();

    // Reset Map View to new metro bounds
    if (state.map) {
      centerMapForMetro(metroKey);
    }
  }

  function populateArchetypes(archetypes) {
    el.archetypeSelect.innerHTML = '';
    
    // Group by category (CAFÉ, RESTAURANT)
    const groups = {};
    archetypes.forEach(a => {
      const cat = a.category_id || 'OTHER';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });

    for (const [catName, archList] of Object.entries(groups)) {
      const optGroup = document.createElement('optgroup');
      optGroup.label = catName === 'CAFE' ? '☕ Café Archetypes' : '🍽️ Restaurant Archetypes';

      archList.forEach(a => {
        const option = document.createElement('option');
        option.value = a.archetype_id;
        option.textContent = `${a.name}`;
        optGroup.appendChild(option);
      });
      el.archetypeSelect.appendChild(optGroup);
    }

    // Default archetype selection
    // Prefer "Neighborhood cafe" or first in list
    const neighborhoodCafe = archetypes.find(a => a.name.toLowerCase().includes('neighborhood'));
    if (neighborhoodCafe) {
      state.activeArchetypeId = neighborhoodCafe.archetype_id;
      el.archetypeSelect.value = neighborhoodCafe.archetype_id;
    } else if (archetypes.length > 0) {
      state.activeArchetypeId = archetypes[0].archetype_id;
      el.archetypeSelect.value = archetypes[0].archetype_id;
    }

    updateArchetypeBrief();
  }

  function updateArchetypeBrief() {
    const data = state.datasets[state.activeMetro];
    if (!data) return;

    const arch = data.archetypes.find(a => a.archetype_id === state.activeArchetypeId);
    if (!arch) return;

    el.archetypeCategoryPill.textContent = (arch.category_id || 'BUSINESS') + ' FORMAT';
    el.archetypeName.textContent = arch.name;
    el.archetypeMission.textContent = arch.mission || 'General commercial activation format.';
    el.archetypeGate.textContent = arch.required_gate || 'Standard commercial retail frontage';

    // Render signals
    el.archetypeSignals.innerHTML = '';
    (arch.primary_signals || []).forEach(sig => {
      const pill = document.createElement('span');
      pill.className = 'signal-pill primary';
      pill.textContent = 'Primary: ' + sig.replace(/_/g, ' ');
      el.archetypeSignals.appendChild(pill);
    });

    (arch.supporting_signals || []).forEach(sig => {
      const pill = document.createElement('span');
      pill.className = 'signal-pill supporting';
      pill.textContent = 'Support: ' + sig.replace(/_/g, ' ');
      el.archetypeSignals.appendChild(pill);
    });
  }

  function populateBoroughs(corridors) {
    el.boroughFilter.innerHTML = '<option value="all">All Boroughs & Districts</option>';
    const boroughs = new Set();
    corridors.forEach(c => {
      if (c.borough) boroughs.add(c.borough);
    });

    Array.from(boroughs).sort().forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      el.boroughFilter.appendChild(opt);
    });
    el.boroughFilter.value = 'all';
  }

  // =========================================================================
  // 3. Calculation & Opportunity Scoring Logic
  // =========================================================================
  function getCorridorMetrics(corridor, archetypeId) {
    const scoreObj = (corridor.scores && corridor.scores[archetypeId]) || {
      score: 0,
      tier: 'INSUFFICIENT_CONTEXT'
    };

    const fitScore = typeof scoreObj.score === 'number' ? scoreObj.score : 0;
    const fitPercent = Math.round(fitScore * 100);
    const fitTier = scoreObj.tier || 'INSUFFICIENT_CONTEXT';
    const whitespace = typeof corridor.cafe_whitespace === 'number' ? corridor.cafe_whitespace : 0;
    const cafeCount = typeof corridor.cafe_count === 'number' ? corridor.cafe_count : 0;

    // Multi-Signal Opportunity Index (Application Calculation)
    // Formula based on the Starter Kit Guide:
    // Opportunity = (Fit Score * 100) + (Whitespace * 0.40) - (Existing Supply Penalty)
    // Strong tier bonus, gated-out penalty
    let tierMultiplier = 1.0;
    if (fitTier === 'STRONG_FIT') tierMultiplier = 1.15;
    else if (fitTier === 'MODERATE_FIT') tierMultiplier = 1.0;
    else if (fitTier === 'WEAK_FIT') tierMultiplier = 0.85;
    else if (fitTier === 'GATED_OUT') tierMultiplier = 0.3;
    else if (fitTier === 'INSUFFICIENT_CONTEXT') tierMultiplier = 0.6;

    // Existing Cafe Supply Penalty (diminishing penalty)
    const supplyPenalty = Math.min(cafeCount * 0.25, 25);

    let rawOpp = ((fitScore * 100) + (whitespace * 0.40) - supplyPenalty) * tierMultiplier;
    const opportunityScore = Math.max(0, Math.round(rawOpp * 10) / 10);

    return {
      fitScore,
      fitPercent,
      fitTier,
      whitespace,
      cafeCount,
      opportunityScore,
      scoreObj
    };
  }

  // =========================================================================
  // 4. "Why Recommended" Explanation Engine
  // =========================================================================
  function generateWhyExplanation(corridor, metrics, arch) {
    const { fitTier, fitPercent, whitespace, cafeCount, scoreObj } = metrics;
    const name = corridor.name;

    // Check for DFW rich reasons
    if (scoreObj.reasons && scoreObj.reasons.length > 0) {
      return scoreObj.reasons.join('. ') + '.';
    }

    // Synthesize transparent explanation from authentic dataset facts
    const parts = [];

    // Part 1: Fit assessment
    if (fitTier === 'STRONG_FIT') {
      parts.push(`Exceptional fit score of ${fitPercent}% matches the operational contract of the ${arch.name}`);
    } else if (fitTier === 'MODERATE_FIT') {
      parts.push(`Solid fit score of ${fitPercent}% provides viable commercial demand for this format`);
    } else if (fitTier === 'WEAK_FIT') {
      parts.push(`Moderate-to-low fit score (${fitPercent}%) suggests specialized or niche positioning`);
    } else if (fitTier === 'GATED_OUT') {
      parts.push(`Currently gated out for this format due to contract gate constraints (${arch.required_gate || 'infrastructure'})`);
    } else {
      parts.push(`Contextual fit is exploratory (${fitPercent}%)`);
    }

    // Part 2: Whitespace and competition
    if (whitespace >= 70) {
      parts.push(`high café whitespace quality (${whitespace}/100) points to substantial unmet market demand`);
    } else if (whitespace >= 50) {
      parts.push(`healthy whitespace (${whitespace}/100) indicates balanced customer footfall`);
    } else {
      parts.push(`established commercial baseline with whitespace rated at ${whitespace}/100`);
    }

    if (cafeCount <= 15) {
      parts.push(`light existing competition (${cafeCount} cafés)`);
    } else if (cafeCount <= 40) {
      parts.push(`moderate café clustering (${cafeCount} listings)`);
    } else {
      parts.push(`dense café hub (${cafeCount} listings) offering strong proof-of-concept foot traffic`);
    }

    // Part 3: Anchors & Dominant Audience
    const audLabel = corridor.dominant_audience?.label || (corridor.top_audiences && corridor.top_audiences[0]?.label);
    if (audLabel) {
      parts.push(`primarily energized by ${audLabel}`);
    }

    if (corridor.anchors && corridor.anchors.length > 0) {
      const topAnchor = corridor.anchors[0].name;
      parts.push(`with major pedestrian draw from ${topAnchor}`);
    }

    if (corridor.special_zones && corridor.special_zones.length > 0) {
      parts.push(`benefiting from adjacent traffic magnet: ${corridor.special_zones[0].name}`);
    }

    return parts.join(', ') + '.';
  }

  // =========================================================================
  // 5. Filtering, Sorting & Rendering
  // =========================================================================
  function getFilteredAndSortedCorridors() {
    const data = state.datasets[state.activeMetro];
    if (!data) return [];

    const archId = state.activeArchetypeId;
    let list = data.corridors.map(c => {
      const m = getCorridorMetrics(c, archId);
      return {
        corridor: c,
        metrics: m
      };
    });

    // 1. Borough Filter
    if (state.boroughFilter !== 'all') {
      list = list.filter(item => item.corridor.borough === state.boroughFilter);
    }

    // 2. Tier Filter
    if (state.tierFilter !== 'all') {
      list = list.filter(item => item.metrics.fitTier === state.tierFilter);
    }

    // 3. Search Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const c = item.corridor;
        const inName = c.name.toLowerCase().includes(q);
        const inBorough = c.borough.toLowerCase().includes(q);
        const inNeighborhoods = (c.neighborhoods || []).some(n => n.toLowerCase().includes(q));
        const inCharacter = (c.character || '').toLowerCase().includes(q);
        return inName || inBorough || inNeighborhoods || inCharacter;
      });
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (state.rankingMetric === 'opportunity') {
        return b.metrics.opportunityScore - a.metrics.opportunityScore;
      } else if (state.rankingMetric === 'fit') {
        return b.metrics.fitScore - a.metrics.fitScore;
      } else if (state.rankingMetric === 'whitespace') {
        return b.metrics.whitespace - a.metrics.whitespace;
      } else if (state.rankingMetric === 'fewest_cafes') {
        return a.metrics.cafeCount - b.metrics.cafeCount;
      }
      return 0;
    });

    return list;
  }

  function render() {
    const list = getFilteredAndSortedCorridors();
    const data = state.datasets[state.activeMetro];
    const arch = data.archetypes.find(a => a.archetype_id === state.activeArchetypeId) || { name: 'Selected Format' };

    // Update KPI Strip
    updateKPIs(list);

    // Update View Switcher Counts & Label
    el.cardsCountLabel.textContent = list.length;
    let sortName = 'Opportunity Score (Calculated)';
    if (state.rankingMetric === 'fit') sortName = 'Official Fit Score';
    else if (state.rankingMetric === 'whitespace') sortName = 'Whitespace Opportunity';
    else if (state.rankingMetric === 'fewest_cafes') sortName = 'Lowest Cafe Competition';
    el.sortInfoPill.innerHTML = `Sorted by: <strong>${sortName}</strong>`;

    // Render Cards Grid
    renderCards(list, arch);

    // Render Map Markers
    if (state.map) {
      renderMapMarkers(list, arch);
    }
  }

  function updateKPIs(list) {
    el.kpiTotalCorridors.textContent = list.length;
    
    const strongFits = list.filter(item => item.metrics.fitTier === 'STRONG_FIT').length;
    el.kpiStrongFits.textContent = strongFits;

    if (list.length > 0) {
      el.kpiTopCorridor.textContent = list[0].corridor.name;
      el.kpiTopCorridor.title = list[0].corridor.name;

      const avgWs = Math.round(list.reduce((acc, i) => acc + i.metrics.whitespace, 0) / list.length);
      el.kpiAvgWhitespace.textContent = `${avgWs} / 100`;

      const avgCafes = Math.round(list.reduce((acc, i) => acc + i.metrics.cafeCount, 0) / list.length);
      el.kpiAvgCafes.textContent = avgCafes;
    } else {
      el.kpiTopCorridor.textContent = 'None';
      el.kpiAvgWhitespace.textContent = '0';
      el.kpiAvgCafes.textContent = '0';
    }
  }

  function renderCards(list, arch) {
    el.corridorsGrid.innerHTML = '';

    if (list.length === 0) {
      el.noResultsNotice.style.display = 'block';
      return;
    }
    el.noResultsNotice.style.display = 'none';

    list.forEach((item, index) => {
      const { corridor, metrics } = item;
      const rank = index + 1;
      const card = createCorridorCard(corridor, metrics, rank, arch);
      el.corridorsGrid.appendChild(card);
    });
  }

  function createCorridorCard(c, m, rank, arch) {
    const card = document.createElement('div');
    card.className = 'corridor-card glass-card';
    card.dataset.id = c.id;

    // Rank styling
    let rankClass = 'rank-normal';
    if (rank === 1) rankClass = 'rank-top-1';
    else if (rank === 2) rankClass = 'rank-top-2';
    else if (rank === 3) rankClass = 'rank-top-3';

    // Progress bar class
    let progressClass = 'moderate';
    if (m.fitTier === 'STRONG_FIT') progressClass = 'strong';
    else if (m.fitTier === 'WEAK_FIT') progressClass = 'weak';
    else if (m.fitTier === 'GATED_OUT' || m.fitTier === 'INSUFFICIENT_CONTEXT') progressClass = 'gated';

    // Why explanation
    const whySummary = generateWhyExplanation(c, m, arch);

    // Anchors & Special Zones
    const topAnchor = c.anchors && c.anchors.length > 0 ? c.anchors[0].name : null;
    const topZone = c.special_zones && c.special_zones.length > 0 ? c.special_zones[0].name : null;

    // Compare checked state
    const isCompared = state.comparisonList.includes(c.id);

    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-title-group">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="rank-badge ${rankClass}">#${rank}</span>
            <span class="borough-tag">${c.borough}</span>
          </div>
          <h3 class="corridor-name">${c.name}</h3>
          <div class="neighborhoods-line" title="${(c.neighborhoods || []).join(', ')}">
            ${(c.neighborhoods && c.neighborhoods.length > 0) ? c.neighborhoods.join(', ') : 'Central Commercial District'}
          </div>
        </div>
        <div class="card-tier-wrap">
          <span class="tier-badge tier-${m.fitTier}">${m.fitTier.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <!-- Fit Progress Bar -->
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-bottom: 4px; color: var(--text-muted);">
          <span>Official Fit Match</span>
          <strong>${m.fitPercent}% (${m.fitScore.toFixed(4)})</strong>
        </div>
        <div class="fit-progress-bar-wrap">
          <div class="fit-progress-bar ${progressClass}" style="width: ${m.fitPercent}%"></div>
        </div>
      </div>

      <!-- Metrics Triad -->
      <div class="card-metrics-triad">
        <div class="triad-col">
          <div class="triad-val opp-val">${m.opportunityScore}</div>
          <div class="triad-label">Opportunity Score</div>
        </div>
        <div class="triad-col">
          <div class="triad-val">${m.whitespace}</div>
          <div class="triad-label">Café Whitespace</div>
        </div>
        <div class="triad-col">
          <div class="triad-val">${m.cafeCount}</div>
          <div class="triad-label">Existing Cafés</div>
        </div>
      </div>

      <!-- Why Recommended Callout -->
      <div class="card-why-callout">
        <strong>Why Investigate:</strong> ${whySummary}
      </div>

      <!-- Anchors & Zones preview -->
      <div class="card-anchors-row">
        ${topAnchor ? `<span class="anchor-chip" title="Anchor: ${topAnchor}">🏛️ ${topAnchor}</span>` : ''}
        ${topZone ? `<span class="zone-chip" title="Special Zone: ${topZone}">⭐ ${topZone}</span>` : ''}
        ${c.dominant_audience?.label ? `<span class="anchor-chip">👥 ${c.dominant_audience.label}</span>` : ''}
      </div>

      <!-- Bottom Card Actions -->
      <div class="card-actions-row">
        <label class="compare-checkbox-label" onclick="event.stopPropagation();">
          <input type="checkbox" class="compare-checkbox" data-id="${c.id}" ${isCompared ? 'checked' : ''}>
          <span>Compare</span>
        </label>
        <button type="button" class="btn-card-inspect">Inspect Deep Dive &rarr;</button>
      </div>
    `;

    // Click card opens detail
    card.addEventListener('click', () => {
      openDetailModal(c, m, rank, arch);
    });

    // Checkbox compare toggle
    const checkbox = card.querySelector('.compare-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleCompare(c.id, checkbox.checked);
    });

    return card;
  }

  // =========================================================================
  // 6. Interactive Map Integration (Leaflet)
  // =========================================================================
  function initMap() {
    if (state.map) return;

    state.map = L.map('corridorMap', {
      zoomControl: true,
      attributionControl: true
    }).setView([40.7128, -73.9850], 11);

    // High quality CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(state.map);

    state.markersGroup = L.layerGroup().addTo(state.map);
    state.placesLayerGroup = L.layerGroup().addTo(state.map);

    centerMapForMetro(state.activeMetro);
  }

  function centerMapForMetro(metroKey) {
    if (!state.map) return;
    if (metroKey === 'nyc') {
      state.map.setView([40.7200, -73.9600], 11);
    } else {
      state.map.setView([32.8000, -96.8200], 10);
    }
  }

  function renderMapMarkers(list, arch) {
    if (!state.map || !state.markersGroup) return;

    state.markersGroup.clearLayers();
    state.placesLayerGroup.clearLayers();

    list.forEach((item, index) => {
      const { corridor, metrics } = item;
      const rank = index + 1;
      const lat = corridor.centroid?.lat;
      const lon = corridor.centroid?.lon;
      if (!lat || !lon) return;

      // Tier color
      let color = '#f59e0b';
      if (metrics.fitTier === 'STRONG_FIT') color = '#10b981';
      else if (metrics.fitTier === 'WEAK_FIT') color = '#94a3b8';
      else if (metrics.fitTier === 'GATED_OUT' || metrics.fitTier === 'INSUFFICIENT_CONTEXT') color = '#f43f5e';

      const circleMarker = L.circleMarker([lat, lon], {
        radius: metrics.fitTier === 'STRONG_FIT' ? 12 : 9,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85
      });

      // Custom Popup
      const popupHtml = `
        <div class="map-popup-card">
          <span style="font-size:0.7rem; font-weight:700; color:#818cf8;">RANK #${rank} • ${corridor.borough}</span>
          <div class="popup-title">${corridor.name}</div>
          <div class="popup-metrics">
            <span>Fit: <strong>${metrics.fitPercent}%</strong></span>
            <span>Opp: <strong>${metrics.opportunityScore}</strong></span>
            <span>Cafés: <strong>${metrics.cafeCount}</strong></span>
          </div>
          <p style="font-size:0.75rem; color:#cbd5e1; margin-top:4px; line-height:1.3;">
            ${(corridor.neighborhoods || []).slice(0, 3).join(', ')}
          </p>
          <button type="button" class="btn btn-primary" style="margin-top:6px; padding:4px 10px; font-size:0.75rem;" onclick="window.appOpenDetail('${corridor.id}')">
            View Full Corridor Breakdown &rarr;
          </button>
        </div>
      `;

      circleMarker.bindPopup(popupHtml);

      // Marker click also updates sidebar
      circleMarker.on('click', () => {
        showCorridorInMapSidebar(corridor, metrics, rank, arch);
        showSamplePlacesOnMap(corridor);
      });

      state.markersGroup.addLayer(circleMarker);
    });
  }

  function showCorridorInMapSidebar(c, m, rank, arch) {
    const whySummary = generateWhyExplanation(c, m, arch);
    el.mapSidebarContent.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="rank-badge rank-top-1">#${rank} Recommended</span>
          <span class="tier-badge tier-${m.fitTier}">${m.fitTier.replace(/_/g, ' ')}</span>
        </div>
        <h3 style="font-size:1.3rem; font-family:var(--font-display); color:#fff;">${c.name}</h3>
        <div style="font-size:0.8rem; color:#93c5fd; text-transform:uppercase; font-weight:600;">${c.borough}</div>

        <div class="card-metrics-triad">
          <div class="triad-col">
            <div class="triad-val opp-val">${m.opportunityScore}</div>
            <div class="triad-label">Opp Score</div>
          </div>
          <div class="triad-col">
            <div class="triad-val">${m.fitPercent}%</div>
            <div class="triad-label">Fit Match</div>
          </div>
          <div class="triad-col">
            <div class="triad-val">${m.whitespace}</div>
            <div class="triad-label">Whitespace</div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:var(--radius-sm); font-size:0.82rem; color:#e2e8f0; line-height:1.4;">
          <strong>Why Selected:</strong> ${whySummary}
        </div>

        <div style="font-size:0.82rem; color:var(--text-muted);">
          <strong>Top Anchors:</strong> ${(c.anchors || []).map(a => a.name).slice(0, 3).join(', ') || 'District retail hubs'}
        </div>

        <button type="button" class="btn btn-primary" style="margin-top:0.5rem;" onclick="window.appOpenDetail('${c.id}')">
          Open Full Corridor Dossier
        </button>
      </div>
    `;
  }

  function showSamplePlacesOnMap(corridor) {
    if (!state.placesLayerGroup) return;
    state.placesLayerGroup.clearLayers();

    const pts = corridor.sample_points || [];
    pts.forEach(p => {
      if (!p.lat || !p.lon) return;

      // Color by family
      let color = '#94a3b8';
      if (p.family === 'food_drink') color = '#f97316';
      else if (p.family === 'culture') color = '#a855f7';
      else if (p.family === 'retail') color = '#38bdf8';
      else if (p.family === 'workplace') color = '#3b82f6';
      else if (p.family === 'grocery') color = '#22c55e';

      const placeMarker = L.circleMarker([p.lat, p.lon], {
        radius: 4,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        fillOpacity: 0.8
      });

      placeMarker.bindTooltip(`<b>${p.name}</b><br><span style="font-size:0.75rem; color:#94a3b8;">${p.family_label || p.category}</span>`, {
        direction: 'top',
        opacity: 0.9
      });

      state.placesLayerGroup.addLayer(placeMarker);
    });
  }

  // =========================================================================
  // 7. Deep-Dive Corridor Modal
  // =========================================================================
  function openDetailModal(corridor, metrics, rank, arch) {
    state.selectedCorridorForDetail = corridor;

    el.modalBorough.textContent = corridor.borough;
    el.modalTierPill.textContent = metrics.fitTier.replace(/_/g, ' ');
    el.modalTierPill.className = `tier-badge tier-${metrics.fitTier}`;
    el.modalRankBadge.textContent = rank ? `Rank #${rank}` : '';
    el.modalCorridorName.textContent = corridor.name;
    el.modalNeighborhoods.textContent = (corridor.neighborhoods && corridor.neighborhoods.length > 0)
      ? corridor.neighborhoods.join(', ')
      : 'Commercial District';

    el.modalCharacter.textContent = corridor.character || 'No plain-English character note provided for this corridor in the export.';
    el.modalWhyBox.textContent = generateWhyExplanation(corridor, metrics, arch);

    // Metrics
    el.modalFitScore.textContent = metrics.fitScore.toFixed(4);
    el.modalFitPercent.textContent = `${metrics.fitPercent}% Fit Score`;
    el.modalOppScore.textContent = metrics.opportunityScore;
    el.modalWhitespace.textContent = `${metrics.whitespace} / 100`;
    el.modalCafeCount.textContent = metrics.cafeCount;

    // Contributions / Signal Table
    renderContributions(corridor, metrics.scoreObj, arch);

    // Audience Personas
    renderAudiences(corridor);

    // Anchors
    renderAnchors(corridor);

    // Special Zones
    renderSpecialZones(corridor);

    // Mapped Places
    renderPlacesChips(corridor);

    // Compare Toggle Button
    updateModalCompareBtn();

    el.detailModalOverlay.style.display = 'flex';
  }

  function renderContributions(corridor, scoreObj, arch) {
    const container = el.modalContributionsContent;
    container.innerHTML = '';

    // If DFW contributions exist
    if (scoreObj.contributions && scoreObj.contributions.length > 0) {
      let html = `
        <table class="contributions-table">
          <thead>
            <tr>
              <th>Signal Name</th>
              <th>Role</th>
              <th>Signal Value</th>
              <th>Effective Weight</th>
              <th>Total Contribution</th>
            </tr>
          </thead>
          <tbody>
      `;
      scoreObj.contributions.forEach(c => {
        html += `
          <tr>
            <td><strong>${c.signal.replace(/_/g, ' ')}</strong></td>
            <td><span class="signal-pill ${c.role === 'PRIMARY' ? 'primary' : 'supporting'}">${c.role}</span></td>
            <td>${Math.round(c.value * 100)}%</td>
            <td>${Math.round(c.effective_weight * 100)}%</td>
            <td><strong style="color:#818cf8;">+${(c.contribution * 100).toFixed(1)}%</strong></td>
          </tr>
        `;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
      return;
    }

    // Otherwise show NYC demand source breakdown
    const ds = corridor.demand_sources || {};
    if (Object.keys(ds).length > 0) {
      let html = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.6rem;">';
      for (const [key, val] of Object.entries(ds)) {
        if (typeof val === 'number') {
          html += `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:0.5rem; border-radius:4px; text-align:center;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${key.replace(/_/g, ' ')}</div>
              <div style="font-size:1.1rem; font-weight:700; color:#fff;">${Math.round(val * 100)}%</div>
            </div>
          `;
        }
      }
      html += '</div>';
      container.innerHTML = html;
    } else {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Signal weights adhere to standard category contract.</p>';
    }
  }

  function renderAudiences(corridor) {
    const list = el.modalAudiencesList;
    list.innerHTML = '';

    const topAuds = corridor.top_audiences || [];
    if (topAuds.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No audience breakdown recorded for this corridor.</p>';
      return;
    }

    topAuds.forEach(a => {
      const item = document.createElement('div');
      item.className = 'audience-pill-item';
      item.innerHTML = `
        <span class="audience-name" title="${a.label}">${a.label}</span>
        <span class="audience-score-val">${a.score} / 7</span>
      `;
      list.appendChild(item);
    });
  }

  function renderAnchors(corridor) {
    const list = el.modalAnchorsList;
    list.innerHTML = '';

    const anchors = corridor.anchors || [];
    if (anchors.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">No designated named anchors recorded.</p>';
      return;
    }

    anchors.forEach(a => {
      const div = document.createElement('div');
      div.className = 'anchor-item';
      div.innerHTML = `
        <span style="font-weight:600; color:#fff;">${a.name}</span>
        <span class="anchor-relation">${(a.relation || a.class || '').replace(/_/g, ' ')}</span>
      `;
      list.appendChild(div);
    });
  }

  function renderSpecialZones(corridor) {
    const list = el.modalSpecialZonesList;
    list.innerHTML = '';

    const zones = corridor.special_zones || [];
    if (zones.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">None adjacent to this corridor stretch.</p>';
      return;
    }

    zones.forEach(z => {
      const div = document.createElement('div');
      div.className = 'zone-item';
      div.innerHTML = `
        <div>
          <strong style="color:#fbbf24;">⭐ ${z.name}</strong>
          ${z.note ? `<div style="font-size:0.72rem; color:var(--text-muted);">${z.note}</div>` : ''}
        </div>
        <span style="font-size:0.7rem; background:rgba(245,158,11,0.2); padding:2px 6px; border-radius:3px; color:#fde68a;">
          ${(z.zone_type || 'ZONE').replace(/_/g, ' ')}
        </span>
      `;
      list.appendChild(div);
    });
  }

  function renderPlacesChips(corridor) {
    const container = el.modalPlacesChips;
    container.innerHTML = '';

    const pts = corridor.sample_points || [];
    el.modalPlacesCount.textContent = pts.length;

    if (pts.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">No representative places sampled in this corridor.</p>';
      return;
    }

    pts.forEach(p => {
      const chip = document.createElement('span');
      chip.className = 'place-chip';
      chip.textContent = `${p.name} (${p.family_label || p.family})`;
      container.appendChild(chip);
    });
  }

  function updateModalCompareBtn() {
    if (!state.selectedCorridorForDetail) return;
    const isCompared = state.comparisonList.includes(state.selectedCorridorForDetail.id);
    el.modalCompareToggleBtn.textContent = isCompared ? 'Remove from Compare' : 'Add to Compare';
  }

  // Global helper for map popups
  window.appOpenDetail = function(corridorId) {
    const data = state.datasets[state.activeMetro];
    if (!data) return;
    const c = data.corridors.find(item => item.id === corridorId);
    if (!c) return;
    const m = getCorridorMetrics(c, state.activeArchetypeId);
    const arch = data.archetypes.find(a => a.archetype_id === state.activeArchetypeId);
    openDetailModal(c, m, null, arch);
  };

  // =========================================================================
  // 8. Side-by-Side Comparison Modal
  // =========================================================================
  function toggleCompare(corridorId, shouldAdd) {
    if (shouldAdd) {
      if (!state.comparisonList.includes(corridorId)) {
        if (state.comparisonList.length >= 3) {
          alert('You can compare up to 3 corridors simultaneously.');
          render();
          return;
        }
        state.comparisonList.push(corridorId);
      }
    } else {
      state.comparisonList = state.comparisonList.filter(id => id !== corridorId);
    }

    updateCompareButtons();
    updateModalCompareBtn();
  }

  function updateCompareButtons() {
    const count = state.comparisonList.length;
    el.compareCount.textContent = count;
    el.openCompareBtn.disabled = count === 0;
  }

  function openCompareModal() {
    if (state.comparisonList.length === 0) return;

    const data = state.datasets[state.activeMetro];
    const arch = data.archetypes.find(a => a.archetype_id === state.activeArchetypeId);
    el.compareArchetypeTitle.textContent = arch ? arch.name : 'Selected Format';

    const corridorsToCompare = state.comparisonList.map(id => {
      const c = data.corridors.find(item => item.id === id);
      const m = getCorridorMetrics(c, state.activeArchetypeId);
      return { corridor: c, metrics: m };
    });

    renderComparisonTable(corridorsToCompare, arch);
    el.compareModalOverlay.style.display = 'flex';
  }

  function renderComparisonTable(items, arch) {
    const table = el.comparisonTable;
    table.innerHTML = '';

    // Header Row
    let headerHtml = '<thead><tr><th>Feature / Signal</th>';
    items.forEach(i => {
      headerHtml += `
        <th>
          <div style="font-size:1.1rem; font-family:var(--font-display);">${i.corridor.name}</div>
          <span class="borough-tag">${i.corridor.borough}</span>
        </th>
      `;
    });
    headerHtml += '</tr></thead>';

    // Rows Data
    const rows = [
      {
        label: 'Fit Tier & Match',
        fn: i => `<span class="tier-badge tier-${i.metrics.fitTier}">${i.metrics.fitTier.replace(/_/g, ' ')}</span> (${i.metrics.fitPercent}%)`
      },
      {
        label: 'Opportunity Score',
        fn: i => `<strong style="color:#818cf8; font-size:1.2rem;">${i.metrics.opportunityScore}</strong>`
      },
      {
        label: 'Café Whitespace Quality',
        fn: i => `<strong>${i.metrics.whitespace} / 100</strong>`
      },
      {
        label: 'Existing Café Listings',
        fn: i => `<strong>${i.metrics.cafeCount} cafés</strong>`
      },
      {
        label: 'Dominant Audience',
        fn: i => i.corridor.dominant_audience?.label || (i.corridor.top_audiences && i.corridor.top_audiences[0]?.label) || 'N/A'
      },
      {
        label: 'Core Named Anchors',
        fn: i => (i.corridor.anchors || []).map(a => a.name).slice(0, 3).join('<br>') || 'General commercial hubs'
      },
      {
        label: 'Special Zones',
        fn: i => (i.corridor.special_zones || []).map(z => `⭐ ${z.name}`).join('<br>') || 'None adjacent'
      },
      {
        label: 'Strategic Summary',
        fn: i => `<span style="font-size:0.8rem; line-height:1.4;">${generateWhyExplanation(i.corridor, i.metrics, arch)}</span>`
      }
    ];

    let bodyHtml = '<tbody>';
    rows.forEach(r => {
      bodyHtml += `<tr><td>${r.label}</td>`;
      items.forEach(i => {
        bodyHtml += `<td>${r.fn(i)}</td>`;
      });
      bodyHtml += '</tr>';
    });
    bodyHtml += '</tbody>';

    table.innerHTML = headerHtml + bodyHtml;
  }

  // =========================================================================
  // 9. Event Listeners & Interactions
  // =========================================================================
  function setupEventListeners() {
    // Metro Switch
    el.metroBtnNyc.addEventListener('click', () => {
      if (state.activeMetro !== 'nyc') switchMetro('nyc');
    });

    el.metroBtnDfw.addEventListener('click', () => {
      if (state.activeMetro !== 'dfw') switchMetro('dfw');
    });

    // Archetype Select
    el.archetypeSelect.addEventListener('change', (e) => {
      state.activeArchetypeId = e.target.value;
      updateArchetypeBrief();
      render();
    });

    // Ranking Metric Select
    el.rankingMetricSelect.addEventListener('change', (e) => {
      state.rankingMetric = e.target.value;
      render();
    });

    // Borough Filter
    el.boroughFilter.addEventListener('change', (e) => {
      state.boroughFilter = e.target.value;
      render();
    });

    // Tier Filter
    el.tierFilter.addEventListener('change', (e) => {
      state.tierFilter = e.target.value;
      render();
    });

    // Search Input
    el.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      el.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      render();
    });

    el.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      el.searchInput.value = '';
      el.clearSearchBtn.style.display = 'none';
      render();
    });

    // Reset Filters
    el.resetFiltersBtn.addEventListener('click', () => {
      state.boroughFilter = 'all';
      state.tierFilter = 'all';
      state.searchQuery = '';
      el.boroughFilter.value = 'all';
      el.tierFilter.value = 'all';
      el.searchInput.value = '';
      el.clearSearchBtn.style.display = 'none';
      render();
    });

    // View Switching
    el.viewTabCards.addEventListener('click', () => switchView('cards'));
    el.viewTabMap.addEventListener('click', () => switchView('map'));
    el.viewTabMethodology.addEventListener('click', () => switchView('methodology'));

    // Detail Modal Close
    el.closeDetailModalBtn.addEventListener('click', () => {
      el.detailModalOverlay.style.display = 'none';
    });
    el.modalCloseBtn.addEventListener('click', () => {
      el.detailModalOverlay.style.display = 'none';
    });
    el.detailModalOverlay.addEventListener('click', (e) => {
      if (e.target === el.detailModalOverlay) el.detailModalOverlay.style.display = 'none';
    });

    // Detail Modal Compare Toggle
    el.modalCompareToggleBtn.addEventListener('click', () => {
      if (!state.selectedCorridorForDetail) return;
      const id = state.selectedCorridorForDetail.id;
      const isCurrentlyCompared = state.comparisonList.includes(id);
      toggleCompare(id, !isCurrentlyCompared);
      render();
    });

    // Compare Modal Controls
    el.openCompareBtn.addEventListener('click', openCompareModal);
    el.closeCompareModalBtn.addEventListener('click', () => {
      el.compareModalOverlay.style.display = 'none';
    });
    el.closeCompareFooterBtn.addEventListener('click', () => {
      el.compareModalOverlay.style.display = 'none';
    });
    el.compareModalOverlay.addEventListener('click', (e) => {
      if (e.target === el.compareModalOverlay) el.compareModalOverlay.style.display = 'none';
    });
    el.clearCompareBtn.addEventListener('click', () => {
      state.comparisonList = [];
      updateCompareButtons();
      el.compareModalOverlay.style.display = 'none';
      render();
    });
  }

  function switchView(viewName) {
    state.activeView = viewName;
    el.viewTabCards.classList.toggle('active', viewName === 'cards');
    el.viewTabMap.classList.toggle('active', viewName === 'map');
    el.viewTabMethodology.classList.toggle('active', viewName === 'methodology');

    el.cardsView.style.display = viewName === 'cards' ? 'block' : 'none';
    el.mapView.style.display = viewName === 'map' ? 'block' : 'none';
    el.methodologyView.style.display = viewName === 'methodology' ? 'block' : 'none';

    if (viewName === 'map') {
      initMap();
      setTimeout(() => {
        if (state.map) {
          state.map.invalidateSize();
          renderMapMarkers(getFilteredAndSortedCorridors(), state.datasets[state.activeMetro].archetypes.find(a => a.archetype_id === state.activeArchetypeId));
        }
      }, 100);
    }
  }

  // Run on page load
  window.addEventListener('DOMContentLoaded', init);

})();

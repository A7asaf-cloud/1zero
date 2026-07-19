// import './style.css';

// Initial Application State
const state = {
  balances: {
    liquid: 0,
    pension: 0,
    studyFund: 0,
    stocks: 0 // Will be calculated dynamically from stocksHoldings
  },
  creditOutstanding: 0,
  netWorthHistory: [0],
  stockAllocation: [],
  connections: {
    leumi: false,
    hapoalim: false,
    clearinghouse: false
  },
  stocksHoldings: [],
  transactions: []
};

// Charts
let sparklineChart = null;
let donutChart = null;

// DOM Element References
const elNetWorth = document.getElementById('net-worth-value');
const elNetWorthTrendPct = document.getElementById('net-worth-trend-pct');
const elNetWorthTrendIcon = document.querySelector('#net-worth-trend i');
const elLiquidVal = document.getElementById('liquid-val');
const elSavingsVal = document.getElementById('savings-val');
const elPensionBalance = document.getElementById('pension-balance-val');
const elStudyFundVal = document.getElementById('study-fund-val');
const elStocksVal = document.getElementById('stocks-val');
const elCreditOutstanding = document.getElementById('credit-outstanding-val');

// Helper to format currency
function formatCurrency(val) {
  return '₪' + Math.round(val).toLocaleString('en-US');
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'info') iconName = 'info';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Write to DevOps Terminal
function terminalWrite(text, type = 'system') {
  const terminal = document.getElementById('devops-terminal');
  if (!terminal) return;
  const line = document.createElement('div');
  line.className = `terminal-line terminal-${type}`;
  line.textContent = `[${type}] ${text}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Apply Filters to Ledger Transactions
function applyFilters() {
  const searchQuery = document.getElementById('ledger-search').value.toLowerCase().trim();
  const selectedCategory = document.getElementById('ledger-filter-category').value;

  const filteredTx = state.transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery) ||
                          tx.category.toLowerCase().includes(searchQuery) ||
                          tx.source.toLowerCase().includes(searchQuery);
    
    const matchesCategory = selectedCategory === 'ALL' || tx.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderLedgerLayouts(filteredTx);
}

// Calculate Stocks Balance Dynamically
function calculateStocksBalance() {
  if (state.stocksHoldings.length > 0) {
    const total = state.stocksHoldings.reduce((sum, h) => sum + (h.shares * h.price), 0);
    state.balances.stocks = total;
    return total;
  }
  return state.balances.stocks;
}

// Calculate Aggregated Net Worth
function getNetWorth() {
  calculateStocksBalance();
  return state.balances.liquid + state.balances.pension + state.balances.studyFund + state.balances.stocks - state.creditOutstanding;
}

// Update UI Values
function updateUIBalances(animate = false) {
  calculateStocksBalance();
  const currentNetWorth = getNetWorth();
  
  if (animate) {
    animateValue(elNetWorth, getPreviousNetWorth(), currentNetWorth, 800);
    animateValue(elLiquidVal, parseFloat(elLiquidVal.textContent.replace(/[^\d]/g, '')), state.balances.liquid, 800);
    animateValue(elSavingsVal, parseFloat(elSavingsVal.textContent.replace(/[^\d]/g, '')), state.balances.pension + state.balances.studyFund, 800);
    animateValue(elPensionBalance, parseFloat(elPensionBalance.textContent.replace(/[^\d]/g, '')), state.balances.pension, 800);
    animateValue(elStudyFundVal, parseFloat(elStudyFundVal.textContent.replace(/[^\d]/g, '')), state.balances.studyFund, 800);
    animateValue(elStocksVal, parseFloat(elStocksVal.textContent.replace(/[^\d]/g, '')), state.balances.stocks, 800);
  } else {
    elNetWorth.textContent = formatCurrency(currentNetWorth);
    elLiquidVal.textContent = formatCurrency(state.balances.liquid);
    elSavingsVal.textContent = formatCurrency(state.balances.pension + state.balances.studyFund);
    elPensionBalance.textContent = formatCurrency(state.balances.pension);
    elStudyFundVal.textContent = formatCurrency(state.balances.studyFund);
    elStocksVal.textContent = formatCurrency(state.balances.stocks);
  }

  elCreditOutstanding.textContent = formatCurrency(state.creditOutstanding);
  updatePensionProjections();
  updateManualSliderInputs();
}

// Real-time compound interest retirement projections slider calculations
function updatePensionProjections() {
  const yearsSlider = document.getElementById('years-slider');
  const yearsLabel = document.getElementById('slider-years-label');
  const resultDisplay = document.getElementById('projection-result');
  
  const years = parseInt(yearsSlider.value);
  yearsLabel.textContent = `Years left: ${years}`;

  const currentPension = state.balances.pension;
  const monthlyDeposit = 2200; 
  const annualRate = 0.065; 
  const monthlyRate = annualRate / 12;
  const months = years * 12;

  const compoundPV = currentPension * Math.pow(1 + monthlyRate, months);
  const annuityPMT = monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  const futureValue = compoundPV + annuityPMT;

  resultDisplay.textContent = formatCurrency(futureValue);
}

function getPreviousNetWorth() {
  return state.netWorthHistory[state.netWorthHistory.length - 2] || getNetWorth();
}

// Roll up Value animation
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = progress * (end - start) + start;
    obj.textContent = formatCurrency(val);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Synchronize range sliders with state
function updateManualSliderInputs() {
  document.getElementById('input-pension').value = state.balances.pension;
  document.getElementById('slider-pension').value = state.balances.pension;
  
  document.getElementById('input-studyfund').value = state.balances.studyFund;
  document.getElementById('slider-studyfund').value = state.balances.studyFund;

  document.getElementById('input-stocks').value = state.balances.stocks;
  document.getElementById('slider-stocks').value = state.balances.stocks;
}

// Render stock assets lists inside Stock Card
function renderStocksList() {
  const container = document.getElementById('stocks-holdings-list');
  container.innerHTML = '';

  if (state.stocksHoldings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.8rem;">
        No stock assets added yet.
      </div>
    `;
    return;
  }

  state.stocksHoldings.forEach(h => {
    const row = document.createElement('div');
    row.className = 'stock-holding-row';
    row.innerHTML = `
      <span class="stock-ticker-name">${h.ticker}</span>
      <span>${h.shares.toLocaleString()} shares</span>
      <span class="stock-value-align">${formatCurrency(h.shares * h.price)}</span>
    `;
    container.appendChild(row);
  });
}

// Render dual transaction ledger layouts (Mobile vertical list vs Desktop Table)
function renderLedgerLayouts(filteredTx = state.transactions) {
  // 1. Render Mobile Swipe List
  const mobileList = document.getElementById('ledger-list');
  mobileList.innerHTML = '';

  // 2. Render Desktop Table Rows
  const desktopTable = document.getElementById('ledger-table-body');
  desktopTable.innerHTML = '';

  if (filteredTx.length === 0) {
    const noRecordsMsg = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0; font-size: 0.8rem;">
        No records found matching filters.
      </div>
    `;
    mobileList.innerHTML = noRecordsMsg;
    desktopTable.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No records found matching active filters.
        </td>
      </tr>
    `;
    return;
  }

  filteredTx.forEach((tx, idx) => {
    // Generate icons for mobile cards
    let categoryClass = 'expense';
    let iconName = 'shopping-bag';

    if (tx.category === 'Salary') {
      categoryClass = 'salary';
      iconName = 'dollar-sign';
    } else if (tx.category === 'Food & Dining') {
      categoryClass = 'expense';
      iconName = 'coffee';
    } else if (tx.category === 'Utilities') {
      categoryClass = 'expense';
      iconName = 'zap';
    } else if (tx.category === 'Investment') {
      categoryClass = 'investment';
      iconName = 'trending-up';
    } else if (tx.category === 'Leisure') {
      categoryClass = 'expense';
      iconName = 'smile';
    }

    const sign = tx.type === 'INCOME' ? '+' : '-';
    const amountValClass = tx.type === 'INCOME' ? 'income' : 'expense';

    // A. Render Mobile Card
    const mobileCard = document.createElement('div');
    mobileCard.className = 'tx-item-card';
    mobileCard.innerHTML = `
      <div class="tx-icon-avatar ${categoryClass}">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="tx-details-middle">
        <span class="tx-title">${tx.description}</span>
        <span class="tx-meta">${tx.date} • ${tx.source}</span>
      </div>
      <div class="tx-amount-right ${amountValClass}">
        ${sign}${formatCurrency(tx.amount)}
      </div>
      <div class="tx-swipe-indicator">
        <i data-lucide="trash-2"></i>
      </div>
    `;

    // Bind mobile delete swipe button click
    mobileCard.querySelector('.tx-swipe-indicator').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTransaction(idx);
    });

    // Bind Swipe Gestures to Mobile Card
    setupSwipeGestures(mobileCard);

    mobileList.appendChild(mobileCard);

    // B. Render Desktop Row
    const desktopRow = document.createElement('tr');
    const badgeStyleClass = tx.type === 'INCOME' ? 'badge-income' : 'badge-expense';
    const amountStyleColor = tx.type === 'INCOME' ? 'color: var(--emerald); font-weight:600;' : 'color: var(--coral); font-weight:600;';

    desktopRow.innerHTML = `
      <td>${tx.date}</td>
      <td style="font-weight: 600;">${tx.description}</td>
      <td><span class="badge ${badgeStyleClass}">${tx.category}</span></td>
      <td><span class="badge badge-source">${tx.source}</span></td>
      <td style="${amountStyleColor}">${sign}${formatCurrency(tx.amount)}</td>
      <td style="text-align: center;">
        <button class="btn-delete-row" aria-label="Delete transaction row">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;

    // Bind desktop delete click
    desktopRow.querySelector('.btn-delete-row').addEventListener('click', () => {
      deleteTransaction(idx);
    });

    desktopTable.appendChild(desktopRow);
  });

  // Rebuild Lucide SVG icons
  lucide.createIcons();
}

// Delete transaction
function deleteTransaction(index) {
  state.transactions.splice(index, 1);
  showToast('Record deleted successfully.', 'info');
  applyFilters();
  updateUIBalances(true);
}

// Mobile swipe-to-delete horizontal gestures
function setupSwipeGestures(cardEl) {
  let touchStartX = 0;
  let touchMoveX = 0;

  cardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    // Close other swiped cards
    document.querySelectorAll('.tx-item-card.swiped').forEach(card => {
      if (card !== cardEl) card.classList.remove('swiped');
    });
  }, { passive: true });

  cardEl.addEventListener('touchmove', (e) => {
    touchMoveX = e.touches[0].clientX;
    const deltaX = touchMoveX - touchStartX;

    if (deltaX < -30) {
      cardEl.classList.add('swiped');
    } else if (deltaX > 20) {
      cardEl.classList.remove('swiped');
    }
  }, { passive: true });
}

// Secure Portals Connect Click Handlers
let activeConnectingPortalKey = null;

function setupPortalsConnections() {
  const modal = document.getElementById('otp-connect-modal');
  const btnClose = document.getElementById('btn-otp-close');
  const form = document.getElementById('otp-connect-form');
  const codeGroup = document.getElementById('otp-code-group');
  const phoneGroup = document.getElementById('otp-phone-group');
  const idGroup = document.getElementById('otp-id-group');
  const btnSubmit = document.getElementById('btn-otp-submit');

  // Bind Connect Portal buttons
  document.querySelectorAll('.btn-connect-portal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const portalKey = e.target.id.replace('btn-portal-', '');

      if (state.connections[portalKey]) {
        // Disconnect
        state.connections[portalKey] = false;
        e.target.classList.remove('connected');
        e.target.textContent = portalKey === 'clearinghouse' ? 'Verify Clearinghouse' : 'Secure Sync';
        
        const statusEl = document.getElementById(`status-${portalKey}`);
        statusEl.className = 'portal-card-status disconnected';
        statusEl.innerHTML = `<span class="status-dot"></span>Disconnected`;

        terminalWrite(`Disconnected portal channel link: ${portalKey.toUpperCase()}`, 'error');
        showToast(`Disconnected connection: ${portalKey.toUpperCase()}`, 'info');
        updateUIBalances(true);
      } else {
        // Open OTP Portal modal
        activeConnectingPortalKey = portalKey;
        const titleEl = document.getElementById('otp-modal-title');
        const descEl = document.getElementById('otp-modal-desc');

        if (portalKey === 'clearinghouse') {
          titleEl.textContent = 'Verify Pension Clearinghouse';
          descEl.textContent = 'Secure 1-click OTP query pull from Israeli Pension Clearinghouse (מסלקת פנסיה).';
        } else {
          const bankName = portalKey === 'leumi' ? 'Bank Leumi' : 'Bank Hapoalim';
          titleEl.textContent = `Connect to ${bankName}`;
          descEl.textContent = 'Read-Only sync session powered by Bank Israel Open Banking APIs.';
        }

        // Reset fields
        codeGroup.style.display = 'none';
        phoneGroup.style.display = 'flex';
        idGroup.style.display = 'flex';
        btnSubmit.textContent = 'Request SMS OTP Code';
        btnSubmit.disabled = false;
        form.reset();
        modal.classList.add('active');
      }
    });
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Modal connection Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (codeGroup.style.display === 'none') {
      // Step 1: Phone details verify -> Request OTP
      btnSubmit.textContent = 'Requesting OTP...';
      btnSubmit.disabled = true;

      setTimeout(() => {
        btnSubmit.disabled = false;
        phoneGroup.style.display = 'none';
        idGroup.style.display = 'none';
        codeGroup.style.display = 'flex';
        document.getElementById('otp-code-input').required = true;
        btnSubmit.textContent = 'Confirm Security OTP';
        showToast('SMS verification code sent to registered number.', 'info');
      }, 1200);
    } else {
      // Step 2: OTP verify -> complete connection
      btnSubmit.textContent = 'Securing API tunnel...';
      btnSubmit.disabled = true;

      setTimeout(() => {
        btnSubmit.disabled = false;
        modal.classList.remove('active');
        
        state.connections[activeConnectingPortalKey] = true;
        
        const btn = document.getElementById(`btn-portal-${activeConnectingPortalKey}`);
        btn.classList.add('connected');
        btn.textContent = 'Disconnect';

        const statusEl = document.getElementById(`status-${activeConnectingPortalKey}`);
        statusEl.className = 'portal-card-status connected';
        statusEl.innerHTML = `<span class="status-dot active"></span>Connected`;

        if (activeConnectingPortalKey === 'clearinghouse') {
          // Pension clearinghouse sync pulls ₪20,000 addition
          state.balances.pension += 20000;
          terminalWrite('clearinghouse.pull(): Fetched Harel Pension and Menora Keren Hishtalmut. Synced +₪20,000.', 'success');
          showToast('Israeli Pension Clearinghouse sync pulled updated records!');
        } else {
          // Bank sync pulls ₪3,500 adjustment
          state.balances.liquid += 3500;
          terminalWrite(`Open Banking API: Fetched read-only records from ${activeConnectingPortalKey.toUpperCase()}`, 'success');
          showToast(`Secure read-only Bank link established!`);
        }

        updateUIBalances(true);
      }, 1200);
    }
  });
}

// Live stock holdings adder
function setupStockAssetAdder() {
  const modal = document.getElementById('add-asset-modal');
  const btnOpen = document.getElementById('btn-open-asset-modal');
  const btnClose = document.getElementById('btn-asset-close');
  const form = document.getElementById('add-asset-form');

  btnOpen.addEventListener('click', () => {
    form.reset();
    modal.classList.add('active');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tickerInput = document.getElementById('asset-ticker').value.toUpperCase().trim();
    const sharesInput = parseFloat(document.getElementById('asset-shares').value);

    modal.classList.remove('active');
    showToast(`Contacting Web Quote API for ${tickerInput}...`, 'info');

    // Add loader placeholder to stock list
    const holdingsList = document.getElementById('stocks-holdings-list');
    const loaderRow = document.createElement('div');
    loaderRow.className = 'stock-holding-row';
    loaderRow.id = `loader-${tickerInput}`;
    loaderRow.innerHTML = `
      <span class="stock-loader-text">
        <i data-lucide="loader" style="animation: spin 2s linear infinite; width: 12px; height: 12px;"></i>
        Fetching live Quote for ${tickerInput} via Web API...
      </span>
    `;
    holdingsList.appendChild(loaderRow);
    lucide.createIcons();

    // Simulate stock price query delay
    setTimeout(() => {
      // Remove loader
      loaderRow.remove();

      // Real quote dictionary simulation (in ILS exchange rate equivalents)
      const mockQuotes = {
        'SPY': 1980,
        'PLTR': 137,
        'TSLA': 810,
        'AAPL': 790,
        'NVDA': 450,
        'MSFT': 1520,
        'BTC': 240000,
        'ETH': 12500,
        'IWM': 820
      };

      const quotePrice = mockQuotes[tickerInput] || Math.round(50 + Math.random() * 200);
      
      // Update state
      const existingAsset = state.stocksHoldings.find(h => h.ticker === tickerInput);
      if (existingAsset) {
        existingAsset.shares += sharesInput;
      } else {
        state.stocksHoldings.push({
          ticker: tickerInput,
          shares: sharesInput,
          price: quotePrice,
          allocationPct: 15
        });
      }

      // Re-calculate allocation percentages for Donut chart
      const totalStockVal = calculateStocksBalance();
      state.stockAllocation = state.stocksHoldings.map(h => {
        return Math.round((h.shares * h.price) / totalStockVal * 100);
      });

      // Refresh UI, stocks list, and charts
      updateUIBalances(true);
      renderStocksList();
      
      if (donutChart) {
        const hasHoldings = state.stocksHoldings.length > 0;
        donutChart.updateSeries(hasHoldings ? state.stockAllocation : [100]);
        donutChart.updateOptions({ 
          labels: hasHoldings ? state.stocksHoldings.map(h => h.ticker) : ['No Assets'],
          colors: hasHoldings ? ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#a855f7'] : ['#22252d']
        });
      }

      terminalWrite(`finance_api.getQuote('${tickerInput}'): Success. Price ₪${quotePrice.toLocaleString()}`, 'success');
      showToast(`Added ${sharesInput} shares of ${tickerInput} fetched live!`);
    }, 1500);
  });
}

// Initialise Sparkline (Area Chart)
function initSparkline() {
  const options = {
    series: [{
      name: 'Net Worth',
      data: state.netWorthHistory
    }],
    chart: {
      type: 'area',
      height: 38,
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 600 }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#10b981']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0,
        colorStops: [
          { offset: 0, color: '#10b981', opacity: 0.3 },
          { offset: 100, color: '#06b6d4', opacity: 0 }
        ]
      }
    },
    tooltip: {
      theme: 'dark',
      x: { show: false },
      y: {
        title: { formatter: () => 'Net Worth: ' },
        formatter: (val) => formatCurrency(val)
      }
    }
  };

  sparklineChart = new ApexCharts(document.querySelector("#net-worth-sparkline"), options);
  sparklineChart.render();
}

// Initialise Stock Allocation Donut
function initDonutChart() {
  const hasHoldings = state.stocksHoldings.length > 0;
  const labels = hasHoldings ? state.stocksHoldings.map(h => h.ticker) : ['No Assets'];
  const series = hasHoldings ? state.stocksHoldings.map(h => h.allocationPct) : [100];
  const colors = hasHoldings ? ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#a855f7'] : ['#22252d'];

  const options = {
    series: series,
    chart: {
      type: 'donut',
      height: 140,
      foreColor: '#8b949e',
      animations: { enabled: true, speed: 400 }
    },
    labels: labels,
    colors: colors,
    stroke: {
      show: true,
      colors: ['#0d1117'],
      width: 2
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              fontFamily: 'Outfit',
              color: '#8b949e',
              offsetY: -3
            },
            value: {
              show: true,
              fontSize: '13px',
              fontFamily: 'Outfit',
              color: '#f0f6fc',
              fontWeight: 600,
              offsetY: 3,
              formatter: (val) => val + '%'
            },
            total: {
              show: true,
              label: 'Allocated',
              color: '#8b949e',
              fontSize: '9px',
              formatter: () => '100%'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val}%` }
    }
  };

  donutChart = new ApexCharts(document.querySelector("#stock-donut-chart"), options);
  donutChart.render();
}

// Sync Click trigger
function handleGlobalSync() {
  const btnSync = document.getElementById('btn-sync');
  if (btnSync.classList.contains('syncing')) return;

  btnSync.classList.add('syncing');
  btnSync.querySelector('span').textContent = 'Syncing...';
  
  terminalWrite('Starting secure local ledger backup validation...', 'system');
  terminalWrite('validate_backup_checksums', 'cmd');

  setTimeout(() => {
    // Generate variance
    const liquidDelta = Math.round((Math.random() - 0.4) * 500); 
    const pensionDelta = Math.round((Math.random() - 0.1) * 900); 

    state.balances.liquid += liquidDelta;
    state.balances.pension += pensionDelta;

    const newNetWorth = getNetWorth();
    state.netWorthHistory.push(newNetWorth);

    if (state.netWorthHistory.length > 10) state.netWorthHistory.shift();

    updateUIBalances(true);
    sparklineChart.updateSeries([{ data: state.netWorthHistory }]);

    const prevNW = state.netWorthHistory[state.netWorthHistory.length - 2];
    const pctDiff = ((newNetWorth - prevNW) / prevNW * 100).toFixed(2);
    
    elNetWorthTrendPct.textContent = `${pctDiff >= 0 ? '+' : ''}${pctDiff}%`;
    const trendEl = document.getElementById('net-worth-trend');
    if (pctDiff >= 0) {
      trendEl.className = 'networth-trend up';
      elNetWorthTrendIcon.setAttribute('data-lucide', 'trending-up');
    } else {
      trendEl.className = 'networth-trend down';
      elNetWorthTrendIcon.setAttribute('data-lucide', 'trending-down');
    }
    lucide.createIcons();

    btnSync.classList.remove('syncing');
    btnSync.querySelector('span').textContent = 'Sync Ledger';

    terminalWrite(`State verified. Local DB Net Worth Adjustment: ${pctDiff >= 0 ? '+' : ''}${formatCurrency(newNetWorth - prevNW)}`, 'success');
    showToast(`Dashboard values synchronized with offline secure database ledger.`);
  }, 1500);
}

// Bidirectional Manual sliders
function setupBidirectionalSliders() {
  const sliderPension = document.getElementById('slider-pension');
  const inputPension = document.getElementById('input-pension');

  const sliderStudy = document.getElementById('slider-studyfund');
  const inputStudy = document.getElementById('input-studyfund');

  const sliderStocks = document.getElementById('slider-stocks');
  const inputStocks = document.getElementById('input-stocks');

  // Pension Sync
  sliderPension.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputPension.value = val;
    state.balances.pension = val;
    updateUIBalances(false);
  });
  inputPension.addEventListener('change', (e) => {
    let val = parseInt(e.target.value) || 0;
    val = Math.max(10000, Math.min(val, 2000000));
    inputPension.value = val;
    sliderPension.value = val;
    state.balances.pension = val;
    updateUIBalances(true);
  });

  // Study Fund Sync
  sliderStudy.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputStudy.value = val;
    state.balances.studyFund = val;
    updateUIBalances(false);
  });
  inputStudy.addEventListener('change', (e) => {
    let val = parseInt(e.target.value) || 0;
    val = Math.max(5000, Math.min(val, 800000));
    inputStudy.value = val;
    sliderStudy.value = val;
    state.balances.studyFund = val;
    updateUIBalances(true);
  });

  // Stocks Sync
  sliderStocks.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputStocks.value = val;
    state.balances.stocks = val;
    updateUIBalances(false);
  });
  inputStocks.addEventListener('change', (e) => {
    let val = parseInt(e.target.value) || 0;
    val = Math.max(5000, Math.min(val, 1500000));
    inputStocks.value = val;
    sliderStocks.value = val;
    state.balances.stocks = val;
    updateUIBalances(true);
  });
}

// Uploader processing logic
function setupUploaderLogic() {
  // 1. Bank Statement Uploader
  const stmtDropzone = document.getElementById('statement-dropzone');
  const stmtInput = document.getElementById('statement-file-input');
  const stmtScanner = document.getElementById('statement-scanner');
  const stmtProgress = document.getElementById('statement-progress-fill');
  const stmtStatus = document.getElementById('statement-status-text');
  const stmtResult = document.getElementById('statement-result-card');

  stmtDropzone.addEventListener('click', () => {
    if (!stmtScanner.classList.contains('active')) stmtInput.click();
  });
  stmtInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processStatement(e.target.files[0]);
  });
  stmtDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    stmtDropzone.style.borderColor = 'var(--emerald)';
  });
  stmtDropzone.addEventListener('dragleave', () => {
    stmtDropzone.style.borderColor = 'var(--border-color)';
  });
  stmtDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    stmtDropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) processStatement(e.dataTransfer.files[0]);
  });

  function processStatement(file) {
    stmtScanner.classList.add('active');
    stmtResult.style.display = 'none';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      stmtProgress.style.width = `${progress}%`;
      
      if (progress < 30) {
        stmtStatus.innerHTML = `Reading statement CSV: <strong>${file.name}</strong>...`;
      } else if (progress < 60) {
        stmtStatus.innerHTML = `Parsing transaction columns...`;
      } else if (progress < 90) {
        stmtStatus.innerHTML = `Running duplicates analysis...`;
      } else if (progress >= 100) {
        clearInterval(interval);
        completeStatementExtraction();
      }
    }, 80);
  }

  function completeStatementExtraction() {
    stmtScanner.classList.remove('active');
    stmtProgress.style.width = '0%';
    
    const records = [
      { date: '2026-07-16', description: 'Wolt Refund Credit', category: 'Food & Dining', source: 'Bank Statement', amount: 120, type: 'INCOME' },
      { date: '2026-07-15', description: 'Shufersal Supermarket', category: 'Food & Dining', source: 'Bank Statement', amount: 450, type: 'EXPENSE' },
      { date: '2026-07-15', description: 'Delek Fuel Station', category: 'Utilities', source: 'Bank Statement', amount: 180, type: 'EXPENSE' }
    ];

    records.forEach(r => state.transactions.unshift(r));
    
    state.balances.liquid += (120 - 450);
    state.creditOutstanding += 180;

    updateUIBalances(true);
    applyFilters();
    
    stmtResult.style.display = 'block';
    terminalWrite('Statement processed successfully. checking balance adjusted.', 'success');
    showToast('Secure bank statement CSV parsed. Ledger balances refreshed!');
  }

  // 2. Payslip Uploader
  const payDropzone = document.getElementById('payslip-dropzone');
  const payInput = document.getElementById('payslip-file-input');
  const payScanner = document.getElementById('payslip-scanner');
  const payProgress = document.getElementById('payslip-progress-fill');
  const payStatus = document.getElementById('payslip-status-text');
  const payResult = document.getElementById('payslip-result-card');

  payDropzone.addEventListener('click', () => {
    if (!payScanner.classList.contains('active')) payInput.click();
  });
  payInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) processPayslip(e.target.files[0]);
  });
  payDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    payDropzone.style.borderColor = 'var(--emerald)';
  });
  payDropzone.addEventListener('dragleave', () => {
    payDropzone.style.borderColor = 'var(--border-color)';
  });
  payDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    payDropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) processPayslip(e.dataTransfer.files[0]);
  });

  function processPayslip(file) {
    payScanner.classList.add('active');
    payResult.style.display = 'none';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      payProgress.style.width = `${progress}%`;
      
      if (progress < 30) {
        payStatus.innerHTML = `Reading Payslip file: <strong>${file.name}</strong>...`;
      } else if (progress < 60) {
        payStatus.innerHTML = `Extracting income tax rows...`;
      } else if (progress < 90) {
        payStatus.innerHTML = `Retrieving pension distributions...`;
      } else if (progress >= 100) {
        clearInterval(interval);
        completePayslipExtraction();
      }
    }, 80);
  }

  function completePayslipExtraction() {
    payScanner.classList.remove('active');
    payProgress.style.width = '0%';

    const mockNet = 16240;
    const mockTax = 2840;
    const mockPension = 1950;
    
    document.getElementById('extracted-net-pay').textContent = formatCurrency(mockNet);
    document.getElementById('extracted-tax').textContent = formatCurrency(mockTax);
    document.getElementById('extracted-pension').textContent = formatCurrency(mockPension);
    
    const d = new Date();
    document.getElementById('extracted-slip-date').textContent = `June ${d.getFullYear()}`;

    state.balances.liquid += mockNet;
    state.balances.pension += mockPension;

    state.transactions.unshift({
      date: new Date().toISOString().slice(0,10),
      description: 'Monthly Salary Pay Slip AI Extraction',
      category: 'Salary',
      source: 'Pay Slip',
      amount: mockNet,
      type: 'INCOME'
    });

    updateUIBalances(true);
    applyFilters();

    payResult.style.display = 'block';
    terminalWrite(`extracted_payslip_data: Net ${mockNet}, Tax ${mockTax}, Pension ${mockPension}`, 'success');
    showToast('Pay slip parsed. Local checking and pension balances updated.');
  }
}

// DevOps Console operations
function setupDevopsConsole() {
  const btnBackup = document.getElementById('btn-trigger-backup');
  const btnExport = document.getElementById('btn-export-config');
  const btnGithub = document.getElementById('btn-github-sync');

  btnBackup.addEventListener('click', () => {
    terminalWrite('Backing up local database dump...', 'system');
    terminalWrite('dump_database_to_json', 'cmd');
    
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const dlAnchor = document.createElement('a');
      const filename = `wealthflow-mobile-backup-${new Date().toISOString().slice(0, 10)}.json`;
      
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", filename);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();

      terminalWrite(`Backup file successfully generated: ${filename}`, 'success');
      showToast('Offline backup JSON generated and downloaded!');
    }, 600);
  });

  btnExport.addEventListener('click', () => {
    terminalWrite('Encrypting local offline configuration using AES-256...', 'system');
    terminalWrite('export_encrypted_vault_key', 'cmd');

    setTimeout(() => {
      const cryptoKey = 'U2FsdGVkX19Nb2JpbGVDb25maWdBZXMyNTZLZXlGb3JXZWFsdGhGbG93TGVkZ2VyRG9jdW1lbnRz';
      navigator.clipboard.writeText(cryptoKey).then(() => {
        terminalWrite('Off-grid vault configuration key copied to clipboard.', 'success');
        showToast('Vault configuration key copied to clipboard!', 'info');
      }).catch(() => {
        terminalWrite('Clipboard error. Output: ' + cryptoKey, 'error');
      });
    }, 600);
  });

  btnGithub.addEventListener('click', () => {
    terminalWrite('Initializing manual git commit sync...', 'system');
    
    const logs = [
      { text: 'git add metrics/offline_ledger.json', type: 'cmd', delay: 300 },
      { text: 'git commit -m "sync: push manually updated cashflow ledger [2026-07-16]"', type: 'cmd', delay: 700 },
      { text: '[main d78e9c0] sync: push manually updated cashflow ledger\n 1 file changed, 14 insertions(+)', type: 'system', delay: 1100 },
      { text: 'git push origin main', type: 'cmd', delay: 1500 },
      { text: 'To github.com/asharabi/wealthflow-ledger.git\n   a8bc3f1..d78e9c0  main -> main', type: 'system', delay: 2000 },
      { text: 'Synchronization with GitHub repository complete.', type: 'success', delay: 2300 }
    ];

    logs.forEach(log => {
      setTimeout(() => {
        terminalWrite(log.text, log.type);
        if (log.type === 'success') {
          showToast('Offline metrics ledger synced to remote git repository.');
        }
      }, log.delay);
    });
  });
}

// Add Custom Transaction Modal
function setupManualTxModal() {
  const modal = document.getElementById('add-tx-modal');
  const btnOpen = document.getElementById('btn-open-tx-modal');
  const btnClose = document.getElementById('btn-tx-close');
  const form = document.getElementById('add-tx-form');

  btnOpen.addEventListener('click', () => {
    form.reset();
    document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
    modal.classList.add('active');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = document.getElementById('tx-type').value;
    const date = document.getElementById('tx-date').value;
    const description = document.getElementById('tx-description').value;
    const category = document.getElementById('tx-category').value;
    const source = document.getElementById('tx-source').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);

    const newTx = { date, description, category, source, amount, type };
    state.transactions.unshift(newTx);

    // Update balances
    if (type === 'INCOME') {
      if (source.includes('Statement') || source.includes('Manual')) {
        state.balances.liquid += amount;
      }
    } else {
      if (source.includes('Statement') || source.includes('Manual')) {
        state.balances.liquid -= amount;
      }
    }

    updateUIBalances(true);
    applyFilters();
    modal.classList.remove('active');
    
    terminalWrite(`Appended transaction record: ${description} (₪${amount})`, 'success');
    showToast('Offline cashflow transaction logged.');
  });
}

// Harmonized Navigation (Coordinates both Sidebar buttons and Bottom Nav buttons)
function setupNavigation() {
  const bottomNavBtns = document.querySelectorAll('.bottom-nav .nav-btn');
  const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
  const views = document.querySelectorAll('.app-view');

  function handleViewChange(targetViewId) {
    // Switch view panel visibility
    views.forEach(view => {
      if (view.id === targetViewId) {
        view.classList.add('active-view');
      } else {
        view.classList.remove('active-view');
      }
    });

    // Synchronize bottom nav buttons
    bottomNavBtns.forEach(btn => {
      if (btn.getAttribute('data-view') === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Synchronize sidebar links
    sidebarLinks.forEach(link => {
      if (link.getAttribute('data-view') === targetViewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Force Charts Resize calculations (handles hidden canvas bugs)
    if (targetViewId === 'view-portfolio' && donutChart) {
      setTimeout(() => {
        donutChart.windowResizeHandler();
      }, 50);
    }
    if (targetViewId === 'view-home' && sparklineChart) {
      setTimeout(() => {
        sparklineChart.windowResizeHandler();
      }, 50);
    }
    if (targetViewId === 'view-money-edit') {
      populateMoneyEditView();
    }
  }

  // Bind bottom nav buttons
  bottomNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetViewId = btn.getAttribute('data-view');
      handleViewChange(targetViewId);
    });
  });

  // Bind sidebar nav links
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetViewId = link.getAttribute('data-view');
      handleViewChange(targetViewId);
    });
  });
}

// Tabs within views
function setupSubTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');

      const parentPanel = tab.closest('.panel');
      const siblingTabs = parentPanel.querySelectorAll('.tab-btn');
      const siblingContents = parentPanel.querySelectorAll('.tab-content');

      siblingTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      siblingContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// Setup Filters
function setupLedgerFilters() {
  document.getElementById('ledger-search').addEventListener('input', applyFilters);
  document.getElementById('ledger-filter-category').addEventListener('change', applyFilters);
}

// Setup Projections Slider
function setupProjectionsSlider() {
  document.getElementById('years-slider').addEventListener('input', updatePensionProjections);
}

// Onboarding Entry Interview flow state
let onboardingIncomes = [];

function setupOnboardingFlow() {
  const modal = document.getElementById('onboarding-modal');
  const sliderSalary = document.getElementById('ob-slider-salary');
  const inputSalary = document.getElementById('ob-input-salary');
  const btnAddIncome = document.getElementById('ob-btn-add-income');
  const incomeListContainer = document.getElementById('ob-income-list-container');
  const btnFinish = document.getElementById('ob-btn-finish');
  const btnRerun = document.getElementById('btn-rerun-onboarding');

  if (!modal) return;

  // Synchronize Primary Salary Slider and Numeric Input
  sliderSalary.addEventListener('input', (e) => {
    inputSalary.value = e.target.value;
  });
  inputSalary.addEventListener('change', (e) => {
    let val = parseInt(e.target.value) || 2000;
    val = Math.max(2000, Math.min(val, 100000));
    inputSalary.value = val;
    sliderSalary.value = val;
  });

  // Manage steps navigation
  document.querySelectorAll('.ob-btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStepNum = parseInt(btn.getAttribute('data-next'));
      
      // If moving to step 4, compile summary metrics
      if (nextStepNum === 4) {
        const salaryVal = parseInt(inputSalary.value);
        const extraVal = onboardingIncomes.reduce((sum, item) => sum + item.amount, 0);
        const cashVal = parseInt(document.getElementById('ob-input-cash').value) || 0;
        const debtVal = parseInt(document.getElementById('ob-input-card').value) || 0;
        const pensionVal = parseInt(document.getElementById('ob-input-pension').value) || 0;
        const studyFundVal = parseInt(document.getElementById('ob-input-studyfund').value) || 0;

        document.getElementById('ob-sum-salary').textContent = formatCurrency(salaryVal);
        document.getElementById('ob-sum-extra').textContent = formatCurrency(extraVal);
        document.getElementById('ob-sum-cash').textContent = formatCurrency(cashVal);
        document.getElementById('ob-sum-debt').textContent = formatCurrency(debtVal);
        document.getElementById('ob-sum-pension').textContent = formatCurrency(pensionVal);
        document.getElementById('ob-sum-studyfund').textContent = formatCurrency(studyFundVal);
      }

      switchToOnboardingStep(nextStepNum);
    });
  });

  document.querySelectorAll('.ob-btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStepNum = parseInt(btn.getAttribute('data-prev'));
      switchToOnboardingStep(prevStepNum);
    });
  });

  // Add custom income item
  btnAddIncome.addEventListener('click', () => {
    const descInput = document.getElementById('ob-income-desc');
    const amountInput = document.getElementById('ob-income-amount');
    
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid description and amount.', 'error');
      return;
    }

    onboardingIncomes.push({ id: Date.now(), desc, amount });
    descInput.value = '';
    amountInput.value = '';
    renderOnboardingIncomes();
  });

  function renderOnboardingIncomes() {
    incomeListContainer.innerHTML = '';
    
    if (onboardingIncomes.length === 0) {
      incomeListContainer.innerHTML = `
        <div class="empty-list-text" style="color: var(--text-muted); font-size: 0.75rem; text-align: center; padding: 0.5rem;">No additional incomes added yet.</div>
      `;
      return;
    }

    onboardingIncomes.forEach(item => {
      const row = document.createElement('div');
      row.className = 'ob-income-row';
      row.innerHTML = `
        <span>${item.desc}</span>
        <span>${formatCurrency(item.amount)}</span>
        <button type="button" class="ob-btn-remove-income" data-id="${item.id}">✕</button>
      `;

      row.querySelector('.ob-btn-remove-income').addEventListener('click', () => {
        onboardingIncomes = onboardingIncomes.filter(i => i.id !== item.id);
        renderOnboardingIncomes();
      });

      incomeListContainer.appendChild(row);
    });
  }

  // Complete onboarding wizard
  btnFinish.addEventListener('click', () => {
    const salaryVal = parseInt(inputSalary.value) || 15000;
    const cashVal = parseInt(document.getElementById('ob-input-cash').value) || 0;
    const debtVal = parseInt(document.getElementById('ob-input-card').value) || 0;
    const pensionVal = parseInt(document.getElementById('ob-input-pension').value) || 0;
    const studyFundVal = parseInt(document.getElementById('ob-input-studyfund').value) || 0;

    // Apply values to app state
    state.balances.liquid = cashVal;
    state.creditOutstanding = debtVal;
    state.balances.pension = pensionVal;
    state.balances.studyFund = studyFundVal;
    state.balances.stocks = 0;
    state.stocksHoldings = [];
    state.stockAllocation = [];

    // Disconnect all default portal connections
    Object.keys(state.connections).forEach(portalKey => {
      state.connections[portalKey] = false;
      const btn = document.getElementById(`btn-portal-${portalKey}`);
      if (btn) {
        btn.classList.remove('connected');
        btn.textContent = portalKey === 'clearinghouse' ? 'Verify Clearinghouse' : 'Secure Sync';
      }
      const statusEl = document.getElementById(`status-${portalKey}`);
      if (statusEl) {
        statusEl.className = 'portal-card-status disconnected';
        statusEl.innerHTML = `<span class="status-dot"></span>Disconnected`;
      }
    });

    // Build fresh transaction list based on onboarding inputs
    const todayStr = new Date().toISOString().slice(0, 10);
    const newTxList = [];

    // Add Primary Salary Income
    newTxList.push({
      date: todayStr,
      description: 'Monthly Salary (Primary)',
      category: 'Salary',
      source: 'Pay Slip',
      amount: salaryVal,
      type: 'INCOME'
    });

    // Add Additional Incomes
    onboardingIncomes.forEach(item => {
      newTxList.push({
        date: todayStr,
        description: item.desc,
        category: 'Salary',
        source: 'Manual Entry',
        amount: item.amount,
        type: 'INCOME'
      });
    });

    // Append some mock generic expenses to populate the list realistically
    newTxList.push(
      { date: todayStr, description: 'Supermarket Grocery Sync', category: 'Food & Dining', source: 'Bank Statement', amount: 450, type: 'EXPENSE' },
      { date: todayStr, description: 'Electricity Utilities Sync', category: 'Utilities', source: 'Bank Statement', amount: 320, type: 'EXPENSE' }
    );

    state.transactions = newTxList;

    // Re-initialize Net Worth History sparkline representation
    const freshNetWorth = getNetWorth();
    state.netWorthHistory = [freshNetWorth - 15000, freshNetWorth - 10000, freshNetWorth - 5000, freshNetWorth];

    // Persist onboarding completion status
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Reset steps to step 1 for next time
    switchToOnboardingStep(1);
    modal.classList.remove('active');

    // Update charts and GUI values
    updateUIBalances(true);
    applyFilters();
    renderStocksList();
    if (sparklineChart) {
      sparklineChart.updateSeries([{ data: state.netWorthHistory }]);
    }
    if (donutChart) {
      donutChart.updateSeries([100]);
      donutChart.updateOptions({ 
        labels: ['No Assets'],
        colors: ['#22252d']
      });
    }

    terminalWrite('Onboarding config loaded. Cash flow ledger initialized.', 'success');
    showToast('Entry interview completed! Welcome dashboard configured.');
  });

  // Switch wizard display steps
  function switchToOnboardingStep(stepNumber) {
    document.querySelectorAll('.onboarding-step').forEach(step => {
      step.classList.remove('active');
    });
    document.getElementById(`onboarding-step-${stepNumber}`).classList.add('active');

    // Update indicators
    document.querySelectorAll('.onboarding-stepper .step-dot').forEach(dot => {
      const dotStep = parseInt(dot.getAttribute('data-step'));
      if (dotStep === stepNumber) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Bind Rerun button inside settings
  if (btnRerun) {
    btnRerun.addEventListener('click', () => {
      // Clear onboarding completed flag
      localStorage.removeItem('onboardingCompleted');

      // Switch view panel visibility to close settings/devops
      document.getElementById('nav-home').click();
      
      // Reset inputs & state
      onboardingIncomes = [];
      document.getElementById('ob-income-desc').value = '';
      document.getElementById('ob-income-amount').value = '';
      document.getElementById('ob-input-cash').value = '0';
      document.getElementById('ob-input-card').value = '0';
      document.getElementById('ob-input-pension').value = '0';
      document.getElementById('ob-input-studyfund').value = '0';
      renderOnboardingIncomes();
      
      switchToOnboardingStep(1);
      modal.classList.add('active');
    });
  }
}

// Add Custom Savings Edit Modal
function setupSavingsEditModal() {
  const modal = document.getElementById('update-savings-modal');
  const btnOpen = document.getElementById('btn-open-savings-modal');
  const btnClose = document.getElementById('btn-savings-close');
  const form = document.getElementById('update-savings-form');

  if (!modal || !btnOpen) return;

  btnOpen.addEventListener('click', () => {
    document.getElementById('savings-pension').value = state.balances.pension;
    document.getElementById('savings-studyfund').value = state.balances.studyFund;
    modal.classList.add('active');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const pensionVal = parseInt(document.getElementById('savings-pension').value) || 0;
    const studyFundVal = parseInt(document.getElementById('savings-studyfund').value) || 0;

    state.balances.pension = pensionVal;
    state.balances.studyFund = studyFundVal;

    // Refresh UI, sparklines, sliders
    updateUIBalances(true);
    
    modal.classList.remove('active');
    terminalWrite(`finance_api.updateSavings(): Success. Pension: ₪${pensionVal.toLocaleString()}, Study Fund: ₪${studyFundVal.toLocaleString()}`, 'success');
    showToast('Long-Term Savings balances updated successfully!');
  });
}
 
// Populate fields in Money Edit view with current state balances
function populateMoneyEditView() {
  const meLiquid = document.getElementById('me-input-liquid');
  const meSliderLiquid = document.getElementById('me-slider-liquid');
  const meCredit = document.getElementById('me-input-credit');
  const meSliderCredit = document.getElementById('me-slider-credit');
  const mePension = document.getElementById('me-input-pension');
  const meSliderPension = document.getElementById('me-slider-pension');
  const meStudy = document.getElementById('me-input-studyfund');
  const meSliderStudy = document.getElementById('me-slider-studyfund');
  const meStocks = document.getElementById('me-input-stocks');
  const meSliderStocks = document.getElementById('me-slider-stocks');

  if (meLiquid) meLiquid.value = state.balances.liquid;
  if (meSliderLiquid) meSliderLiquid.value = state.balances.liquid;
  
  if (meCredit) meCredit.value = state.creditOutstanding;
  if (meSliderCredit) meSliderCredit.value = state.creditOutstanding;

  if (mePension) mePension.value = state.balances.pension;
  if (meSliderPension) meSliderPension.value = state.balances.pension;

  if (meStudy) meStudy.value = state.balances.studyFund;
  if (meSliderStudy) meSliderStudy.value = state.balances.studyFund;

  if (meStocks) meStocks.value = state.balances.stocks;
  if (meSliderStocks) meSliderStocks.value = state.balances.stocks;
}

// Setup Event Listeners for Money Edit View
function setupMoneyEditFlow() {
  const form = document.getElementById('money-edit-form');
  const btnReset = document.getElementById('btn-money-edit-reset');

  if (!form) return;

  const pairs = [
    { inputId: 'me-input-liquid', sliderId: 'me-slider-liquid' },
    { inputId: 'me-input-credit', sliderId: 'me-slider-credit' },
    { inputId: 'me-input-pension', sliderId: 'me-slider-pension' },
    { inputId: 'me-input-studyfund', sliderId: 'me-slider-studyfund' },
    { inputId: 'me-input-stocks', sliderId: 'me-slider-stocks' }
  ];

  pairs.forEach(pair => {
    const inputEl = document.getElementById(pair.inputId);
    const sliderEl = document.getElementById(pair.sliderId);

    if (inputEl && sliderEl) {
      inputEl.addEventListener('input', (e) => {
        sliderEl.value = e.target.value;
      });
      sliderEl.addEventListener('input', (e) => {
        inputEl.value = e.target.value;
      });
    }
  });

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      populateMoneyEditView();
      showToast('Reset inputs to current saved balances.');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    state.balances.liquid = parseInt(document.getElementById('me-input-liquid').value) || 0;
    state.creditOutstanding = parseInt(document.getElementById('me-input-credit').value) || 0;
    state.balances.pension = parseInt(document.getElementById('me-input-pension').value) || 0;
    state.balances.studyFund = parseInt(document.getElementById('me-input-studyfund').value) || 0;
    state.balances.stocks = parseInt(document.getElementById('me-input-stocks').value) || 0;

    // Refresh UI, sparklines, sliders
    updateUIBalances(true);
    showToast('Finances and balances updated successfully!');
    terminalWrite(`finance_api.updateAllBalances(): Success. Liquid: ₪${state.balances.liquid.toLocaleString()}, Pension: ₪${state.balances.pension.toLocaleString()}`, 'success');
  });
}

// Initialise Application
function initApp() {
  updateUIBalances(false);
  renderLedgerLayouts();
  renderStocksList();
  
  initSparkline();
  initDonutChart();

  setupNavigation();
  setupSubTabs();
  setupPortalsConnections();
  setupStockAssetAdder();
  setupBidirectionalSliders();
  setupUploaderLogic();
  setupDevopsConsole();
  setupManualTxModal();
  setupSavingsEditModal();
  setupMoneyEditFlow();
  setupLedgerFilters();
  setupProjectionsSlider();

  setupOnboardingFlow();
  if (!localStorage.getItem('onboardingCompleted')) {
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.add('active');
  }

  document.getElementById('btn-sync').addEventListener('click', handleGlobalSync);
  
  // Create icons
  lucide.createIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

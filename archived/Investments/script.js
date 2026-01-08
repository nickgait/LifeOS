/**
 * LifeOS Investment Portfolio Tracker
 * Track investments, dividends, and research stocks/ETFs
 */

class InvestmentApp {
  constructor() {
    this.portfolio = StorageManager.get('investments-portfolio') || [];
    this.dividends = StorageManager.get('investments-dividends') || [];
    this.research = StorageManager.get('investments-research') || [];
    this.interest = StorageManager.get('investments-interest') || [];
    this.cash = StorageManager.get('investments-cash') || { balance: 0, notes: '', lastUpdated: null };
    this.selectedTab = 'holdings';

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDefaultDates();
    this.updateDashboard();

    // Listen for data changes
    StorageManager.onChange('investments-*', () => {
      this.refresh();
    });
  }

  setupEventListeners() {
    const holdingForm = document.getElementById('holding-form');
    const dividendForm = document.getElementById('dividend-form');
    const researchForm = document.getElementById('research-form');
    const cashForm = document.getElementById('cash-form');
    const interestForm = document.getElementById('interest-form');
    const lookupBtn = document.getElementById('lookup-btn');
    const researchLookupBtn = document.getElementById('research-lookup-btn');
    const dividendLookupBtn = document.getElementById('dividend-lookup-btn');

    if (holdingForm) {
      holdingForm.addEventListener('submit', (e) => this.handleHoldingSubmit(e));
    }
    if (dividendForm) {
      dividendForm.addEventListener('submit', (e) => this.handleDividendSubmit(e));
    }
    if (researchForm) {
      researchForm.addEventListener('submit', (e) => this.handleResearchSubmit(e));
    }
    if (cashForm) {
      cashForm.addEventListener('submit', (e) => this.handleCashSubmit(e));
    }
    if (interestForm) {
      interestForm.addEventListener('submit', (e) => this.handleInterestSubmit(e));
    }
    if (lookupBtn) {
      lookupBtn.addEventListener('click', () => this.lookupStock());
    }
    if (researchLookupBtn) {
      researchLookupBtn.addEventListener('click', () => this.lookupResearchStock());
    }
    if (dividendLookupBtn) {
      dividendLookupBtn.addEventListener('click', () => this.lookupDividendStock());
    }

    // Tab switching in Research section
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedTab = e.target.dataset.tab;
        this.renderResearch();
      });
    });
  }

  setupDefaultDates() {
    const purchaseDate = document.getElementById('purchase-date');
    const dividendDate = document.getElementById('dividend-date');
    const interestDate = document.getElementById('interest-date');

    if (purchaseDate) {
      purchaseDate.value = new Date().toISOString().split('T')[0];
    }
    if (dividendDate) {
      dividendDate.value = new Date().toISOString().split('T')[0];
    }
    if (interestDate) {
      interestDate.value = new Date().toISOString().split('T')[0];
    }

    // Load current cash balance
    const cashAmount = document.getElementById('cash-amount');
    if (cashAmount && this.cash.balance) {
      cashAmount.value = this.cash.balance;
    }
  }

  async lookupStock() {
    const symbolInput = document.getElementById('holding-symbol');
    const nameInput = document.getElementById('holding-name');
    const currentPriceInput = document.getElementById('current-price');
    const statusDiv = document.getElementById('lookup-status');
    const lookupBtn = document.getElementById('lookup-btn');

    const symbol = symbolInput.value.trim().toUpperCase();

    if (!symbol) {
      statusDiv.textContent = 'Please enter a stock symbol';
      statusDiv.style.color = '#ef4444';
      return;
    }

    // Disable button and show loading
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'Loading...';
    statusDiv.textContent = 'Fetching stock data...';
    statusDiv.style.color = '#667eea';

    try {
      // Use Finnhub API (free tier, good for testing)
      const apiKey = 'd379vepr01qskrefa3u0d379vepr01qskrefa3ug'; // Free public demo key
      const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);

      if (!quoteResponse.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const quoteData = await quoteResponse.json();

      // Check if we got valid data
      if (quoteData.c && quoteData.c > 0) {
        const currentPrice = quoteData.c;
        currentPriceInput.value = currentPrice.toFixed(2);

        // Try to get company profile for the name
        try {
          const profileResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`);
          const profileData = await profileResponse.json();

          if (profileData.name) {
            nameInput.value = profileData.name;
            statusDiv.textContent = `✓ Found: ${profileData.name} - $${currentPrice.toFixed(2)}`;
          } else {
            nameInput.value = symbol;
            statusDiv.textContent = `✓ Found price: $${currentPrice.toFixed(2)} (enter company name manually)`;
          }
        } catch (profileError) {
          nameInput.value = symbol;
          statusDiv.textContent = `✓ Found price: $${currentPrice.toFixed(2)} (enter company name manually)`;
        }

        statusDiv.style.color = '#10b981';
      } else {
        throw new Error('Stock not found or market is closed');
      }
    } catch (error) {
      console.error('Stock lookup error:', error);
      statusDiv.textContent = `✕ Unable to fetch data. Please enter manually.`;
      statusDiv.style.color = '#ef4444';
    } finally {
      // Re-enable button
      lookupBtn.disabled = false;
      lookupBtn.textContent = 'Lookup';
    }
  }

  async lookupResearchStock() {
    const symbolInput = document.getElementById('research-symbol');
    const nameInput = document.getElementById('research-name');
    const statusDiv = document.getElementById('research-lookup-status');
    const lookupBtn = document.getElementById('research-lookup-btn');

    const symbol = symbolInput.value.trim().toUpperCase();

    if (!symbol) {
      statusDiv.textContent = 'Please enter a stock symbol';
      statusDiv.style.color = '#ef4444';
      return;
    }

    // Disable button and show loading
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'Loading...';
    statusDiv.textContent = 'Fetching stock data...';
    statusDiv.style.color = '#667eea';

    try {
      // Use Finnhub API (free tier, good for testing)
      const apiKey = 'ctckit9r01qjc7r3u7ngctckit9r01qjc7r3u7o0'; // Free public demo key
      const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);

      if (!quoteResponse.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const quoteData = await quoteResponse.json();

      // Check if we got valid data
      if (quoteData.c && quoteData.c > 0) {
        const currentPrice = quoteData.c;

        // Try to get company profile for the name
        try {
          const profileResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`);
          const profileData = await profileResponse.json();

          if (profileData.name) {
            nameInput.value = profileData.name;
            statusDiv.textContent = `✓ Found: ${profileData.name} - $${currentPrice.toFixed(2)}`;
          } else {
            nameInput.value = symbol;
            statusDiv.textContent = `✓ Found price: $${currentPrice.toFixed(2)} (enter company name manually)`;
          }
        } catch (profileError) {
          nameInput.value = symbol;
          statusDiv.textContent = `✓ Found price: $${currentPrice.toFixed(2)} (enter company name manually)`;
        }

        statusDiv.style.color = '#10b981';
      } else {
        throw new Error('Stock not found or market is closed');
      }
    } catch (error) {
      console.error('Stock lookup error:', error);
      statusDiv.textContent = `✕ Unable to fetch data. Please enter manually.`;
      statusDiv.style.color = '#ef4444';
    } finally {
      // Re-enable button
      lookupBtn.disabled = false;
      lookupBtn.textContent = 'Lookup';
    }
  }

  async lookupDividendStock() {
    const symbolInput = document.getElementById('dividend-symbol');
    const statusDiv = document.getElementById('dividend-lookup-status');
    const lookupBtn = document.getElementById('dividend-lookup-btn');

    const symbol = symbolInput.value.trim().toUpperCase();

    if (!symbol) {
      statusDiv.textContent = 'Please enter a stock symbol';
      statusDiv.style.color = '#ef4444';
      return;
    }

    // Disable button and show loading
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'Loading...';
    statusDiv.textContent = 'Verifying stock symbol...';
    statusDiv.style.color = '#667eea';

    try {
      // Use Finnhub API to verify symbol
      const apiKey = 'd379vepr01qskrefa3u0d379vepr01qskrefa3ug'; // Free public demo key
      const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);

      if (!quoteResponse.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const quoteData = await quoteResponse.json();

      // Check if we got valid data
      if (quoteData.c && quoteData.c > 0) {
        const currentPrice = quoteData.c;

        // Try to get company profile for the name
        try {
          const profileResponse = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`);
          const profileData = await profileResponse.json();

          if (profileData.name) {
            statusDiv.textContent = `✓ Found: ${profileData.name} (Current: $${currentPrice.toFixed(2)})`;
          } else {
            statusDiv.textContent = `✓ Symbol verified (Current price: $${currentPrice.toFixed(2)})`;
          }
        } catch (profileError) {
          statusDiv.textContent = `✓ Symbol verified (Current price: $${currentPrice.toFixed(2)})`;
        }

        statusDiv.style.color = '#10b981';
      } else {
        throw new Error('Stock not found or market is closed');
      }
    } catch (error) {
      console.error('Stock lookup error:', error);
      statusDiv.textContent = `✕ Unable to verify symbol. Please check and continue manually.`;
      statusDiv.style.color = '#ef4444';
    } finally {
      // Re-enable button
      lookupBtn.disabled = false;
      lookupBtn.textContent = 'Lookup';
    }
  }

  handleHoldingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.dataset.editingId;

    const holdingData = {
      symbol: document.getElementById('holding-symbol').value.toUpperCase(),
      name: document.getElementById('holding-name').value,
      type: document.getElementById('holding-type').value,
      lotType: document.getElementById('lot-type').value,
      quantity: parseFloat(document.getElementById('holding-quantity').value),
      purchasePrice: parseFloat(document.getElementById('purchase-price').value),
      purchaseDate: document.getElementById('purchase-date').value,
      currentPrice: parseFloat(document.getElementById('current-price').value),
      soldShares: parseFloat(document.getElementById('sold-shares').value) || 0,
      soldPrice: parseFloat(document.getElementById('sold-price').value) || 0,
      notes: document.getElementById('holding-notes').value
    };

    if (editingId) {
      // Update existing holding
      const index = this.portfolio.findIndex(h => h.id === parseInt(editingId));
      if (index !== -1) {
        this.portfolio[index] = {
          ...this.portfolio[index],
          ...holdingData
        };
        alert('Lot updated successfully!');
      }
      delete form.dataset.editingId;

      // Reset button
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Add Holding';
      submitBtn.style.background = '';
    } else {
      // Add new holding/lot
      const holding = {
        id: Date.now(),
        ...holdingData,
        addedDate: new Date().toISOString().split('T')[0]
      };
      this.portfolio.push(holding);
      alert(`${holdingData.lotType} lot added successfully!`);
    }

    StorageManager.set('investments-portfolio', this.portfolio);

    e.target.reset();
    this.setupDefaultDates();
    this.renderPortfolio();
    this.updateDashboard();
  }

  handleDividendSubmit(e) {
    e.preventDefault();

    const symbol = document.getElementById('dividend-symbol').value.toUpperCase();
    const amount = parseFloat(document.getElementById('dividend-amount').value);
    const perShare = parseFloat(document.getElementById('dividend-per-share').value);
    const date = document.getElementById('dividend-date').value;

    const dividend = {
      id: Date.now(),
      symbol: symbol,
      amount: amount,
      date: date,
      perShare: perShare,
      notes: document.getElementById('dividend-notes').value,
      recordedDate: new Date().toISOString().split('T')[0]
    };

    this.dividends.push(dividend);
    StorageManager.set('investments-dividends', this.dividends);

    e.target.reset();
    this.setupDefaultDates();

    // Ask if user wants to add DRIP lot
    const addDrip = confirm(`Dividend recorded successfully!\n\nWas this dividend reinvested (DRIP)?\n\nClick OK to add a DRIP lot for ${symbol}, or Cancel to skip.`);

    if (addDrip) {
      this.promptDripLot(symbol, amount, date);
    }

    this.renderDividends();
    this.updateDashboard();
  }

  promptDripLot(symbol, dividendAmount, dividendDate) {
    // Get current price and company info from existing holdings
    const existingHolding = this.portfolio.find(h => h.symbol === symbol);

    if (!existingHolding) {
      alert('No existing holding found for this symbol. Please add the DRIP lot manually from the Portfolio tab.');
      return;
    }

    // Calculate shares: dividend amount / current price
    const currentPrice = existingHolding.currentPrice;
    const shares = dividendAmount / currentPrice;

    const confirmed = confirm(
      `Add DRIP lot for ${symbol}?\n\n` +
      `Dividend amount: $${dividendAmount.toFixed(2)}\n` +
      `Current price: $${currentPrice.toFixed(2)}\n` +
      `Shares to add: ${shares.toFixed(4)}\n\n` +
      `Click OK to add this DRIP lot, or Cancel to add it manually later.`
    );

    if (confirmed) {
      const dripLot = {
        id: Date.now(),
        symbol: symbol,
        name: existingHolding.name,
        type: existingHolding.type,
        lotType: 'DRIP',
        quantity: shares,
        purchasePrice: currentPrice,
        purchaseDate: dividendDate,
        currentPrice: currentPrice,
        soldShares: 0,
        soldPrice: 0,
        notes: `DRIP from dividend on ${dividendDate}`,
        addedDate: new Date().toISOString().split('T')[0]
      };

      this.portfolio.push(dripLot);
      StorageManager.set('investments-portfolio', this.portfolio);

      alert(`DRIP lot added: ${shares.toFixed(4)} shares of ${symbol} @ $${currentPrice.toFixed(2)}`);
      this.renderPortfolio();
      this.updateDashboard();
    }
  }

  handleResearchSubmit(e) {
    e.preventDefault();

    const research = {
      id: Date.now(),
      symbol: document.getElementById('research-symbol').value.toUpperCase(),
      name: document.getElementById('research-name').value,
      type: document.getElementById('research-type').value,
      sector: document.getElementById('research-sector').value,
      notes: document.getElementById('research-notes').value,
      rating: document.getElementById('research-rating').value,
      addedDate: new Date().toISOString().split('T')[0]
    };

    this.research.push(research);
    StorageManager.set('investments-research', this.research);

    e.target.reset();
    alert('Research entry saved successfully!');
    this.renderResearch();
    this.updateDashboard();
  }

  sellShares(id) {
    const lot = this.portfolio.find(h => h.id === id);
    if (!lot) return;

    const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
    if (remainingShares <= 0) {
      alert('No shares available to sell in this lot.');
      return;
    }

    // Create a modal-style prompt for selling shares
    const sellForm = document.createElement('div');
    sellForm.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.5); z-index: 1000; 
      display: flex; align-items: center; justify-content: center;
    `;
    
    sellForm.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 12px; width: 400px; max-width: 90vw;">
        <h3 style="margin: 0 0 20px 0; color: #333;">🔄 Sell Shares - ${lot.symbol}</h3>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Available to sell:</div>
          <div style="font-size: 18px; font-weight: 600; color: #333;">${remainingShares.toFixed(4)} shares</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            Original purchase: ${lot.quantity.toFixed(4)} @ $${lot.purchasePrice.toFixed(2)} on ${lot.purchaseDate}
          </div>
        </div>

        <form id="sell-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">
              Shares to Sell *
            </label>
            <input type="number" id="sell-quantity" 
                   max="${remainingShares}" min="0.0001" step="0.0001" 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                   placeholder="e.g., ${Math.min(remainingShares, 10).toFixed(4)}" required>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">
              Sell Price per Share *
            </label>
            <input type="number" id="sell-price" 
                   min="0" step="0.01"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                   placeholder="e.g., ${lot.currentPrice.toFixed(2)}" value="${lot.currentPrice.toFixed(2)}" required>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #333;">
              Sale Date
            </label>
            <input type="date" id="sell-date" 
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"
                   value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div style="display: flex; gap: 10px; justify-content: end;">
            <button type="button" onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                    style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Cancel
            </button>
            <button type="submit"
                    style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Sell Shares
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(sellForm);

    // Handle form submission
    const form = sellForm.querySelector('#sell-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const sellQuantity = parseFloat(document.getElementById('sell-quantity').value);
      const sellPrice = parseFloat(document.getElementById('sell-price').value);
      const sellDate = document.getElementById('sell-date').value;

      if (sellQuantity > remainingShares) {
        alert('Cannot sell more shares than available!');
        return;
      }

      // Update the lot with sold shares
      const updatedSoldShares = (lot.soldShares || 0) + sellQuantity;
      const weightedSoldPrice = lot.soldShares > 0 
        ? ((lot.soldShares * (lot.soldPrice || 0)) + (sellQuantity * sellPrice)) / updatedSoldShares
        : sellPrice;

      lot.soldShares = updatedSoldShares;
      lot.soldPrice = weightedSoldPrice;
      
      // Add a note about the sale
      const saleNote = `Sold ${sellQuantity.toFixed(4)} shares @ $${sellPrice.toFixed(2)} on ${sellDate}`;
      lot.notes = lot.notes ? `${lot.notes}\n${saleNote}` : saleNote;

      StorageManager.set('investments-portfolio', this.portfolio);
      
      // Calculate realized gain for this sale
      const costBasis = sellQuantity * lot.purchasePrice;
      const saleValue = sellQuantity * sellPrice;
      const realizedGain = saleValue - costBasis;

      alert(`Sale recorded successfully!\n\nSold: ${sellQuantity.toFixed(4)} shares @ $${sellPrice.toFixed(2)}\nRealized ${realizedGain >= 0 ? 'Gain' : 'Loss'}: $${Math.abs(realizedGain).toFixed(2)}`);

      sellForm.remove();
      this.renderPortfolio();
      this.updateDashboard();
    });

    // Focus on quantity input
    setTimeout(() => {
      document.getElementById('sell-quantity').focus();
    }, 100);
  }

  editHolding(id) {
    const holding = this.portfolio.find(h => h.id === id);
    if (!holding) return;

    // Populate the form with holding data
    document.getElementById('holding-symbol').value = holding.symbol;
    document.getElementById('holding-name').value = holding.name;
    document.getElementById('holding-type').value = holding.type;
    document.getElementById('lot-type').value = holding.lotType || 'Purchase';
    document.getElementById('holding-quantity').value = holding.quantity;
    document.getElementById('purchase-price').value = holding.purchasePrice;
    document.getElementById('current-price').value = holding.currentPrice;
    document.getElementById('purchase-date').value = holding.purchaseDate;
    document.getElementById('sold-shares').value = holding.soldShares || 0;
    document.getElementById('sold-price').value = holding.soldPrice || 0;
    document.getElementById('holding-notes').value = holding.notes || '';

    // Store the ID being edited
    const form = document.getElementById('holding-form');
    form.dataset.editingId = id;

    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Lot';
    submitBtn.style.background = '#f59e0b';

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  deleteHolding(id) {
    if (confirm('Delete this holding?')) {
      this.portfolio = this.portfolio.filter(h => h.id !== id);
      StorageManager.set('investments-portfolio', this.portfolio);
      this.renderPortfolio();
      this.updateDashboard();
    }
  }

  deleteDividend(id) {
    if (confirm('Delete this dividend record?')) {
      this.dividends = this.dividends.filter(d => d.id !== id);
      StorageManager.set('investments-dividends', this.dividends);
      this.renderDividends();
      this.updateDashboard();
    }
  }

  deleteResearch(id) {
    if (confirm('Delete this research entry?')) {
      this.research = this.research.filter(r => r.id !== id);
      StorageManager.set('investments-research', this.research);
      this.renderResearch();
    }
  }

  handleCashSubmit(e) {
    e.preventDefault();

    this.cash = {
      balance: parseFloat(document.getElementById('cash-amount').value),
      notes: document.getElementById('cash-notes').value,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    StorageManager.set('investments-cash', this.cash);
    alert('Cash balance updated successfully!');
    this.updateDashboard();
  }

  handleInterestSubmit(e) {
    e.preventDefault();

    const interest = {
      id: Date.now(),
      amount: parseFloat(document.getElementById('interest-amount').value),
      source: document.getElementById('interest-source').value,
      date: document.getElementById('interest-date').value,
      notes: document.getElementById('interest-notes').value,
      recordedDate: new Date().toISOString().split('T')[0]
    };

    this.interest.push(interest);
    StorageManager.set('investments-interest', this.interest);

    e.target.reset();
    this.setupDefaultDates();
    alert('Interest recorded successfully!');
    this.renderInterest();
    this.updateDashboard();
  }

  deleteInterest(id) {
    if (confirm('Delete this interest record?')) {
      this.interest = this.interest.filter(i => i.id !== id);
      StorageManager.set('investments-interest', this.interest);
      this.renderInterest();
      this.updateDashboard();
    }
  }

  calculatePortfolioValue() {
    return this.portfolio.reduce((sum, lot) => {
      const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
      return sum + (remainingShares * lot.currentPrice);
    }, 0);
  }

  calculateTotalCost() {
    return this.portfolio.reduce((sum, lot) => {
      const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
      return sum + (remainingShares * lot.purchasePrice);
    }, 0);
  }

  calculateUnrealizedGain() {
    return this.portfolio.reduce((sum, lot) => {
      const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
      const currentValue = remainingShares * lot.currentPrice;
      const costBasis = remainingShares * lot.purchasePrice;
      return sum + (currentValue - costBasis);
    }, 0);
  }

  calculateRealizedGain() {
    return this.portfolio.reduce((sum, lot) => {
      if (lot.soldShares && lot.soldShares > 0 && lot.soldPrice > 0) {
        const soldValue = lot.soldShares * lot.soldPrice;
        const soldCost = lot.soldShares * lot.purchasePrice;
        return sum + (soldValue - soldCost);
      }
      return sum;
    }, 0);
  }

  calculateTotalDividends() {
    return this.dividends.reduce((sum, d) => sum + d.amount, 0);
  }

  calculateTotalInterest() {
    return this.interest.reduce((sum, i) => sum + i.amount, 0);
  }

  renderPortfolio() {
    const portfolioList = document.getElementById('portfolio-list');
    if (!portfolioList) return;

    if (this.portfolio.length === 0) {
      portfolioList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📈</div>
          <p>No holdings yet. Add your first investment!</p>
        </div>
      `;
      return;
    }

    // Group lots by symbol
    const symbolGroups = {};
    this.portfolio.forEach(lot => {
      if (!symbolGroups[lot.symbol]) {
        symbolGroups[lot.symbol] = {
          symbol: lot.symbol,
          name: lot.name,
          type: lot.type,
          currentPrice: lot.currentPrice,
          lots: []
        };
      }
      symbolGroups[lot.symbol].lots.push(lot);
      // Update current price to latest
      symbolGroups[lot.symbol].currentPrice = lot.currentPrice;
    });

    // Render grouped holdings
    portfolioList.innerHTML = Object.values(symbolGroups)
      .map(group => {
        // Calculate totals across all lots for this symbol
        let totalShares = 0;
        let totalCostBasis = 0;
        let totalCurrentValue = 0;
        let totalRealizedGain = 0;
        let hasSoldShares = false;

        group.lots.forEach(lot => {
          const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
          totalShares += remainingShares;
          totalCostBasis += remainingShares * lot.purchasePrice;
          totalCurrentValue += remainingShares * group.currentPrice;

          if (lot.soldShares && lot.soldShares > 0 && lot.soldPrice > 0) {
            hasSoldShares = true;
            const soldValue = lot.soldShares * lot.soldPrice;
            const soldCost = lot.soldShares * lot.purchasePrice;
            totalRealizedGain += (soldValue - soldCost);
          }
        });

        const totalUnrealizedGain = totalCurrentValue - totalCostBasis;
        const totalUnrealizedPercent = totalCostBasis > 0 ? ((totalUnrealizedGain / totalCostBasis) * 100).toFixed(2) : 0;
        const unrealizedClass = totalUnrealizedGain > 0 ? 'gain-positive' : totalUnrealizedGain < 0 ? 'gain-negative' : 'gain-neutral';

        // Count lots by type
        const purchaseLots = group.lots.filter(l => (l.lotType || 'Purchase') === 'Purchase').length;
        const dripLots = group.lots.filter(l => l.lotType === 'DRIP').length;

        return `
          <div class="portfolio-item">
            <div class="portfolio-header">
              <div>
                <div class="portfolio-symbol">${group.symbol}</div>
                <div class="portfolio-name">${group.name}</div>
                <div style="font-size: 11px; color: #999; margin-top: 3px;">
                  ${group.lots.length} lot${group.lots.length > 1 ? 's' : ''}
                  ${dripLots > 0 ? `(${purchaseLots} purchase, ${dripLots} DRIP)` : ''}
                </div>
              </div>
              <div>
                <div class="portfolio-value">$${totalCurrentValue.toFixed(2)}</div>
                <div class="portfolio-value-label">${group.type}</div>
              </div>
            </div>

            <div class="portfolio-meta">
              <div class="meta-item">
                <span class="meta-label">Total Shares:</span>
                <span class="meta-value" style="font-weight: 700;">${totalShares.toFixed(4)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Current Price:</span>
                <span class="meta-value">$${group.currentPrice.toFixed(2)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Cost Basis:</span>
                <span class="meta-value">$${totalCostBasis.toFixed(2)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Avg Cost/Share:</span>
                <span class="meta-value">$${totalShares > 0 ? (totalCostBasis / totalShares).toFixed(2) : '0.00'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Unrealized Gain:</span>
                <span class="meta-value ${unrealizedClass}">$${totalUnrealizedGain.toFixed(2)} (${totalUnrealizedPercent}%)</span>
              </div>
              ${hasSoldShares ? `
                <div class="meta-item">
                  <span class="meta-label">Realized Gain:</span>
                  <span class="meta-value ${totalRealizedGain >= 0 ? 'gain-positive' : 'gain-negative'}">$${totalRealizedGain.toFixed(2)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Individual Lots -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
              <div style="font-size: 12px; font-weight: 600; color: #667eea; margin-bottom: 10px;">📊 Individual Lots:</div>
              ${group.lots.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)).map(lot => {
                const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
                const lotCostBasis = remainingShares * lot.purchasePrice;
                const lotCurrentValue = remainingShares * group.currentPrice;
                const lotGain = lotCurrentValue - lotCostBasis;
                const lotGainPercent = lotCostBasis > 0 ? ((lotGain / lotCostBasis) * 100).toFixed(2) : 0;
                const lotGainClass = lotGain > 0 ? 'gain-positive' : lotGain < 0 ? 'gain-negative' : 'gain-neutral';

                let lotRealizedHTML = '';
                if (lot.soldShares && lot.soldShares > 0 && lot.soldPrice > 0) {
                  const soldValue = lot.soldShares * lot.soldPrice;
                  const soldCost = lot.soldShares * lot.purchasePrice;
                  const realizedGain = soldValue - soldCost;
                  const realizedClass = realizedGain >= 0 ? 'gain-positive' : 'gain-negative';
                  lotRealizedHTML = `
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">
                      Sold: ${lot.soldShares.toFixed(4)} @ $${lot.soldPrice.toFixed(2)} |
                      Realized: <span class="${realizedClass}">$${realizedGain.toFixed(2)}</span>
                    </div>
                  `;
                }

                return `
                  <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${lot.lotType === 'DRIP' ? '#10b981' : '#667eea'};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
                      <div style="flex: 1;">
                        <span style="font-weight: 600; font-size: 11px; color: #667eea; background: ${lot.lotType === 'DRIP' ? '#d1fae5' : '#e0e7ff'}; padding: 2px 6px; border-radius: 3px; margin-right: 6px;">
                          ${lot.lotType || 'Purchase'}
                        </span>
                        <span style="font-size: 11px; color: #999;">${lot.purchaseDate}</span>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 12px; font-weight: 600; color: #333;">$${lotCurrentValue.toFixed(2)}</div>
                        <div style="font-size: 10px; color: ${lotGainClass};">${lotGain >= 0 ? '+' : ''}$${lotGain.toFixed(2)} (${lotGainPercent}%)</div>
                      </div>
                    </div>
                    <div style="font-size: 11px; color: #666;">
                      Shares: ${remainingShares.toFixed(4)} @ $${lot.purchasePrice.toFixed(2)} |
                      Cost: $${lotCostBasis.toFixed(2)}
                    </div>
                    ${lotRealizedHTML}
                    ${lot.notes ? `<div style="font-size: 10px; color: #888; margin-top: 5px; font-style: italic;">${lot.notes}</div>` : ''}
                    <div style="display: flex; gap: 6px; margin-top: 8px;">
                      <button class="investment-btn investment-btn-small" onclick="investmentApp.editHolding(${lot.id})" style="background: #667eea; font-size: 10px; padding: 4px 10px;">Edit Lot</button>
                      ${remainingShares > 0 ? `<button class="investment-btn investment-btn-small" onclick="investmentApp.sellShares(${lot.id})" style="background: #f59e0b; font-size: 10px; padding: 4px 10px;">Sell Shares</button>` : ''}
                      <button class="investment-btn investment-btn-small investment-btn-danger" onclick="investmentApp.deleteHolding(${lot.id})" style="font-size: 10px; padding: 4px 10px;">Delete</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
  }

  renderDividends() {
    const dividendsList = document.getElementById('dividends-list');
    if (!dividendsList) return;

    if (this.dividends.length === 0) {
      dividendsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💰</div>
          <p>No dividend records yet.</p>
        </div>
      `;
      return;
    }

    dividendsList.innerHTML = this.dividends
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(dividend => `
        <div class="dividend-item">
          <div class="dividend-info">
            <div class="dividend-symbol">${dividend.symbol} - $${dividend.perShare.toFixed(4)}/share</div>
            <div class="dividend-date">Recorded: ${dividend.date}</div>
            ${dividend.notes ? `<div style="font-size: 11px; color: #666; margin-top: 3px;">${dividend.notes}</div>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="dividend-amount">$${dividend.amount.toFixed(2)}</div>
            <button class="investment-btn investment-btn-small investment-btn-danger" onclick="investmentApp.deleteDividend(${dividend.id})">✕</button>
          </div>
        </div>
      `).join('');
  }

  renderResearch() {
    const researchList = document.getElementById('research-list');
    if (!researchList) return;

    let filtered = this.research;
    if (this.selectedTab !== 'all') {
      filtered = this.research.filter(r => r.type.toLowerCase() === this.selectedTab.toLowerCase());
    }

    if (filtered.length === 0) {
      researchList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔬</div>
          <p>No ${this.selectedTab === 'all' ? 'research' : this.selectedTab} entries yet.</p>
        </div>
      `;
      return;
    }

    researchList.innerHTML = filtered
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
      .map(item => `
        <div class="research-card">
          <div class="research-header">
            <div>
              <div class="research-symbol">${item.symbol}</div>
              <div class="research-info">${item.name}</div>
            </div>
            <span class="research-type">${item.type}</span>
          </div>

          <div class="research-info">
            <strong>Sector:</strong> ${item.sector}<br>
            <strong>Rating:</strong> ${item.rating || 'Unrated'}
          </div>

          ${item.notes ? `<div class="research-info">${item.notes}</div>` : ''}

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <a href="https://www.google.com/search?q=${item.symbol}" target="_blank" class="research-button">
              Google Search
            </a>
            <button class="investment-btn investment-btn-small investment-btn-danger" onclick="investmentApp.deleteResearch(${item.id})">Delete</button>
          </div>
        </div>
      `).join('');
  }

  renderInterest() {
    const interestList = document.getElementById('interest-list');
    if (!interestList) return;

    if (this.interest.length === 0) {
      interestList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏦</div>
          <p>No interest records yet.</p>
        </div>
      `;
      return;
    }

    interestList.innerHTML = this.interest
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(interest => `
        <div class="dividend-item">
          <div class="dividend-info">
            <div class="dividend-symbol">${interest.source}</div>
            <div class="dividend-date">${interest.date}</div>
            ${interest.notes ? `<div style="font-size: 11px; color: #666; margin-top: 3px;">${interest.notes}</div>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="dividend-amount">$${interest.amount.toFixed(2)}</div>
            <button class="investment-btn investment-btn-small investment-btn-danger" onclick="investmentApp.deleteInterest(${interest.id})">✕</button>
          </div>
        </div>
      `).join('');
  }

  renderMonthlyDividends() {
    const monthlyDiv = document.getElementById('monthly-dividends');
    if (!monthlyDiv) return;

    if (this.dividends.length === 0) {
      monthlyDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No dividends to summarize</p>
        </div>
      `;
      return;
    }

    // Group dividends by month
    const monthlyTotals = {};
    this.dividends.forEach(d => {
      const date = new Date(d.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = 0;
      }
      monthlyTotals[monthKey] += d.amount;
    });

    // Convert to array and sort
    const months = Object.keys(monthlyTotals).sort().reverse();
    const totalDividends = this.calculateTotalDividends();

    monthlyDiv.innerHTML = `
      <div style="margin-bottom: 15px; padding: 10px; background: #f0f7ff; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: bold; color: #667eea;">$${totalDividends.toFixed(2)}</div>
        <div style="font-size: 12px; color: #666;">Total Dividends Received</div>
      </div>
      ${months.map(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });
        return `
          <div class="dividend-item">
            <div class="dividend-info">
              <div class="dividend-symbol">${monthName} ${year}</div>
            </div>
            <div class="dividend-amount">$${monthlyTotals[month].toFixed(2)}</div>
          </div>
        `;
      }).join('')}
    `;
  }

  renderDripSummary() {
    const dripDiv = document.getElementById('drip-summary');
    if (!dripDiv) return;

    // Get DRIP lots (excluding sold shares)
    const dripLots = this.portfolio.filter(lot => lot.lotType === 'DRIP');

    if (dripLots.length === 0) {
      dripDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No DRIP lots recorded</p>
        </div>
      `;
      return;
    }

    // Sort DRIP lots by date (most recent first)
    dripLots.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

    dripDiv.innerHTML = dripLots
      .map(lot => {
        const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
        const currentValue = remainingShares * lot.currentPrice;
        const costBasis = remainingShares * lot.purchasePrice;
        const gain = currentValue - costBasis;
        const gainClass = gain >= 0 ? 'gain-positive' : 'gain-negative';
        
        return `
          <div class="dividend-item">
            <div class="dividend-info">
              <div class="dividend-symbol">${lot.symbol} - ${lot.name}</div>
              <div class="dividend-date">${lot.purchaseDate}</div>
              <div style="font-size: 11px; color: #666; margin-top: 3px;">
                ${remainingShares.toFixed(4)} shares @ $${lot.purchasePrice.toFixed(2)} DRIP price
                ${lot.notes ? ` • ${lot.notes}` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="dividend-amount">$${currentValue.toFixed(2)}</div>
              <div style="font-size: 10px; color: ${gainClass};">
                ${gain >= 0 ? '+' : ''}$${gain.toFixed(2)}
              </div>
            </div>
          </div>
        `;
      }).join('');
  }

  updateDashboard() {
    const portfolioValue = this.calculatePortfolioValue();
    const unrealizedGain = this.calculateUnrealizedGain();
    const realizedGain = this.calculateRealizedGain();
    const totalDividends = this.calculateTotalDividends();
    const totalInterest = this.calculateTotalInterest();
    const cashBalance = this.cash.balance || 0;

    // Update stat cards
    const portfolioValueEl = document.getElementById('portfolio-value');
    const unrealizedGainEl = document.getElementById('unrealized-gain');
    const realizedGainEl = document.getElementById('realized-gain');
    const totalDividendsEl = document.getElementById('total-dividends');
    const totalInterestEl = document.getElementById('total-interest');
    const cashBalanceEl = document.getElementById('cash-balance');
    const holdingsCountEl = document.getElementById('holdings-count');

    if (portfolioValueEl) portfolioValueEl.textContent = '$' + portfolioValue.toFixed(2);
    if (unrealizedGainEl) {
      unrealizedGainEl.textContent = '$' + unrealizedGain.toFixed(2);
      unrealizedGainEl.style.color = unrealizedGain >= 0 ? '#10b981' : '#ef4444';
    }
    if (realizedGainEl) {
      realizedGainEl.textContent = '$' + realizedGain.toFixed(2);
      realizedGainEl.style.color = realizedGain >= 0 ? '#10b981' : '#ef4444';
    }
    if (totalDividendsEl) totalDividendsEl.textContent = '$' + totalDividends.toFixed(2);
    if (totalInterestEl) totalInterestEl.textContent = '$' + totalInterest.toFixed(2);
    if (cashBalanceEl) cashBalanceEl.textContent = '$' + cashBalance.toFixed(2);
    if (holdingsCountEl) {
      const uniqueSymbols = new Set(this.portfolio.map(lot => lot.symbol));
      holdingsCountEl.textContent = uniqueSymbols.size;
    }

    this.renderPortfolioAllocation();
    this.renderRecentActivity();
    this.renderMonthlyDividends();
    this.renderDripSummary();
    this.renderInterest();
  }

  renderPortfolioAllocation() {
    const allocationDiv = document.getElementById('allocation');
    if (!allocationDiv) return;

    if (this.portfolio.length === 0) {
      allocationDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>Add holdings to see allocation</p>
        </div>
      `;
      return;
    }

    const portfolioValue = this.calculatePortfolioValue();

    // Group lots by symbol for allocation
    const symbolValues = {};
    this.portfolio.forEach(lot => {
      const remainingShares = (lot.quantity || 0) - (lot.soldShares || 0);
      const value = remainingShares * lot.currentPrice;
      if (!symbolValues[lot.symbol]) {
        symbolValues[lot.symbol] = 0;
      }
      symbolValues[lot.symbol] += value;
    });

    allocationDiv.innerHTML = Object.entries(symbolValues)
      .sort(([, a], [, b]) => b - a)
      .map(([symbol, value]) => {
        const percent = ((value / portfolioValue) * 100).toFixed(1);
        return `
          <div class="allocation-item">
            <div class="allocation-name">${symbol}</div>
            <div class="allocation-bar">
              <div class="allocation-fill" style="width: ${percent}%"></div>
            </div>
            <div class="allocation-percent">${percent}%</div>
          </div>
        `;
      }).join('');
  }

  renderRecentActivity() {
    const activityDiv = document.getElementById('recent-activity');
    if (!activityDiv) return;

    const activities = [];

    // Add recent holdings/lots
    this.portfolio.slice(-5).forEach(lot => {
      const lotTypeLabel = lot.lotType === 'DRIP' ? '🔄 DRIP' : '📈';
      activities.push({
        type: 'holding',
        date: new Date(lot.addedDate),
        text: `${lotTypeLabel} ${lot.quantity.toFixed(4)} ${lot.symbol} @ $${lot.purchasePrice.toFixed(2)}`
      });
    });

    // Add recent dividends
    this.dividends.slice(-5).forEach(d => {
      activities.push({
        type: 'dividend',
        date: new Date(d.recordedDate),
        text: `💰 Dividend: ${d.symbol} $${d.amount.toFixed(2)}`
      });
    });

    activities.sort((a, b) => b.date - a.date);

    if (activities.length === 0) {
      activityDiv.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <p>No recent activity</p>
        </div>
      `;
      return;
    }

    activityDiv.innerHTML = activities.slice(0, 8).map(activity => `
      <div class="dividend-item">
        <div>
          <div style="font-weight: 500; color: #333; font-size: 13px;">${activity.text}</div>
          <div style="font-size: 11px; color: #999;">${activity.date.toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  }

  refresh() {
    this.portfolio = StorageManager.get('investments-portfolio') || [];
    this.dividends = StorageManager.get('investments-dividends') || [];
    this.research = StorageManager.get('investments-research') || [];
    this.interest = StorageManager.get('investments-interest') || [];
    this.cash = StorageManager.get('investments-cash') || { balance: 0, notes: '', lastUpdated: null };
    this.updateDashboard();
  }
}

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  const tab = document.getElementById(`${tabName}-tab`);
  if (tab) {
    tab.classList.add('active');
  }

  if (event.target) {
    event.target.classList.add('active');
  }

  if (tabName === 'dashboard') investmentApp.updateDashboard();
  if (tabName === 'portfolio') investmentApp.renderPortfolio();
  if (tabName === 'dividends') {
    investmentApp.renderDividends();
    investmentApp.renderMonthlyDividends();
    investmentApp.renderDripSummary();
  }
  if (tabName === 'cash') {
    investmentApp.setupDefaultDates();
    investmentApp.renderInterest();
  }
  if (tabName === 'research') investmentApp.renderResearch();
}

// Initialize app
let investmentApp;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    investmentApp = new InvestmentApp();
  });
} else {
  investmentApp = new InvestmentApp();
}

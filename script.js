class FantacalcioApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentSort = { column: null, direction: 'asc' };
        this.acquiredPlayers = new Set();
        this.myTeam = [];
        this.totalBudget = 500;
        this.currentPlayerForPurchase = null;
        this.currentQuickFilter = 'tutti';
        this.currentMobileTab = 'players';
        this.positionLimits = {
            'Portieri': 3,
            'Difensori': 8,
            'Centrocampisti': 8,
            'Attaccanti': 6
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStatus('Carica il file CSV per iniziare');
        this.updateBudgetDisplay();
        this.loadFromLocalStorage();
        this.handleMobileView();
    }

    handleMobileView() {
        // Set initial mobile view
        if (window.innerWidth <= 768) {
            this.switchMobileTab('players');
        }
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.switchMobileTab(this.currentMobileTab);
            }
        });
    }

    setupEventListeners() {
        // CSV loading
        document.getElementById('loadCsvBtn')?.addEventListener('click', () => {
            this.loadCSVFile();
        });

        // Search form
        document.getElementById('searchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchPlayers();
        });

        // Reset button
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Hide acquired checkbox
        document.getElementById('hideAcquired')?.addEventListener('change', () => {
            this.searchPlayers();
        });

        // Team management buttons
        document.getElementById('clearTeamBtn')?.addEventListener('click', () => {
            this.clearTeam();
        });

        document.getElementById('exportTeamBtn')?.addEventListener('click', () => {
            this.exportTeam();
        });

        // Mobile tab navigation
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMobileTab(e.target.dataset.tab);
            });
        });

        // Quick filters
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickFilter(e.target.dataset.filter);
            });
        });

        // Modal event listeners
        document.getElementById('confirmPurchase')?.addEventListener('click', () => {
            this.confirmPurchase();
        });

        document.getElementById('cancelPurchase')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.close')?.addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('purchaseModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Table sorting
        document.querySelectorAll('th').forEach((header, index) => {
            header.addEventListener('click', () => {
                this.sortTable(index);
            });
        });
    }

    switchMobileTab(tabName) {
        this.currentMobileTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Show/hide content based on tab
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.content');
        const detailsPanel = document.querySelector('.details-panel');
        const teamManagement = document.querySelector('.team-management');
        
        // Reset all
        sidebar?.classList.remove('mobile-active');
        detailsPanel?.classList.remove('mobile-active');
        
        switch(tabName) {
            case 'players':
                // Show main table
                if (content) content.style.display = 'flex';
                break;
                
            case 'team':
                // Show team management
                if (content) content.style.display = 'none';
                if (teamManagement) teamManagement.style.display = 'grid';
                break;
                
            case 'filters':
                // Show sidebar
                if (content) content.style.display = 'none';
                sidebar?.classList.add('mobile-active');
                break;
                
            case 'details':
                // Show details panel
                if (content) content.style.display = 'none';
                detailsPanel?.classList.add('mobile-active');
                break;
        }
    }

    loadCSVFile() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (!file) {
            this.updateStatus('Seleziona un file CSV', 'error');
            return;
        }

        if (!file.name.endsWith('.csv')) {
            this.updateStatus('Seleziona un file CSV valido', 'error');
            return;
        }

        this.updateStatus('Caricamento file CSV in corso...');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.parseCSV(csvText);
            } catch (error) {
                console.error('Errore nella lettura del file:', error);
                this.updateStatus('Errore nella lettura del file CSV', 'error');
            }
        };

        reader.readAsText(file, 'UTF-8');
    }

    parseCSV(csvText) {
        try {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            this.data = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === '') continue;

                const values = this.parseCSVLine(line);
                if (values.length === headers.length) {
                    const player = {};
                    headers.forEach((header, index) => {
                        player[header] = values[index];
                    });
                    player.id = `player_${i}`;
                    this.data.push(player);
                }
            }

            this.filteredData = [...this.data];
            this.populateFilters();
            this.applyQuickFilter(this.currentQuickFilter);
            this.updateStatus(`Dati caricati: ${this.data.length} giocatori`);

        } catch (error) {
            console.error('Errore nel parsing del CSV:', error);
            this.updateStatus('Errore nel parsing del file CSV', 'error');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim().replace(/"/g, ''));
        return result;
    }

    populateFilters() {
        const teams = [...new Set(this.data.map(player => player.Squadra))].sort();
        
        const teamSelect = document.getElementById('team');
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Tutte</option>';
            teams.forEach(team => {
                if (team) {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    teamSelect.appendChild(option);
                }
            });
        }

        const allSkills = new Set();
        this.data.forEach(player => {
            if (player.Skills) {
                try {
                    const skills = JSON.parse(player.Skills.replace(/'/g, '"'));
                    skills.forEach(skill => allSkills.add(skill));
                } catch (e) {
                    const skillsText = player.Skills.replace(/[\[\]']/g, '');
                    const skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
                    skills.forEach(skill => allSkills.add(skill));
                }
            }
        });

        const skillSelect = document.getElementById('skill');
        if (skillSelect) {
            skillSelect.innerHTML = '<option value="">Tutte</option>';
            [...allSkills].sort().forEach(skill => {
                if (skill) {
                    const option = document.createElement('option');
                    option.value = skill;
                    option.textContent = skill;
                    skillSelect.appendChild(option);
                }
            });
        }
    }

    applyQuickFilter(filterType) {
        if (this.data.length === 0) {
            this.updateStatus('Carica prima un file CSV', 'error');
            return;
        }

        this.currentQuickFilter = filterType;
        
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.quick-filter-btn[data-filter="${filterType}"]`)?.classList.add('active');

        // Reset search form
        document.getElementById('searchForm')?.reset();
        const minScore = document.getElementById('minScore');
        const maxScore = document.getElementById('maxScore');
        if (minScore) minScore.value = 0;
        if (maxScore) maxScore.value = 100;

        let filteredData = [...this.data];

        switch(filterType) {
            case 'titolari':
                filteredData = this.data.filter(player => {
                    return player.Skills && player.Skills.toLowerCase().includes('titolare');
                });
                break;
            
            case 'giovani':
                filteredData = this.data.filter(player => {
                    const isYoung = player.Skills && player.Skills.toLowerCase().includes('giovane');
                    const isNewSigning = player['Nuovo acquisto'] === 'True' || player['Nuovo acquisto'] === 'true';
                    return isYoung || isNewSigning;
                });
                break;
            
            case 'rigoristi':
                filteredData = this.data.filter(player => {
                    return player.Skills && player.Skills.toLowerCase().includes('rigorista');
                });
                break;
            
            case 'tutti':
            default:
                filteredData = [...this.data];
                break;
        }

        this.filteredData = filteredData;
        this.displayData(this.filteredData);
    }

    displayData(data) {
        const tbody = document.querySelector('#playersTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        data.forEach((player) => {
            const row = document.createElement('tr');
            
            const nome = player.Nome || '';
            const ruolo = player.Ruolo || '';
            const squadra = player.Squadra || '';
            const fantamedia = player['Fantamedia anno 2024-2025'] || player['Fantamedia 2024-2025'] || '';
            const punteggio = player.Punteggio || '';
            const trend = player.Trend || 'STABLE';
            
            const isAcquired = this.acquiredPlayers.has(player.id);
            const isMyPlayer = this.myTeam.some(p => p.id === player.id);
            
            const positionCategory = this.getPositionCategory(ruolo);
            const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
            const isPositionFull = currentCount >= this.positionLimits[positionCategory];
            
            if (isAcquired) row.classList.add('acquired');
            if (isMyPlayer) row.classList.add('my-player');
            
            row.innerHTML = `
                <td class="desktop-only">
                    <input type="checkbox" class="status-checkbox" ${isAcquired ? 'checked' : ''} 
                           data-player-id="${player.id}">
                </td>
                <td>${nome}</td>
                <td>${ruolo}</td>
                <td class="desktop-only">${squadra}</td>
                <td class="desktop-only">${fantamedia}</td>
                <td>${punteggio}</td>
                <td class="desktop-only trend-${trend.toLowerCase()}">${trend}</td>
                <td>
                    ${!isMyPlayer && !isAcquired ? 
                        (isPositionFull ? 
                            '<span style="color: #ff9800; font-size: 12px;">LIMITE</span>' :
                            `<button class="btn btn-primary btn-small" data-player-id="${player.id}">Acquista</button>`
                        ) :
                        isMyPlayer ? '<span style="color: #4CAF50; font-weight: bold;">MIO</span>' :
                        '<span style="color: #f44336;">PRESO</span>'
                    }
                </td>
            `;
            
            // Event listeners
            const checkbox = row.querySelector('.status-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.togglePlayerStatus(player.id);
                });
            }
            
            const buyButton = row.querySelector('button[data-player-id]');
            if (buyButton) {
                buyButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openPurchaseModal(player.id);
                });
            }
            
            row.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox' && e.target.tagName !== 'BUTTON') {
                    this.selectPlayer(row, player);
                }
            });
            
            tbody.appendChild(row);
        });

        this.updateStatus(`Risultati: ${data.length} giocatori trovati`);
    }

    togglePlayerStatus(playerId) {
        if (this.acquiredPlayers.has(playerId)) {
            this.acquiredPlayers.delete(playerId);
        } else {
            this.acquiredPlayers.add(playerId);
        }
        this.saveToLocalStorage();
        this.displayData(this.filteredData);
    }

    openPurchaseModal(playerId) {
        const player = this.data.find(p => p.id === playerId);
        
        if (!player) {
            alert('Errore: giocatore non trovato');
            return;
        }

        const positionCategory = this.getPositionCategory(player.Ruolo);
        const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
        const limit = this.positionLimits[positionCategory];
        
        if (currentCount >= limit) {
            alert(`Non puoi acquistare più di ${limit} ${positionCategory.toLowerCase()}!`);
            return;
        }

        this.currentPlayerForPurchase = player;
        document.getElementById('modalPlayerName').textContent = player.Nome || '';
        document.getElementById('modalPlayerRole').textContent = player.Ruolo || '';
        
        const averageBudget = this.calculateAverageBudget();
        const remainingBudget = this.getRemainingBudget();
        const remainingSlots = 25 - this.myTeam.length;
        
        document.getElementById('budgetSuggestion').textContent = 
            `Budget medio disponibile: ${averageBudget} crediti per giocatore (${remainingSlots} slot rimanenti)`;
        
        document.getElementById('purchasePrice').value = Math.min(averageBudget, remainingBudget) || 1;
        document.getElementById('purchaseModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('purchaseModal').style.display = 'none';
        this.currentPlayerForPurchase = null;
    }

    confirmPurchase() {
        if (!this.currentPlayerForPurchase) return;

        const price = parseInt(document.getElementById('purchasePrice').value);
        if (price <= 0 || price > this.getRemainingBudget()) {
            alert('Prezzo non valido o budget insufficiente!');
            return;
        }

        const player = this.currentPlayerForPurchase;
        
        const positionCategory = this.getPositionCategory(player.Ruolo);
        const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
        const limit = this.positionLimits[positionCategory];
        
        if (currentCount >= limit) {
            alert(`Non puoi acquistare più di ${limit} ${positionCategory.toLowerCase()}!`);
            return;
        }

        this.myTeam.push({
            id: player.id,
            nome: player.Nome || '',
            ruolo: player.Ruolo || '',
            squadra: player.Squadra || '',
            price: price
        });

        this.acquiredPlayers.add(player.id);
        this.updateTeamDisplay();
        this.updateBudgetDisplay();
        this.saveToLocalStorage();
        this.displayData(this.filteredData);
        this.closeModal();
    }

    removePlayerFromTeam(playerId) {
        const playerIndex = this.myTeam.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            this.myTeam.splice(playerIndex, 1);
            this.acquiredPlayers.delete(playerId);
            this.updateTeamDisplay();
            this.updateBudgetDisplay();
            this.saveToLocalStorage();
            this.displayData(this.filteredData);
        }
    }

    getPositionCategory(ruolo) {
        switch(ruolo) {
            case 'POR':
                return 'Portieri';
            case 'DIF':
                return 'Difensori';
            case 'CEN':
            case 'TRQ':
                return 'Centrocampisti';
            case 'ATT':
                return 'Attaccanti';
            default:
                return 'Altri';
        }
    }

    getPositionTotal(position) {
        return this.myTeam
            .filter(player => this.getPositionCategory(player.ruolo) === position)
            .reduce((total, player) => total + player.price, 0);
    }

    calculateAverageBudget() {
        const remainingBudget = this.getRemainingBudget();
        const remainingSlots = 25 - this.myTeam.length;
        
        if (remainingSlots <= 0) {
            return 0;
        }
        
        return Math.floor(remainingBudget / remainingSlots);
    }

    updateTeamDisplay() {
        const teamList = document.getElementById('myTeamList');
        const teamCount = document.getElementById('teamCount');
        const mobileTeamCount = document.getElementById('mobileTeamCount');
        
        if (teamCount) teamCount.textContent = this.myTeam.length;
        if (mobileTeamCount) mobileTeamCount.textContent = this.myTeam.length;
        
        if (!teamList) return;
        
        if (this.myTeam.length === 0) {
            teamList.innerHTML = '<p class="empty-team">Nessun giocatore acquistato</p>';
            return;
        }

        const positions = {
            'Portieri': [],
            'Difensori': [],
            'Centrocampisti': [],
            'Attaccanti': []
        };

        this.myTeam.forEach(player => {
            const category = this.getPositionCategory(player.ruolo);
            positions[category].push(player);
        });

        Object.keys(positions).forEach(pos => {
            positions[pos].sort((a, b) => a.nome.localeCompare(b.nome));
        });

        teamList.innerHTML = `
            <div class="team-positions">
                ${Object.keys(positions).map(position => {
                    const count = positions[position].length;
                    const limit = this.positionLimits[position];
                    const total = this.getPositionTotal(position);
                    const isComplete = count >= limit;
                    
                    return `
                        <div class="position-column ${isComplete ? 'position-complete' : ''}">
                            <div class="position-header">
                                ${position} (${count}/${limit})
                                <div class="position-total">Totale: ${total} crediti</div>
                            </div>
                            ${positions[position].length === 0 ? 
                                '<div class="empty-position">Nessun giocatore</div>' :
                                positions[position].map(player => `
                                    <div class="team-player">
                                        <div class="team-player-info">
                                            <div class="team-player-name">${player.nome}</div>
                                            <div class="team-player-details">${player.squadra}</div>
                                        </div>
                                        <div class="team-player-price">${player.price} crediti</div>
                                        <button class="remove-player" onclick="app.removePlayerFromTeam('${player.id}')">✕</button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateBudgetDisplay() {
        const spent = this.myTeam.reduce((total, player) => total + player.price, 0);
        const remaining = this.totalBudget - spent;
        const averageBudget = this.calculateAverageBudget();
        
        const spentElement = document.getElementById('spentBudget');
        const remainingElement = document.getElementById('remainingBudget');
        const averageElement = document.getElementById('averageBudget');
        const mobileBudgetElement = document.getElementById('mobileBudget');
        
        if (spentElement) spentElement.textContent = spent;
        if (remainingElement) remainingElement.textContent = remaining;
        if (averageElement) averageElement.textContent = `Budget medio: ${averageBudget} crediti per giocatore`;
        if (mobileBudgetElement) mobileBudgetElement.textContent = remaining;
        
        const budgetDisplay = document.querySelector('.budget-display');
        if (budgetDisplay) {
            if (remaining < 50) {
                budgetDisplay.style.color = '#f44336';
            } else if (remaining < 100) {
                budgetDisplay.style.color = '#ff9800';
            } else {
                budgetDisplay.style.color = '#2196F3';
            }
        }
    }

    getRemainingBudget() {
        const spent = this.myTeam.reduce((total, player) => total + player.price, 0);
        return this.totalBudget - spent;
    }

    clearTeam() {
        if (confirm('Sei sicuro di voler svuotare la squadra?')) {
            this.myTeam.forEach(player => {
                this.acquiredPlayers.delete(player.id);
            });
            this.myTeam = [];
            this.updateTeamDisplay();
            this.updateBudgetDisplay();
            this.saveToLocalStorage();
            this.displayData(this.filteredData);
        }
    }

    exportTeam() {
        if (this.myTeam.length === 0) {
            alert('Non hai ancora acquistato nessun giocatore!');
            return;
        }

        const teamData = this.myTeam.map(player => 
            `${player.nome},${player.ruolo},${player.squadra},${player.price}`
        ).join('\n');
        
        const header = 'Nome,Ruolo,Squadra,Prezzo\n';
        const csvContent = header + teamData;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'la_mia_squadra.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    saveToLocalStorage() {
        localStorage.setItem('fantacalcio_acquired', JSON.stringify([...this.acquiredPlayers]));
        localStorage.setItem('fantacalcio_team', JSON.stringify(this.myTeam));
    }

    loadFromLocalStorage() {
        const acquired = localStorage.getItem('fantacalcio_acquired');
        const team = localStorage.getItem('fantacalcio_team');
        
        if (acquired) {
            this.acquiredPlayers = new Set(JSON.parse(acquired));
        }
        
        if (team) {
            this.myTeam = JSON.parse(team);
            this.updateTeamDisplay();
            this.updateBudgetDisplay();
        }
    }

    selectPlayer(row, player) {
        document.querySelectorAll('tbody tr').forEach(tr => {
            tr.classList.remove('selected');
        });
        
        row.classList.add('selected');
        this.showPlayerDetails(player);
        
        // Auto switch to details on mobile
        if (window.innerWidth <= 768) {
            this.switchMobileTab('details');
        }
    }

    showPlayerDetails(player) {
        const detailsContainer = document.getElementById('playerDetails');
        if (!detailsContainer) return;
        
        let detailsHTML = '';
        
        Object.keys(player).forEach(key => {
            if (player[key] !== undefined && player[key] !== '' && key !== 'id') {
                let value = player[key];
                
                if (value === 'True' || value === 'true') value = 'Sì';
                if (value === 'False' || value === 'false') value = 'No';
                
                detailsHTML += `
                    <div class="detail-item">
                        <span class="detail-label">${key}:</span>
                        <span class="detail-value">${value}</span>
                    </div>
                `;
            }
        });
        
        detailsContainer.innerHTML = detailsHTML;
    }

    searchPlayers() {
        if (this.data.length === 0) {
            this.updateStatus('Carica prima un file CSV', 'error');
            return;
        }

        const name = document.getElementById('playerName')?.value.toLowerCase() || '';
        const role = document.getElementById('role')?.value || '';
        const team = document.getElementById('team')?.value || '';
        const skill = document.getElementById('skill')?.value || '';
        const minScore = parseFloat(document.getElementById('minScore')?.value || 0);
        const maxScore = parseFloat(document.getElementById('maxScore')?.value || 100);
        const hideAcquired = document.getElementById('hideAcquired')?.checked || false;

        this.currentQuickFilter = 'tutti';
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-filter="tutti"]')?.classList.add('active');

        this.filteredData = this.data.filter(player => {
            const nameMatch = !name || (player.Nome && player.Nome.toLowerCase().includes(name));
            const roleMatch = !role || player.Ruolo === role;
            const teamMatch = !team || player.Squadra === team;
            
            let skillMatch = true;
            if (skill) {
                skillMatch = false;
                if (player.Skills) {
                    try {
                        const skills = JSON.parse(player.Skills.replace(/'/g, '"'));
                        skillMatch = skills.includes(skill);
                    } catch (e) {
                        const skillsText = player.Skills.replace(/[\[\]']/g, '');
                        const skills = skillsText.split(',').map(s => s.trim());
                        skillMatch = skills.includes(skill);
                    }
                }
            }
            
            const playerScore = parseFloat(player.Punteggio) || 0;
            const scoreMatch = playerScore >= minScore && playerScore <= maxScore;
            
            const acquiredMatch = !hideAcquired || !this.acquiredPlayers.has(player.id);

            return nameMatch && roleMatch && teamMatch && skillMatch && scoreMatch && acquiredMatch;
        });

        this.displayData(this.filteredData);
        
        // Switch to players tab on mobile
        if (window.innerWidth <= 768) {
            this.switchMobileTab('players');
        }
    }

    resetFilters() {
        document.getElementById('searchForm')?.reset();
        const minScore = document.getElementById('minScore');
        const maxScore = document.getElementById('maxScore');
        if (minScore) minScore.value = 0;
        if (maxScore) maxScore.value = 100;
        
        this.applyQuickFilter('tutti');
        
        const detailsContainer = document.getElementById('playerDetails');
        if (detailsContainer) {
            detailsContainer.innerHTML = 
                '<p>Seleziona un giocatore dalla tabella per visualizzarne i dettagli</p>';
        }
    }

    sortTable(columnIndex) {
        if (this.filteredData.length === 0) return;

        const columns = ['status', 'Nome', 'Ruolo', 'Squadra', 'Fantamedia 2024-2025', 'Punteggio', 'Trend', 'actions'];
        const column = columns[columnIndex];

        if (column === 'status' || column === 'actions') return;

        if (this.currentSort.column === column) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = column;
            this.currentSort.direction = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';

            if (column === 'Fantamedia 2024-2025' || column === 'Punteggio') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }

            if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.displayData(this.filteredData);
    }

    updateStatus(message, type = 'success') {
        const statusLabel = document.getElementById('statusLabel');
        
        if (statusLabel) {
            statusLabel.textContent = message;
            statusLabel.className = type === 'error' ? 'error' : '';
        }
    }
}

// Global app instance
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FantacalcioApp();
});
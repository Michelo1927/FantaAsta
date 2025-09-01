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
        this.isMobile = window.innerWidth <= 768;
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
        this.checkMobileView();
    }

    checkMobileView() {
        this.isMobile = window.innerWidth <= 768;
        
        // Update resize listener
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                // Device type changed, refresh display
                this.displayData(this.filteredData);
                this.updateBudgetDisplay();
            }
        });
    }

    setupEventListeners() {
        // Desktop CSV loading
        document.getElementById('loadCsvBtn')?.addEventListener('click', () => {
            this.loadCSVFile('csvFile');
        });

        // Mobile CSV loading
        document.getElementById('mobileLoadCsvBtn')?.addEventListener('click', () => {
            this.loadCSVFile('mobileCSVFile');
        });

        // Desktop search form
        document.getElementById('searchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchPlayers(false);
        });

        // Mobile search form
        document.getElementById('mobileSearchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchPlayers(true);
        });

        // Reset buttons
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.resetFilters(false);
        });

        document.getElementById('mobileResetBtn')?.addEventListener('click', () => {
            this.resetFilters(true);
        });

        // Hide acquired checkboxes
        document.getElementById('hideAcquired')?.addEventListener('change', () => {
            this.searchPlayers(false);
        });

        document.getElementById('mobileHideAcquired')?.addEventListener('change', () => {
            this.searchPlayers(true);
        });

        // Team management buttons
        document.getElementById('clearTeamBtn')?.addEventListener('click', () => {
            this.clearTeam();
        });

        document.getElementById('mobileClearTeamBtn')?.addEventListener('click', () => {
            this.clearTeam();
        });

        document.getElementById('exportTeamBtn')?.addEventListener('click', () => {
            this.exportTeam();
        });

        document.getElementById('mobileExportTeamBtn')?.addEventListener('click', () => {
            this.exportTeam();
        });

        // Mobile tab navigation
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMobileTab(e.target.dataset.tab);
            });
        });

        // Desktop quick filters
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickFilter(e.target.dataset.filter, false);
            });
        });

        // Mobile quick filters
        document.querySelectorAll('.mobile-quick-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickFilter(e.target.dataset.filter, true);
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

        // Setup table sorting
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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.mobile-content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`mobile-${tabName}`).classList.add('active');
    }

    loadCSVFile(inputId) {
        const fileInput = document.getElementById(inputId);
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
                
                // Sync file inputs
                if (inputId === 'csvFile') {
                    document.getElementById('mobileCSVFile').files = fileInput.files;
                } else {
                    document.getElementById('csvFile').files = fileInput.files;
                }
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
            this.applyQuickFilter(this.currentQuickFilter, false);
            this.applyQuickFilter(this.currentQuickFilter, true);
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
        // Popola filtri desktop e mobile
        const teams = [...new Set(this.data.map(player => player.Squadra))].sort();
        
        // Desktop filters
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

        // Mobile filters
        const mobileTeamSelect = document.getElementById('mobileTeam');
        if (mobileTeamSelect) {
            mobileTeamSelect.innerHTML = '<option value="">Tutte</option>';
            teams.forEach(team => {
                if (team) {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    mobileTeamSelect.appendChild(option);
                }
            });
        }

        // Popola filtro skills
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

        // Desktop skills
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

    applyQuickFilter(filterType, isMobile = false) {
        if (this.data.length === 0) {
            this.updateStatus('Carica prima un file CSV', 'error');
            return;
        }

        this.currentQuickFilter = filterType;
        
        // Aggiorna UI dei bottoni
        const filterSelector = isMobile ? '.mobile-quick-filter' : '.quick-filter-btn';
        document.querySelectorAll(filterSelector).forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (isMobile) {
            document.querySelector(`.mobile-quick-filter[data-filter="${filterType}"]`)?.classList.add('active');
        } else {
            document.querySelector(`.quick-filter-btn[data-filter="${filterType}"]`)?.classList.add('active');
        }

        // Reset dei filtri di ricerca quando si applica un filtro rapido
        if (isMobile) {
            document.getElementById('mobileSearchForm')?.reset();
            const minScore = document.getElementById('mobileMinScore');
            const maxScore = document.getElementById('mobileMaxScore');
            if (minScore) minScore.value = 0;
            if (maxScore) maxScore.value = 100;
        } else {
            document.getElementById('searchForm')?.reset();
            const minScore = document.getElementById('minScore');
            const maxScore = document.getElementById('maxScore');
            if (minScore) minScore.value = 0;
            if (maxScore) maxScore.value = 100;
        }

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
        const tableId = this.isMobile ? 'playersTable' : 'desktopPlayersTable';
        const tbody = document.querySelector(`#${tableId} tbody`);
        
        if (!tbody) return;
        
        tbody.innerHTML = '';

        data.forEach((player, index) => {
            const row = document.createElement('tr');
            
            const nome = player.Nome || '';
            const ruolo = player.Ruolo || '';
            const squadra = player.Squadra || '';
            const fantamedia = player['Fantamedia anno 2024-2025'] || player['Fantamedia 2024-2025'] || '';
            const punteggio = player.Punteggio || '';
            const trend = player.Trend || 'STABLE';
            
            const isAcquired = this.acquiredPlayers.has(player.id);
            const isMyPlayer = this.myTeam.some(p => p.id === player.id);
            
            // Controlla se il ruolo è al limite
            const positionCategory = this.getPositionCategory(ruolo);
            const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
            const isPositionFull = currentCount >= this.positionLimits[positionCategory];
            
            if (isAcquired) row.classList.add('acquired');
            if (isMyPlayer) row.classList.add('my-player');
            
            // Mobile layout - simplified table
            if (this.isMobile) {
                row.innerHTML = `
                    <td>${nome}</td>
                    <td>${ruolo}</td>
                    <td>${punteggio}</td>
                    <td>
                        ${!isMyPlayer && !isAcquired ? 
                            (isPositionFull ? 
                                '<span style="color: #ff9800; font-size: 10px;">LIMITE</span>' :
                                `<button class="btn btn-primary btn-small" data-player-id="${player.id}" style="padding: 4px 8px; font-size: 10px;">Acquista</button>`
                            ) :
                            isMyPlayer ? '<span style="color: #4CAF50; font-weight: bold; font-size: 10px;">MIO</span>' :
                            '<span style="color: #f44336; font-size: 10px;">PRESO</span>'
                        }
                    </td>
                `;
            } else {
                // Desktop layout - full table
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="status-checkbox" ${isAcquired ? 'checked' : ''} 
                               data-player-id="${player.id}">
                    </td>
                    <td>${nome}</td>
                    <td>${ruolo}</td>
                    <td>${squadra}</td>
                    <td>${fantamedia}</td>
                    <td>${punteggio}</td>
                    <td class="trend-${trend.toLowerCase()}">${trend}</td>
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
            }
            
            // Aggiungi event listeners per checkbox e bottone
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

    calculateAverageBudget() {
        const remainingBudget = this.getRemainingBudget();
        const remainingSlots = 25 - this.myTeam.length;
        
        if (remainingSlots <= 0) {
            return 0;
        }
        
        return Math.floor(remainingBudget / remainingSlots);
    }

    openPurchaseModal(playerId) {
        const player = this.data.find(p => p.id === playerId);
        
        if (!player) {
            alert('Errore: giocatore non trovato');
            return;
        }

        // Controlla limiti di ruolo
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
        
        // Calcola budget medio suggerito
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
        
        // Ricontrolla i limiti prima dell'acquisto
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

    updateTeamDisplay() {
        // Update desktop team display
        this.updateDesktopTeamDisplay();
        
        // Update mobile team display
        this.updateMobileTeamDisplay();
    }

    updateDesktopTeamDisplay() {
        const teamList = document.getElementById('myTeamList');
        const teamCount = document.getElementById('teamCount');
        
        if (!teamList || !teamCount) return;
        
        teamCount.textContent = this.myTeam.length;
        
        if (this.myTeam.length === 0) {
            teamList.innerHTML = '<p class="empty-team">Nessun giocatore acquistato</p>';
            return;
        }

        // Raggruppa i giocatori per posizione
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

        // Ordina i giocatori per nome in ogni posizione
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
                                        <button class="remove-player" data-remove-id="${player.id}">✕</button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Aggiungi event listeners per i bottoni rimuovi
        document.querySelectorAll('[data-remove-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const playerId = button.getAttribute('data-remove-id');
                this.removePlayerFromTeam(playerId);
            });
        });
    }

    updateMobileTeamDisplay() {
        const mobileTeamList = document.getElementById('mobileTeamList');
        const mobileTeamCount = document.getElementById('mobileTeamCount');
        
        if (!mobileTeamList || !mobileTeamCount) return;
        
        mobileTeamCount.textContent = this.myTeam.length;
        
        if (this.myTeam.length === 0) {
            mobileTeamList.innerHTML = '<p class="empty-team">Nessun giocatore acquistato</p>';
            return;
        }

        // Mobile simplified team display
        const teamHTML = this.myTeam.map(player => `
            <div class="team-player" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; font-size: 14px;">${player.nome}</div>
                        <div style="font-size: 12px; color: #666;">${player.ruolo} - ${player.squadra}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: bold; color: #2196F3;">${player.price} crediti</span>
                        <button class="remove-player" data-remove-id="${player.id}" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 4px 8px; font-size: 12px;">✕</button>
                    </div>
                </div>
            </div>
        `).join('');

        mobileTeamList.innerHTML = teamHTML;

        // Aggiungi event listeners per i bottoni rimuovi
        document.querySelectorAll('[data-remove-id]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const playerId = button.getAttribute('data-remove-id');
                this.removePlayerFromTeam(playerId);
            });
        });
    }

    updateBudgetDisplay() {
        const spent = this.myTeam.reduce((total, player) => total + player.price, 0);
        const remaining = this.totalBudget - spent;
        const averageBudget = this.calculateAverageBudget();
        
        // Desktop budget display
        const spentElement = document.getElementById('spentBudget');
        const remainingElement = document.getElementById('remainingBudget');
        const averageElement = document.getElementById('averageBudget');
        
        if (spentElement) spentElement.textContent = spent;
        if (remainingElement) remainingElement.textContent = remaining;
        if (averageElement) averageElement.textContent = `Budget medio: ${averageBudget} crediti per giocatore`;
        
        // Mobile budget display
        const mobileRemainingElement = document.getElementById('mobileBudgetRemaining');
        const mobileSpentElement = document.getElementById('mobileSpentBudget');
        const mobileRemainingBudgetElement = document.getElementById('mobileRemainingBudget');
        const mobileAverageElement = document.getElementById('mobileAverageBudget');
        
        if (mobileRemainingElement) mobileRemainingElement.textContent = remaining;
        if (mobileSpentElement) mobileSpentElement.textContent = spent;
        if (mobileRemainingBudgetElement) mobileRemainingBudgetElement.textContent = remaining;
        if (mobileAverageElement) mobileAverageElement.textContent = averageBudget;
        
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
    }

    showPlayerDetails(player) {
        // Desktop details
        const detailsContainer = document.getElementById('playerDetails');
        
        // Mobile details
        const mobileDetailsContainer = document.getElementById('mobilePlayerDetails');
        
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
        
        if (detailsContainer) detailsContainer.innerHTML = detailsHTML;
        if (mobileDetailsContainer) mobileDetailsContainer.innerHTML = detailsHTML;
        
        // Auto switch to details tab on mobile
        if (this.isMobile) {
            this.switchMobileTab('details');
        }
    }

    searchPlayers(isMobile = false) {
        if (this.data.length === 0) {
            this.updateStatus('Carica prima un file CSV', 'error');
            return;
        }

        const prefix = isMobile ? 'mobile' : '';
        const name = document.getElementById(`${prefix}${prefix ? 'PlayerName' : 'playerName'}`)?.value.toLowerCase() || '';
        const role = document.getElementById(`${prefix}${prefix ? 'Role' : 'role'}`)?.value || '';
        const team = document.getElementById(`${prefix}${prefix ? 'Team' : 'team'}`)?.value || '';
        const skill = document.getElementById(`${prefix ? '' : 'skill'}`)?.value || '';
        const minScore = parseFloat(document.getElementById(`${prefix}${prefix ? 'MinScore' : 'minScore'}`)?.value || 0);
        const maxScore = parseFloat(document.getElementById(`${prefix}${prefix ? 'MaxScore' : 'maxScore'}`)?.value || 100);
        const hideAcquired = document.getElementById(`${prefix}${prefix ? 'HideAcquired' : 'hideAcquired'}`)?.checked || false;

        // Reset del filtro rapido se si usa la ricerca avanzata
        this.currentQuickFilter = 'tutti';
        document.querySelectorAll('.quick-filter-btn, .mobile-quick-filter').forEach(btn => {
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
        
        // Switch to players tab on mobile after search
        if (isMobile) {
            this.switchMobileTab('players');
        }
    }

    resetFilters(isMobile = false) {
        if (isMobile) {
            document.getElementById('mobileSearchForm')?.reset();
            const minScore = document.getElementById('mobileMinScore');
            const maxScore = document.getElementById('mobileMaxScore');
            if (minScore) minScore.value = 0;
            if (maxScore) maxScore.value = 100;
        } else {
            document.getElementById('searchForm')?.reset();
            const minScore = document.getElementById('minScore');
            const maxScore = document.getElementById('maxScore');
            if (minScore) minScore.value = 0;
            if (maxScore) maxScore.value = 100;
        }
        
        // Reset anche il filtro rapido
        this.applyQuickFilter('tutti', isMobile);
        
        const detailsContainer = isMobile ? 
            document.getElementById('mobilePlayerDetails') : 
            document.getElementById('playerDetails');
            
        if (detailsContainer) {
            detailsContainer.innerHTML = 
                '<p>Seleziona un giocatore dalla tabella per visualizzarne i dettagli</p>';
        }
    }

    sortTable(columnIndex) {
        if (this.filteredData.length === 0) return;

        const columns = this.isMobile ? 
            ['Nome', 'Ruolo', 'Punteggio', 'actions'] :
            ['status', 'Nome', 'Ruolo', 'Squadra', 'Fantamedia 2024-2025', 'Punteggio', 'Trend', 'actions'];
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
        const desktopStatusLabel = document.getElementById('desktopStatusLabel');
        
        if (statusLabel) {
            statusLabel.textContent = message;
            statusLabel.className = type === 'error' ? 'error' : '';
        }
        
        if (desktopStatusLabel) {
            desktopStatusLabel.textContent = message;
            desktopStatusLabel.className = type === 'error' ? 'error' : '';
        }
    }
}

// Global app instance
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FantacalcioApp();
});
// Classe per la strategia di fantacalcio
class StrategiaFantacalcio {
    constructor(app) {
        this.app = app;
        this.strategieDisponibili = {
            'conservativa': { budget: 0.7, rischio: 0.2 },
            'equilibrata': { budget: 0.5, rischio: 0.5 },
            'aggressiva': { budget: 0.3, rischio: 0.8 }
        };
    }

    getStrategiaPerRuolo() {
    // USA strategia personalizzata se disponibile
    if (this.strategiaPersonalizzata) {
        return {
            'POR': { 
                budget: this.strategiaPersonalizzata.POR.budget,
                priorita: ['titolare', 'giovane'],
                descrizione: `${this.strategiaPersonalizzata.POR.percentage}% del budget (${this.strategiaPersonalizzata.POR.budget} crediti)`
            },
            'DIF': { 
                budget: this.strategiaPersonalizzata.DIF.budget,
                priorita: ['titolare', 'trend_up'],
                descrizione: `${this.strategiaPersonalizzata.DIF.percentage}% del budget (${this.strategiaPersonalizzata.DIF.budget} crediti)`
            },
            'CEN': { 
                budget: this.strategiaPersonalizzata.CEN.budget,
                priorita: ['fantamedia', 'rigorista'],
                descrizione: `${this.strategiaPersonalizzata.CEN.percentage}% del budget (${this.strategiaPersonalizzata.CEN.budget} crediti)`
            },
            'ATT': { 
                budget: this.strategiaPersonalizzata.ATT.budget,
                priorita: ['punteggio', 'nuovo_acquisto'],
                descrizione: `${this.strategiaPersonalizzata.ATT.percentage}% del budget (${this.strategiaPersonalizzata.ATT.budget} crediti)`
            }
        };
    }
    
    // Strategia di default se non personalizzata
    return {
        'POR': { 
            budget: 45, // 9% del budget
            priorita: ['titolare', 'giovane'],
            descrizione: 'Punta su 1 titolare forte + 2 riserve economiche'
        },
        'DIF': { 
            budget: 180, // 36% del budget
            priorita: ['titolare', 'trend_up'],
            descrizione: '4-5 titolari affidabili, evita scommesse'
        },
        'CEN': { 
            budget: 180, // 36% del budget
            priorita: ['fantamedia', 'rigorista'],
            descrizione: 'Mix di qualità e quantità, cerca rigoristi'
        },
        'ATT': { 
            budget: 95, // 19% del budget
            priorita: ['punteggio', 'nuovo_acquisto'],
            descrizione: 'Pochi ma buoni, scommetti sui nuovi acquisti'
        }
    };
}




// Calcola le fasce di prezzo di un giocatore (min-media-max)
calcolaFascePrezzo(player) {
    const punteggio = parseFloat(player.Punteggio) || 0;
    const fantamedia = parseFloat(player['Fantamedia 2024-2025']) || parseFloat(player['Fantamedia anno 2024-2025']) || 0;
    const ruolo = player.Ruolo || '';
    const squadra = player.Squadra || '';
    
    // LOGICA SPECIALE PER PORTIERI (molto più contenuta)
    if (ruolo === 'POR') {
        return this.calcolaFascePortieri(player, punteggio, squadra, fantamedia);
    }
    
    // CLASSIFICAZIONE SQUADRE (per altri ruoli)
    const classificazioneSquadre = {
        // Alta classifica
        'Inter': 'alta',
        'Juventus': 'alta', 
        'Milan': 'alta',
        'Napoli': 'alta',
        'Atalanta': 'alta',
        'Roma': 'alta',
        'Lazio': 'alta',
        
        // Media classifica
        'Fiorentina': 'media',
        'Bologna': 'media',
        'Torino': 'media',
        'Udinese': 'media',
        'Genoa': 'media',
        'Sassuolo': 'media',
        'Verona': 'media',
        'Parma': 'media',
        'Como': 'media',
        
        // Bassa classifica
        'Cagliari': 'bassa',
        'Lecce': 'bassa',
        'Cremonese': 'bassa',
        'Pisa': 'bassa'
    };
    
    const tipoSquadra = classificazioneSquadre[squadra] || 'media';
    
    // VALORI MINIMI GARANTITI PER GIOCATORI TOP (punteggio >= 80) - ALTRI RUOLI
    const minimiGarantiti = {
        'alta': {
            'DIF': { min: 50, media: 70, max: 100 },
            'CEN': { min: 80, media: 110, max: 150 },
            'TRQ': { min: 80, media: 110, max: 150 },
            'ATT': { min: 200, media: 250, max: 350 }
        },
        'media': {
            'DIF': { min: 40, media: 55, max: 80 },
            'CEN': { min: 70, media: 90, max: 120 },
            'TRQ': { min: 70, media: 90, max: 120 },
            'ATT': { min: 130, media: 170, max: 220 }
        },
        'bassa': {
            'DIF': { min: 25, media: 35, max: 50 },
            'CEN': { min: 55, media: 70, max: 90 },
            'TRQ': { min: 55, media: 70, max: 90 },
            'ATT': { min: 90, media: 120, max: 160 }
        }
    };
    
    // VALORE BASE PROPORZIONATO AL PUNTEGGIO
    let fattorePunteggio = 0;
    
    if (punteggio >= 90) {
        fattorePunteggio = 1.0; // Top assoluti = valore pieno
    } else if (punteggio >= 85) {
        fattorePunteggio = 0.85; // Molto forti = 85%
    } else if (punteggio >= 80) {
        fattorePunteggio = 0.7; // Forti = 70%
    } else if (punteggio >= 75) {
        fattorePunteggio = 0.5; // Buoni = 50%
    } else if (punteggio >= 70) {
        fattorePunteggio = 0.35; // Discreti = 35%
    } else if (punteggio >= 60) {
        fattorePunteggio = 0.2; // Medi = 20%
    } else {
        fattorePunteggio = 0.1; // Scarsi = 10%
    }
    
    // CALCOLO FASCE BASATE SUI MINIMI GARANTITI
    const minimi = minimiGarantiti[tipoSquadra][ruolo] || minimiGarantiti['media']['CEN'];
    
    let prezzoMin = Math.round(minimi.min * fattorePunteggio);
    let prezzoMedio = Math.round(minimi.media * fattorePunteggio);
    let prezzoMax = Math.round(minimi.max * fattorePunteggio);
    
    // BONUS PER SKILLS
    if (player.Skills) {
        const skills = player.Skills.toLowerCase();
        
        if (skills.includes('titolare')) {
            // Bonus titolare proporzionato al livello squadra
            const bonusTitolare = {
                'alta': { min: 15, media: 25, max: 40 },
                'media': { min: 10, media: 18, max: 30 },
                'bassa': { min: 8, media: 12, max: 20 }
            };
            
            const bonus = bonusTitolare[tipoSquadra];
            prezzoMin += bonus.min;
            prezzoMedio += bonus.media;
            prezzoMax += bonus.max;
        }
        
        if (skills.includes('rigorista')) {
            // Rigoristi più preziosi per attaccanti e trequartisti
            const bonusRigorista = {
                'ATT': { min: 30, media: 50, max: 80 },
                'TRQ': { min: 20, media: 35, max: 55 },
                'CEN': { min: 10, media: 20, max: 35 }
            };
            
            const bonus = bonusRigorista[ruolo] || { min: 0, media: 0, max: 0 };
            prezzoMin += bonus.min;
            prezzoMedio += bonus.media;
            prezzoMax += bonus.max;
        }
        
        if (skills.includes('giovane')) {
            // Giovani: più volatilità nei prezzi
            prezzoMin = Math.round(prezzoMin * 0.8);
            prezzoMax = Math.round(prezzoMax * 1.3);
        }
    }
    
    // BONUS TREND
    if (player.Trend === 'UP') {
        prezzoMin = Math.round(prezzoMin * 1.1);
        prezzoMedio = Math.round(prezzoMedio * 1.2);
        prezzoMax = Math.round(prezzoMax * 1.4);
    } else if (player.Trend === 'DOWN') {
        prezzoMin = Math.round(prezzoMin * 0.8);
        prezzoMedio = Math.round(prezzoMedio * 0.9);
        prezzoMax = Math.round(prezzoMax * 0.95);
    }
    
    // BONUS NUOVO ACQUISTO
    if (player['Nuovo acquisto'] === 'True') {
        // Nuovi acquisti = più hype = prezzi più alti
        prezzoMin = Math.round(prezzoMin * 1.0);
        prezzoMedio = Math.round(prezzoMedio * 1.15);
        prezzoMax = Math.round(prezzoMax * 1.4);
    }
    
    // BONUS FANTAMEDIA
    if (fantamedia > 0) {
        const bonusFantamedia = Math.round(fantamedia * 3);
        prezzoMin += Math.round(bonusFantamedia * 0.5);
        prezzoMedio += bonusFantamedia;
        prezzoMax += Math.round(bonusFantamedia * 1.5);
    }
    
    // GARANTISCI VALORI MINIMI E ORDINE LOGICO
    prezzoMin = Math.max(1, prezzoMin);
    prezzoMedio = Math.max(prezzoMin + 2, prezzoMedio);
    prezzoMax = Math.max(prezzoMedio + 5, prezzoMax);
    
    // TETTI MASSIMI ASSOLUTI (per evitare prezzi assurdi)
    const tettiMassimi = {
        'ATT': 500,  // Fenomeni possono arrivare anche a 500
        'TRQ': 300,  
        'CEN': 250,   
        'DIF': 150   
    };
    
    const tetto = tettiMassimi[ruolo] || 200;
    prezzoMax = Math.min(prezzoMax, tetto);
    
    return {
        min: prezzoMin,
        medio: prezzoMedio,
        max: prezzoMax
    };
}

// METODO SPECIALE PER CALCOLARE I PREZZI DEI PORTIERI
calcolaFascePortieri(player, punteggio, squadra, fantamedia) {
    // CLASSIFICAZIONE SQUADRE PER PORTIERI
    const livelloSquadra = {
        // Alta classifica - portieri più costosi
        'Inter': 'alta',
        'Juventus': 'alta', 
        'Milan': 'alta',
        'Napoli': 'alta',
        'Atalanta': 'alta',
        'Roma': 'media_alta',
        'Lazio': 'media_alta',
        
        // Media classifica
        'Fiorentina': 'media',
        'Bologna': 'media',
        'Torino': 'media',
        'Udinese': 'media',
        'Genoa': 'media',
        'Sassuolo': 'media',
        'Verona': 'media',
        'Parma': 'media',
        'Como': 'media',
        
        // Bassa classifica
        'Cagliari': 'bassa',
        'Lecce': 'bassa',
        'Cremonese': 'bassa',
        'Pisa': 'bassa'
    };
    
    const livello = livelloSquadra[squadra] || 'media';
    
    // FASCE REALISTICHE PER PORTIERI
    const fascePortieri = {
        // Punteggio >= 85 (portieri fenomeni)
        'fenomeno': {
            'alta': { min: 25, media: 35, max: 50 },
            'media_alta': { min: 20, media: 28, max: 40 },
            'media': { min: 15, media: 22, max: 35 },
            'bassa': { min: 12, media: 18, max: 28 }
        },
        // Punteggio 80-84 (portieri top)
        'top': {
            'alta': { min: 18, media: 25, max: 35 },
            'media_alta': { min: 15, media: 20, max: 30 },
            'media': { min: 12, media: 16, max: 25 },
            'bassa': { min: 10, media: 13, max: 20 }
        },
        // Punteggio 75-79 (portieri buoni)
        'buono': {
            'alta': { min: 12, media: 18, max: 28 },
            'media_alta': { min: 10, media: 15, max: 22 },
            'media': { min: 8, media: 12, max: 18 },
            'bassa': { min: 6, media: 10, max: 15 }
        },
        // Punteggio 70-74 (portieri discreti)
        'discreto': {
            'alta': { min: 8, media: 15, max: 25 },
            'media_alta': { min: 6, media: 12, max: 20 },
            'media': { min: 5, media: 10, max: 16 },
            'bassa': { min: 4, media: 8, max: 12 }
        },
        // Punteggio 65-69 (portieri normali)
        'normale': {
            'alta': { min: 5, media: 10, max: 18 },
            'media_alta': { min: 4, media: 8, max: 15 },
            'media': { min: 3, media: 6, max: 12 },
            'bassa': { min: 2, media: 5, max: 10 }
        },
        // Punteggio < 65 (portieri scarsi)
        'scarso': {
            'alta': { min: 2, media: 5, max: 10 },
            'media_alta': { min: 1, media: 4, max: 8 },
            'media': { min: 1, media: 3, max: 6 },
            'bassa': { min: 1, media: 2, max: 4 }
        }
    };
    
    // DETERMINA CATEGORIA PORTIERE
    let categoria = 'scarso';
    if (punteggio >= 85) categoria = 'fenomeno';
    else if (punteggio >= 80) categoria = 'top';
    else if (punteggio >= 75) categoria = 'buono';
    else if (punteggio >= 70) categoria = 'discreto';
    else if (punteggio >= 65) categoria = 'normale';
    
    // OTTIENI FASCE BASE
    const fasce = fascePortieri[categoria][livello];
    let prezzoMin = fasce.min;
    let prezzoMedio = fasce.media;
    let prezzoMax = fasce.max;
    
    // BONUS PER SKILLS (molto contenuti per portieri)
    if (player.Skills) {
        const skills = player.Skills.toLowerCase();
        
        if (skills.includes('titolare')) {
            // Bonus titolare per portieri (piccolo)
            const bonusTitolare = {
                'alta': { min: 5, media: 8, max: 12 },
                'media_alta': { min: 4, media: 6, max: 10 },
                'media': { min: 3, media: 5, max: 8 },
                'bassa': { min: 2, media: 3, max: 5 }
            };
            
            const bonus = bonusTitolare[livello];
            prezzoMin += bonus.min;
            prezzoMedio += bonus.media;
            prezzoMax += bonus.max;
        }
        
        if (skills.includes('giovane')) {
            // Giovani portieri: più volatilità ma contenuta
            prezzoMin = Math.round(prezzoMin * 0.8);
            prezzoMax = Math.round(prezzoMax * 1.2);
        }
    }
    
    // BONUS TREND (molto piccoli)
    if (player.Trend === 'UP') {
        prezzoMin += 2;
        prezzoMedio += 3;
        prezzoMax += 5;
    } else if (player.Trend === 'DOWN') {
        prezzoMin = Math.max(1, prezzoMin - 2);
        prezzoMedio = Math.max(2, prezzoMedio - 3);
        prezzoMax = Math.max(3, prezzoMax - 3);
    }
    
    // BONUS NUOVO ACQUISTO (minimo per portieri)
    if (player['Nuovo acquisto'] === 'True') {
        prezzoMedio += 2;
        prezzoMax += 4;
    }
    
    // BONUS FANTAMEDIA (molto contenuto)
    if (fantamedia > 0) {
        const bonusFantamedia = Math.round(fantamedia * 0.5); // Molto ridotto
        prezzoMin += Math.round(bonusFantamedia * 0.3);
        prezzoMedio += Math.round(bonusFantamedia * 0.6);
        prezzoMax += bonusFantamedia;
    }
    
    // GARANTISCI VALORI MINIMI E ORDINE LOGICO
    prezzoMin = Math.max(1, prezzoMin);
    prezzoMedio = Math.max(prezzoMin + 1, prezzoMedio);
    prezzoMax = Math.max(prezzoMedio + 2, prezzoMax);
    
    // TETTO MASSIMO ASSOLUTO PER PORTIERI
    prezzoMax = Math.min(prezzoMax, 60); // Mai più di 60 crediti
    prezzoMedio = Math.min(prezzoMedio, 45);
    prezzoMin = Math.min(prezzoMin, 35);
    
    return {
        min: prezzoMin,
        medio: prezzoMedio,
        max: prezzoMax
    };
}

// Mantieni il vecchio metodo per compatibilità ma usa la fascia media
calcolaValoreMercato(player) {
    const fasce = this.calcolaFascePrezzo(player);
    return fasce.medio;
}


    // Analizza la squadra attuale e suggerisce miglioramenti
    // Analizza la squadra attuale e suggerisce miglioramenti
analizzaSquadra() {
    const analisi = {
        puntiForza: [],
        puntiDeboli: [],
        suggerimenti: [],
        biasDetection: [] // NUOVO: Aggiungiamo array per bias detection
    };

    if (this.app.myTeam.length === 0) {
        analisi.suggerimenti.push('Inizia ad acquistare giocatori per vedere l\'analisi');
        return analisi;
    }

    const strategia = this.getStrategiaPerRuolo();
    
    // ANALISI ESISTENTE per ruoli...
    Object.keys(strategia).forEach(ruolo => {
        const categoria = this.getRuoloCategory(ruolo);
        const giocatoriRuolo = this.app.myTeam.filter(p => 
            this.app.getPositionCategory(p.ruolo) === categoria
        );
        
        const budgetSpeso = giocatoriRuolo.reduce((sum, p) => sum + p.price, 0);
        const budgetConsigliato = strategia[ruolo].budget;
        const numeroGiocatori = giocatoriRuolo.length;
        
        if (budgetSpeso > budgetConsigliato * 1.3) {
            analisi.puntiDeboli.push(`${ruolo}: Budget troppo alto (${budgetSpeso}/${budgetConsigliato} consigliati)`);
        } else if (budgetSpeso < budgetConsigliato * 0.6 && numeroGiocatori > 0) {
            analisi.suggerimenti.push(`${ruolo}: Puoi investire di più (${budgetSpeso}/${budgetConsigliato} consigliati)`);
        } else if (numeroGiocatori > 0) {
            analisi.puntiForza.push(`${ruolo}: Budget equilibrato (${budgetSpeso}/${budgetConsigliato})`);
        }
    });

    // 🧠 NUOVO: BIAS DETECTION
    analisi.biasDetection = this.detectBias();

    // Analisi generale esistente...
    const totalSpent = this.app.myTeam.reduce((sum, p) => sum + p.price, 0);
    const averagePrice = totalSpent / this.app.myTeam.length;
    
    if (averagePrice > 25) {
        analisi.suggerimenti.push('Prezzo medio alto: considera qualche acquisto economico');
    } else if (averagePrice < 15) {
        analisi.suggerimenti.push('Prezzo medio basso: potresti investire di più sui top player');
    }

    if (analisi.puntiForza.length === 0) {
        analisi.suggerimenti.push('Continua ad acquistare per bilanciare la rosa');
    }

    return analisi;
}

// 🧠 NUOVO METODO: Rileva bias negli acquisti
detectBias() {
    const bias = [];
    
    if (this.app.myTeam.length < 3) {
        return bias; // Troppo pochi giocatori per rilevare bias
    }
    
    // 1. 🏟️ BIAS CONCENTRAZIONE SQUADRE
    const squadreCount = this.analizzaConcentrazioneSquadre();
    squadreCount.forEach(({ squadra, count, percentage, players, totalSpent }) => {
        if (count >= 4) {
            bias.push({
                tipo: 'squadra_alta',
                severita: 'alta',
                messaggio: `⚠️ Troppi giocatori della ${squadra} (${count} giocatori, ${percentage}% della rosa)`,
                dettagli: `Spesi ${totalSpent} crediti in una sola squadra. Rischio alto se la squadra non rende.`,
                suggerimento: 'Diversifica gli acquisti per ridurre il rischio',
                icona: '🏟️'
            });
        } else if (count >= 3 && percentage > 25) {
            bias.push({
                tipo: 'squadra_media',
                severita: 'media',
                messaggio: `💭 Concentrazione elevata sulla ${squadra} (${count} giocatori)`,
                dettagli: `Rappresenta il ${percentage}% della tua rosa attuale.`,
                suggerimento: 'Considera di diversificare le prossime scelte',
                icona: '⚖️'
            });
        }
    });
    
    // 2. 💰 BIAS BUDGET CONCENTRATO
    const budgetBias = this.analizzaBudgetConcentrato();
    if (budgetBias.length > 0) {
        bias.push(...budgetBias);
    }
    
    // 4. 📈 BIAS TREND
    const trendBias = this.analizzaBiasTrend();
    if (trendBias.length > 0) {
        bias.push(...trendBias);
    }
    
    return bias;
}

// Analizza concentrazione per squadra
analizzaConcentrazioneSquadre() {
    const squadreMap = new Map();
    
    // Conta giocatori e budget per squadra
    this.app.myTeam.forEach(player => {
        const squadra = player.squadra;
        if (!squadreMap.has(squadra)) {
            squadreMap.set(squadra, {
                count: 0,
                totalSpent: 0,
                players: []
            });
        }
        
        const squadraData = squadreMap.get(squadra);
        squadraData.count++;
        squadraData.totalSpent += player.price;
        squadraData.players.push(player.nome);
    });
    
    // Calcola percentuali e filtra squadre significative
    const result = [];
    squadreMap.forEach((data, squadra) => {
        if (data.count >= 2) { // Solo squadre con almeno 2 giocatori
            const percentage = Math.round((data.count / this.app.myTeam.length) * 100);
            result.push({
                squadra,
                count: data.count,
                percentage,
                players: data.players,
                totalSpent: data.totalSpent
            });
        }
    });
    
    // Ordina per concentrazione decrescente
    return result.sort((a, b) => b.count - a.count);
}

// Analizza bias budget concentrato
analizzaBudgetConcentrato() {
    const bias = [];
    
    // SERVONO ALMENO 8-10 GIOCATORI per rilevare concentrazione problematica
    if (this.app.myTeam.length < 3) {
        return bias; // Troppo presto per rilevare questo bias
    }
    
    const totalSpent = this.app.myTeam.reduce((sum, p) => sum + p.price, 0);
    const remainingBudget = this.app.getRemainingBudget();
    const remainingSlots = 25 - this.app.myTeam.length;
    const averageBudgetPerSlot = remainingSlots > 0 ? remainingBudget / remainingSlots : 0;
    
    // IDENTIFICAZIONE TOP PLAYER più intelligente
    const topPlayers = this.identifyTopPlayers();
    
    if (topPlayers.length === 0) {
        return bias; // Nessun top player identificato
    }
    
    const topPlayersSpending = topPlayers.reduce((sum, p) => sum + p.price, 0);
    const topPlayersPercentage = (topPlayersSpending / totalSpent) * 100;
    
    // 🔍 ANALISI PIÙ INTELLIGENTE:
    
    // 1. VERIFICA SE PUOI COMPLETARE LA ROSA
    const canCompleteTeam = remainingBudget >= (remainingSlots * 10); // 10 crediti min per slot
    
    // 2. VERIFICA SE HAI SPESO TROPPO (non solo se hai top player)
    const averageTopPlayerPrice = topPlayersSpending / topPlayers.length;
    const isOverspending = averageTopPlayerPrice > 80; // Soglia ragionevole
    
    // 3. CONTA I "VERI PROBLEMI"
    const expensiveTopPlayers = topPlayers.filter(p => p.price > 100);
    const veryExpensiveSpending = expensiveTopPlayers.reduce((sum, p) => sum + p.price, 0);
    const veryExpensivePercentage = (veryExpensiveSpending / totalSpent) * 100;
    
    // 🚨 BIAS ALTA SEVERITÀ: Vero rischio di non completare la rosa
    if (!canCompleteTeam && topPlayersPercentage > 60) {
        bias.push({
            tipo: 'budget_concentrato',
            severita: 'alta',
            messaggio: `💸 Budget concentrato rischia di lasciare la rosa incompleta`,
            dettagli: `${topPlayers.length} top player costano ${topPlayersSpending} crediti. Ti rimangono ${remainingBudget} crediti per ${remainingSlots} slot (serve almeno ${remainingSlots * 10}).`,
            suggerimento: 'Riduci gli acquisti costosi o aumenta il budget per completare la rosa.',
            icona: '💰'
        });
    }
    // ⚠️ BIAS MEDIA SEVERITÀ: Spesa eccessiva ma gestibile
    else if (veryExpensivePercentage > 50 && expensiveTopPlayers.length >= 2) {
        bias.push({
            tipo: 'budget_concentrato',
            severita: 'media',
            messaggio: `💭 Spesa elevata sui top player più costosi (${Math.round(veryExpensivePercentage)}%)`,
            dettagli: `Hai speso molto su ${expensiveTopPlayers.length} giocatori costosi: ${expensiveTopPlayers.map(p => `${p.nome} (${p.price})`).join(', ')}.`,
            suggerimento: 'Bilancia con acquisti più economici per il resto della rosa.',
            icona: '⚖️'
        });
    }
    // 💡 BIAS INFORMATIVO: Concentrazione alta ma con buoni affari
    else if (topPlayersPercentage > 70 && canCompleteTeam && averageTopPlayerPrice <= 60) {
        bias.push({
            tipo: 'budget_concentrato',
            severita: 'bassa',
            messaggio: `💡 Strategia concentrata sui top player (${Math.round(topPlayersPercentage)}%)`,
            dettagli: `Hai fatto buoni affari sui top player (media ${Math.round(averageTopPlayerPrice)} crediti). Budget sufficiente per completare la rosa.`,
            suggerimento: 'Strategia valida! Continua con acquisti economici per completare.',
            icona: '✅'
        });
    }
    
    return bias;
}

// NUOVO METODO: Identifica i veri top player
identifyTopPlayers() {
    const topPlayers = [];
    
    // SQUADRE TOP per identificare i top player
    const squadreTop = ['Inter', 'Juventus', 'Milan', 'Napoli', 'Atalanta', 'Roma', 'Lazio'];
    
    this.app.myTeam.forEach(player => {
        // Trova il giocatore originale per avere tutti i dati
        const originalPlayer = this.app.data.find(p => p.id === player.id);
        if (!originalPlayer) return;
        
        const punteggio = parseFloat(originalPlayer.Punteggio) || 0;
        const squadra = originalPlayer.Squadra || '';
        const skills = originalPlayer.Skills || '';
        const prezzo = player.price;
        
        // CRITERI per essere considerato TOP PLAYER:
        let isTopPlayer = false;
        let motivo = [];
        
        // 1. TITOLARE di SQUADRA TOP
        if (squadreTop.includes(squadra) && skills.toLowerCase().includes('titolare')) {
            isTopPlayer = true;
            motivo.push(`Titolare ${squadra}`);
        }
        
        // 2. PREZZO ALTO (indica investimento importante)
        let prezzoAlto = false;
        if (player.ruolo === 'ATT' && prezzo >= 120) prezzoAlto = true;
        else if (player.ruolo === 'TRQ' && prezzo >= 90) prezzoAlto = true;
        else if (player.ruolo === 'CEN' && prezzo >= 65) prezzoAlto = true;
        else if (player.ruolo === 'DIF' && prezzo >= 50) prezzoAlto = true;
        else if (player.ruolo === 'POR' && prezzo >= 35) prezzoAlto = true;
        
        if (prezzoAlto) {
            isTopPlayer = true;
            motivo.push(`Prezzo alto (${prezzo} crediti)`);
        }
        
        // 3. PUNTEGGIO MOLTO ALTO (indipendentemente da squadra)
        if (punteggio >= 85) {
            isTopPlayer = true;
            motivo.push(`Punteggio alto (${punteggio})`);
        }
        
        // 4. RIGORISTA di valore
        if (skills.toLowerCase().includes('rigorista') && 
            (player.ruolo === 'ATT' || player.ruolo === 'TRQ') && 
            prezzo >= 40) {
            isTopPlayer = true;
            motivo.push('Rigorista di valore');
        }
        
        // AGGIUNGI alla lista se è considerato top player
        if (isTopPlayer) {
            topPlayers.push({
                ...player,
                motivo: motivo.join(', '),
                punteggio: punteggio
            });
        }
    });
    
    // ORDINA per prezzo decrescente
    return topPlayers.sort((a, b) => b.price - a.price);
}


// Analizza bias trend (troppi UP o troppi DOWN)
analizzaBiasTrend() {
    const bias = [];
    
    if (this.app.myTeam.length < 5) return bias; // Serve un campione significativo
    
    // Conta trend dei giocatori acquistati
    let upCount = 0;
    let downCount = 0;
    let totalWithTrend = 0;
    
    this.app.myTeam.forEach(player => {
        // Trova il giocatore originale per avere i dati completi
        const originalPlayer = this.app.data.find(p => p.id === player.id);
        if (originalPlayer && originalPlayer.Trend) {
            totalWithTrend++;
            if (originalPlayer.Trend === 'UP') upCount++;
            if (originalPlayer.Trend === 'DOWN') downCount++;
        }
    });
    
    if (totalWithTrend >= 4) {
        const upPercentage = (upCount / totalWithTrend) * 100;
        const downPercentage = (downCount / totalWithTrend) * 100;
        
        if (upPercentage > 70) {
            bias.push({
                tipo: 'trend_ottimista',
                severita: 'media',
                messaggio: `📈 Molto ottimista nei trend (${upPercentage.toFixed(0)}% giocatori in crescita)`,
                dettagli: `${upCount} su ${totalWithTrend} giocatori hanno trend UP.`,
                suggerimento: 'Bilancia con qualche giocatore stabile per ridurre il rischio.',
                icona: '📈'
            });
        } else if (downPercentage > 50) {
            bias.push({
                tipo: 'trend_pessimista',
                severita: 'alta',
                messaggio: `📉 Troppi giocatori in calo (${downPercentage.toFixed(0)}% trend DOWN)`,
                dettagli: `${downCount} su ${totalWithTrend} giocatori hanno trend DOWN.`,
                suggerimento: 'Attenzione! Cerca giocatori più stabili o in crescita.',
                icona: '📉'
            });
        }
    }
    
    return bias;
}


    // Suggerisce i migliori acquisti disponibili
suggerisciAcquisti(budget = 50, ruoloFiltro = '') {
    if (!this.app.data || this.app.data.length === 0) {
        return [];
    }

    let giocatoriDisponibili = this.app.data.filter(player => 
        !this.app.acquiredPlayers.has(player.id) && 
        !this.app.myTeam.some(p => p.id === player.id)
    );

    // Applica filtro ruolo se specificato
    if (ruoloFiltro && ruoloFiltro !== '') {
        giocatoriDisponibili = giocatoriDisponibili.filter(player => 
            player.Ruolo === ruoloFiltro
        );
    }

    const suggerimenti = giocatoriDisponibili.map(player => {
        const valore = this.calcolaValoreMercato(player);
        const convenienza = valore <= budget ? Math.max(0, (budget - valore) / budget) : -1;
        
        return {
            player,
            valore,
            convenienza,
            motivo: this.getMotivoAcquisto(player),
            priorita: this.calcolaPriorita(player)
        };
    }).filter(s => s.convenienza >= 0)
      .sort((a, b) => {
          // Ordina per priorità e poi per convenienza
          if (a.priorita !== b.priorita) return b.priorita - a.priorita;
          return b.convenienza - a.convenienza;
      })
      .slice(0, 10);

    return suggerimenti;
    }

    calcolaPriorita(player) {
        let priorita = 0;
        
        // Considera ruoli con pochi giocatori
        const categoria = this.getRuoloCategory(player.Ruolo);
        const giocatoriRuolo = this.app.myTeam.filter(p => 
            this.app.getPositionCategory(p.ruolo) === categoria
        ).length;
        const limite = this.app.positionLimits[categoria];
        
        if (giocatoriRuolo < limite / 2) priorita += 3;
        else if (giocatoriRuolo < limite) priorita += 1;
        
        // Bonus per caratteristiche speciali
        if (player.Skills) {
            const skillsText = player.Skills.toLowerCase();
            if (skillsText.includes('titolare')) priorita += 2;
            if (skillsText.includes('rigorista')) priorita += 1;
        }
        
        if (player.Trend === 'UP') priorita += 1;
        if (parseFloat(player.Punteggio) > 70) priorita += 1;
        
        return priorita;
    }

    getMotivoAcquisto(player) {
        const motivi = [];
        
        if (player.Skills) {
            const skillsText = player.Skills.toLowerCase();
            if (skillsText.includes('titolare')) motivi.push('Titolare');
            if (skillsText.includes('rigorista')) motivi.push('Rigorista');
            if (skillsText.includes('giovane')) motivi.push('Giovane');
        }
        
        if (player.Trend === 'UP') motivi.push('In crescita');
        if (player['Nuovo acquisto'] === 'True') motivi.push('Nuovo acquisto');
        if (parseFloat(player.Punteggio) > 75) motivi.push('Alto punteggio');
        
        // Considera ruoli con pochi giocatori
        const categoria = this.getRuoloCategory(player.Ruolo);
        const giocatoriRuolo = this.app.myTeam.filter(p => 
            this.app.getPositionCategory(p.ruolo) === categoria
        ).length;
        const limite = this.app.positionLimits[categoria];
        
        if (giocatoriRuolo < limite / 2) {
            motivi.unshift('Ruolo scoperto');
        }
        
        return motivi.length > 0 ? motivi.join(', ') : 'Buon rapporto qualità/prezzo';
    }

    getRuoloCategory(ruolo) {
        switch(ruolo) {
            case 'POR': return 'Portieri';
            case 'DIF': return 'Difensori';
            case 'CEN': case 'TRQ': return 'Centrocampisti';
            case 'ATT': return 'Attaccanti';
            default: return 'Altri';
        }
    }
}

// Classe principale dell'applicazione
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
    this.positionLimits = {
        'Portieri': 3,
        'Difensori': 8,
        'Centrocampisti': 8,
        'Attaccanti': 6
    };
    // NUOVO: Strategia personalizzata
    this.strategiaPersonalizzata = null;
    this.strategia = new StrategiaFantacalcio(this);
    this.init();
}

    init() {
    this.setupEventListeners();
    this.updateStatus('Carica il file CSV per iniziare');
    this.updateBudgetDisplay();
    this.loadFromLocalStorage();
    
    // CORRETTO: Mostra modal strategia se non è ancora stata impostata
    if (!this.strategiaPersonalizzata) {
        this.showStrategyModal();
    }
}

    // NUOVO METODO: Mostra modal per selezione strategia
// NUOVO METODO: Mostra modal per selezione strategia (VERSIONE COMPATTA)
showStrategyModal() {
    const modalHTML = `
        <div id="strategySetupModal" class="modal strategy-modal" style="display: block;">
            <div class="modal-content strategy-modal-content">
                <div class="modal-header">
                    <h2>🎯 Imposta Strategia Budget</h2>
                </div>
                
                <div class="strategy-presets">
                    <button class="preset-btn" data-preset="conservativa">
                        🛡️ Conservativa<br>
                        <small>POR 10% • DIF 40% • CEN 35% • ATT 15%</small>
                    </button>
                    <button class="preset-btn" data-preset="equilibrata">
                        ⚖️ Equilibrata<br>
                        <small>POR 9% • DIF 28% • CEN 33% • ATT 30%</small>
                    </button>
                    <button class="preset-btn" data-preset="offensiva">
                        ⚔️ Offensiva<br>
                        <small>POR 8% • DIF 22% • CEN 30% • ATT 40%</small>
                    </button>
                </div>
                
                <div class="custom-strategy">
                    <h3>Personalizza:</h3>
                    <div class="role-inputs">
                        <div class="role-input">
                            <label>POR (%)</label>
                            <input type="number" id="porPercentage" min="5" max="20" value="9">
                        </div>
                        <div class="role-input">
                            <label>DIF (%)</label>
                            <input type="number" id="difPercentage" min="15" max="50" value="28">
                        </div>
                        <div class="role-input">
                            <label>CEN (%)</label>
                            <input type="number" id="cenPercentage" min="20" max="50" value="33">
                        </div>
                        <div class="role-input">
                            <label>ATT (%)</label>
                            <input type="number" id="attPercentage" min="10" max="50" value="30">
                        </div>
                    </div>
                    <div class="total-check">
                        Totale: <span id="totalPercentage">100</span>% = <span id="totalCredits">500</span> crediti
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button id="confirmStrategy" class="btn btn-primary">Conferma</button>
                </div>
            </div>
        </div>
    `;
    
    // Aggiungi al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners per il modal strategia
    this.setupStrategyModalListeners();
}

// AGGIORNA METODO: Setup listeners per modal strategia (SEMPLIFICATO)
setupStrategyModalListeners() {
    // Preset strategies
    document.querySelectorAll('.preset-btn').forEach(preset => {
        preset.addEventListener('click', () => {
            // Rimuovi selezione precedente
            document.querySelectorAll('.preset-btn').forEach(p => p.classList.remove('selected'));
            preset.classList.add('selected');
            
            const presetType = preset.dataset.preset;
            this.loadPresetStrategy(presetType);
        });
    });
    
    // Custom percentage inputs
    ['por', 'dif', 'cen', 'att'].forEach(role => {
        const input = document.getElementById(`${role}Percentage`);
        if (input) {
            input.addEventListener('input', () => {
                this.updateCustomStrategy();
            });
        }
    });
    
    // Confirm button
    const confirmBtn = document.getElementById('confirmStrategy');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            this.confirmStrategySelection();
        });
    }
}

// AGGIORNA METODO: Aggiorna strategia personalizzata (SEMPLIFICATO)
updateCustomStrategy() {
    const porPercent = parseInt(document.getElementById('porPercentage').value) || 0;
    const difPercent = parseInt(document.getElementById('difPercentage').value) || 0;
    const cenPercent = parseInt(document.getElementById('cenPercentage').value) || 0;
    const attPercent = parseInt(document.getElementById('attPercentage').value) || 0;
    
    const totalPercent = porPercent + difPercent + cenPercent + attPercent;
    const totalCredits = Math.round((totalPercent / 100) * this.totalBudget);
    
    document.getElementById('totalPercentage').textContent = totalPercent;
    document.getElementById('totalCredits').textContent = totalCredits;
    
    // Colora in base alla validità
    const totalDisplay = document.querySelector('.total-check');
    if (totalPercent === 100) {
        totalDisplay.style.color = '#4CAF50';
    } else {
        totalDisplay.style.color = '#f44336';
    }
    
    // Disabilita conferma se non è 100%
    const confirmBtn = document.getElementById('confirmStrategy');
    if (confirmBtn) {
        confirmBtn.disabled = totalPercent !== 100;
        confirmBtn.style.opacity = totalPercent === 100 ? '1' : '0.5';
    }
}

    // NUOVO METODO: Conferma selezione strategia
    confirmStrategySelection() {
        const porPercent = parseInt(document.getElementById('porPercentage').value) || 0;
        const difPercent = parseInt(document.getElementById('difPercentage').value) || 0;
        const cenPercent = parseInt(document.getElementById('cenPercentage').value) || 0;
        const attPercent = parseInt(document.getElementById('attPercentage').value) || 0;
        
        if (porPercent + difPercent + cenPercent + attPercent !== 100) {
            alert('La somma delle percentuali deve essere 100%!');
            return;
        }
        
        // Salva strategia personalizzata
        this.strategiaPersonalizzata = {
            POR: { 
                budget: Math.round((porPercent / 100) * this.totalBudget),
                percentage: porPercent
            },
            DIF: { 
                budget: Math.round((difPercent / 100) * this.totalBudget),
                percentage: difPercent
            },
            CEN: { 
                budget: Math.round((cenPercent / 100) * this.totalBudget),
                percentage: cenPercent
            },
            ATT: { 
                budget: Math.round((attPercent / 100) * this.totalBudget),
                percentage: attPercent
            }
        };
        
        // Aggiorna strategia nella classe StrategiaFantacalcio
        this.strategia.strategiaPersonalizzata = this.strategiaPersonalizzata;
        
        // Salva in localStorage
        this.saveStrategyToLocalStorage();
        
        // Chiudi modal
        const modal = document.getElementById('strategySetupModal');
        if (modal) {
            modal.remove();
        }
        
        // Aggiorna display squadra
        this.updateTeamDisplay();
        
        this.updateStatus('Strategia impostata con successo!');
    }

    // NUOVO METODO: Salva strategia in localStorage
    saveStrategyToLocalStorage() {
        try {
            localStorage.setItem('fantacalcio_strategy', JSON.stringify(this.strategiaPersonalizzata));
        } catch (error) {
            console.error('Errore nel salvataggio strategia:', error);
        }
    }

    // NUOVO METODO: Carica strategia da localStorage
    loadStrategyFromLocalStorage() {
        try {
            const strategy = localStorage.getItem('fantacalcio_strategy');
            if (strategy) {
                this.strategiaPersonalizzata = JSON.parse(strategy);
                this.strategia.strategiaPersonalizzata = this.strategiaPersonalizzata;
                return true;
            }
        } catch (error) {
            console.error('Errore nel caricamento strategia:', error);
        }
        return false;
    }

    loadFromLocalStorage() {
        try {
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
            
            // NUOVO: Carica strategia
            if (this.loadStrategyFromLocalStorage()) {
                // Non mostrare modal se strategia già salvata
                this.strategiaPersonalizzata = JSON.parse(localStorage.getItem('fantacalcio_strategy'));
            }
        } catch (error) {
            console.error('Errore nel caricamento:', error);
        }
    }


    setupEventListeners() {
    // CSV loading
    const loadBtn = document.getElementById('loadCsvBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => this.loadCSVFile());
    }

    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchPlayers();
        });
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => this.resetFilters());
    }

    // Hide acquired checkbox
    const hideAcquired = document.getElementById('hideAcquired');
    if (hideAcquired) {
        hideAcquired.addEventListener('change', () => this.searchPlayers());
    }

    // Team management buttons
    const clearBtn = document.getElementById('clearTeamBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearTeam());
    }

    const exportBtn = document.getElementById('exportTeamBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => this.exportTeam());
    }

    // Quick filters
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            this.applyQuickFilter(e.target.dataset.filter);
        });
    });

    // Modal event listeners
    const confirmBtn = document.getElementById('confirmPurchase');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.confirmPurchase());
    }

    const cancelBtn = document.getElementById('cancelPurchase');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.closeModal());
    }

    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('purchaseModal');
        if (e.target === modal) {
            this.closeModal();
        }
        
        // NUOVO: Chiudi anche strategy modal
        const strategyModal = document.getElementById('strategySetupModal');
        if (e.target === strategyModal) {
            // Non chiudere automaticamente il strategy modal
        }
    });

    // Table sorting
    this.setupTableSorting();
    
    // NUOVO: Strategy listeners
    this.setupStrategyListeners();
}

    setupStrategyListeners() {
        // Tab switching
        document.querySelectorAll('.strategy-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchStrategyTab(e.target.dataset.tab);
            });
        });

        // Suggestions
        const getSuggestionsBtn = document.getElementById('getSuggestions');
        if (getSuggestionsBtn) {
            getSuggestionsBtn.addEventListener('click', () => this.showSuggestions());
        }
    }

    setupTableSorting() {
        document.querySelectorAll('#playersTable th').forEach((header, index) => {
            header.addEventListener('click', () => {
                this.sortTable(index);
            });
        });
    }

    switchStrategyTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.strategy-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update content
        document.querySelectorAll('.strategy-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`strategy-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Load specific content
        if (tabName === 'analysis') this.updateAnalysis();
    }

    updateAnalysis() {
    const analisi = this.strategia.analizzaSquadra();
    const container = document.getElementById('squadraAnalysis');
    
    if (!container) return;
    
    let html = '';
    
    // 🧠 NUOVA SEZIONE: Bias Detection
    if (analisi.biasDetection && analisi.biasDetection.length > 0) {
        html += `
            <div class="analysis-section bias-section">
                <h4>🧠 Bias Detection</h4>
                ${analisi.biasDetection.map(bias => `
                    <div class="bias-alert bias-${bias.severita}">
                        <div class="bias-header">
                            <span class="bias-icon">${bias.icona}</span>
                            <strong>${bias.messaggio}</strong>
                        </div>
                        <div class="bias-details">${bias.dettagli}</div>
                        <div class="bias-suggestion">💡 ${bias.suggerimento}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Sezioni esistenti...
    if (analisi.puntiForza.length > 0) {
        html += `
            <div class="analysis-section">
                <h4>💪 Punti di Forza</h4>
                ${analisi.puntiForza.map(p => `<p>✅ ${p}</p>`).join('')}
            </div>
        `;
    }
    
    if (analisi.puntiDeboli.length > 0) {
        html += `
            <div class="analysis-section">
                <h4>⚠️ Punti Deboli</h4>
                ${analisi.puntiDeboli.map(p => `<p>❌ ${p}</p>`).join('')}
            </div>
        `;
    }
    
    if (analisi.suggerimenti.length > 0) {
        html += `
            <div class="analysis-section">
                <h4>💡 Suggerimenti</h4>
                ${analisi.suggerimenti.map(p => `<p>💡 ${p}</p>`).join('')}
            </div>
        `;
    }
    
    if (html === '') {
        html = '<p>Acquista giocatori per vedere l\'analisi della squadra</p>';
    }
    
    container.innerHTML = html;
}

    showSuggestions() {
    const budgetInput = document.getElementById('suggestionBudget');
    const roleSelect = document.getElementById('suggestionRole');
    const sortSelect = document.getElementById('suggestionSort');
    
    const budget = budgetInput ? parseInt(budgetInput.value) : 50;
    const ruolo = roleSelect ? roleSelect.value : '';
    const sortBy = sortSelect ? sortSelect.value : 'convenienza';
    
    const suggerimenti = this.strategia.suggerisciAcquisti(budget, ruolo);
    this.displaySuggestionsTable(suggerimenti, budget, ruolo, sortBy);
}

displaySuggestionsTable(suggerimenti, budget, ruolo, sortBy) {
    const container = document.getElementById('suggestionsList');
    if (!container) return;
    
    if (suggerimenti.length === 0) {
        const messaggioRuolo = ruolo ? ` per il ruolo ${ruolo}` : '';
        container.innerHTML = `
            <div class="no-suggestions">
                <p>🚫 Nessuna occasione trovata con budget ${budget} crediti${messaggioRuolo}</p>
                <p>💡 Prova ad aumentare il budget o cambiare filtro ruolo</p>
            </div>
        `;
        return;
    }
    
    // Ordina i suggerimenti
    this.sortSuggestions(suggerimenti, sortBy);
    
    const titoloRuolo = ruolo ? ` - ${ruolo}` : '';
    
    container.innerHTML = `
        <div class="suggestions-table-container">
            <h4>🎯 ${suggerimenti.length} occasioni trovate${titoloRuolo} (Budget max: ${budget} crediti)</h4>
            
            <table class="suggestions-table">
                <thead>
                    <tr>
                        <th>Giocatore</th>
                        <th>Ruolo</th>
                        <th>Squadra</th>
                        <th>Punteggio</th>
                        <th>Skills</th>
                        <th>Prezzo Est.</th>
                        <th>Convenienza</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${suggerimenti.map((s, index) => this.renderSuggestionRow(s, index)).join('')}
                </tbody>
            </table>
            
            <div class="suggestions-summary">
                <p>💰 Budget medio utilizzato: ${Math.round(suggerimenti.reduce((sum, s) => sum + s.valore, 0) / suggerimenti.length)} crediti</p>
                <p>🎯 Miglior affare: <strong>${suggerimenti[0].player.Nome}</strong> (${suggerimenti[0].valore} crediti)</p>
            </div>
        </div>
    `;
}

renderSuggestionRow(suggestion, index) {
    const player = suggestion.player;
    const punteggio = parseFloat(player.Punteggio) || 0;
    const trend = player.Trend || 'STABLE';
    const skills = this.getSkillsIcons(player.Skills);
    const convenienzaPercent = Math.round(suggestion.convenienza * 100);
    
    // Calcola fasce di prezzo
    const fasce = this.strategia.calcolaFascePrezzo(player);
    
    // Colore convenienza
    let convenienzaColor = '#f44336'; // Rosso
    if (convenienzaPercent > 70) convenienzaColor = '#4CAF50'; // Verde
    else if (convenienzaPercent > 40) convenienzaColor = '#ff9800'; // Arancione
    
    return `
        <tr class="suggestion-row ${index < 3 ? 'top-suggestion' : ''}">
            <td>
                <div class="player-name">
                    <strong>${player.Nome}</strong>
                    ${trend === 'UP' ? '<span class="trend-icon">📈</span>' : ''}
                    ${trend === 'DOWN' ? '<span class="trend-icon">📉</span>' : ''}
                    ${player['Nuovo acquisto'] === 'True' ? '<span class="new-badge">🆕</span>' : ''}
                </div>
            </td>
            <td><span class="role-badge role-${player.Ruolo}">${player.Ruolo}</span></td>
            <td>${player.Squadra}</td>
            <td>
                <span class="score ${punteggio >= 75 ? 'high-score' : punteggio >= 65 ? 'medium-score' : 'low-score'}">
                    ${punteggio}
                </span>
            </td>
            <td>${skills}</td>
            <td>
                <div class="price-range">
                    <div class="price-main">${fasce.min}-${fasce.max}</div>
                    <div class="price-detail">Media: ${fasce.medio}</div>
                </div>
            </td>
            <td>
                <div class="convenienza-bar">
                    <div class="convenienza-fill" style="width: ${convenienzaPercent}%; background-color: ${convenienzaColor}"></div>
                    <span class="convenienza-text">${convenienzaPercent}%</span>
                </div>
            </td>
            <td>
                <button class="btn btn-primary btn-small" onclick="app.openPurchaseModal('${player.id}')">
                    Acquista
                </button>
            </td>
        </tr>
    `;
}

getSkillsIcons(skillsText) {
    if (!skillsText) return '<span class="no-skills">-</span>';
    
    const skills = skillsText.toLowerCase();
    let icons = [];
    
    if (skills.includes('titolare')) icons.push('<span class="skill-icon titolare" title="Titolare">👑</span>');
    if (skills.includes('rigorista')) icons.push('<span class="skill-icon rigorista" title="Rigorista">⚽</span>');
    if (skills.includes('giovane')) icons.push('<span class="skill-icon giovane" title="Giovane">🌟</span>');
    
    return icons.length > 0 ? icons.join(' ') : '<span class="no-skills">-</span>';
}

sortSuggestions(suggerimenti, sortBy) {
    switch(sortBy) {
        case 'prezzo-asc':
            suggerimenti.sort((a, b) => a.valore - b.valore);
            break;
        case 'prezzo-desc':
            suggerimenti.sort((a, b) => b.valore - a.valore);
            break;
        case 'punteggio':
            suggerimenti.sort((a, b) => {
                const scoreA = parseFloat(a.player.Punteggio) || 0;
                const scoreB = parseFloat(b.player.Punteggio) || 0;
                return scoreB - scoreA;
            });
            break;
        case 'nome':
            suggerimenti.sort((a, b) => a.player.Nome.localeCompare(b.player.Nome));
            break;
        case 'convenienza':
        default:
            suggerimenti.sort((a, b) => {
                if (a.priorita !== b.priorita) return b.priorita - a.priorita;
                return b.convenienza - a.convenienza;
            });
            break;
    }
}

setupStrategyListeners() {
    // Tab switching
    document.querySelectorAll('.strategy-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            this.switchStrategyTab(e.target.dataset.tab);
        });
    });

    // Suggestions
    const getSuggestionsBtn = document.getElementById('getSuggestions');
    if (getSuggestionsBtn) {
        getSuggestionsBtn.addEventListener('click', () => this.showSuggestions());
    }
    
    // Ordinamento suggerimenti
    const sortSelect = document.getElementById('suggestionSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => this.showSuggestions());
    }
}

    loadCSVFile() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput?.files[0];

        if (!file) {
            this.updateStatus('Seleziona un file CSV', 'error');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.updateStatus('Seleziona un file CSV valido', 'error');
            return;
        }

        this.updateStatus('Caricamento file CSV in corso...');

        const reader = new FileReader();
        reader.onerror = () => {
            console.error('Errore FileReader:', reader.error);
            this.updateStatus('Errore nella lettura del file', 'error');
        };
        
        reader.onload = (e) => {
            try {
                let csvText = e.target.result;
                csvText = this.cleanCSVText(csvText);
                this.parseCSV(csvText);
            } catch (error) {
                console.error('Errore nella lettura del file:', error);
                this.updateStatus(`Errore: ${error.message}`, 'error');
            }
        };

        try {
            reader.readAsText(file, 'UTF-8');
        } catch (error) {
            console.log('Tentativo UTF-8 fallito, provo con encoding di default');
            try {
                reader.readAsText(file);
            } catch (fallbackError) {
                console.error('Tutti i tentativi di lettura falliti:', fallbackError);
                this.updateStatus('Impossibile leggere il file', 'error');
            }
        }
    }

    cleanCSVText(csvText) {
        // Rimuovi BOM se presente
        if (csvText.charCodeAt(0) === 0xFEFF) {
            csvText = csvText.slice(1);
        }
        
        // Normalizza i fine linea
        csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Rimuovi righe vuote multiple
        csvText = csvText.replace(/\n\s*\n/g, '\n');
        
        return csvText.trim();
    }

    parseCSV(csvText) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length < 2) {
                throw new Error('Il file CSV deve contenere almeno un header e una riga di dati');
            }
            
            const headerLine = lines[0];
            const headers = this.parseCSVLineRobust(headerLine);
            
            if (headers.length === 0) {
                throw new Error('Impossibile leggere l\'header del CSV');
            }
            
            this.data = [];
            let successfulRows = 0;
            let failedRows = 0;

            for (let i = 1; i < lines.length; i++) {
                try {
                    const line = lines[i].trim();
                    if (line === '') continue;

                    const values = this.parseCSVLineRobust(line);
                    
                    // Accetta anche righe con meno colonne
                    while (values.length < headers.length) {
                        values.push('');
                    }
                    
                    if (values.length >= headers.length) {
                        const player = {};
                        headers.forEach((header, index) => {
                            player[header] = values[index] || '';
                        });
                        player.id = `player_${i}_${Date.now()}`;
                        this.data.push(player);
                        successfulRows++;
                    } else {
                        failedRows++;
                    }
                } catch (rowError) {
                    failedRows++;
                }
            }

            if (this.data.length === 0) {
                throw new Error('Nessun dato valido trovato nel CSV');
            }

            this.filteredData = [...this.data];
            this.populateFilters();
            this.applyQuickFilter(this.currentQuickFilter);
            this.updateStatus(`Dati caricati: ${this.data.length} giocatori`);

        } catch (error) {
            console.error('Errore nel parsing del CSV:', error);
            this.updateStatus(`Errore nel parsing: ${error.message}`, 'error');
        }
    }

    parseCSVLineRobust(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                i++;
                continue;
            } else {
                current += char;
            }
            i++;
        }
        
        result.push(current.trim());
        
        return result.map(value => {
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            return value.trim();
        });
    }

    populateFilters() {
        try {
            // Popola filtro squadre
            const teams = [...new Set(this.data.map(player => player.Squadra))].filter(team => team).sort();
            const teamSelect = document.getElementById('team');
            if (teamSelect) {
                teamSelect.innerHTML = '<option value="">Tutte</option>';
                teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    teamSelect.appendChild(option);
                });
            }

            // Popola filtro skills
            const allSkills = new Set();
            this.data.forEach(player => {
                if (player.Skills) {
                    try {
                        const skills = JSON.parse(player.Skills.replace(/'/g, '"'));
                        if (Array.isArray(skills)) {
                            skills.forEach(skill => {
                                if (skill && skill.trim()) allSkills.add(skill.trim());
                            });
                        }
                    } catch (e) {
                        const skillsText = player.Skills.replace(/[\[\]'"]/g, '');
                        const skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
                        skills.forEach(skill => allSkills.add(skill));
                    }
                }
            });

            const skillSelect = document.getElementById('skill');
            if (skillSelect) {
                skillSelect.innerHTML = '<option value="">Tutte</option>';
                [...allSkills].sort().forEach(skill => {
                    const option = document.createElement('option');
                    option.value = skill;
                    option.textContent = skill;
                    skillSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Errore nel popolare i filtri:', error);
        }
    }

    applyQuickFilter(filterType) {
        if (this.data.length === 0) {
            this.updateStatus('Carica prima un file CSV', 'error');
            return;
        }

        this.currentQuickFilter = filterType;
        
        // Aggiorna UI dei bottoni
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-filter="${filterType}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Reset dei filtri di ricerca
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.reset();
        }
        
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
            
            // Controlla se il ruolo è al limite
            const positionCategory = this.getPositionCategory(ruolo);
            const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
            const isPositionFull = currentCount >= this.positionLimits[positionCategory];
            
            if (isAcquired) row.classList.add('acquired');
            if (isMyPlayer) row.classList.add('my-player');
            
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

        // Controlla limiti di ruolo
        const positionCategory = this.getPositionCategory(player.Ruolo);
        const currentCount = this.myTeam.filter(p => this.getPositionCategory(p.ruolo) === positionCategory).length;
        const limit = this.positionLimits[positionCategory];
        
        if (currentCount >= limit) {
            alert(`Non puoi acquistare più di ${limit} ${positionCategory.toLowerCase()}!`);
            return;
        }

        this.currentPlayerForPurchase = player;
        
        const modalPlayerName = document.getElementById('modalPlayerName');
        const modalPlayerRole = document.getElementById('modalPlayerRole');
        const budgetSuggestion = document.getElementById('budgetSuggestion');
        const purchasePrice = document.getElementById('purchasePrice');
        
        if (modalPlayerName) modalPlayerName.textContent = player.Nome || '';
        if (modalPlayerRole) modalPlayerRole.textContent = player.Ruolo || '';
        
        const averageBudget = this.calculateAverageBudget();
        const remainingBudget = this.getRemainingBudget();
        const remainingSlots = 25 - this.myTeam.length;
        const valoreMercato = this.strategia.calcolaValoreMercato(player);
        
        if (budgetSuggestion) {
            budgetSuggestion.textContent = 
                `Budget medio: ${averageBudget} crediti (${remainingSlots} slot). Valore stimato: ${valoreMercato} crediti`;
        }
        
        if (purchasePrice) {
            purchasePrice.value = Math.min(valoreMercato, Math.min(averageBudget, remainingBudget)) || 1;
        }
        
        const modal = document.getElementById('purchaseModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('purchaseModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentPlayerForPurchase = null;
    }

    confirmPurchase() {
        if (!this.currentPlayerForPurchase) return;

        const purchasePrice = document.getElementById('purchasePrice');
        const price = purchasePrice ? parseInt(purchasePrice.value) : 0;
        
        if (price <= 0 || price > this.getRemainingBudget()) {
            alert('Prezzo non valido o budget insufficiente!');
            return;
        }

        const player = this.currentPlayerForPurchase;
        
        // Ricontrolla i limiti
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
        
        // Aggiorna l'analisi se è attiva
        const currentTab = document.querySelector('.strategy-tab.active');
        if (currentTab && currentTab.dataset.tab === 'analysis') {
            this.updateAnalysis();
        }
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
            
            // Aggiorna l'analisi se è attiva
            const currentTab = document.querySelector('.strategy-tab.active');
            if (currentTab && currentTab.dataset.tab === 'analysis') {
                this.updateAnalysis();
            }
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
    
    if (teamCount) {
        teamCount.textContent = this.myTeam.length;
    }
    
    if (!teamList) return;
    
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

    // NUOVO: Ottieni strategia per budget
    const strategia = this.strategia.getStrategiaPerRuolo();
    const roleMappings = {
        'Portieri': 'POR',
        'Difensori': 'DIF', 
        'Centrocampisti': 'CEN',
        'Attaccanti': 'ATT'
    };

    teamList.innerHTML = `
        <div class="team-positions">
            ${Object.keys(positions).map(position => {
                const count = positions[position].length;
                const limit = this.positionLimits[position];
                const total = this.getPositionTotal(position);
                const isComplete = count >= limit;
                
                // NUOVO: Budget strategico
                const roleKey = roleMappings[position];
                const budgetStrategico = strategia[roleKey] ? strategia[roleKey].budget : 0;
                const percentageUsed = budgetStrategico > 0 ? Math.round((total / budgetStrategico) * 100) : 0;
                const remaining = budgetStrategico - total;
                
                // Colori per indicatori budget
                let budgetColor = '#4CAF50'; // Verde
                if (percentageUsed > 100) budgetColor = '#f44336'; // Rosso se supera
                else if (percentageUsed > 80) budgetColor = '#ff9800'; // Arancione se vicino al limite
                
                return `
                    <div class="position-column ${isComplete ? 'position-complete' : ''}">
                        <div class="position-header">
                            <div class="position-title">${position} (${count}/${limit})</div>
                            <div class="position-budget">
                                <div class="budget-line">
                                    <span>Speso: ${total} crediti</span>
                                    <span style="color: ${budgetColor};">${percentageUsed}%</span>
                                </div>
                                <div class="budget-strategy">
                                    Budget: ${budgetStrategico} crediti
                                    ${remaining >= 0 ? 
                                        `<span style="color: #4CAF50;">(+${remaining})</span>` : 
                                        `<span style="color: #f44336;">(${remaining})</span>`
                                    }
                                </div>
                                <div class="budget-bar">
                                    <div class="budget-fill" style="width: ${Math.min(percentageUsed, 100)}%; background-color: ${budgetColor};"></div>
                                </div>
                            </div>
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
        
        ${this.strategiaPersonalizzata ? `
            <div class="strategy-summary">
                <h4>📊 Strategia Attuale</h4>
                <div class="strategy-overview">
                    <div class="strategy-item">POR: ${this.strategiaPersonalizzata.POR.percentage}% (${this.strategiaPersonalizzata.POR.budget} crediti)</div>
                    <div class="strategy-item">DIF: ${this.strategiaPersonalizzata.DIF.percentage}% (${this.strategiaPersonalizzata.DIF.budget} crediti)</div>
                    <div class="strategy-item">CEN: ${this.strategiaPersonalizzata.CEN.percentage}% (${this.strategiaPersonalizzata.CEN.budget} crediti)</div>
                    <div class="strategy-item">ATT: ${this.strategiaPersonalizzata.ATT.percentage}% (${this.strategiaPersonalizzata.ATT.budget} crediti)</div>
                </div>
                <button id="changeStrategy" class="btn btn-secondary btn-small">Cambia Strategia</button>
            </div>
        ` : ''}
    `;

    // Event listeners per rimuovere giocatori
    document.querySelectorAll('[data-remove-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const playerId = button.getAttribute('data-remove-id');
            this.removePlayerFromTeam(playerId);
        });
    });
    
    // NUOVO: Event listener per cambiare strategia
    const changeStrategyBtn = document.getElementById('changeStrategy');
    if (changeStrategyBtn) {
        changeStrategyBtn.addEventListener('click', () => {
            this.showStrategyModal();
        });
    }
}



    updateBudgetDisplay() {
        const spent = this.myTeam.reduce((total, player) => total + player.price, 0);
        const remaining = this.totalBudget - spent;
        const averageBudget = this.calculateAverageBudget();
        
        const spentElement = document.getElementById('spentBudget');
        const remainingElement = document.getElementById('remainingBudget');
        const averageElement = document.getElementById('averageBudget');
        
        if (spentElement) spentElement.textContent = spent;
        if (remainingElement) remainingElement.textContent = remaining;
        if (averageElement) averageElement.textContent = `Budget medio: ${averageBudget} crediti per giocatore`;
        
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
        try {
            localStorage.setItem('fantacalcio_acquired', JSON.stringify([...this.acquiredPlayers]));
            localStorage.setItem('fantacalcio_team', JSON.stringify(this.myTeam));
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
        }
    }

    loadFromLocalStorage() {
    try {
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
        
        // CORRETTO: Carica strategia
        const strategyLoaded = this.loadStrategyFromLocalStorage();
        if (strategyLoaded) {
            // Strategia già impostata, non mostrare modal
            console.log('Strategia caricata da localStorage');
        }
    } catch (error) {
        console.error('Errore nel caricamento:', error);
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

        const nameInput = document.getElementById('playerName');
        const roleSelect = document.getElementById('role');
        const teamSelect = document.getElementById('team');
        const skillSelect = document.getElementById('skill');
        const minScoreInput = document.getElementById('minScore');
        const maxScoreInput = document.getElementById('maxScore');
        const hideAcquiredCheck = document.getElementById('hideAcquired');

        const name = nameInput ? nameInput.value.toLowerCase() : '';
        const role = roleSelect ? roleSelect.value : '';
        const team = teamSelect ? teamSelect.value : '';
        const skill = skillSelect ? skillSelect.value : '';
        const minScore = minScoreInput ? parseFloat(minScoreInput.value) : 0;
        const maxScore = maxScoreInput ? parseFloat(maxScoreInput.value) : 100;
        const hideAcquired = hideAcquiredCheck ? hideAcquiredCheck.checked : false;

        // Reset del filtro rapido
        this.currentQuickFilter = 'tutti';
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const tuttiBtn = document.querySelector('[data-filter="tutti"]');
        if (tuttiBtn) {
            tuttiBtn.classList.add('active');
        }

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
    }

    resetFilters() {
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.reset();
        }
        
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
            let aVal = a[column] || a['Fantamedia anno 2024-2025'] || '';
            let bVal = b[column] || b['Fantamedia anno 2024-2025'] || '';

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

// Istanza globale dell'app
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FantacalcioApp();
});
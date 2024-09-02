import sys
import os
import logging
from PyQt5.QtGui import QFont, QIcon
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                             QLabel, QLineEdit, QPushButton, QTableWidget, QTableWidgetItem, 
                             QHeaderView, QComboBox, QGroupBox, QFormLayout, QTextEdit,
                             QDoubleSpinBox, QStyle, QStyledItemDelegate, QMessageBox)
from PyQt5.QtCore import Qt, QSortFilterProxyModel
from PyQt5.QtGui import QColor
import pandas as pd

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class ColorDelegate(QStyledItemDelegate):
    def paint(self, painter, option, index):
        if index.column() == 5:  # Trend column
            value = index.data()
            if value == "UP":
                color = QColor(144, 238, 144)  # Light green
            elif value == "DOWN":
                color = QColor(255, 182, 193)  # Light red
            else:
                color = QColor(160, 160, 160)  # Gray
            
            painter.fillRect(option.rect, color)
        
        QStyledItemDelegate.paint(self, painter, option, index)

class FantacalcioGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("FantacalcioGPT")
        self.setGeometry(100, 100, 1700, 700)
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout = QHBoxLayout(self.central_widget)

        self.setup_left_panel()
        self.setup_right_panel()

        self.setStyleSheet("""
            QMainWindow {
                background-color: #f0f0f0;
                font-family: 'Roboto', sans-serif;
            }
            QGroupBox {
                font-weight: bold;
                border: 1px solid #cccccc;
                border-radius: 5px;
                margin-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 3px 0 3px;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 5px 15px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QTableWidget {
                gridline-color: #d3d3d3;
                font-size: 14px;
            }
            QHeaderView::section {
                background-color: #f0f0f0;
                padding: 8px;
                border: 1px solid #d3d3d3;
                font-weight: bold;
                font-size: 16px;
            }
        """)
        
        # Imposta un'icona per l'applicazione
        app_icon = QIcon(os.path.join(os.path.dirname(__file__), "image.png"))
        self.setWindowIcon(app_icon)

        # Imposta un font personalizzato
        font = QFont("Roboto", 22)
        self.setFont(font)


    def setup_left_panel(self):
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)

        # Ricerca avanzata
        search_group = QGroupBox("Ricerca Avanzata")
        search_layout = QFormLayout()
        self.name_input = QLineEdit()
        self.role_combo = QComboBox()
        self.skill_combo = QComboBox()
        self.team_combo = QComboBox()
        self.min_score = QDoubleSpinBox()
        self.max_score = QDoubleSpinBox()
        self.min_score.setRange(0, 100)
        self.max_score.setRange(0, 100)
        self.min_score.setSingleStep(0.1)
        self.max_score.setSingleStep(0.1)
        self.min_score.setValue(0)
        self.max_score.setValue(100)
        search_layout.addRow("Nome:", self.name_input)
        search_layout.addRow("Ruolo:", self.role_combo)
        search_layout.addRow("Skill:", self.skill_combo)
        search_layout.addRow("Squadra:", self.team_combo)
        search_layout.addRow("Punteggio Min:", self.min_score)
        search_layout.addRow("Punteggio Max:", self.max_score)
        
        button_layout = QHBoxLayout()
        self.search_button = QPushButton("Cerca")
        self.reset_button = QPushButton("Reset")
        self.reset_button.setStyleSheet("background-color: #f44336;")  # Red color for reset button
        button_layout.addWidget(self.search_button)
        button_layout.addWidget(self.reset_button)
        search_layout.addRow(button_layout)
        
        search_group.setLayout(search_layout)

        # Status label
        self.status_label = QLabel("Pronto per la ricerca")
        self.status_label.setStyleSheet("font-weight: bold;")

        # Tabella risultati
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["Nome", "Ruolo", "Squadra", "Fantamedia 2023-2024", "Punteggio", "Trend"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setItemDelegate(ColorDelegate())

        left_layout.addWidget(search_group)
        left_layout.addWidget(self.status_label)
        left_layout.addWidget(self.table)

        self.layout.addWidget(left_panel, 2)

    def setup_right_panel(self):
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)

        # Dettagli giocatore
        details_group = QGroupBox("Dettagli Giocatore")
        details_layout = QVBoxLayout()
        self.player_details = QTextEdit()
        self.player_details.setReadOnly(True)
        details_layout.addWidget(self.player_details)
        details_group.setLayout(details_layout)

        right_layout.addWidget(details_group)

        self.layout.addWidget(right_panel, 1)

    def load_data(self):
        try:
            self.df = pd.read_csv("giocatori.csv")
            logging.info(f"Dati caricati con successo. Numero di righe: {len(self.df)}")
            logging.debug(f"Colonne nel DataFrame: {self.df.columns}")
        except Exception as e:
            logging.error(f"Errore nel caricamento del file CSV: {e}")
            QMessageBox.critical(self, "Errore", "Impossibile caricare i dati dei giocatori. Verifica che il file 'giocatori.csv' sia presente nella directory corretta.")
            sys.exit(1)

        # Popola i combobox
        roles = ['Tutti', 'POR', 'DIF', 'CEN', 'TRQ', 'ATT']
        self.role_combo.addItems(roles)
        self.team_combo.addItems(['Tutte'] + sorted(self.df['Squadra'].unique()))
        
        # Estrai tutte le skills uniche
        all_skills = set()
        for skills in self.df['Skills'].dropna():
            try:
                all_skills.update(eval(skills))
            except:
                pass  # Ignora le righe con formato non valido
        self.skill_combo.addItems(['Tutte'] + sorted(all_skills))

        self.search_button.clicked.connect(self.search_players)
        self.reset_button.clicked.connect(self.reset_filters)
        self.table.itemClicked.connect(self.show_player_details)

        self.update_table(self.df)

    
    def update_table(self, data):
        self.table.setRowCount(0)  # Pulisce la tabella
        self.table.setSortingEnabled(False)  # Disabilita temporaneamente l'ordinamento

        # Assicuriamoci di avere le colonne corrette
        columns = ["Nome", "Ruolo", "Squadra", "Fantamedia anno 2023-2024", "Punteggio", "Trend"]
        
        for i, row in data.iterrows():
            row_position = self.table.rowCount()
            self.table.insertRow(row_position)
            for j, col in enumerate(columns):
                value = row[col] if col in row else ""
                self.table.setItem(row_position, j, QTableWidgetItem(str(value)))

        self.table.setSortingEnabled(True)  # Riabilita l'ordinamento
        self.table.sortItems(0)  # Ordina per la prima colonna (Nome)

        # Aggiorna l'etichetta di stato
        self.status_label.setText(f"Risultati: {len(data)} giocatori trovati")
        self.status_label.setStyleSheet("color: green; font-weight: bold;")

        #logging.info(f"Tabella aggiornata con {len(data)} righe")

    def search_players(self):

        #logging.info("Inizio della ricerca giocatori")
        filtered_df = self.df.copy()

        name = self.name_input.text().lower()
        role = self.role_combo.currentText()
        skill = self.skill_combo.currentText()
        team = self.team_combo.currentText()
        min_score = self.min_score.value()
        max_score = self.max_score.value()

        #logging.debug(f"Filtri applicati: Nome={name}, Ruolo={role}, Skill={skill}, Squadra={team}, Punteggio Min={min_score}, Punteggio Max={max_score}")

        if name:
            filtered_df = filtered_df[filtered_df['Nome'].str.lower().str.contains(name)]
        
        if role != 'Tutti':
            filtered_df = filtered_df[filtered_df['Ruolo'] == role]
        
        if skill != 'Tutte':
            filtered_df = filtered_df[filtered_df['Skills'].apply(lambda x: skill in eval(x) if pd.notnull(x) and isinstance(x, str) else False)]
        
        if team != 'Tutte':
            filtered_df = filtered_df[filtered_df['Squadra'] == team]
        
        filtered_df['Punteggio'] = pd.to_numeric(filtered_df['Punteggio'], errors='coerce')
        filtered_df = filtered_df[(filtered_df['Punteggio'] >= min_score) & (filtered_df['Punteggio'] <= max_score)]

        #logging.info(f"Numero di giocatori dopo il filtraggio: {len(filtered_df)}")
        self.update_table(filtered_df)

    def reset_filters(self):
        self.name_input.clear()
        self.role_combo.setCurrentIndex(0)
        self.skill_combo.setCurrentIndex(0)
        self.team_combo.setCurrentIndex(0)
        self.min_score.setValue(0)
        self.max_score.setValue(100)
        self.update_table(self.df)
        #logging.info("Filtri resettati")

    def show_player_details(self, item):
        row = item.row()
        player_name = self.table.item(row, 0).text()
        player_data = self.df[self.df['Nome'] == player_name].iloc[0]

        details = f"<b><font size='6'>Nome:</font></b> <font size='6'>{player_data['Nome']}</font><br><br>"
        details += f"<b><font size='6'>Ruolo:</font></b> <font size='6'>{player_data['Ruolo']}</font><br><br>"
        details += f"<b><font size='6'>Squadra:</font></b> <font size='6'>{player_data['Squadra']}</font><br><br>"
        details += f"<b><font size='6'>Punteggio:</font></b> <font size='6'>{player_data['Punteggio']}</font><br><br>"
        details += f"<b><font size='6'>Fantamedia 2023-2024:</font></b> <font size='6'>{player_data['Fantamedia anno 2023-2024']}</font><br><br>"
        details += f"<b><font size='6'>Fantamedia 2022-2023:</font></b> <font size='6'>{player_data['Fantamedia anno 2022-2023']}</font><br><br>"
        details += f"<b><font size='6'>Fantamedia 2021-2022:</font></b> <font size='6'>{player_data['Fantamedia anno 2021-2022']}</font><br><br>"
        details += f"<b><font size='6'>Presenze 2023-2024:</font></b> <font size='6'>{player_data['Presenze 2023-2024']}</font><br><br>"
        details += f"<b><font size='6'>Presenze previste:</font></b> <font size='6'>{player_data['Presenze previste']}</font><br><br>"
        details += f"<b><font size='6'>Gol previsti:</font></b> <font size='6'>{player_data['Gol previsti']}</font><br><br>"
        details += f"<b><font size='6'>Assist previsti:</font></b> <font size='6'>{player_data['Assist previsti']}</font><br><br>"
        details += f"<b><font size='6'>Skills:</font></b> <font size='6'>{player_data['Skills']}</font><br><br>"
        details += f"<b><font size='6'>Buon investimento:</font></b> <font size='6'>{player_data['Buon investimento']}</font><br><br>"
        details += f"<b><font size='6'>Resistenza infortuni:</font></b> <font size='6'>{player_data['Resistenza infortuni']}</font><br><br>"
        details += f"<b><font size='6'>Consigliato prossima giornata:</font></b> <font size='6'>{player_data['Consigliato prossima giornata']}</font><br><br>"
        details += f"<b><font size='6'>Nuovo acquisto:</font></b> <font size='6'>{player_data['Nuovo acquisto']}</font><br><br>"
        details += f"<b><font size='6'>Infortunato:</font></b> <font size='6'>{player_data['Infortunato']}</font><br><br>"
        details += f"<b><font size='6'>Trend:</font></b> <font size='6'>{player_data['Trend']}</font><br><br>"




        self.player_details.setText(details)
        #logging.info(f"Dettagli mostrati per il giocatore: {player_name}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = FantacalcioGUI()
    window.show()
    sys.exit(app.exec_())
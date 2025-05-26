### Archivo: rps2v2_gui.py

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import random

# Reglas del juego
RULES = {"piedra": "tijera", "tijera": "papel", "papel": "piedra"}
OPTIONS = ["piedra", "papel", "tijera"]
TIME_LIMIT = 10  # segundos para elegir

# Definición de cartas/power-ups
CARD_DECK = {
    'Duplicar punto': 'Duplica los puntos obtenidos en una ronda.',
    'Forzar cambio': 'El rival debe cambiar su elección aleatoriamente.',
    'Segundo intento': 'Permite repetir elección en caso de empate.'
}
CARDS_PER_TEAM = 2

class RPSGame(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Piedra, Papel o Tijera 2v2 Mejorado")
        self.geometry("500x400")
        self.resizable(False, False)

        # Variables del juego
        self.victories_needed = tk.IntVar(value=3)
        self.score = [0, 0]
        self.card_choices = [[], []]  # cartas elegidas por cada equipo
        self.selections = [tk.StringVar(value='') for _ in range(4)]
        self.chosen_flags = [tk.BooleanVar(value=False) for _ in range(4)]

        # Frames
        self.start_frame = ttk.Frame(self, padding=20)
        self.card_frame = ttk.Frame(self, padding=20)
        self.game_frame = ttk.Frame(self, padding=20)

        self._build_start()
        self.start_frame.pack(fill='both', expand=True)

    def _build_start(self):
        ttk.Label(self.start_frame, text="Configuración 2vs2", font=(None, 16)).pack(pady=10)
        ttk.Label(self.start_frame, text="Victorias necesarias:").pack(anchor='w')
        ttk.Entry(self.start_frame, textvariable=self.victories_needed, width=5).pack(anchor='w', pady=(0,10))
        ttk.Button(self.start_frame, text="Seleccionar cartas", command=self._to_card_selection).pack(pady=20)

    def _to_card_selection(self):
        # validar rondas
        if self.victories_needed.get() <= 0:
            messagebox.showwarning("Error", "Debe ser > 0")
            return
        self.start_frame.forget()
        self._build_card_selection()
        self.card_frame.pack(fill='both', expand=True)

    def _build_card_selection(self):
        ttk.Label(self.card_frame, text="Elijan 2 cartas cada equipo", font=(None, 14)).pack(pady=5)
        # Panel de cartas
        for team in range(2):
            frame = ttk.LabelFrame(self.card_frame, text=f"Equipo {team+1}")
            frame.pack(fill='x', padx=10, pady=5)
            vars = []
            for _ in range(CARDS_PER_TEAM):
                var = tk.StringVar(value='')
                vars.append(var)
                cb = ttk.Combobox(frame, textvariable=var, values=list(CARD_DECK.keys()), state='readonly')
                cb.pack(side='left', padx=5)
            self.card_choices[team] = vars
        ttk.Button(self.card_frame, text="Iniciar juego", command=self._start_game).pack(pady=20)

    def _start_game(self):
        # validar cartas elegidas
        for team_vars in self.card_choices:
            if any(not v.get() for v in team_vars):
                messagebox.showwarning("Error", "Cada equipo debe elegir 2 cartas")
                return
        self.card_frame.forget()
        self._build_game()
        self.game_frame.pack(fill='both', expand=True)

    def _build_game(self):
        ttk.Label(self.game_frame, text=self._score_text(), font=(None, 14)).pack(pady=5)
        # Indicador de tiempo
        self.time_label = ttk.Label(self.game_frame, text=f"Tiempo: {TIME_LIMIT}s")
        self.time_label.pack()

        grid = ttk.Frame(self.game_frame)
        grid.pack(pady=10)
        # Jugadores 0-1 = Equipo 1, 2-3 = Equipo 2
        for idx in range(4):
            ttk.Label(grid, text=f"Jugador {idx+1}").grid(row=0, column=idx)
            menu = ttk.OptionMenu(grid, self.selections[idx], '', *OPTIONS, command=lambda _: self._flag_chosen())
            menu.grid(row=1, column=idx)
            ttk.Label(grid, textvariable=self.chosen_flags[idx], foreground='green').grid(row=2, column=idx)

        ttk.Button(self.game_frame, text="Confirmar" , command=self._confirm_round).pack(pady=10)
        self._start_timer()

    def _score_text(self):
        return f"Score: {self.score[0]} - {self.score[1]}"

    def _flag_chosen(self):
        for i, var in enumerate(self.selections):
            self.chosen_flags[i].set(bool(var.get()))

    def _start_timer(self):
        self.remaining = TIME_LIMIT
        self._countdown()

    def _countdown(self):
        if self.remaining <= 0:
            messagebox.showinfo("Tiempo", "Se acabó el tiempo")
            self._confirm_round()
            return
        self.time_label.config(text=f"Tiempo: {self.remaining}s")
        self.remaining -= 1
        self.after(1000, self._countdown)

    def _apply_cards(self, team, p1_pts, p2_pts):
        # Evaluar uso de carta por equipo
        for var in self.card_choices[team]:
            card = var.get()
            if card == 'Duplicar punto' and (p1_pts > p2_pts if team==0 else p2_pts>p1_pts):
                return 2  # duplicar
            if card == 'Forzar cambio':
                # fuerza cambio en equipo contrario primero jugador
                other = 2 if team==0 else 0
                i = other*2
                # cambia elección de jugador i
                self.selections[i].set(random.choice(OPTIONS))
            # 'Segundo intento' implementado en empate
        return 1

    def _confirm_round(self):
        # detener timer
        self.remaining = -1
        # chequear selecciones
        sel = [v.get() if v.get() else random.choice(OPTIONS) for v in self.selections]
        # combo bonus si compañeros iguales
        bonus = [0,0]
        for team in (0,1):
            pair = sel[team*2:team*2+2]
            if pair[0] == pair[1]: bonus[team] = 1
        # calcular puntos base
        pts = [[0,0],[0,0]]
        for team in (0,1):
            opp = 1-team
            for i in range(2):
                a = sel[team*2 + i]
                for j in range(2):
                    b = sel[opp*2 + j]
                    if a == b: continue
                    if RULES[a] == b: pts[team][0]+=1
                    else: pts[team][1]+=1
        # sumar bonus y aplicar cartas
        for t in (0,1):
            base = pts[t][0] - pts[t][1] + bonus[t]
            multiplier = self._apply_cards(t, pts[t][0], pts[t][1])
            if base>0:
                self.score[t] += base * multiplier
        # actualizar UI
        messagebox.showinfo("Ronda", f"Selecciones: {sel}\nScore: {self.score}")
        self._reset_for_next()

    def _reset_for_next(self):
        for v in self.selections: v.set('')
        for f in self.chosen_flags: f.set(False)
        self.game_frame.destroy()
        self.game_frame = ttk.Frame(self, padding=20)
        self.game_frame.pack(fill='both', expand=True)
        self._build_game()

if __name__ == "__main__":
    app = RPSGame()
    app.mainloop()

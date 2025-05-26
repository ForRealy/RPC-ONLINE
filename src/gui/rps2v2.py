### Archivo: rps2v2.py

# Diccionario para determinar qué vence a qué
reglas = {
    "piedra": "tijera",
    "tijera": "papel",
    "papel": "piedra"
}

# Opciones numeradas
opciones = {
    "1": "piedra",
    "2": "papel",
    "3": "tijera"
}


def mostrar_menu(jugador):
    print(f"\n{jugador}, elige una opción:")
    for num, jugada in opciones.items():
        print(f"  {num}. {jugada.capitalize()}")


def obtener_jugada(jugador):
    while True:
        mostrar_menu(jugador)
        eleccion = input("Opción (1-3): ").strip()
        if eleccion in opciones:
            return opciones[eleccion]
        print("¡Opción inválida! Intenta de nuevo.")


def calcular_puntos(jugadores_equipo1, jugadores_equipo2):
    puntos_equipo1 = 0
    puntos_equipo2 = 0
    # Comparar cada jugador del equipo 1 con cada jugador del equipo 2
    for jug1 in jugadores_equipo1:
        for jug2 in jugadores_equipo2:
            if jug1 == jug2:
                continue  # Empate, no sumar
            elif reglas[jug1] == jug2:
                puntos_equipo1 += 1
            else:
                puntos_equipo2 += 1
    return puntos_equipo1, puntos_equipo2


def main():
    print("¡Bienvenidos a Piedra, Papel o Tijera 2 vs 2!\n")
    victorias_necesarias = int(input("¿Cuántas rondas necesitas ganar? "))
    victorias_equipo1 = 0
    victorias_equipo2 = 0

    while victorias_equipo1 < victorias_necesarias and victorias_equipo2 < victorias_necesarias:
        print(f"\nMarcador: Equipo 1 [{victorias_equipo1}] - Equipo 2 [{victorias_equipo2}]")
        print("Ronda nueva:")

        # Obtener jugadas mediante números
        eq1_j1 = obtener_jugada("Equipo 1 - Jugador 1")
        eq1_j2 = obtener_jugada("Equipo 1 - Jugador 2")
        eq2_j1 = obtener_jugada("Equipo 2 - Jugador 1")
        eq2_j2 = obtener_jugada("Equipo 2 - Jugador 2")

        # Calcular puntos
        puntos_eq1, puntos_eq2 = calcular_puntos(
            [eq1_j1, eq1_j2],
            [eq2_j1, eq2_j2]
        )

        # Resultado de la ronda
        if puntos_eq1 > puntos_eq2:
            victorias_equipo1 += 1
            print("\n¡Equipo 1 gana la ronda!")
        elif puntos_eq2 > puntos_eq1:
            victorias_equipo2 += 1
            print("\n¡Equipo 2 gana la ronda!")
        else:
            print("\n¡Empate en la ronda!")

    # Fin del juego
    print("\n¡Juego terminado!")
    if victorias_equipo1 > victorias_equipo2:
        print("¡El Equipo 1 es el ganador!")
    else:
        print("¡El Equipo 2 es el ganador!")


if __name__ == "__main__":
    main()

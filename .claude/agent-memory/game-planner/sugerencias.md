# Registro de sugerencias

Una entrada por juego, identificada por su `id`. Al cambiar el estado se actualiza la
entrada existente; nunca se duplica.

Plantilla:

```md
### NOMBRE (`id`)

- **Fecha:** AAAA-MM-DD
- **Categoría / color:** CATEGORÍA · color
- **Rol:** principal | alternativa
- **Resumen:** concepto en una línea
- **Estado:** sugerido | aceptado (spec NN-…) | descartado | implementado
- **Notas:** motivo de descarte, comentarios del usuario, cambios de estado con fecha
```

## Entradas

### BURBUJAS (`burbujas`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · cyan
- **Rol:** principal
- **Resumen:** Bubble shooter infinito: apunta un lanzador, agrupa 3+ burbujas del mismo color para reventarlas y suelta racimos colgantes antes de que el techo baje hasta tu línea.
- **Estado:** sugerido
- **Notas:** Puntuación 5 · Sesión 4 · Implementabilidad 4 · Controles 5 · Estética 5 · Catálogo 5 = 28/30. Esfuerzo M. Elegido para reforzar PUZZLE (solo Tetris/Caída). Sin base vanilla en `references/started-games/`.

### CÚPULA (`cupula`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · magenta
- **Rol:** alternativa
- **Resumen:** Defensa antimisiles: protege 6 ciudades neón detonando explosiones expansivas en la trayectoria de los misiles que caen.
- **Estado:** sugerido
- **Notas:** Puntuación 5 · Sesión 5 · Implementabilidad 5 · Controles 4 · Estética 5 · Catálogo 3 = 27/30. Esfuerzo S. Muy viable en táctil (tocar = disparar). Penaliza que sería el 3.er SHOOTER.

### ALUNIZAJE (`alunizaje`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · green
- **Rol:** alternativa
- **Resumen:** Lander vectorial: rota y propulsa un módulo con combustible limitado para posarlo suavemente en plataformas con multiplicador sobre un terreno aleatorio.
- **Estado:** sugerido
- **Notas:** Puntuación 4 · Sesión 5 · Implementabilidad 5 · Controles 5 · Estética 5 · Catálogo 3 = 27/30. Esfuerzo S. Reutiliza la física de nave de Asteroids. ARCADE ya es la categoría más poblada.

<!-- Lote de 18 (2026-10-23): el usuario pidió un ranking de 18 en lugar de 1+2. Los 3 primeros son "principal", el resto "alternativa". Desempate: total → Catálogo → menor esfuerzo. -->

### ECO (`eco`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · magenta
- **Rol:** principal (ranking #1 del lote de 18)
- **Resumen:** Memoria de secuencias: 4 pads neón (cyan/magenta/yellow/green) se iluminan con tono; repite la secuencia, que crece y se acelera.
- **Estado:** sugerido
- **Notas:** P4 · S5 · I5 · C5 · E5 · Cat4 = 28/30. Esfuerzo S. Score = pulsaciones correctas × multiplicador de velocidad + bonus por ronda (evita empates por longitud). Riesgo: techo de profundidad, requiere audio (Web Audio, sin assets).

### TORRE (`torre`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · yellow
- **Rol:** principal (ranking #2)
- **Resumen:** Apilador de un botón: un bloque oscila y lo sueltas sobre la torre; lo que sobresale se corta y la torre se estrecha.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I5 · C5 · E5 · Cat3 = 28/30. Esfuerzo S. Bonus por caída perfecta (recupera ancho). Riesgo: poca profundidad; ARCADE ya saturado, pero mecánica de timing de 1 botón es nueva.

### FUSIÓN (`fusion`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · cyan
- **Rol:** principal (ranking #3)
- **Resumen:** Tablero 4×4 de fichas numeradas; desliza todas a la vez y fusiona iguales (estilo 2048).
- **Estado:** sugerido
- **Notas:** P5 · S3 · I5 · C5 · E4 · Cat5 = 27/30. Esfuerzo S. Score = suma de fusiones. Riesgo: partidas que superan 10 min; escala de color de fichas con solo 4 colores (usar intensidad/glow).

### PULSO (`pulso`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · magenta
- **Rol:** alternativa (ranking #4)
- **Resumen:** Ritmo de 4 carriles: notas neón bajan y se pulsan D/F/J/K al cruzar la línea; combo y precisión.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I3 · C4 · E5 · Cat5 = 27/30. Esfuerzo L. Riesgos: sincronía/latencia de audio, música con licencia libre. Posible nueva categoría RITMO a futuro.

### CRISTALES (`cristales`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · green
- **Rol:** alternativa (ranking #5)
- **Resumen:** Match-3 contrarreloj de 2 min: intercambia gemas adyacentes, encadena cascadas.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I4 · C4 · E5 · Cat4 = 27/30. Esfuerzo M. Riesgo: cascadas/animaciones de swap; solapa algo con Burbujas (emparejar colores).

### FLUJO (`flujo`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · cyan
- **Rol:** alternativa (ranking #6)
- **Resumen:** Coloca tramos de tubería de una cola antes de que el plasma avance; fuga = game over.
- **Estado:** sugerido
- **Notas:** P5 · S4 · I4 · C3 · E5 · Cat5 = 26/30. Esfuerzo M. Riesgo: controles de cursor en teclado; curva de dificultad por niveles.

### DÁCTILO (`dactilo`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · green
- **Rol:** alternativa (ranking #7)
- **Resumen:** Shooter de mecanografía: escribe la palabra en español que lleva cada nave enemiga para derribarla.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I4 · C2 · E5 · Cat5 = 26/30. Esfuerzo M. Riesgos: inviable en táctil, diccionario y tildes/ñ en distintos layouts.

### RACIMOS (`racimos`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · yellow
- **Rol:** alternativa (ranking #8)
- **Resumen:** Elimina grupos de 2+ celdas del mismo color; las de arriba caen; puntos (n−1)² por grupo.
- **Estado:** sugerido
- **Notas:** P4 · S4 · I5 · C4 · E5 · Cat4 = 26/30. Esfuerzo S. Riesgo: azar del tablero → semilla diaria para comparar scores.

### TERRITORIO (`territorio`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · magenta
- **Rol:** alternativa (ranking #9)
- **Resumen:** Traza líneas para cerrar y capturar áreas del campo evitando a una entidad que rebota (estilo Qix).
- **Estado:** sugerido
- **Notas:** P5 · S4 · I3 · C5 · E5 · Cat4 = 26/30. Esfuerzo M. Riesgo: relleno de áreas (flood fill en rejilla) y colisión con el trazo.

### DIANA (`diana`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · yellow
- **Rol:** alternativa (ranking #10)
- **Resumen:** Galería de tiro de 60 s: dianas neón aparecen y se mueven; precisión y racha multiplican.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I5 · C4 · E4 · Cat3 = 26/30. Esfuerzo S. Riesgos: poca profundidad, autoclickers; requiere ratón/táctil.

### TRÍADA (`triada`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · cyan
- **Rol:** alternativa (ranking #11)
- **Resumen:** Caen columnas de 3 gemas; rota su orden y alinea 3+ iguales en cualquier dirección (estilo Columns).
- **Estado:** sugerido
- **Notas:** P5 · S4 · I4 · C5 · E5 · Cat3 = 26/30. Esfuerzo M. Reutiliza el tablero de Tetris. Riesgo: demasiado parecido a Tetris/Caída.

### CIEMPIÉS (`ciempies`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · green
- **Rol:** alternativa (ranking #12)
- **Resumen:** Un ciempiés segmentado baja entre setas; cada segmento abatido se vuelve seta y lo divide.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I4 · C4 · E5 · Cat3 = 26/30. Esfuerzo M. Riesgo: sería otro SHOOTER de disparo vertical como Invasores.

### TÚNEL (`tunel`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · magenta
- **Rol:** alternativa (ranking #13)
- **Resumen:** Shooter vectorial en el borde de un tubo pseudo-3D; enemigos suben desde el fondo (estilo Tempest).
- **Estado:** sugerido
- **Notas:** P5 · S5 · I3 · C5 · E5 · Cat3 = 26/30. Esfuerzo L. Riesgo: proyección y geometría de varios tubos.

### ALETEO (`aleteo`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · green
- **Rol:** alternativa (ranking #14)
- **Resumen:** Un botón para aletear y cruzar huecos entre pilares neón; score = pilares superados.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I5 · C5 · E4 · Cat2 = 26/30. Esfuerzo S. Riesgos: clon muy reconocible, frustración, ARCADE saturado.

### PETACO (`petaco`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · cyan
- **Rol:** alternativa (ranking #15)
- **Resumen:** Pinball de una mesa neón: flippers, bumpers, rampas y multiplicadores; 3 bolas.
- **Estado:** sugerido
- **Notas:** P5 · S4 · I2 · C5 · E5 · Cat4 = 25/30. Esfuerzo L. Riesgo principal: física de bola y flippers (túneling, colisiones con segmentos rotando).

### ARENA (`arena`)

- **Fecha:** 2026-10-23
- **Categoría / color:** SHOOTER · magenta
- **Rol:** alternativa (ranking #16)
- **Resumen:** Twin-stick en arena cerrada: WASD mueve, flechas disparan; oleadas de enemigos geométricos.
- **Estado:** sugerido
- **Notas:** P5 · S5 · I4 · C3 · E5 · Cat3 = 25/30. Esfuerzo M. Riesgos: control dual en táctil, rendimiento con muchas partículas.

### AUTOPISTA (`autopista`)

- **Fecha:** 2026-10-23
- **Categoría / color:** ARCADE · yellow
- **Rol:** alternativa (ranking #17)
- **Resumen:** Conducción vertical: esquiva tráfico creciente en una autopista neón; distancia + adelantamientos.
- **Estado:** sugerido
- **Notas:** P4 · S5 · I5 · C5 · E4 · Cat2 = 25/30. Esfuerzo S. Riesgo: mecánica de esquivar parecida a Ranaria; ARCADE saturado.

### MINADO (`minado`)

- **Fecha:** 2026-10-23
- **Categoría / color:** PUZZLE · green
- **Rol:** alternativa (ranking #18)
- **Resumen:** Buscaminas en tableros encadenados contra reloj; score por casillas despejadas y tableros completados.
- **Estado:** sugerido
- **Notas:** P3 · S4 · I5 · C3 · E3 · Cat4 = 22/30. Esfuerzo S. Riesgos: azar de 50/50, clic derecho/long-press, poca acción visual.

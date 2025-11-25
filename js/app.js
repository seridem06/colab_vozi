class VoziGame {
    constructor() {
        this.estrellas = 0;
        this.palabraActual = null;
        this.nivelActual = 1;
        this.oportunidadesRestantes = 3;
        this.palabrasNivelActual = [];
        this.indicePalabraActual = 0;
        this.juegoTerminado = false;
        
        // Configuración de rutas de audio
        this.audioPaths = {
            nivel_001: 'assets/audios/nivel_001/',
            nivel_002: 'assets/audios/nivel_002/',
            feedback: 'assets/audios/pronuncia_bien/'
        };
        
        // Listas de palabras (se cargarán dinámicamente)
        this.palabrasNivel001 = [];
        this.palabrasNivel002 = [];
        this.audiosFeedback = [];
        
        // Elementos DOM
        this.elements = {};
        
        // Inicializar el juego
        this.init();
    }
    
    async init() {
        await this.loadDOMElements();
        await this.loadAudioLists();
        this.setupEventListeners();
        this.showInstructions();
    }
    
    async loadDOMElements() {
        // Pantallas
        this.elements.loadingScreen = document.getElementById('loadingScreen');
        this.elements.instructionsScreen = document.getElementById('instructionsScreen');
        this.elements.gameScreen = document.getElementById('gameScreen');
        this.elements.endScreen = document.getElementById('endScreen');
        
        // Elementos del juego
        this.elements.currentLevel = document.getElementById('currentLevel');
        this.elements.currentStars = document.getElementById('currentStars');
        this.elements.currentWord = document.getElementById('currentWord');
        this.elements.remainingOpportunities = document.getElementById('remainingOpportunities');
        this.elements.currentProgress = document.getElementById('currentProgress');
        this.elements.totalWords = document.getElementById('totalWords');
        this.elements.progressDots = document.getElementById('progressDots');
        this.elements.recognitionStatus = document.getElementById('recognitionStatus');
        this.elements.result = document.getElementById('result');
        
        // Botones
        this.elements.startGameBtn = document.getElementById('startGameBtn');
        this.elements.recognizeBtn = document.getElementById('recognizeBtn');
        this.elements.replayBtn = document.getElementById('replayBtn');
        this.elements.restartBtn = document.getElementById('restartBtn');
        this.elements.exitBtn = document.getElementById('exitBtn');
        this.elements.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Ocultar pantalla de carga después de un breve tiempo
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1500);
    }
    
    async loadAudioLists() {
        try {
            // En un entorno real, aquí harías una petición al servidor
            // Para este ejemplo, simulamos la carga de archivos
            this.palabrasNivel001 = await this.simulateAudioLoad('nivel_001');
            this.palabrasNivel002 = await this.simulateAudioLoad('nivel_002');
            this.audiosFeedback = await this.simulateAudioLoad('feedback');
            
            console.log('🔊 Audios cargados:', {
                nivel1: this.palabrasNivel001,
                nivel2: this.palabrasNivel002,
                feedback: this.audiosFeedback
            });
        } catch (error) {
            console.error('Error cargando listas de audio:', error);
        }
    }
    
    async simulateAudioLoad(nivel) {
        // Simulación de carga de archivos de audio
        // En producción, esto se reemplazaría con una llamada al servidor
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockFiles = {
                    'nivel_001': ['casa', 'mesa', 'silla', 'gato', 'perro', 'sol'],
                    'nivel_002': ['árbol', 'flor', 'puerta', 'ventana', 'libro', 'lápiz'],
                    'feedback': ['estas_cerca', 'intentalo', 'pronuncia_bien', 'felicidades', 'corregir']
                };
                resolve(mockFiles[nivel] || []);
            }, 500);
        });
    }
    
    setupEventListeners() {
        // Botones de navegación
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.exitBtn.addEventListener('click', () => this.exitGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
        
        // Botones de juego
        this.elements.recognizeBtn.addEventListener('click', () => this.startRecognition());
        this.elements.replayBtn.addEventListener('click', () => this.playCurrentAudio());
        
        // Inicializar reconocimiento de voz
        if (window.VoiceRecognition) {
            window.VoiceRecognition.init({
                onStart: () => this.onRecognitionStart(),
                onResult: (text) => this.processRecognitionResult(text),
                onError: (error) => this.onRecognitionError(error),
                onEnd: () => this.onRecognitionEnd()
            });
        }
    }
    
    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hidden');
    }
    
    showInstructions() {
        this.elements.instructionsScreen.classList.remove('hidden');
    }
    
    startGame() {
        this.elements.instructionsScreen.classList.add('hidden');
        this.elements.gameScreen.classList.remove('hidden');
        
        this.seleccionarPalabrasNivel();
        this.palabraActual = this.obtenerSiguientePalabra();
        this.updateGameUI();
        this.playCurrentAudio();
    }
    
    seleccionarPalabrasNivel() {
        const palabrasDisponibles = this.nivelActual === 1 ? 
            [...this.palabrasNivel001] : [...this.palabrasNivel002];
        
        // Seleccionar 3 palabras aleatorias únicas
        if (palabrasDisponibles.length >= 3) {
            this.palabrasNivelActual = this.getRandomSample(palabrasDisponibles, 3);
        } else {
            this.palabrasNivelActual = [...palabrasDisponibles];
        }
        
        this.indicePalabraActual = 0;
        console.log(`🎯 Palabras seleccionadas para el nivel ${this.nivelActual}:`, this.palabrasNivelActual);
    }
    
    getRandomSample(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    obtenerSiguientePalabra() {
        if (this.indicePalabraActual < this.palabrasNivelActual.length) {
            const palabra = this.palabrasNivelActual[this.indicePalabraActual];
            this.indicePalabraActual++;
            return palabra;
        } else {
            // Si ya se completaron todas las palabras, seleccionar nuevas
            this.seleccionarPalabrasNivel();
            return this.palabrasNivelActual[0] || null;
        }
    }
    
    updateGameUI() {
        // Actualizar elementos de la interfaz
        this.elements.currentLevel.textContent = this.nivelActual;
        this.elements.currentStars.textContent = this.estrellas;
        this.elements.currentWord.textContent = this.palabraActual ? this.palabraActual.toUpperCase() : 'CARGANDO...';
        this.elements.remainingOpportunities.textContent = this.oportunidadesRestantes;
        this.elements.currentProgress.textContent = this.indicePalabraActual;
        this.elements.totalWords.textContent = this.palabrasNivelActual.length;
        
        // Actualizar puntos de progreso
        this.updateProgressDots();
        
        // Limpiar mensajes
        this.elements.result.textContent = '';
    }
    
    updateProgressDots() {
        const dotsContainer = this.elements.progressDots;
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < this.palabrasNivelActual.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'progress-dot';
            
            if (i < this.indicePalabraActual - 1) {
                dot.textContent = '✓';
                dot.classList.add('completed');
            } else if (i === this.indicePalabraActual - 1) {
                dot.textContent = '●';
                dot.classList.add('current');
            } else {
                dot.textContent = '○';
                dot.classList.add('pending');
            }
            
            dotsContainer.appendChild(dot);
        }
    }
    
    playCurrentAudio() {
        if (!this.palabraActual) return;
        
        const audioPath = `${this.audioPaths[this.nivelActual === 1 ? 'nivel_001' : 'nivel_002']}${this.palabraActual}.m4a`;
        
        this.elements.recognitionStatus.textContent = '🔊 Reproduciendo audio...';
        this.elements.recognitionStatus.className = 'status-message status-playing';
        
        if (window.AudioPlayer) {
            window.AudioPlayer.playAudio(audioPath)
                .then(() => {
                    this.elements.recognitionStatus.textContent = '👆 Presiona "HABLAR" para empezar';
                    this.elements.recognitionStatus.className = 'status-message';
                })
                .catch(error => {
                    console.error('Error reproduciendo audio:', error);
                    this.elements.recognitionStatus.textContent = '❌ Error reproduciendo audio';
                    this.elements.recognitionStatus.className = 'status-message status-error';
                });
        }
    }
    
    startRecognition() {
        if (window.VoiceRecognition) {
            window.VoiceRecognition.start();
        }
    }
    
    onRecognitionStart() {
        this.elements.recognitionStatus.textContent = '● ESCUCHANDO... Habla ahora';
        this.elements.recognitionStatus.className = 'status-message status-listening';
        
        this.elements.recognizeBtn.textContent = '🎤 ESCUCHANDO...';
        this.elements.recognizeBtn.disabled = true;
    }
    
    processRecognitionResult(textoReconocido) {
        console.log(`🎯 Texto reconocido: '${textoReconocido}'`);
        console.log(`🎯 Palabra objetivo: '${this.palabraActual}'`);
        
        this.elements.recognitionStatus.textContent = `✅ Reconocido: ${textoReconocido}`;
        this.elements.recognitionStatus.className = 'status-message status-success';
        
        // Comparar palabras
        const esCorrecto = this.compararPalabrasExactas(textoReconocido, this.palabraActual);
        
        if (esCorrecto) {
            this.procesarAcierto();
        } else {
            this.procesarError(textoReconocido);
        }
    }
    
    onRecognitionError(error) {
        let mensajeError = '❌ Error: ';
        
        switch (error) {
            case 'no-speech':
                mensajeError += 'No se detectó voz';
                break;
            case 'audio-capture':
                mensajeError += 'No se pudo capturar audio';
                break;
            case 'not-allowed':
                mensajeError += 'Permiso de micrófono denegado';
                break;
            default:
                mensajeError += error;
        }
        
        this.elements.recognitionStatus.textContent = mensajeError;
        this.elements.recognitionStatus.className = 'status-message status-error';
        this.resetRecognitionButton();
    }
    
    onRecognitionEnd() {
        this.resetRecognitionButton();
    }
    
    resetRecognitionButton() {
        this.elements.recognizeBtn.textContent = '🎤 HABLAR';
        this.elements.recognizeBtn.disabled = false;
    }
    
    compararPalabrasExactas(textoReconocido, palabraObjetivo) {
        const textoLimpio = textoReconocido.toLowerCase().trim();
        const objetivoLimpio = palabraObjetivo.toLowerCase().trim();
        
        console.log(`🔍 Comparando EXACTO: '${textoLimpio}' con '${objetivoLimpio}'`);
        
        return textoLimpio === objetivoLimpio;
    }
    
    procesarAcierto() {
        this.estrellas++;
        this.oportunidadesRestantes = 3;
        
        // Mostrar mensaje de éxito
        this.elements.result.textContent = '✅ ¡ACERTASTE EXACTAMENTE!';
        this.elements.result.style.background = 'rgba(76, 175, 80, 0.3)';
        this.elements.result.style.color = '#69F0AE';
        
        // Reproducir audio de felicitaciones
        this.playFeedbackAudio('felicidades');
        
        // Verificar si pasó al nivel 2 o terminó el juego
        setTimeout(() => {
            if (this.estrellas >= 3) {
                if (this.nivelActual === 1) {
                    this.pasarAlNivel2();
                } else {
                    this.terminarJuego();
                }
            } else {
                this.siguientePalabra();
            }
        }, 3000);
    }
    
    procesarError(textoReconocido) {
        this.oportunidadesRestantes--;
        
        // Mostrar mensaje de error
        this.elements.result.textContent = `❌ No es correcto. Dijiste: "${textoReconocido}"`;
        this.elements.result.style.background = 'rgba(244, 67, 54, 0.3)';
        this.elements.result.style.color = '#FF5252';
        
        // Reproducir feedback según las oportunidades restantes
        let tipoFeedback = 'corregir';
        if (this.oportunidadesRestantes === 2) {
            tipoFeedback = 'cerca';
        } else if (this.oportunidadesRestantes === 1) {
            tipoFeedback = 'intentalo';
        }
        
        this.playFeedbackAudio(tipoFeedback);
        
        if (this.oportunidadesRestantes > 0) {
            setTimeout(() => {
                this.updateGameUI();
                this.elements.result.textContent = '';
            }, 3000);
        } else {
            this.oportunidadesRestantes = 3;
            setTimeout(() => {
                this.siguientePalabra();
            }, 2000);
        }
    }
    
    playFeedbackAudio(tipoFeedback) {
        const mapeoArchivos = {
            "cerca": ["estas_cerca", "estas cerca", "cerca"],
            "intentalo": ["inténtalo", "intentalo", "intenta", "inténtalo de nuevo"],
            "bien": ["pronuncia_bien", "pronuncia bien", "bien", "tu puedes"],
            "felicidades": ["felicidades", "excelente", "muy bien", "perfecto"],
            "corregir": ["corregir", "no es la palabra", "escucha bien", "incorrecto"]
        };
        
        const archivosPosibles = mapeoArchivos[tipoFeedback] || [];
        let archivoEncontrado = null;
        
        // Buscar archivo disponible
        for (const archivo of archivosPosibles) {
            if (this.audiosFeedback.includes(archivo)) {
                archivoEncontrado = archivo;
                break;
            }
        }
        
        if (!archivoEncontrado && this.audiosFeedback.length > 0) {
            archivoEncontrado = this.audiosFeedback[0];
        }
        
        if (archivoEncontrado) {
            const audioPath = `${this.audioPaths.feedback}${archivoEncontrado}.m4a`;
            console.log(`🎧 Reproduciendo feedback: ${archivoEncontrado}`);
            
            if (window.AudioPlayer) {
                window.AudioPlayer.playAudio(audioPath);
            }
        }
    }
    
    siguientePalabra() {
        if (this.juegoTerminado) {
            this.mostrarPantallaFinal();
            return;
        }
        
        const siguientePalabra = this.obtenerSiguientePalabra();
        
        if (siguientePalabra) {
            this.palabraActual = siguientePalabra;
            this.updateGameUI();
            this.playCurrentAudio();
        } else {
            this.seleccionarPalabrasNivel();
            if (this.palabrasNivelActual.length > 0) {
                this.palabraActual = this.palabrasNivelActual[0];
                this.updateGameUI();
                this.playCurrentAudio();
            }
        }
    }
    
    pasarAlNivel2() {
        this.nivelActual = 2;
        this.estrellas = 0;
        this.seleccionarPalabrasNivel();
        this.palabraActual = this.obtenerSiguientePalabra();
        this.updateGameUI();
        this.playCurrentAudio();
        
        this.elements.result.textContent = '🚀 ¡Pasaste al NIVEL 2!';
        this.elements.result.style.background = 'rgba(255, 152, 0, 0.3)';
        this.elements.result.style.color = '#FFCC80';
        
        setTimeout(() => {
            this.elements.result.textContent = '';
        }, 3000);
    }
    
    terminarJuego() {
        this.juegoTerminado = true;
        this.mostrarPantallaFinal();
    }
    
    mostrarPantallaFinal() {
        this.elements.gameScreen.classList.add('hidden');
        this.elements.endScreen.classList.remove('hidden');
    }
    
    restartGame() {
        // Reiniciar estado del juego
        this.estrellas = 0;
        this.nivelActual = 1;
        this.oportunidadesRestantes = 3;
        this.juegoTerminado = false;
        
        // Volver a la pantalla de instrucciones
        this.elements.endScreen.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.showInstructions();
    }
    
    exitGame() {
        if (confirm('¿Estás seguro de que quieres salir del juego?')) {
            this.elements.gameScreen.classList.add('hidden');
            this.showInstructions();
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.voziGame = new VoziGame();
});
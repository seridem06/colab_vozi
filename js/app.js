class VoziGame {
    constructor() {
        this.estrellas = 0;
        this.palabraActual = null;
        this.nivelActual = 1;
        this.oportunidadesRestantes = 3;
        this.palabrasNivelActual = [];
        this.indicePalabraActual = 0;
        this.juegoTerminado = false;
        this.microfonoPermitido = false;
        this.solicitandoMicrofono = false;
        
        // Configuración de rutas de audio - RELATIVAS
        this.audioPaths = {
            nivel_001: 'assets/audios/nivel_001/',
            nivel_002: 'assets/audios/nivel_002/',
            feedback: 'assets/audios/pronuncia_bien/'
        };
        
        // Listas de palabras (se cargarán desde los archivos reales)
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
        // Inicializar reconocimiento de voz
        this.inicializarReconocimientoVoz();
    }
    
    async inicializarReconocimientoVoz() {
        // Verificar compatibilidad primero
        if (!this.isSpeechRecognitionSupported()) {
            this.mostrarErrorCompatibilidad();
            return;
        }
        
        // Intentar obtener permisos del micrófono automáticamente
        await this.solicitarPermisoMicrofono();
    }
    
    isSpeechRecognitionSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    async solicitarPermisoMicrofono() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('getUserMedia no es compatible con este navegador');
            this.mostrarEstadoMicrofono('no-compatible');
            return;
        }

        try {
            this.mostrarEstadoMicrofono('solicitando');
            this.solicitandoMicrofono = true;
            
            // Solicitar acceso al micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // Detener el stream inmediatamente - solo necesitamos el permiso
            stream.getTracks().forEach(track => track.stop());
            
            this.microfonoPermitido = true;
            this.solicitandoMicrofono = false;
            this.mostrarEstadoMicrofono('permitido');
            console.log('✅ Permiso de micrófono concedido');
            
        } catch (error) {
            this.microfonoPermitido = false;
            this.solicitandoMicrofono = false;
            this.mostrarEstadoMicrofono('denegado');
            console.error('❌ Error al acceder al micrófono:', error);
            
            if (error.name === 'NotAllowedError') {
                this.mostrarModalPermisos();
            }
        }
    }
    
    mostrarEstadoMicrofono(estado) {
        const statusElement = this.elements.recognitionStatus;
        if (!statusElement) return;
        
        switch(estado) {
            case 'solicitando':
                statusElement.innerHTML = '🎤 <strong>Solicitando acceso al micrófono...</strong><br><small>Por favor, permite el acceso cuando tu navegador lo solicite</small>';
                statusElement.className = 'status-message status-microphone-request';
                break;
                
            case 'permitido':
                statusElement.innerHTML = '✅ <strong>Micrófono permitido</strong><br><small>Ahora puedes usar el reconocimiento de voz</small>';
                statusElement.className = 'status-message status-microphone-allowed';
                break;
                
            case 'denegado':
                statusElement.innerHTML = '❌ <strong>Acceso al micrófono denegado</strong><br><small>Haz clic en "HABLAR" para intentar nuevamente</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
                
            case 'no-compatible':
                statusElement.innerHTML = '⚠️ <strong>Navegador no compatible</strong><br><small>Usa Chrome, Edge o Safari para reconocimiento de voz</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
        }
    }
    
    mostrarModalPermisos() {
        // Verificar si ya existe un modal
        if (document.getElementById('microphoneModal')) return;
        
        const modalHtml = `
        <div id="microphoneModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🎤</div>
                <h3 style="margin: 0 0 15px 0; color: #333;">Permiso de Micrófono Requerido</h3>
                <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                    Para jugar a Vozi necesitas permitir el acceso al micrófono. 
                    Cuando hagas clic en "Permitir", tu navegador te pedirá los permisos.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btnPermitirMicrofono" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Permitir Micrófono</button>
                    <button id="btnCancelarMicrofono" style="
                        background: #f44336;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Cancelar</button>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btnPermitirMicrofono').addEventListener('click', async () => {
            document.getElementById('microphoneModal').remove();
            await this.solicitarPermisoMicrofono();
        });
        
        document.getElementById('btnCancelarMicrofono').addEventListener('click', () => {
            document.getElementById('microphoneModal').remove();
            this.mostrarEstadoMicrofono('denegado');
        });
    }
    
    mostrarErrorCompatibilidad() {
        const statusElement = this.elements.recognitionStatus;
        if (!statusElement) return;
        
        statusElement.innerHTML = `
            ❌ <strong>Navegador no compatible</strong><br>
            <small>El reconocimiento de voz no está disponible en este navegador.</small><br>
            <small>Usa <strong>Chrome</strong>, <strong>Edge</strong> o <strong>Safari</strong> para jugar.</small>
        `;
        statusElement.className = 'status-message status-microphone-denied';
        
        if (this.elements.recognizeBtn) {
            this.elements.recognizeBtn.disabled = true;
            this.elements.recognizeBtn.style.background = '#9E9E9E';
        }
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
        
        // Ocultar pantalla de carga
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1000);
    }
    
    async loadAudioLists() {
        try {
            // Cargar listas de archivos de audio disponibles
            this.palabrasNivel001 = await this.getAvailableAudios('nivel_001');
            this.palabrasNivel002 = await this.getAvailableAudios('nivel_002');
            this.audiosFeedback = await this.getAvailableAudios('pronuncia_bien');
            
            console.log('🔊 Audios cargados:', {
                nivel1: this.palabrasNivel001,
                nivel2: this.palabrasNivel002,
                feedback: this.audiosFeedback
            });
        } catch (error) {
            console.error('Error cargando listas de audio:', error);
        }
    }
    
    async getAvailableAudios(nivel) {
        // Lista de archivos conocidos basada en tu estructura
        const archivosConocidos = {
            'nivel_001': ['dado', 'gato', 'helado', 'perro', 'rama'],
            'nivel_002': ['ardilla', 'ferrocarril', 'pelota', 'ratón', 'tortuga'],
            'pronuncia_bien': ['corregir', 'estas_cerca', 'felicidades', 'intentalo', 'pronuncia_bien']
        };
        
        return archivosConocidos[nivel] || [];
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
        
        // Seleccionar 3 palabras aleatorias únicas (igual que Colab)
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
            // Si ya se completaron todas las palabras, seleccionar nuevas (igual que Colab)
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
        
        // Actualizar puntos de progreso (igual que Colab)
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
        
        this.playAudio(audioPath)
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
    
    playAudio(audioPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioPath);
            audio.onloadeddata = () => {
                audio.play().then(resolve).catch(reject);
            };
            audio.onerror = reject;
            audio.onended = resolve;
        });
    }
    
    async startRecognition() {
        // Verificar compatibilidad
        if (!this.isSpeechRecognitionSupported()) {
            this.mostrarErrorCompatibilidad();
            return;
        }

        // Si no tenemos permiso o está en proceso, intentar obtenerlo
        if (!this.microfonoPermitido || this.solicitandoMicrofono) {
            await this.solicitarPermisoMicrofono();
            
            // Si aún no tenemos permiso, mostrar mensaje
            if (!this.microfonoPermitido) {
                this.elements.recognitionStatus.innerHTML = `
                    ❌ <strong>Micrófono no disponible</strong><br>
                    <small>Haz clic en "Permitir" cuando tu navegador lo solicite</small>
                `;
                this.elements.recognitionStatus.className = 'status-message status-microphone-denied';
                return;
            }
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        // Estado de escucha
        this.elements.recognitionStatus.innerHTML = '● <strong>ESCUCHANDO...</strong><br><small>Habla ahora claramente</small>';
        this.elements.recognitionStatus.className = 'status-message status-listening';
        this.elements.recognizeBtn.textContent = '🎤 ESCUCHANDO...';
        this.elements.recognizeBtn.disabled = true;

        recognition.onresult = (event) => {
            const textoReconocido = event.results[0][0].transcript.toLowerCase().trim();
            this.elements.recognitionStatus.innerHTML = `✅ <strong>Reconocido:</strong> ${textoReconocido}`;
            this.elements.recognitionStatus.className = 'status-message status-success';
            
            this.procesarResultado(textoReconocido);
        };

        recognition.onerror = (event) => {
            let mensajeError = '❌ <strong>Error:</strong> ';
            
            if (event.error == 'no-speech') {
                mensajeError += 'No se detectó voz. Intenta hablar más fuerte.';
            } else if (event.error == 'audio-capture') {
                mensajeError += 'No se pudo capturar audio. Verifica tu micrófono.';
                this.microfonoPermitido = false;
            } else if (event.error == 'not-allowed') {
                mensajeError += 'Permiso de micrófono denegado. Haz clic en "HABLAR" para intentar nuevamente.';
                this.microfonoPermitido = false;
                this.mostrarModalPermisos();
            } else if (event.error == 'network') {
                mensajeError += 'Error de red. Verifica tu conexión a internet.';
            } else {
                mensajeError += event.error;
            }

            this.elements.recognitionStatus.innerHTML = mensajeError;
            this.elements.recognitionStatus.className = 'status-message status-error';
            this.resetRecognitionButton();
        };

        recognition.onend = () => {
            this.resetRecognitionButton();
        };

        try {
            recognition.start();
        } catch (error) {
            this.elements.recognitionStatus.innerHTML = '❌ <strong>Error al iniciar reconocimiento</strong>';
            this.elements.recognitionStatus.className = 'status-message status-error';
            this.resetRecognitionButton();
        }
    }
    
    resetRecognitionButton() {
        this.elements.recognizeBtn.textContent = '🎤 HABLAR';
        this.elements.recognizeBtn.disabled = false;
    }
    
    // MÉTODOS IDÉNTICOS AL CÓDIGO COLAB
    
    detectarConfusionRL(textoReconocido, palabraObjetivo) {
        const texto = textoReconocido.toLowerCase();
        const objetivo = palabraObjetivo.toLowerCase();

        // Caso 1: Palabra objetivo tiene R pero niño dijo L
        if ('r'.includes(objetivo) && texto.includes('l')) {
            const textoCorregido = texto.replace(/l/g, 'r');
            if (textoCorregido === objetivo) {
                return [true, "r_por_l", "Confundiste 'R' con 'L'. Para la R, haz vibrar la lengua"];
            }
        }

        // Caso 2: Palabra objetivo tiene RR pero niño dijo L
        if (objetivo.includes('rr') && texto.includes('l')) {
            const textoCorregido = texto.replace(/l/g, 'rr');
            if (textoCorregido === objetivo) {
                return [true, "rr_por_l", "Confundiste 'RR' con 'L'. Para la RR, vibra la lengua más fuerte"];
            }
        }

        // Caso 3: Palabra objetivo tiene L pero niño dijo R
        if (objetivo.includes('l') && texto.includes('r')) {
            const textoCorregido = texto.replace(/r/g, 'l');
            if (textoCorregido === objetivo) {
                return [true, "l_por_r", "Confundiste 'L' con 'R'. Para la L, toca el paladar con la punta de la lengua"];
            }
        }

        return [false, "", ""];
    }

    calcularSimilitud(texto1, texto2) {
        // Implementación simple de similitud (puedes mejorarla)
        const longer = texto1.length > texto2.length ? texto1 : texto2;
        const shorter = texto1.length > texto2.length ? texto2 : texto1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }

    editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    compararPalabras(textoReconocido, palabraObjetivo) {
        const textoLimpio = textoReconocido.toLowerCase().trim();
        const objetivoLimpio = palabraObjetivo.toLowerCase().trim();

        console.log(`🔍 Comparando EXACTO: '${textoLimpio}' con '${objetivoLimpio}'`);

        // SOLO COMPARACIÓN EXACTA (igual que Colab)
        if (textoLimpio === objetivoLimpio) {
            return [true, "exacta", ""];
        }

        // Verificar confusiones específicas R/L
        const [tieneConfusionRL, tipoConfusion, mensajeConfusion] = this.detectarConfusionRL(textoLimpio, objetivoLimpio);
        if (tieneConfusionRL) {
            return [false, tipoConfusion, mensajeConfusion];
        }

        // Calcular similitud para determinar el tipo de feedback
        const similitud = this.calcularSimilitud(textoLimpio, objetivoLimpio);

        if (similitud < 0.3) {
            return [false, "completamente_diferente", ""];
        } else if (similitud < 0.6) {
            return [false, "poco_similar", ""];
        } else {
            return [false, "muy_similar", ""];
        }
    }

    procesarResultado(textoReconocido) {
        console.log(`🎯 Texto reconocido: '${textoReconocido}'`);
        console.log(`🎯 Palabra objetivo: '${this.palabraActual}'`);

        // Comparar las palabras - SOLO EXACTO (igual que Colab)
        const [esCorrecto, tipoComparacion, mensajeEspecifico] = this.compararPalabras(textoReconocido, this.palabraActual);

        if (esCorrecto) {
            this.estrellas++;
            this.oportunidadesRestantes = 3;

            // Reproducir audio de felicitaciones
            console.log("✅ ¡ACERTASTE EXACTAMENTE!");
            this.reproducirAudioFeedback("felicidades");

            this.elements.result.textContent = '✅ ¡ACERTASTE EXACTAMENTE!';
            this.elements.result.style.background = 'rgba(76, 175, 80, 0.3)';
            this.elements.result.style.color = '#69F0AE';

            // Verificar si pasó al nivel 2 o terminó el juego
            setTimeout(() => {
                if (this.estrellas >= 3) {
                    if (this.nivelActual === 1) {
                        console.log("🚀 Pasando al NIVEL 2...");
                        this.nivelActual = 2;
                        this.estrellas = 0;
                        this.seleccionarPalabrasNivel();
                        
                        this.elements.result.textContent = '🚀 ¡Pasaste al NIVEL 2!';
                        this.elements.result.style.background = 'rgba(255, 152, 0, 0.3)';
                        this.elements.result.style.color = '#FFCC80';
                        
                        setTimeout(() => {
                            this.siguientePalabra();
                        }, 3000);
                    } else {
                        this.juegoTerminado = true;
                        this.mostrarPantallaFinal();
                    }
                } else {
                    this.siguientePalabra();
                }
            }, 3000);

        } else {
            this.oportunidadesRestantes--;

            this.elements.result.textContent = `❌ No es correcto. Dijiste: "${textoReconocido}"`;
            this.elements.result.style.background = 'rgba(244, 67, 54, 0.3)';
            this.elements.result.style.color = '#FF5252';

            // Determinar qué tipo de feedback reproducir (igual que Colab)
            if (["r_por_l", "rr_por_l", "l_por_r"].includes(tipoComparacion)) {
                this.reproducirAudioFeedback("corregir");
            } else if (tipoComparacion === "completamente_diferente") {
                this.reproducirAudioFeedback("corregir");
            } else if (tipoComparacion === "poco_similar") {
                this.reproducirAudioFeedback("bien");
            } else {
                if (this.oportunidadesRestantes === 2) {
                    this.reproducirAudioFeedback("cerca");
                } else if (this.oportunidadesRestantes === 1) {
                    this.reproducirAudioFeedback("intentalo");
                } else {
                    this.reproducirAudioFeedback("bien");
                }
            }

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
    }

    reproducirAudioFeedback(tipoFeedback) {
        const mapeoArchivos = {
            "cerca": ["estas_cerca", "estas cerca", "cerca"],
            "intentalo": ["intentalo", "inténtalo", "intenta", "inténtalo de nuevo"],
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
            
            this.playAudio(audioPath).catch(error => {
                console.error('Error reproduciendo feedback:', error);
            });
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
        this.microfonoPermitido = false;

        // Volver a la pantalla de instrucciones
        this.elements.endScreen.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.showInstructions();
        
        // Re-inicializar reconocimiento de voz
        this.inicializarReconocimientoVoz();
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
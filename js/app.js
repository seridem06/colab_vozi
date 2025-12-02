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
        this.reconocimientoActivo = false;
        
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
            
            // Solicitar acceso al micrófono con configuraciones para PC
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                },
                video: false
            };
            
            console.log('🎤 Solicitando permisos con constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Obtener información del dispositivo
            const tracks = stream.getAudioTracks();
            if (tracks.length > 0) {
                console.log('✅ Micrófono conectado:', tracks[0].label);
            }
            
            // Detener el stream inmediatamente - solo necesitamos el permiso
            stream.getTracks().forEach(track => track.stop());
            
            this.microfonoPermitido = true;
            this.solicitandoMicrofono = false;
            this.mostrarEstadoMicrofono('permitido');
            console.log('✅ Permiso de micrófono concedido');
            
        } catch (error) {
            this.microfonoPermitido = false;
            this.solicitandoMicrofono = false;
            console.error('❌ Error al acceder al micrófono:', error.name, error.message);
            
            if (error.name === 'NotAllowedError') {
                this.mostrarEstadoMicrofono('denegado');
                this.mostrarModalPermisos();
            } else if (error.name === 'NotFoundError') {
                this.mostrarEstadoMicrofono('no-microfono');
            } else if (error.name === 'NotReadableError') {
                this.mostrarEstadoMicrofono('error-hardware');
            } else {
                this.mostrarEstadoMicrofono('error-desconocido');
            }
        }
    }
    
    crearEstrellaFlotante() {
        const estrella = document.createElement('div');
        estrella.innerHTML = '⭐';
        estrella.style.cssText = `
            position: fixed;
            font-size: 10rem;
            z-index: 1000;
            pointer-events: none;
            animation: flotarEstrella 2s ease-in-out forwards;
            top: 50%;
            left: 50%;
        `;
        
        document.body.appendChild(estrella);
        
        const randomX = (Math.random() - 0.5) * 200;
        const randomY = (Math.random() - 0.5) * 200;
        
        estrella.style.setProperty('--random-x', `${randomX}px`);
        estrella.style.setProperty('--random-y', `${randomY}px`);
        
        setTimeout(() => {
            if (estrella.parentNode) {
                estrella.parentNode.removeChild(estrella);
            }
        }, 2000);
    }
    
    crearEmojiLengua() {
        const emoji = document.createElement('div');
        emoji.innerHTML = '😛';
        emoji.style.cssText = `
            position: fixed;
            font-size: 12rem;
            z-index: 1000;
            pointer-events: none;
            animation: mostrarLengua 1.5s ease-in-out forwards;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(emoji);
        
        setTimeout(() => {
            if (emoji.parentNode) {
                emoji.parentNode.removeChild(emoji);
            }
        }, 1500);
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
                
            case 'no-microfono':
                statusElement.innerHTML = '🎤 <strong>No se encontró micrófono</strong><br><small>Conecta un micrófono a tu computadora</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
                
            case 'error-hardware':
                statusElement.innerHTML = '🔧 <strong>Error de hardware</strong><br><small>El micrófono está siendo usado por otra aplicación</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
                
            case 'no-compatible':
                statusElement.innerHTML = '⚠️ <strong>Navegador no compatible</strong><br><small>Usa Chrome, Edge o Safari para reconocimiento de voz</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
                
            case 'error-desconocido':
                statusElement.innerHTML = '❓ <strong>Error desconocido</strong><br><small>Intenta reiniciar el navegador</small>';
                statusElement.className = 'status-message status-microphone-denied';
                break;
        }
    }
    
    mostrarModalPermisos() {
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
                    Para jugar a Vozi necesitas permitir el acceso al micrófono.<br><br>
                    <strong>En PC:</strong><br>
                    1. Haz clic en "Permitir Micrófono"<br>
                    2. Asegúrate de tener un micrófono conectado<br>
                    3. En Windows: Configuración > Sonido > Entrada<br>
                    4. Selecciona el micrófono correcto
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
        
        this.agregarEstilosAnimaciones();
        
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1000);
    }
    
    agregarEstilosAnimaciones() {
        const styles = `
            <style>
                @keyframes flotarEstrella {
                    0% {
                        transform: translate(-50%, -50%) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + var(--random-x, 0px)), calc(-50% + var(--random-y, 0px))) scale(0.8);
                        opacity: 0;
                    }
                }
                
                @keyframes mostrarLengua {
                    0% {
                        transform: translate(-50%, -50%) scale(0.3);
                        opacity: 0;
                    }
                    30% {
                        transform: translate(-50%, -50%) scale(1.1);
                        opacity: 1;
                    }
                    70% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    async loadAudioLists() {
        try {
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
        const archivosConocidos = {
            'nivel_001': ['carril', 'carro', 'loro', 'perro', 'rama'],
            'nivel_002': ['ardilla', 'ferrocarril', 'ratón', 'tigrillo', 'tortuga','tralalerotralalá'],
            'pronuncia_bien': ['corregir', 'estas_cerca', 'felicidades', 'intentalo', 'pronuncia_bien']
        };
        
        return archivosConocidos[nivel] || [];
    }
    
    setupEventListeners() {
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.exitBtn.addEventListener('click', () => this.exitGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.restartGame());
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
            this.seleccionarPalabrasNivel();
            return this.palabrasNivelActual[0] || null;
        }
    }
    
    updateGameUI() {
        this.elements.currentLevel.textContent = this.nivelActual;
        this.elements.currentStars.textContent = this.estrellas;
        this.elements.currentWord.textContent = this.palabraActual ? this.palabraActual.toUpperCase() : 'CARGANDO...';
        this.elements.remainingOpportunities.textContent = this.oportunidadesRestantes;
        this.elements.currentProgress.textContent = this.indicePalabraActual;
        this.elements.totalWords.textContent = this.palabrasNivelActual.length;
        
        this.updateProgressDots();
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
        if (this.reconocimientoActivo) {
            console.log('⚠️ Reconocimiento ya activo');
            return;
        }
        
        if (!this.isSpeechRecognitionSupported()) {
            this.mostrarErrorCompatibilidad();
            return;
        }

        if (!this.microfonoPermitido || this.solicitandoMicrofono) {
            await this.solicitarPermisoMicrofono();
            
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
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES';
        this.recognition.maxAlternatives = 1;

        this.elements.recognitionStatus.innerHTML = '● <strong>ESCUCHANDO...</strong><br><small>Habla ahora claramente</small>';
        this.elements.recognitionStatus.className = 'status-message status-listening';
        this.elements.recognizeBtn.textContent = '🎤 ESCUCHANDO...';
        this.elements.recognizeBtn.disabled = true;
        this.reconocimientoActivo = true;

        this.recognition.onresult = (event) => {
            this.reconocimientoActivo = false;
            const textoReconocido = event.results[0][0].transcript.toLowerCase().trim();
            this.elements.recognitionStatus.innerHTML = `✅ <strong>Reconocido:</strong> ${textoReconocido}`;
            this.elements.recognitionStatus.className = 'status-message status-success';
            
            this.procesarResultado(textoReconocido);
        };

        this.recognition.onerror = (event) => {
            this.reconocimientoActivo = false;
            let mensajeError = '❌ <strong>Error:</strong> ';
            
            if (event.error == 'no-speech') {
                mensajeError += 'No se detectó voz. Intenta hablar más fuerte.';
            } else if (event.error == 'audio-capture') {
                mensajeError += 'No se pudo capturar audio. Verifica tu micrófono.';
                this.microfonoPermitido = false;
                this.mostrarEstadoMicrofono('no-microfono');
            } else if (event.error == 'not-allowed') {
                mensajeError += 'Permiso de micrófono denegado. Haz clic en "HABLAR" para intentar nuevamente.';
                this.microfonoPermitido = false;
                this.mostrarModalPermisos();
            } else if (event.error == 'network') {
                mensajeError += 'Error de red. Verifica tu conexión a internet.';
            } else if (event.error == 'service-not-allowed') {
                mensajeError += 'Servicio de reconocimiento no disponible.';
            } else {
                mensajeError += event.error;
            }

            this.elements.recognitionStatus.innerHTML = mensajeError;
            this.elements.recognitionStatus.className = 'status-message status-error';
            this.resetRecognitionButton();
        };

        this.recognition.onend = () => {
            this.reconocimientoActivo = false;
            this.resetRecognitionButton();
        };

        try {
            this.recognition.start();
            console.log('🎤 Reconocimiento de voz iniciado');
            
            setTimeout(() => {
                if (this.reconocimientoActivo) {
                    this.recognition.stop();
                    this.elements.recognitionStatus.innerHTML = '⏱️ <strong>Tiempo agotado</strong><br><small>Intenta de nuevo hablando más claro</small>';
                    this.elements.recognitionStatus.className = 'status-message status-error';
                    this.reconocimientoActivo = false;
                    this.resetRecognitionButton();
                }
            }, 10000);
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            this.elements.recognitionStatus.innerHTML = '❌ <strong>Error en el reconocimiento</strong><br><small>Intenta actualizar la página</small>';
            this.elements.recognitionStatus.className = 'status-message status-error';
            this.reconocimientoActivo = false;
            this.resetRecognitionButton();
        }
    }
    
    resetRecognitionButton() {
        this.elements.recognizeBtn.textContent = '🎤 HABLAR';
        this.elements.recognizeBtn.disabled = false;
    }
    
    detectarConfusionRL(textoReconocido, palabraObjetivo) {
        const texto = textoReconocido.toLowerCase();
        const objetivo = palabraObjetivo.toLowerCase();

        // CORRECCIÓN 1: Bug en la línea original - tenía 'r'.includes(objetivo) que siempre era falso
        // Caso 1: Palabra objetivo tiene R pero niño dijo L
        if (objetivo.includes('r') && texto.includes('l')) {
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

        // CORRECCIÓN 2: Detectar errores como "errocarril" en vez de "ferrocarril"
        // Niño omitió la primera letra
        if (texto === objetivo.slice(1)) {
            const letraFaltante = objetivo[0].toUpperCase();
            return [false, "omitio_letra_inicio", `Te faltó la letra '${letraFaltante}' al inicio. Debe ser: ${objetivo.toUpperCase()}`];
        }
        
        // Niño omitió la última letra
        if (texto === objetivo.slice(0, -1)) {
            const letraFaltante = objetivo[objetivo.length - 1].toUpperCase();
            return [false, "omitio_letra_final", `Te faltó la letra '${letraFaltante}' al final. Debe ser: ${objetivo.toUpperCase()}`];
        }

        // Para palabras largas como "ferrocarril", verificar letras faltantes
        if (objetivo.length >= 6 && texto.length >= objetivo.length - 2) {
            // Verificar si es un caso de letra faltante en medio
            for (let i = 0; i < objetivo.length; i++) {
                const sinLetra = objetivo.slice(0, i) + objetivo.slice(i + 1);
                if (texto === sinLetra) {
                    const letraFaltante = objetivo[i].toUpperCase();
                    return [false, "letra_faltante_medio", `Te faltó la letra '${letraFaltante}' en medio. Pronuncia: ${objetivo.toUpperCase()}`];
                }
            }
            
            // Verificar si es un caso de letra incorrecta
            if (texto.length === objetivo.length) {
                let diferencias = 0;
                let posicionError = -1;
                
                for (let i = 0; i < texto.length; i++) {
                    if (texto[i] !== objetivo[i]) {
                        diferencias++;
                        posicionError = i;
                    }
                }
                
                if (diferencias === 1) {
                    return [false, "letra_incorrecta", `En la posición ${posicionError + 1}, '${texto[posicionError].toUpperCase()}' debe ser '${objetivo[posicionError].toUpperCase()}'`];
                }
            }
        }

        return [false, "", ""];
    }

    calcularSimilitud(texto1, texto2) {
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

        console.log(`🔍 Comparando: '${textoLimpio}' con '${objetivoLimpio}'`);

        // CORRECCIÓN 3: SOLO aceptar comparación EXACTA
        if (textoLimpio === objetivoLimpio) {
            return [true, "exacta", ""];
        }

        // Verificar confusiones específicas R/L
        const [tieneConfusionRL, tipoConfusion, mensajeConfusion] = this.detectarConfusionRL(textoLimpio, objetivoLimpio);
        if (tieneConfusionRL) {
            return [false, tipoConfusion, mensajeConfusion];
        }

        // CORRECCIÓN 4: Para palabras largas como "ferrocarril", ser más estricto
        if (objetivoLimpio.length >= 6) {
            // Si la diferencia de longitud es mayor a 1, rechazar
            const diff = Math.abs(textoLimpio.length - objetivoLimpio.length);
            if (diff > 1) {
                return [false, "completamente_diferente", `La palabra tiene ${objetivoLimpio.length} letras. Pronuncia todas las letras`];
            }
            
            // Caso específico para "ferrocarril"
            if (objetivoLimpio === "ferrocarril") {
                if (textoLimpio === "errocarril") {
                    return [false, "letra_faltante", "¡Casi! Pero te falta la F al inicio: FERROCARRIL"];
                }
                if (textoLimpio === "ferrocarrí" || textoLimpio === "ferocarril" || textoLimpio === "ferrocarrr") {
                    return [false, "letra_incorrecta", "Muy cerca. La palabra correcta es: FERROCARRIL"];
                }
            }
        }

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

        const [esCorrecto, tipoComparacion, mensajeEspecifico] = this.compararPalabras(textoReconocido, this.palabraActual);

        if (esCorrecto) {
            this.estrellas++;
            this.oportunidadesRestantes = 3;

            this.crearEstrellaFlotante();
            console.log("✅ ¡ACERTASTE EXACTAMENTE!");
            this.reproducirAudioFeedback("felicidades");

            this.elements.result.textContent = '✅ ¡ACERTASTE EXACTAMENTE!';
            this.elements.result.style.background = 'rgba(76, 175, 80, 0.3)';
            this.elements.result.style.color = '#69F0AE';

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

            if (tipoComparacion.includes("letra") || tipoComparacion.includes("omitio")) {
                this.crearEmojiLengua();
            }

            if (mensajeEspecifico) {
                this.elements.result.textContent = `❌ ${mensajeEspecifico}`;
            } else {
                this.elements.result.textContent = `❌ No es correcto. Dijiste: "${textoReconocido}"`;
            }
            
            this.elements.result.style.background = 'rgba(244, 67, 54, 0.3)';
            this.elements.result.style.color = '#FF5252';

            // Determinar qué tipo de feedback reproducir
            if (["r_por_l", "rr_por_l", "l_por_r"].includes(tipoComparacion)) {
                this.reproducirAudioFeedback("corregir");
            } else if (tipoComparacion.includes("letra") || tipoComparacion.includes("omitio")) {
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
        this.estrellas = 0;
        this.nivelActual = 1;
        this.oportunidadesRestantes = 3;
        this.juegoTerminado = false;
        this.microfonoPermitido = false;

        this.elements.endScreen.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.showInstructions();
        
        this.inicializarReconocimientoVoz();
    }

    exitGame() {
        if (confirm('¿Estás seguro de que quieres salir del juego?')) {
            this.elements.gameScreen.classList.add('hidden');
            this.showInstructions();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.voziGame = new VoziGame();
});
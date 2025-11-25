class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.callbacks = {};
        
        this.init();
    }
    
    init() {
        // Verificar compatibilidad del navegador
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('❌ Navegador no compatible con reconocimiento de voz');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuración
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'es-ES';
        
        // Event listeners
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.callbacks.onStart) {
                this.callbacks.onStart();
            }
        };
        
        this.recognition.onresult = (event) => {
            const textoReconocido = event.results[0][0].transcript;
            if (this.callbacks.onResult) {
                this.callbacks.onResult(textoReconocido);
            }
        };
        
        this.recognition.onerror = (event) => {
            this.isListening = false;
            if (this.callbacks.onError) {
                this.callbacks.onError(event.error);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.callbacks.onEnd) {
                this.callbacks.onEnd();
            }
        };
        
        return true;
    }
    
    start() {
        if (!this.recognition) {
            console.error('Reconocimiento de voz no inicializado');
            return false;
        }
        
        if (this.isListening) {
            console.warn('Ya se está escuchando');
            return false;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            return false;
        }
    }
    
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    onStart(callback) {
        this.callbacks.onStart = callback;
    }
    
    onResult(callback) {
        this.callbacks.onResult = callback;
    }
    
    onError(callback) {
        this.callbacks.onError = callback;
    }
    
    onEnd(callback) {
        this.callbacks.onEnd = callback;
    }
}

// Inicializar y exportar
window.VoiceRecognition = new VoiceRecognition();
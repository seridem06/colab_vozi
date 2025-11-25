class AudioPlayer {
    constructor() {
        this.audioElement = document.getElementById('audioPlayer');
        this.currentAudio = null;
    }
    
    playAudio(audioPath) {
        return new Promise((resolve, reject) => {
            // En un entorno real, aquí cargarías el audio desde el servidor
            // Para este ejemplo, simulamos la reproducción
            
            console.log(`🎵 Intentando reproducir: ${audioPath}`);
            
            // Simular carga y reproducción
            setTimeout(() => {
                console.log(`✅ Audio reproducido: ${audioPath}`);
                resolve();
            }, 1000);
            
            // En producción, usarías:
            /*
            this.audioElement.src = audioPath;
            this.audioElement.onloadeddata = () => {
                this.audioElement.play().then(resolve).catch(reject);
            };
            this.audioElement.onerror = reject;
            */
        });
    }
    
    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
    }
    
    setVolume(volume) {
        if (this.audioElement) {
            this.audioElement.volume = Math.max(0, Math.min(1, volume));
        }
    }
}

// Inicializar y exportar
window.AudioPlayer = new AudioPlayer();
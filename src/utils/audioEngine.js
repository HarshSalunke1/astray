// Audio & Speech Synthesis Engine for ASTRA Study OS

class AudioEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    this.isMuted = false;
    this.isSpeaking = false;
    this.isListening = false;
    this.recognition = null;
    this.onStateChange = null;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.notifyState();
    }
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        isSpeaking: this.isSpeaking,
        isListening: this.isListening,
        isMuted: this.isMuted
      });
    }
  }

  speak(text, onEndCallback) {
    if (this.isMuted || !this.synth) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel any previous speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Pick pleasant English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notifyState();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notifyState();
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.notifyState();
      if (onEndCallback) onEndCallback();
    };

    this.synth.speak(utterance);
  }

  startListening(onResult, onError) {
    if (!this.SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. You can type your request directly.');
      return;
    }

    try {
      this.recognition = new this.SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notifyState();
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onResult) onResult(transcript, event.results[0].isFinal);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        this.notifyState();
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyState();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      this.notifyState();
      if (onError) onError(err.message);
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      this.notifyState();
    }
  }
}

export const audioEngine = new AudioEngine();

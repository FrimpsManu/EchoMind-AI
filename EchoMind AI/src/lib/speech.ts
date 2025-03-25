export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  startListening(onResult: (text: string) => void, onError: (error: string) => void) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    this.recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = () => {
      onError('Error occurred during speech recognition');
    };

    this.recognition.start();
  }

  stopListening() {
    this.recognition?.stop();
  }

  speak(text: string, options: { rate?: number; voice?: SpeechSynthesisVoice; onEnd?: () => void } = {}) {
    if (!this.synthesis) return;
    
    // Cancel any ongoing speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    if (options.voice) {
      utterance.voice = options.voice;
    }

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    // Split long text into sentences and add pauses
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let delay = 0;
    
    sentences.forEach((sentence, index) => {
      setTimeout(() => {
        const sentenceUtterance = new SpeechSynthesisUtterance(sentence.trim());
        sentenceUtterance.rate = options.rate || 1;
        if (options.voice) {
          sentenceUtterance.voice = options.voice;
        }
        if (index === sentences.length - 1 && options.onEnd) {
          sentenceUtterance.onend = options.onEnd;
        }
        this.currentUtterance = sentenceUtterance;
        this.synthesis.speak(sentenceUtterance);
      }, delay);
      
      delay += (sentence.length * 50); // Rough estimate of speaking time
    });
  }

  stopSpeaking() {
    this.synthesis?.cancel();
    this.currentUtterance = null;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}
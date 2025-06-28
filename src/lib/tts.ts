// Text-to-Speech functionality using Web Speech API and ElevenLabs
export class TTSService {
  private synth: SpeechSynthesis
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    this.synth = window.speechSynthesis
    this.loadVoices()
  }

  private loadVoices() {
    this.voices = this.synth.getVoices()
    
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices()
      }
    }
  }

  async speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
    return new Promise<void>((resolve, reject) => {
      if (!text.trim()) {
        resolve()
        return
      }

      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Find a good English voice
      const englishVoice = this.voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || this.voices.find(voice => voice.lang.startsWith('en'))

      if (englishVoice) {
        utterance.voice = englishVoice
      }

      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1

      utterance.onend = () => resolve()
      utterance.onerror = (error) => reject(error)

      this.synth.speak(utterance)
    })
  }

  stop() {
    this.synth.cancel()
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window
  }
}

// ElevenLabs TTS (requires API key)
export async function speakWithElevenLabs(text: string, voiceId: string = 'pNInz6obpgDQGcFmaJgB') {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured')
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    
    const audio = new Audio(audioUrl)
    await audio.play()
    
    // Clean up URL after playing
    audio.onended = () => URL.revokeObjectURL(audioUrl)
    
  } catch (error) {
    console.error('ElevenLabs TTS error:', error)
    throw error
  }
}

export const ttsService = new TTSService()
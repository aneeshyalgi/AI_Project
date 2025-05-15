interface Window {
  SpeechRecognition?: typeof SpeechRecognition
  webkitSpeechRecognition?: typeof SpeechRecognition
  speechSynthesis?: SpeechSynthesis
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: (event: any) => void
  onerror: (event: any) => void
  onend: () => void
}

interface SpeechSynthesisUtterance extends EventTarget {
  text: string
  lang: string
  pitch: number
  rate: number
  volume: number
  voice: SpeechSynthesisVoice | null
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null
}

interface SpeechSynthesis {
  speaking: boolean
  pending: boolean
  paused: boolean
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null
  getVoices(): SpeechSynthesisVoice[]
  speak(utterance: SpeechSynthesisUtterance): void
  cancel(): void
  pause(): void
  resume(): void
}

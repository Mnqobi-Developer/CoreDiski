export type NoticeTone = 'error' | 'info' | 'success'

export type Notice = {
  message: string
  tone: NoticeTone
}

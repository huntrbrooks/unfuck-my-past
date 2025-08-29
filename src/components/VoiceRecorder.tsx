'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button, Alert, Spinner } from 'react-bootstrap'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

interface Recognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: ((event: any) => void) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => Recognition
    SpeechRecognition: new () => Recognition
  }
}

export default function VoiceRecorder({ 
  onTranscription, 
  onError, 
  disabled = false,
  placeholder = "Click to start recording...",
  className = ''
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const recognitionRef = useRef<Recognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript(prev => prev + finalTranscript)
          setInterimTranscript(interimTranscript)
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setError(`Recording error: ${event.error}`)
          setIsRecording(false)
          setIsProcessing(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
          setIsProcessing(false)
        }
      } else {
        setError('Speech recognition is not supported in this browser')
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startRecording = () => {
    if (!recognitionRef.current || disabled) return

    try {
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      setRecordingTime(0)
      setIsRecording(true)
      setIsProcessing(true)
      
      recognitionRef.current.start()

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Auto-stop after 2 minutes
      timeoutRef.current = setTimeout(() => {
        clearInterval(timer)
        stopRecording()
      }, 120000) // 2 minutes

    } catch (err) {
      setError('Failed to start recording')
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  const stopRecording = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Process the final transcript
      const finalText = transcript + interimTranscript
      if (finalText.trim()) {
        onTranscription(finalText.trim())
      }
      
      setInterimTranscript('')
      setRecordingTime(0)
      setIsProcessing(false)

    } catch (err) {
      setError('Failed to stop recording')
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }

  const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  if (!isSupported) {
    return (
      <Alert variant="warning" className={className}>
        <Alert.Heading>Voice Input Not Available</Alert.Heading>
        <p>
          Your browser doesn't support voice recording. Please use the text input instead.
        </p>
      </Alert>
    )
  }

  return (
    <div className={`voice-recorder ${className}`}>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="voice-controls mb-3">
        {!isRecording ? (
          <Button
            variant="primary"
            size="lg"
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="voice-button"
          >
            {isProcessing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-mic-fill me-2"></i>
                Start Recording
              </>
            )}
          </Button>
        ) : (
          <div className="d-flex gap-2">
            <Button
              variant="danger"
              size="lg"
              onClick={stopRecording}
              disabled={isProcessing}
              className="voice-button"
            >
              <i className="bi bi-stop-fill me-2"></i>
              Stop Recording
            </Button>
            <Button
              variant="outline-secondary"
              size="lg"
              onClick={clearTranscript}
              disabled={isProcessing}
            >
              <i className="bi bi-x-circle me-2"></i>
              Clear
            </Button>
          </div>
        )}
      </div>

      {(transcript || interimTranscript) && (
        <div className="transcript-display">
          <div className="transcript-content">
            <strong>Your Response:</strong>
            <div className="transcript-text">
              {transcript}
              {interimTranscript && (
                <span className="interim-text">{interimTranscript}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse-dot"></div>
          <span className="ms-2">
            Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {!transcript && !isRecording && (
        <div className="voice-placeholder">
          <p className="text-muted mb-0">
            <i className="bi bi-mic me-2"></i>
            {placeholder}
          </p>
        </div>
      )}
    </div>
  )
}

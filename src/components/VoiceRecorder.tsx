'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Mic, StopCircle, XCircle, CheckCircle, Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowEdit?: boolean
}

interface Recognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: ((event: Event) => void) | null
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
  className = '',
  allowEdit = true
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  
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
      setIsProcessing(false) // Don't set processing to true when starting
      
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

    } catch {
      setError('Failed to start recording')
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  const stopRecording = () => {
    if (!recognitionRef.current) return

    try {
      setIsProcessing(true) // Set processing when stopping
      recognitionRef.current.stop()
      setIsRecording(false)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Process the final transcript
      const finalText = transcript + interimTranscript
      if (finalText.trim()) {
        setEditedText(finalText.trim())
        if (allowEdit) {
          setIsEditing(true)
        } else {
          onTranscription(finalText.trim())
        }
      }
      
      setInterimTranscript('')
      setRecordingTime(0)
      setIsProcessing(false)

    } catch {
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

  const handleEditSave = () => {
    if (editedText.trim()) {
      onTranscription(editedText.trim())
    }
    setIsEditing(false)
    setEditedText('')
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditedText('')
    setTranscript('')
    setInterimTranscript('')
  }

  // Check if speech recognition is supported
  // const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  if (!SpeechRecognition) {
    return (
      <div className={`bg-warning/10 border border-warning/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h4 className="font-semibold text-warning-foreground">Voice Input Not Available</h4>
        </div>
        <p className="text-warning-foreground">
          Your browser doesn&apos;t support voice recording. Please use the text input instead.
        </p>
      </div>
    )
  }

  return (
    <div className={`voice-recorder ${className}`}>
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        {!isRecording ? (
          <Button
            size="lg"
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              disabled={isProcessing || disabled}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Stopping...
                </>
              ) : (
                <>
                  <StopCircle className="h-5 w-5 mr-2" />
                  Stop Recording
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={clearTranscript}
              disabled={isProcessing || disabled}
              className="flex-1"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {(transcript || interimTranscript) && !isEditing && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
          <div>
            <strong className="text-primary-foreground">Your Response:</strong>
            <div className="text-foreground mt-2">
              {transcript}
              {interimTranscript && (
                <span className="text-primary/70 italic">{interimTranscript}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
          <div>
            <strong className="text-foreground mb-2 block">Edit Your Response:</strong>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Edit your transcribed text here..."
              className="mb-4 min-h-[100px]"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleEditSave}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save & Use
              </Button>
              <Button
                variant="outline"
                onClick={handleEditCancel}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
          <span className="text-foreground">
            Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {!transcript && !isRecording && (
        <div className="text-center text-muted-foreground py-8">
          <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p>{placeholder}</p>
        </div>
      )}
    </div>
  )
}

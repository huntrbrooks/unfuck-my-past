'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Target, Heart, Zap, CheckCircle } from 'lucide-react'

interface QuestionGenerationLoaderProps {
  isGenerating: boolean
  onQuestionsReady: () => void
  onRetry: () => void
}

const QuestionGenerationLoader: React.FC<QuestionGenerationLoaderProps> = ({
  isGenerating,
  onQuestionsReady,
  onRetry
}) => {
  const [showReady, setShowReady] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Brain, text: "Analyzing your responses with GPT-4.1", color: "text-blue-500" },
    { icon: Sparkles, text: "Creating your master prompt", color: "text-purple-500" },
    { icon: Target, text: "Generating personalized questions with Claude-3-Opus", color: "text-green-500" },
    { icon: Heart, text: "Crafting your healing journey", color: "text-pink-500" },
    { icon: Zap, text: "Finalizing your diagnostic experience", color: "text-yellow-500" }
  ]

  useEffect(() => {
    if (!isGenerating && !showReady) {
      // Show the ready message after a brief delay
      setTimeout(() => setShowReady(true), 500)
    }
  }, [isGenerating, showReady])

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isGenerating, steps.length])

  if (showReady) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                Ready to Unfuck Your Past?
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-gray-600 mb-8"
              >
                Your personalized diagnostic questions are ready. This journey is about understanding, healing, and transforming your life.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button 
                  onClick={onQuestionsReady}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  Begin Your Journey
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-white rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                <Brain className="h-8 w-8 text-gray-700" />
              </div>
            </div>
          </motion.div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Crafting Your Personalized Experience
          </h2>
          
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isActive || isCompleted ? 1 : 0.5,
                    x: 0
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-green-50 border border-green-200' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 ${step.color}`}>
                    <Icon className={`h-5 w-5 ${isCompleted ? 'text-green-500' : ''}`} />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {step.text}
                  </span>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              This usually takes 30-60 seconds
            </p>
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="text-sm"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuestionGenerationLoader

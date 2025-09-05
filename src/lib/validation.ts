// Input validation utilities
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Common validation patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  CARD_NUMBER: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  EXPIRY_DATE: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
  CVC: /^\d{3,4}$/,
  NAME: /^[a-zA-Z\s\-']{2,50}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s\-_]{1,100}$/,
  URL: /^https?:\/\/.+/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
}

// Validation functions
export function validateField(value: unknown, rule: ValidationRule, fieldName: string): string[] {
  const errors: string[] = []

  // Required check
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`)
    return errors // Don't check other rules if required field is empty
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors
  }

  // Type-specific validations
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    
    // Length validations
    if (rule.minLength && trimmedValue.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`)
    }
    
    if (rule.maxLength && trimmedValue.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`)
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(trimmedValue)) {
      errors.push(`${fieldName} format is invalid`)
    }
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value)
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : `${fieldName} is invalid`)
    }
  }

  return errors
}

export function validateObject(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
  const errors: string[] = []

  for (const [fieldName, rule] of Object.entries(schema)) {
    const fieldErrors = validateField(data[fieldName], rule, fieldName)
    errors.push(...fieldErrors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Specific validation schemas
export const ONBOARDING_SCHEMA: ValidationSchema = {
  tone: { required: true, pattern: /^(direct|gentle|raw|analytical)$/ },
  voice: { required: true, pattern: /^(therapist|friend|coach|mentor)$/ },
  rawness: { required: true, pattern: /^(mild|moderate|intense|extreme)$/ },
  depth: { required: true, pattern: /^(surface|moderate|deep|profound)$/ },
  learning: { required: true, pattern: /^(visual|text|audio|interactive)$/ },
  engagement: { required: true, pattern: /^(passive|active|challenging|collaborative)$/ },
  experience: { required: true, pattern: /^(beginner|some|experienced|advanced)$/ },
  timeCommitment: { required: true, pattern: /^(5min|15min|30min|1hour)$/ },
  goals: { 
    required: true, 
    custom: (value) => Array.isArray(value) && value.length > 0 ? true : 'At least one goal must be selected'
  },
  safety: {
    required: true,
    custom: (value) => {
      if (!value || typeof value !== 'object') return 'Safety preferences are required'
      const { crisisSupport, contentWarnings, skipTriggers } = value
      return (crisisSupport || contentWarnings || skipTriggers) ? true : 'At least one safety preference must be selected'
    }
  }
}

export const PAYMENT_SCHEMA: ValidationSchema = {
  name: { required: true, pattern: PATTERNS.NAME },
  cardNumber: { required: true, pattern: PATTERNS.CARD_NUMBER },
  expiryDate: { required: true, pattern: PATTERNS.EXPIRY_DATE },
  cvc: { required: true, pattern: PATTERNS.CVC },
  productType: { required: true, pattern: /^(diagnostic|program)$/ }
}

export const DIAGNOSTIC_RESPONSE_SCHEMA: ValidationSchema = {
  question: { 
    required: true, 
    custom: (value) => {
      if (!value || typeof value !== 'object') return 'Question must be an object'
      if (!value.id || !value.question) return 'Question must have id and question properties'
      return true
    }
  },
  response: { required: true, minLength: 10, maxLength: 10000 },
  useClaude: { custom: (value) => typeof value === 'boolean' ? true : 'useClaude must be a boolean' }
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '') // Basic XSS prevention
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now])
      return true
    }
    
    const requests = this.requests.get(identifier)!
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= this.maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests
    }
    
    const requests = this.requests.get(identifier)!
    const recentRequests = requests.filter(time => time > windowStart)
    
    return Math.max(0, this.maxRequests - recentRequests.length)
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(60000, 100) // 100 requests per minute

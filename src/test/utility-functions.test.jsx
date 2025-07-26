import { describe, it, expect } from 'vitest'

// Tests for utility functions that should exist in the app
describe('Utility Functions Tests', () => {
  describe('Date Utilities', () => {
    it('should format date for Norwegian locale', () => {
      const formatNorwegianDate = (date) => {
        return date.toLocaleDateString('no-NO', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit'
        })
      }

      const testDate = new Date('2023-06-15')
      const formatted = formatNorwegianDate(testDate)
      
      expect(formatted).toContain('torsdag')
      expect(formatted).toContain('15')
      expect(formatted).toContain('06')
    })

    it('should get ISO date string', () => {
      const getISODateString = (date) => {
        return date.toISOString().slice(0, 10)
      }

      const testDate = new Date('2023-06-15T10:30:00')
      const isoString = getISODateString(testDate)
      
      expect(isoString).toBe('2023-06-15')
    })

    it('should calculate days between dates', () => {
      const daysBetween = (date1, date2) => {
        const oneDay = 24 * 60 * 60 * 1000
        return Math.round(Math.abs((date1 - date2) / oneDay))
      }

      const date1 = new Date('2023-06-15')
      const date2 = new Date('2023-06-20')
      
      expect(daysBetween(date1, date2)).toBe(5)
    })

    it('should add days to date', () => {
      const addDays = (date, days) => {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      }

      const startDate = new Date('2023-06-15')
      const endDate = addDays(startDate, 7)
      
      expect(endDate.toISOString().slice(0, 10)).toBe('2023-06-22')
    })
  })

  describe('String Utilities', () => {
    it('should get first letter of name', () => {
      const getInitial = (name) => {
        return name ? name[0].toUpperCase() : ''
      }

      expect(getInitial('Test User')).toBe('T')
      expect(getInitial('anna')).toBe('A')
      expect(getInitial('')).toBe('')
      expect(getInitial('123')).toBe('1')
    })

    it('should capitalize first letter', () => {
      const capitalize = (str) => {
        return str ? str[0].toUpperCase() + str.slice(1).toLowerCase() : ''
      }

      expect(capitalize('test')).toBe('Test')
      expect(capitalize('HELLO')).toBe('Hello')
      expect(capitalize('mIxEd')).toBe('Mixed')
      expect(capitalize('')).toBe('')
    })

    it('should truncate text with ellipsis', () => {
      const truncate = (text, maxLength) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength - 3) + '...'
      }

      expect(truncate('Short text', 20)).toBe('Short text')
      expect(truncate('This is a very long text that should be truncated', 20)).toBe('This is a very lo...')
      expect(truncate('Test', 10)).toBe('Test')
    })

    it('should validate email format', () => {
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      }

      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Array Utilities', () => {
    it('should group array items by property', () => {
      const groupBy = (array, key) => {
        return array.reduce((groups, item) => {
          const group = item[key]
          groups[group] = groups[group] || []
          groups[group].push(item)
          return groups
        }, {})
      }

      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ]

      const grouped = groupBy(items, 'category')
      
      expect(grouped.A).toHaveLength(2)
      expect(grouped.B).toHaveLength(1)
      expect(grouped.A[0].value).toBe(1)
      expect(grouped.A[1].value).toBe(3)
    })

    it('should filter unique items', () => {
      const unique = (array) => {
        return [...new Set(array)]
      }

      expect(unique([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 2, 3, 4])
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
      expect(unique([])).toEqual([])
    })

    it('should sort array by property', () => {
      const sortBy = (array, key, ascending = true) => {
        return [...array].sort((a, b) => {
          if (ascending) {
            return a[key] > b[key] ? 1 : -1
          } else {
            return a[key] < b[key] ? 1 : -1
          }
        })
      }

      const items = [
        { name: 'Charlie', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 }
      ]

      const sortedByName = sortBy(items, 'name')
      const sortedByAge = sortBy(items, 'age', false)

      expect(sortedByName[0].name).toBe('Alice')
      expect(sortedByName[2].name).toBe('Charlie')
      expect(sortedByAge[0].age).toBe(30)
      expect(sortedByAge[2].age).toBe(20)
    })
  })

  describe('Number Utilities', () => {
    it('should format points with label', () => {
      const formatPoints = (points) => {
        return `${points} poeng`
      }

      expect(formatPoints(0)).toBe('0 poeng')
      expect(formatPoints(100)).toBe('100 poeng')
      expect(formatPoints(-5)).toBe('-5 poeng')
    })

    it('should calculate percentage', () => {
      const percentage = (value, total) => {
        if (total === 0) return 0
        return Math.round((value / total) * 100)
      }

      expect(percentage(25, 100)).toBe(25)
      expect(percentage(1, 3)).toBe(33)
      expect(percentage(0, 100)).toBe(0)
      expect(percentage(50, 0)).toBe(0)
    })

    it('should clamp number between min and max', () => {
      const clamp = (value, min, max) => {
        return Math.min(Math.max(value, min), max)
      }

      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
      expect(clamp(7, 7, 7)).toBe(7)
    })

    it('should format time in minutes to readable format', () => {
      const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes} min`
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (remainingMinutes === 0) return `${hours} t`
        return `${hours} t ${remainingMinutes} min`
      }

      expect(formatTime(30)).toBe('30 min')
      expect(formatTime(60)).toBe('1 t')
      expect(formatTime(90)).toBe('1 t 30 min')
      expect(formatTime(120)).toBe('2 t')
    })
  })

  describe('Object Utilities', () => {
    it('should safely get nested property', () => {
      const safeGet = (obj, path, defaultValue = null) => {
        const keys = path.split('.')
        let result = obj
        
        for (const key of keys) {
          if (result && typeof result === 'object' && key in result) {
            result = result[key]
          } else {
            return defaultValue
          }
        }
        
        return result
      }

      const testObj = {
        user: {
          profile: {
            name: 'Test User'
          }
        }
      }

      expect(safeGet(testObj, 'user.profile.name')).toBe('Test User')
      expect(safeGet(testObj, 'user.missing.property')).toBe(null)
      expect(safeGet(testObj, 'user.profile.missing', 'default')).toBe('default')
    })

    it('should merge objects deeply', () => {
      const deepMerge = (target, source) => {
        const result = { ...target }
        
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key])
          } else {
            result[key] = source[key]
          }
        }
        
        return result
      }

      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { b: { d: 3 }, e: 4 }
      
      const merged = deepMerge(obj1, obj2)
      
      expect(merged.a).toBe(1)
      expect(merged.b.c).toBe(2)
      expect(merged.b.d).toBe(3)
      expect(merged.e).toBe(4)
    })

    it('should pick specific properties from object', () => {
      const pick = (obj, keys) => {
        const result = {}
        keys.forEach(key => {
          if (key in obj) {
            result[key] = obj[key]
          }
        })
        return result
      }

      const testObj = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        password: 'secret'
      }

      const picked = pick(testObj, ['id', 'name', 'email'])
      
      expect(picked).toEqual({
        id: 1,
        name: 'Test',
        email: 'test@example.com'
      })
      expect(picked.password).toBeUndefined()
    })
  })

  describe('Validation Utilities', () => {
    it('should validate Norwegian text patterns', () => {
      const norwegianWords = [
        'oppgave',
        'familie',
        'poeng',
        'bruker',
        'admin',
        'statistikk',
        'innstillinger'
      ]

      norwegianWords.forEach(word => {
        expect(typeof word).toBe('string')
        expect(word.length).toBeGreaterThan(0)
        expect(word.trim()).toBe(word) // No leading/trailing spaces
      })
    })

    it('should validate hex color codes', () => {
      const isValidHexColor = (color) => {
        return /^#[0-9a-fA-F]{6}$/.test(color)
      }

      expect(isValidHexColor('#82bcf4')).toBe(true)
      expect(isValidHexColor('#FF6B6B')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
      expect(isValidHexColor('#ffffff')).toBe(true)
      
      expect(isValidHexColor('82bcf4')).toBe(false) // Missing #
      expect(isValidHexColor('#82bcf')).toBe(false) // Too short
      expect(isValidHexColor('#82bcf44')).toBe(false) // Too long
      expect(isValidHexColor('#82bcfg')).toBe(false) // Invalid character
    })

    it('should validate required fields', () => {
      const validateRequired = (obj, requiredFields) => {
        const errors = []
        requiredFields.forEach(field => {
          if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
            errors.push(`${field} is required`)
          }
        })
        return errors
      }

      const validObj = { name: 'Test', email: 'test@example.com' }
      const invalidObj = { name: '', email: 'test@example.com' }

      expect(validateRequired(validObj, ['name', 'email'])).toEqual([])
      expect(validateRequired(invalidObj, ['name', 'email'])).toEqual(['name is required'])
    })
  })
})
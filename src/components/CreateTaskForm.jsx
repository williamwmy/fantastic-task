import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { 
  FaPlus, 
  FaClock, 
  FaCoins, 
  FaUser, 
  FaCalendarAlt,
  FaEdit,
  FaFileAlt,
  FaUsers
} from 'react-icons/fa'

const CreateTaskForm = ({ open, onClose }) => {
  const { createTask } = useTasks()
  const { familyMembers, currentMember } = useFamily()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    estimatedMinutes: '',
    recurringType: 'daily',
    recurringDays: [],
    flexibleInterval: 7, // days for flexible recurring
    assignedTo: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const daysOfWeek = [
    { value: 0, label: 'Søndag', short: 'Søn' },
    { value: 1, label: 'Mandag', short: 'Man' },
    { value: 2, label: 'Tirsdag', short: 'Tir' },
    { value: 3, label: 'Onsdag', short: 'Ons' },
    { value: 4, label: 'Torsdag', short: 'Tor' },
    { value: 5, label: 'Fredag', short: 'Fre' },
    { value: 6, label: 'Lørdag', short: 'Lør' }
  ]

  const recurringTypeOptions = [
    { 
      value: 'daily', 
      label: 'Spesifikke dager', 
      description: 'Oppgaven vises på valgte dager hver uke'
    },
    { 
      value: 'weekly_flexible', 
      label: 'Ukentlig (fleksibel)', 
      description: 'Må gjøres én gang i uken, dukker opp igjen 7 dager etter fullføring'
    },
    { 
      value: 'monthly_flexible', 
      label: 'Månedlig (fleksibel)', 
      description: 'Må gjøres én gang i måneden, dukker opp igjen 30 dager etter fullføring'
    }
  ]

  const quickSelectOptions = [
    { label: 'Alle dager', days: [0, 1, 2, 3, 4, 5, 6] },
    { label: 'Ukedager', days: [1, 2, 3, 4, 5] },
    { label: 'Helg', days: [0, 6] },
    { label: 'Tøm valg', days: [] }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
    setSuccess('')
  }

  const handleDayToggle = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(dayValue)
        ? prev.recurringDays.filter(d => d !== dayValue)
        : [...prev.recurringDays, dayValue].sort()
    }))
  }

  const handleQuickSelect = (days) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: [...days].sort()
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.title.trim()) {
      setError('Tittel er påkrevd')
      setLoading(false)
      return
    }

    if (formData.points && (isNaN(formData.points) || parseInt(formData.points) < 0)) {
      setError('Poeng må være et positivt tall')
      setLoading(false)
      return
    }

    if (formData.estimatedMinutes && (isNaN(formData.estimatedMinutes) || parseInt(formData.estimatedMinutes) <= 0)) {
      setError('Estimert tid må være et positivt tall')
      setLoading(false)
      return
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      points: formData.points ? parseInt(formData.points) : 0,
      estimated_minutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
      recurring_type: formData.recurringType,
      recurring_days: formData.recurringType === 'daily' && formData.recurringDays.length > 0 ? formData.recurringDays : null,
      flexible_interval: formData.recurringType !== 'daily' ? formData.flexibleInterval : null,
      created_by: currentMember.id
    }

    const { error } = await createTask(taskData)

    if (error) {
      setError(error.message || 'Feil ved opprettelse av oppgave')
    } else {
      setSuccess('Oppgave opprettet!')
      
      // Close modal after showing success briefly
      setTimeout(() => {
        // Reset form
        setFormData({
          title: '',
          description: '',
          points: '',
          estimatedMinutes: '',
          recurringType: 'daily',
          recurringDays: [],
          flexibleInterval: 7,
          assignedTo: ''
        })
        setSuccess('')
        onClose()
      }, 1500)
    }

    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points: '',
      estimatedMinutes: '',
      recurringType: 'daily',
      recurringDays: [],
      flexibleInterval: 7,
      assignedTo: ''
    })
    setError('')
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #f8f9fa'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: '#82bcf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <FaPlus size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
              Opprett ny oppgave
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Lag en oppgave som familiemedlemmer kan fullføre
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #f5c6cb',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #c3e6cb',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              <FaEdit />
              Tittel *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#82bcf4'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              <FaFileAlt />
              Beskrivelse
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Beskriv hva som skal gjøres, eventuelle spesifikke instruksjoner..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#82bcf4'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
              Valgfritt - hjelper med å tydeliggjøre hva som forventes
            </small>
          </div>

          {/* Points and Time Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Points */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600, 
                marginBottom: '0.5rem',
                color: '#333'
              }}>
                <FaCoins />
                Poeng
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="0"
                max="1000"
                placeholder="F.eks. 10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#82bcf4'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                Poeng familiemedlemmet får for å fullføre oppgaven
              </small>
            </div>

            {/* Estimated time */}
            <div>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600, 
                marginBottom: '0.5rem',
                color: '#333'
              }}>
                <FaClock />
                Estimert tid (min)
              </label>
              <input
                type="number"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleInputChange}
                min="1"
                max="480"
                placeholder="F.eks. 30"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#82bcf4'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                Hvor lang tid oppgaven antas å ta
              </small>
            </div>
          </div>

          {/* Recurring type */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.75rem',
              color: '#333'
            }}>
              <FaCalendarAlt />
              Gjentakelsesmønster
            </label>
            
            {recurringTypeOptions.map((option) => (
              <div 
                key={option.value}
                style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  border: `2px solid ${formData.recurringType === option.value ? '#82bcf4' : '#e9ecef'}`,
                  borderRadius: '0.5rem',
                  backgroundColor: formData.recurringType === option.value ? '#f8f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setFormData(prev => ({ ...prev, recurringType: option.value }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <input
                    type="radio"
                    name="recurringType"
                    value={option.value}
                    checked={formData.recurringType === option.value}
                    readOnly
                    style={{ margin: 0 }}
                  />
                  <strong style={{ color: '#333' }}>{option.label}</strong>
                </div>
                <small style={{ color: '#6c757d', marginLeft: '1.25rem' }}>
                  {option.description}
                </small>
              </div>
            ))}
          </div>

          {/* Days selection - only show for daily recurring */}
          {formData.recurringType === 'daily' && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600, 
                marginBottom: '0.75rem',
                color: '#333'
              }}>
                <FaCalendarAlt />
                Velg dager
              </label>

            {/* Quick select buttons */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '0.5rem',
              border: '1px solid #e9ecef'
            }}>
              <small style={{ 
                color: '#6c757d', 
                fontWeight: 600,
                marginBottom: '0.5rem',
                width: '100%'
              }}>
                Hurtigvalg:
              </small>
              {quickSelectOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickSelect(option.days)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: '#fff',
                    color: '#495057',
                    border: '1px solid #ced4da',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e9ecef'
                    e.target.style.borderColor = '#adb5bd'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#fff'
                    e.target.style.borderColor = '#ced4da'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth < 480 ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)', 
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              {daysOfWeek.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  style={{
                    padding: window.innerWidth < 480 ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    backgroundColor: formData.recurringDays.includes(day.value) ? '#82bcf4' : '#f8f9fa',
                    color: formData.recurringDays.includes(day.value) ? 'white' : '#6c757d',
                    border: `2px solid ${formData.recurringDays.includes(day.value) ? '#82bcf4' : '#e9ecef'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    if (!formData.recurringDays.includes(day.value)) {
                      e.target.style.backgroundColor = '#e9ecef'
                      e.target.style.borderColor = '#adb5bd'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!formData.recurringDays.includes(day.value)) {
                      e.target.style.backgroundColor = '#f8f9fa'
                      e.target.style.borderColor = '#e9ecef'
                    }
                  }}
                >
                  {day.short}
                </button>
              ))}
            </div>
            
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
              {formData.recurringDays.length === 0 
                ? 'Ingen dager valgt - oppgaven vil være tilgjengelig alle dager'
                : `Oppgaven vil være tilgjengelig ${formData.recurringDays.length} ${formData.recurringDays.length === 1 ? 'dag' : 'dager'} i uken`
              }
            </small>
          </div>
          )}

          {/* For flexible recurring tasks, show interval setting */}
          {(formData.recurringType === 'weekly_flexible' || formData.recurringType === 'monthly_flexible') && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600, 
                marginBottom: '0.75rem',
                color: '#333'
              }}>
                <FaClock />
                Gjentakelsesintervall
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  max={formData.recurringType === 'weekly_flexible' ? "52" : "365"}
                  value={formData.flexibleInterval}
                  onChange={(e) => setFormData(prev => ({ ...prev, flexibleInterval: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: '#6c757d' }}>
                  {formData.recurringType === 'weekly_flexible' ? 'dager (anbefalt: 7)' : 'dager (anbefalt: 30)'}
                </span>
              </div>
              <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                Oppgaven dukker opp igjen automatisk etter dette antall dager når den fullføres
              </small>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingTop: '1.5rem',
            borderTop: '2px solid #f8f9fa',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              Avbryt
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: formData.title.trim() ? '#28a745' : '#adb5bd',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (formData.title.trim()) {
                  e.target.style.backgroundColor = '#218838'
                }
              }}
              onMouseOut={(e) => {
                if (formData.title.trim()) {
                  e.target.style.backgroundColor = '#28a745'
                }
              }}
            >
              <FaPlus />
              {loading ? 'Oppretter...' : 'Opprett oppgave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskForm
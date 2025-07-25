import React, { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { 
  FaTrophy, 
  FaMedal, 
  FaChartBar, 
  FaClock, 
  FaCalendarAlt,
  FaDownload,
  FaStar,
  FaFire,
  FaTarget,
  FaCoins
} from 'react-icons/fa'

const StatsView = ({ onClose }) => {
  const { tasks, taskCompletions, pointsTransactions } = useTasks()
  const { familyMembers, currentMember } = useFamily()
  const [timeframe, setTimeframe] = useState('week') // 'week', 'month', 'all'
  const [activeTab, setActiveTab] = useState('leaderboard') // 'leaderboard', 'tasks', 'time', 'achievements'

  // Calculate date ranges
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const getDateFilter = (date) => {
    switch (timeframe) {
      case 'week':
        return new Date(date) >= weekAgo
      case 'month':
        return new Date(date) >= monthAgo
      case 'all':
      default:
        return true
    }
  }

  // Statistics calculations
  const stats = useMemo(() => {
    const filteredCompletions = taskCompletions.filter(c => 
      getDateFilter(c.completed_at)
    )
    
    const memberStats = familyMembers.map(member => {
      const memberCompletions = filteredCompletions.filter(c => 
        c.completed_by === member.id
      )
      
      const totalPoints = memberCompletions.reduce((sum, c) => 
        sum + (c.points_awarded || 0), 0
      )
      
      const totalTasks = memberCompletions.length
      
      const totalTimeSpent = memberCompletions.reduce((sum, c) => 
        sum + (c.time_spent_minutes || 0), 0
      )
      
      const avgTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks : 0
      
      // Calculate streaks and achievements
      const recentCompletions = taskCompletions
        .filter(c => c.completed_by === member.id)
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      
      let currentStreak = 0
      let maxStreak = 0
      let tempStreak = 0
      let lastDate = null
      
      for (const completion of recentCompletions) {
        const completionDate = new Date(completion.completed_at).toDateString()
        
        if (!lastDate) {
          tempStreak = 1
          if (completionDate === now.toDateString()) {
            currentStreak = 1
          }
        } else {
          const dayDiff = (new Date(lastDate) - new Date(completionDate)) / (1000 * 60 * 60 * 24)
          
          if (dayDiff === 1) {
            tempStreak++
            if (currentStreak > 0 || completionDate === now.toDateString()) {
              currentStreak = tempStreak
            }
          } else {
            maxStreak = Math.max(maxStreak, tempStreak)
            tempStreak = 1
            if (completionDate === now.toDateString()) {
              currentStreak = 1
            } else {
              currentStreak = 0
            }
          }
        }
        lastDate = completionDate
      }
      maxStreak = Math.max(maxStreak, tempStreak)
      
      return {
        ...member,
        totalPoints,
        totalTasks,
        totalTimeSpent,
        avgTimePerTask,
        currentStreak,
        maxStreak,
        pointsBalance: member.points_balance || 0
      }
    })
    
    // Sort by total points for leaderboard
    memberStats.sort((a, b) => b.totalPoints - a.totalPoints)
    
    return {
      memberStats,
      totalFamilyTasks: filteredCompletions.length,
      totalFamilyPoints: filteredCompletions.reduce((sum, c) => sum + (c.points_awarded || 0), 0),
      totalFamilyTime: filteredCompletions.reduce((sum, c) => sum + (c.time_spent_minutes || 0), 0)
    }
  }, [familyMembers, taskCompletions, timeframe])

  // Achievement calculations
  const getAchievements = (memberStat) => {
    const achievements = []
    
    if (memberStat.totalTasks >= 1) achievements.push({ name: 'First Task', icon: '🎯', color: '#28a745' })
    if (memberStat.totalTasks >= 10) achievements.push({ name: 'Task Master', icon: '💪', color: '#17a2b8' })
    if (memberStat.totalTasks >= 50) achievements.push({ name: 'Super Helper', icon: '⭐', color: '#ffc107' })
    if (memberStat.totalTasks >= 100) achievements.push({ name: 'Task Legend', icon: '👑', color: '#fd7e14' })
    
    if (memberStat.currentStreak >= 3) achievements.push({ name: 'On Fire!', icon: '🔥', color: '#dc3545' })
    if (memberStat.currentStreak >= 7) achievements.push({ name: 'Week Warrior', icon: '⚡', color: '#6f42c1' })
    if (memberStat.maxStreak >= 14) achievements.push({ name: 'Streak Master', icon: '🌟', color: '#e83e8c' })
    
    if (memberStat.totalPoints >= 100) achievements.push({ name: 'Point Collector', icon: '💰', color: '#20c997' })
    if (memberStat.totalPoints >= 500) achievements.push({ name: 'Point Master', icon: '💎', color: '#6610f2' })
    
    return achievements
  }

  const exportToCSV = () => {
    const csvData = [
      ['Member', 'Total Tasks', 'Total Points', 'Time Spent (min)', 'Avg Time per Task', 'Current Streak', 'Max Streak'],
      ...stats.memberStats.map(m => [
        m.nickname,
        m.totalTasks,
        m.totalPoints,
        m.totalTimeSpent,
        Math.round(m.avgTimePerTask),
        m.currentStreak,
        m.maxStreak
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `family-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}t ${mins}min`
  }

  const getPositionIcon = (index) => {
    switch (index) {
      case 0: return <FaTrophy style={{ color: '#FFD700' }} />
      case 1: return <FaMedal style={{ color: '#C0C0C0' }} />
      case 2: return <FaMedal style={{ color: '#CD7F32' }} />
      default: return <span style={{ color: '#6c757d' }}>#{index + 1}</span>
    }
  }

  const timeframeOptions = [
    { value: 'week', label: 'Denne uke' },
    { value: 'month', label: 'Denne måned' },
    { value: 'all', label: 'Alle tider' }
  ]

  const tabOptions = [
    { value: 'leaderboard', label: 'Leaderboard', icon: FaTrophy },
    { value: 'tasks', label: 'Oppgaver', icon: FaChartBar },
    { value: 'time', label: 'Tid', icon: FaClock },
    { value: 'achievements', label: 'Utmerkelser', icon: FaStar }
  ]

  const renderLeaderboard = () => (
    <div>
      <div style={{ 
        display: 'grid', 
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {stats.memberStats.map((member, index) => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: index === 0 ? '#fff3cd' : index === 1 ? '#f8f9fa' : index === 2 ? '#f4f4f4' : 'white',
              border: `2px solid ${index === 0 ? '#ffc107' : index < 3 ? '#dee2e6' : '#e9ecef'}`,
              borderRadius: '0.75rem',
              boxShadow: index < 3 ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ 
              width: '3rem', 
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: member.avatar_color || '#82bcf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.2rem',
              marginRight: '1rem'
            }}>
              {member.nickname[0].toUpperCase()}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {getPositionIcon(index)}
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{member.nickname}</h4>
                {member.currentStreak >= 3 && (
                  <span style={{ fontSize: '1.2rem' }} title={`${member.currentStreak} dagers streak!`}>
                    🔥
                  </span>
                )}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                <div>
                  <FaCoins style={{ marginRight: '0.25rem' }} />
                  {member.totalPoints} poeng
                </div>
                <div>
                  <FaTarget style={{ marginRight: '0.25rem' }} />
                  {member.totalTasks} oppgaver
                </div>
                {member.totalTimeSpent > 0 && (
                  <div>
                    <FaClock style={{ marginRight: '0.25rem' }} />
                    {formatTime(member.totalTimeSpent)}
                  </div>
                )}
                {member.currentStreak > 0 && (
                  <div>
                    <FaFire style={{ marginRight: '0.25rem' }} />
                    {member.currentStreak} dager
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'right',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: index === 0 ? '#ffc107' : '#28a745'
            }}>
              {member.pointsBalance}
            </div>
          </div>
        ))}
      </div>
      
      {stats.memberStats.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          color: '#6c757d'
        }}>
          <FaTrophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>Ingen statistikk tilgjengelig ennå.</p>
          <p>Fullfør noen oppgaver for å se leaderboard!</p>
        </div>
      )}
    </div>
  )

  const renderTaskStats = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#d4edda',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <FaTarget size={32} style={{ color: '#28a745', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#155724' }}>
            {stats.totalFamilyTasks}
          </div>
          <div style={{ color: '#155724', fontSize: '0.9rem' }}>Totalt oppgaver</div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#d1ecf1',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <FaCoins size={32} style={{ color: '#17a2b8', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0c5460' }}>
            {stats.totalFamilyPoints}
          </div>
          <div style={{ color: '#0c5460', fontSize: '0.9rem' }}>Totalt poeng</div>
        </div>
        
        {stats.totalFamilyTime > 0 && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fff3cd',
            borderRadius: '0.75rem',
            textAlign: 'center'
          }}>
            <FaClock size={32} style={{ color: '#856404', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#856404' }}>
              {formatTime(stats.totalFamilyTime)}
            </div>
            <div style={{ color: '#856404', fontSize: '0.9rem' }}>Total tid</div>
          </div>
        )}
      </div>
      
      {stats.memberStats.map(member => (
        <div
          key={member.id}
          style={{
            padding: '1rem',
            backgroundColor: 'white',
            border: '2px solid #e9ecef',
            borderRadius: '0.75rem'
          }}
        >
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: member.avatar_color || '#82bcf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {member.nickname[0].toUpperCase()}
            </div>
            {member.nickname}
          </h4>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#28a745' }}>
                {member.totalTasks}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Oppgaver fullført</div>
            </div>
            
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#17a2b8' }}>
                {member.totalPoints}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Poeng tjent</div>
            </div>
            
            {member.totalTimeSpent > 0 && (
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffc107' }}>
                  {formatTime(member.totalTimeSpent)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Tid brukt</div>
              </div>
            )}
            
            {member.avgTimePerTask > 0 && (
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6f42c1' }}>
                  {Math.round(member.avgTimePerTask)}min
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Snitt per oppgave</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderAchievements = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {stats.memberStats.map(member => {
        const achievements = getAchievements(member)
        
        return (
          <div
            key={member.id}
            style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              border: '2px solid #e9ecef',
              borderRadius: '0.75rem'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: member.avatar_color || '#82bcf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.2rem'
              }}>
                {member.nickname[0].toUpperCase()}
              </div>
              
              <div>
                <h4 style={{ margin: 0 }}>{member.nickname}</h4>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  {achievements.length} utmerkelser
                </div>
              </div>
            </div>
            
            {achievements.length > 0 ? (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: achievement.color + '20',
                      border: `2px solid ${achievement.color}40`,
                      borderRadius: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{achievement.icon}</span>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        color: achievement.color,
                        fontSize: '0.9rem'
                      }}>
                        {achievement.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '2rem',
                color: '#6c757d',
                fontStyle: 'italic'
              }}>
                Fullfør oppgaver for å låse opp utmerkelser! 🎯
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

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
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '2px solid #f8f9fa',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderRadius: '1rem 1rem 0 0',
          zIndex: 10
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar />
              Familiestatistikk
            </h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <FaDownload />
                Eksporter CSV
              </button>
              
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Lukk
              </button>
            </div>
          </div>
          
          {/* Timeframe selector */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {timeframeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: timeframe === option.value ? '#82bcf4' : '#f8f9fa',
                  color: timeframe === option.value ? 'white' : '#6c757d',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Tab navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            overflowX: 'auto'
          }}>
            {tabOptions.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: activeTab === tab.value ? '#82bcf4' : 'transparent',
                    color: activeTab === tab.value ? 'white' : '#6c757d',
                    border: activeTab === tab.value ? 'none' : '2px solid #e9ecef',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'leaderboard' && renderLeaderboard()}
          {activeTab === 'tasks' && renderTaskStats()}
          {activeTab === 'time' && renderTaskStats()}
          {activeTab === 'achievements' && renderAchievements()}
        </div>
      </div>
    </div>
  )
}

export default StatsView
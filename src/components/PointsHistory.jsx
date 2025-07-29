import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCoins, FaArrowUp, FaArrowDown, FaStar, FaGift } from 'react-icons/fa'
import Modal from './Modal'

const PointsHistory = ({ memberId, open, onClose }) => {
  const { getPointsTransactionsForMember } = useTasks()
  const { familyMembers } = useFamily()
  const [filter, setFilter] = useState('all')

  const member = familyMembers.find(m => m.id === memberId)
  const transactions = getPointsTransactionsForMember(memberId)

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    if (filter === 'bonus') {
      // Show transactions that have bonus_points > 0
      return transaction.bonus_points && transaction.bonus_points > 0
    }
    return transaction.transaction_type === filter
  })

  const getTransactionIcon = (transaction) => {
    // Check if transaction has bonus points
    if (transaction.bonus_points && transaction.bonus_points > 0) {
      return <FaGift style={{ color: '#17a2b8' }} />
    }
    
    switch (transaction.transaction_type) {
      case 'earned':
        return <FaStar style={{ color: '#28a745' }} />
      case 'bonus':
        return <FaGift style={{ color: '#17a2b8' }} />
      default:
        return <FaCoins />
    }
  }

  const getTransactionColor = (transaction) => {
    // Check if transaction has bonus points
    if (transaction.bonus_points && transaction.bonus_points > 0) {
      return '#17a2b8'
    }
    
    switch (transaction.transaction_type) {
      case 'earned':
        return '#28a745'
      case 'bonus':
        return '#17a2b8'
      default:
        return '#6c757d'
    }
  }

  const getTransactionTypeText = (transaction) => {
    // Check if transaction has bonus points
    if (transaction.bonus_points && transaction.bonus_points > 0) {
      return 'Med Bonus'
    }
    
    switch (transaction.transaction_type) {
      case 'earned':
        return 'Opptjent'
      case 'bonus':
        return 'Bonus'
      default:
        return transaction.transaction_type
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTotalPoints = (type) => {
    if (type === 'bonus') {
      // Calculate bonus points from the bonus_points field
      return filteredTransactions
        .reduce((sum, t) => sum + (t.bonus_points || 0), 0);
    }
    
    return filteredTransactions
      .filter(t => !type || t.transaction_type === type)
      .reduce((sum, t) => sum + t.points, 0)
  }

  const memberAvatar = (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      backgroundColor: member?.avatar_color || '#82bcf4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 700,
      fontSize: 14
    }}>
      {member?.nickname?.[0]?.toUpperCase()}
    </div>
  )

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      title={`${member?.nickname}s poenghistorikk`}
      subtitle="Oversikt over alle opptjente poeng"
      icon={memberAvatar}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#d4edda',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ color: '#155724', fontSize: '1.5rem', fontWeight: 700 }}>
              {member?.points_balance || 0}
            </div>
            <div style={{ color: '#155724', fontSize: '0.9rem' }}>
              Nåværende saldo
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#d1ecf1',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #bee5eb'
          }}>
            <div style={{ color: '#0c5460', fontSize: '1.5rem', fontWeight: 700 }}>
              +{getTotalPoints('earned')}
            </div>
            <div style={{ color: '#0c5460', fontSize: '0.9rem' }}>
              Fra oppgaver
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#e2e3e5',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #d6d8db'
          }}>
            <div style={{ color: '#383d41', fontSize: '1.5rem', fontWeight: 700 }}>
              +{getTotalPoints('bonus')}
            </div>
            <div style={{ color: '#383d41', fontSize: '0.9rem' }}>
              Bonus poeng
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
              backgroundColor: 'white'
            }}
          >
            <option value="all">Alle transaksjoner</option>
            <option value="earned">Opptjent</option>
            <option value="bonus">Bonus</option>
          </select>
        </div>

        {/* Transactions list */}
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '0.5rem'
        }}>
          {filteredTransactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6c757d'
            }}>
              <FaCoins size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>Ingen transaksjoner funnet</p>
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: index < filteredTransactions.length - 1 ? '1px solid #dee2e6' : 'none',
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: getTransactionColor(transaction) + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  {getTransactionIcon(transaction)}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>
                      {transaction.description}
                      {transaction.bonus_points > 0 && (
                        <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>
                          (+{transaction.bonus_points} bonus)
                        </span>
                      )}
                    </span>
                    <span style={{
                      backgroundColor: getTransactionColor(transaction),
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem',
                      fontWeight: 600
                    }}>
                      {getTransactionTypeText(transaction)}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <span>{formatDate(transaction.created_at)}</span>
                    
                    {transaction.task_completions?.tasks && (
                      <span>
                        Oppgave: {transaction.task_completions.tasks.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: getTransactionColor(transaction),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {(transaction.points + (transaction.bonus_points || 0)) > 0 ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
                  {Math.abs(transaction.points + (transaction.bonus_points || 0))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </Modal>
  )
}

export default PointsHistory
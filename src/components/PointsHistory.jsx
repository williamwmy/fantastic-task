import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCoins, FaArrowUp, FaArrowDown, FaStar, FaGift, FaShoppingCart } from 'react-icons/fa'
import Modal from './Modal'

const PointsHistory = ({ memberId, open, onClose }) => {
  const { getPointsTransactionsForMember } = useTasks()
  const { familyMembers } = useFamily()
  const [filter, setFilter] = useState('all')

  const member = familyMembers.find(m => m.id === memberId)
  const transactions = getPointsTransactionsForMember(memberId)

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    return transaction.transaction_type === filter
  })

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return <FaStar style={{ color: '#28a745' }} />
      case 'spent':
        return <FaShoppingCart style={{ color: '#dc3545' }} />
      case 'bonus':
        return <FaGift style={{ color: '#17a2b8' }} />
      case 'penalty':
        return <FaArrowDown style={{ color: '#dc3545' }} />
      default:
        return <FaCoins />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return '#28a745'
      case 'spent':
      case 'penalty':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'earned':
        return 'Opptjent'
      case 'spent':
        return 'Brukt'
      case 'bonus':
        return 'Bonus'
      case 'penalty':
        return 'Straff'
      default:
        return type
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
      subtitle="Oversikt over poeng tjent og brukt"
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
              +{getTotalPoints('earned') + getTotalPoints('bonus')}
            </div>
            <div style={{ color: '#0c5460', fontSize: '0.9rem' }}>
              Totalt opptjent
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f8d7da',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: '1px solid #f5c6cb'
          }}>
            <div style={{ color: '#721c24', fontSize: '1.5rem', fontWeight: 700 }}>
              {Math.abs(getTotalPoints('spent') + getTotalPoints('penalty'))}
            </div>
            <div style={{ color: '#721c24', fontSize: '0.9rem' }}>
              Totalt brukt
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
            <option value="spent">Brukt</option>
            <option value="bonus">Bonus</option>
            <option value="penalty">Straff</option>
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
                  backgroundColor: getTransactionColor(transaction.transaction_type) + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem'
                }}>
                  {getTransactionIcon(transaction.transaction_type)}
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
                    <span>{transaction.description}</span>
                    <span style={{
                      backgroundColor: getTransactionColor(transaction.transaction_type),
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem',
                      fontWeight: 600
                    }}>
                      {getTransactionTypeText(transaction.transaction_type)}
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
                  color: getTransactionColor(transaction.transaction_type),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {transaction.points > 0 ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
                  {Math.abs(transaction.points)}
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
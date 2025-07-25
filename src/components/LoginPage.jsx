import React from 'react'
import AuthModal from './AuthModal'
import { FaTasks, FaUsers, FaStar } from 'react-icons/fa'
import packageJson from '../../package.json'

const LoginPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #d0e6fa 0%, #f8e8ee 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        maxWidth: '600px'
      }}>
        {/* App Logo/Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          backgroundColor: '#82bcf4',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto',
          boxShadow: '0 8px 32px rgba(130, 188, 244, 0.3)'
        }}>
          <FaTasks size={60} color="white" />
        </div>

        {/* App Name */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: '#2c3e50',
          margin: '0 0 0.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          Fantastic Task
        </h1>

        {/* Version */}
        <div style={{
          fontSize: '1rem',
          color: '#6c757d',
          fontWeight: 500,
          marginBottom: '2rem'
        }}>
          Versjon {packageJson.version}
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '1.25rem',
          color: '#495057',
          lineHeight: 1.6,
          margin: '0 0 2rem 0'
        }}>
          En familie-oppgaveapp som gjør hverdagen enklere med poeng og belønninger
        </p>

        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaUsers style={{ color: '#82bcf4' }} />
            <span>Hele familien</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaStar style={{ color: '#ffc107' }} />
            <span>Poeng & belønninger</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaTasks style={{ color: '#28a745' }} />
            <span>Fleksible oppgaver</span>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <div style={{
        width: '100%',
        maxWidth: '500px'
      }}>
        <AuthModal 
          open={true}
          onClose={() => {}} // Cannot be closed on login page
        />
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        © {new Date().getFullYear()} Fantastic Task - En PWA for familiehverdagen
      </div>
    </div>
  )
}

export default LoginPage
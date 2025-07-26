import React from 'react'
import LoginPage from './LoginPage'

const FamilySetupPage = ({ initialMode = 'create-family' }) => {
  return <LoginPage initialMode={initialMode} />
}

export default FamilySetupPage
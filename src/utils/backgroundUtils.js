// Utility functions for background preferences

export const getBackgroundStyle = (backgroundPreference) => {
  const backgroundStyles = {
    // Solid colors
    solid_light_blue: { backgroundColor: '#e3f2fd' },
    solid_light_green: { backgroundColor: '#e8f5e8' },
    solid_light_pink: { backgroundColor: '#fce4ec' },
    solid_light_purple: { backgroundColor: '#f3e5f5' },
    solid_light_orange: { backgroundColor: '#fff3e0' },
    solid_mint: { backgroundColor: '#e0f2f1' },
    
    // Gradients
    gradient_blue_purple: { 
      background: 'linear-gradient(135deg, #d0e6fa 0%, #f8e8ee 100%)' 
    },
    gradient_green_blue: { 
      background: 'linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%)' 
    },
    gradient_sunset: { 
      background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)' 
    },
    gradient_ocean: { 
      background: 'linear-gradient(135deg, #e0f2f1 0%, #e3f2fd 100%)' 
    },
    gradient_forest: { 
      background: 'linear-gradient(135deg, #e8f5e8 0%, #f3e5f5 100%)' 
    },
    gradient_warm: { 
      background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 50%, #f3e5f5 100%)' 
    }
  }

  // Return the style if it exists, otherwise return the default gradient
  return backgroundStyles[backgroundPreference] || backgroundStyles.gradient_blue_purple
}

export const getBackgroundName = (backgroundPreference) => {
  const backgroundNames = {
    solid_light_blue: 'Lys Blå',
    solid_light_green: 'Lys Grønn',
    solid_light_pink: 'Lys Rosa',
    solid_light_purple: 'Lys Lilla',
    solid_light_orange: 'Lys Oransje',
    solid_mint: 'Mint',
    gradient_blue_purple: 'Blå til Lilla',
    gradient_green_blue: 'Grønn til Blå',
    gradient_sunset: 'Solnedgang',
    gradient_ocean: 'Hav',
    gradient_forest: 'Skog',
    gradient_warm: 'Varm'
  }

  return backgroundNames[backgroundPreference] || 'Blå til Lilla'
}
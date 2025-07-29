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
    gradient_northern_lights: { 
      background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)' 
    },
    gradient_forest: { 
      background: 'linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%)' 
    },
    gradient_sunset: { 
      background: 'linear-gradient(135deg, #fce4ec 0%, #fff3e0 100%)' 
    },
    gradient_ocean: { 
      background: 'linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 100%)' 
    },
    gradient_lavender: { 
      background: 'linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)' 
    },
    gradient_urban: { 
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' 
    }
  }

  // Return the style if it exists, otherwise return the default gradient
  return backgroundStyles[backgroundPreference] || backgroundStyles.gradient_northern_lights
}

export const getBackgroundName = (backgroundPreference) => {
  const backgroundNames = {
    solid_light_blue: 'Lys Blå',
    solid_light_green: 'Lys Grønn',
    solid_light_pink: 'Lys Rosa',
    solid_light_purple: 'Lys Lilla',
    solid_light_orange: 'Lys Oransje',
    solid_mint: 'Mint',
    gradient_northern_lights: 'Nordlys',
    gradient_forest: 'Skog',
    gradient_sunset: 'Solnedgang',
    gradient_ocean: 'Hav',
    gradient_lavender: 'Lavendel',
    gradient_urban: 'Urbant'
  }

  return backgroundNames[backgroundPreference] || 'Nordlys'
}
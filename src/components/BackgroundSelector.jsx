import React from 'react'

const BackgroundSelector = ({ currentSelection, onSelect }) => {
  const backgroundOptions = [
    // Solid colors
    { 
      id: 'solid_light_blue', 
      name: 'Lys Blå', 
      type: 'solid',
      style: { backgroundColor: '#e3f2fd' }
    },
    { 
      id: 'solid_light_green', 
      name: 'Lys Grønn', 
      type: 'solid',
      style: { backgroundColor: '#e8f5e8' }
    },
    { 
      id: 'solid_light_pink', 
      name: 'Lys Rosa', 
      type: 'solid',
      style: { backgroundColor: '#fce4ec' }
    },
    { 
      id: 'solid_light_purple', 
      name: 'Lys Lilla', 
      type: 'solid',
      style: { backgroundColor: '#f3e5f5' }
    },
    { 
      id: 'solid_light_orange', 
      name: 'Lys Oransje', 
      type: 'solid',
      style: { backgroundColor: '#fff3e0' }
    },
    { 
      id: 'solid_mint', 
      name: 'Mint', 
      type: 'solid',
      style: { backgroundColor: '#e0f2f1' }
    },
    
    // Gradients
    { 
      id: 'gradient_northern_lights', 
      name: 'Nordlys', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #f3e5f5 0%, #e8f5e8 100%)' 
      }
    },
    { 
      id: 'gradient_forest', 
      name: 'Skog', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%)' 
      }
    },
    { 
      id: 'gradient_sunset', 
      name: 'Solnedgang', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #fce4ec 0%, #fff3e0 100%)' 
      }
    },
    { 
      id: 'gradient_ocean', 
      name: 'Hav', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 100%)' 
      }
    },
    { 
      id: 'gradient_lavender', 
      name: 'Lavendel', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 100%)' 
      }
    },
    { 
      id: 'gradient_urban', 
      name: 'Urbant', 
      type: 'gradient',
      style: { 
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' 
      }
    }
  ]

  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
        Bakgrunnsvalg:
      </label>
      
      {/* Solid colors */}
      <div style={{ marginBottom: '1rem' }}>
        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
          Ensfarget bakgrunn
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '0.5rem'
        }}>
          {backgroundOptions.filter(option => option.type === 'solid').map(option => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              style={{
                ...option.style,
                height: '60px',
                border: currentSelection === option.id ? '3px solid #333' : '2px solid #ddd',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#333',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                padding: '0.5rem'
              }}
              title={option.name}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      {/* Gradients */}
      <div>
        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
          Gradient bakgrunn
        </h5>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '0.5rem'
        }}>
          {backgroundOptions.filter(option => option.type === 'gradient').map(option => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              style={{
                ...option.style,
                height: '80px',
                border: currentSelection === option.id ? '3px solid #333' : '2px solid #ddd',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#333',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                padding: '0.5rem'
              }}
              title={option.name}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BackgroundSelector
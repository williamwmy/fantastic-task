import React, { useState, useEffect, useRef } from 'react'
import { FaCheckCircle } from 'react-icons/fa'

const CompletionAnimation = ({ onComplete, points = 0, show = false, position = null }) => {
  const [animationStage, setAnimationStage] = useState('hidden') // hidden, checkmark, confetti, done
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const isAnimationStartedRef = useRef(false)

  useEffect(() => {
    if (!show) {
      setAnimationStage('hidden')
      isAnimationStartedRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    // Don't restart animation if it's already running
    if (isAnimationStartedRef.current) {
      return
    }

    // Mark animation as started
    isAnimationStartedRef.current = true

    // Start checkmark animation
    console.log('CompletionAnimation: Setting stage to checkmark')
    setAnimationStage('checkmark')
    
    // After checkmark, show confetti
    const confettiTimer = setTimeout(() => {
      console.log('CompletionAnimation: Setting stage to confetti')
      setAnimationStage('confetti')
      startConfettiAnimation()
    }, 500)

    // Complete animation - longer timeout to let confetti finish
    const completeTimer = setTimeout(() => {
      console.log('CompletionAnimation: Setting stage to done and calling onComplete')
      setAnimationStage('done')
      // Call onComplete immediately - the component will be hidden due to stage change
      onComplete()
    }, 3000) // Reduced back to reasonable time

    return () => {
      clearTimeout(confettiTimer)
      clearTimeout(completeTimer)
      // Don't cancel animation frame here - let confetti finish naturally
    }
  }, [show, onComplete])

  // Separate cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [])

  const startConfettiAnimation = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const particleCount = 50
    const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    
    // Use the exact physics from the inspiration code
    const confettiOptions = {
      particleCount: particleCount,
      angle: 90, // Shoot upward
      spread: 60, // 45 degree spread
      startVelocity: Math.random() * 10 + 10, // Strong initial velocity
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      x: 0.5, // Center x
      y: 0.5, // Center y
      shapes: ['square', 'circle'],
      colors: colors,
      scalar: 1
    }

    // Recreate the randomPhysics function from the inspiration code
    const createParticle = (opts) => {
      const radAngle = opts.angle * (Math.PI / 180)
      const radSpread = opts.spread * (Math.PI / 180)

      return {
        x: canvas.width * opts.x,
        y: canvas.height * opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: (opts.startVelocity * 0.5) + (Math.random() * opts.startVelocity),
        angle2D: -radAngle + ((0.5 * radSpread) - (Math.random() * radSpread)),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
        shape: opts.shapes[Math.floor(Math.random() * opts.shapes.length)],
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar
      }
    }

    const particles = Array.from({ length: particleCount }, () => createParticle(confettiOptions))
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      let activeParticles = 0
      
      particles.forEach(particle => {
        if (particle.tick >= particle.totalTicks) return
        
        // Update physics exactly like the inspiration code
        particle.x += Math.cos(particle.angle2D) * particle.velocity + particle.drift
        particle.y += Math.sin(particle.angle2D) * particle.velocity + particle.gravity
        particle.velocity *= particle.decay

        particle.wobble += particle.wobbleSpeed
        particle.wobbleX = particle.x + ((10 * particle.scalar) * Math.cos(particle.wobble))
        particle.wobbleY = particle.y + ((10 * particle.scalar) * Math.sin(particle.wobble))

        particle.tiltAngle += 0.1
        particle.tiltSin = Math.sin(particle.tiltAngle)
        particle.tiltCos = Math.cos(particle.tiltAngle)
        particle.random = Math.random() + 2

        const progress = (particle.tick++) / particle.totalTicks

        const x1 = particle.x + (particle.random * particle.tiltCos)
        const y1 = particle.y + (particle.random * particle.tiltSin)
        const x2 = particle.wobbleX + (particle.random * particle.tiltCos)
        const y2 = particle.wobbleY + (particle.random * particle.tiltSin)

        if (particle.tick < particle.totalTicks) {
          activeParticles++
          
          // Draw particle
          ctx.save()
          ctx.globalAlpha = 1 - progress
          ctx.fillStyle = particle.color
          ctx.beginPath()

          if (particle.shape === 'circle') {
            const radiusX = Math.abs(x2 - x1) * particle.ovalScalar
            const radiusY = Math.abs(y2 - y1) * particle.ovalScalar
            ctx.ellipse(particle.x, particle.y, radiusX, radiusY, Math.PI / 10 * particle.wobble, 0, 2 * Math.PI)
          } else {
            // Square
            ctx.moveTo(Math.floor(particle.x), Math.floor(particle.y))
            ctx.lineTo(Math.floor(particle.wobbleX), Math.floor(y1))
            ctx.lineTo(Math.floor(x2), Math.floor(y2))
            ctx.lineTo(Math.floor(x1), Math.floor(particle.wobbleY))
          }

          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
      })
      
      // Continue animation if particles are still alive - don't check animationStage
      if (activeParticles > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Animation naturally finished, clean up
        animationRef.current = null
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  console.log('CompletionAnimation: Render stage:', animationStage, 'show:', show)
  
  if (animationStage === 'hidden' || animationStage === 'done') {
    console.log('CompletionAnimation: Returning null')
    return null
  }

  // Use position if provided, otherwise center on screen
  const containerStyle = position ? {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } : {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  const canvasSize = position ? {
    width: Math.max(position.width, 200),
    height: Math.max(position.height, 200)
  } : {
    width: 400,
    height: 400
  }

  return (
    <div style={containerStyle}>
      {/* Canvas for confetti */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          position: 'absolute',
          top: position ? '50%' : '0',
          left: position ? '50%' : '0',
          transform: position ? 'translate(-50%, -50%)' : 'none',
          pointerEvents: 'none'
        }}
      />
      
      {/* Checkmark and points */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 1
        }}
      >
        <FaCheckCircle
          size={80}
          style={{
            color: '#28a745',
            animation: animationStage === 'checkmark' ? 'checkmarkBounce 0.6s ease-out' : 'none',
            transform: animationStage === 'checkmark' ? 'scale(1)' : 'scale(0)',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
          }}
        />
        
        {points > 0 && (
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: '#28a745',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
              animation: animationStage === 'confetti' ? 'pointsBounce 0.8s ease-out' : 'none',
              opacity: animationStage === 'confetti' ? 1 : 0
            }}
          >
            +{points} poeng!
          </div>
        )}
      </div>

      <style>{`
        @keyframes checkmarkBounce {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @keyframes pointsBounce {
          0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.8); 
          }
          60% { 
            opacity: 1; 
            transform: translateY(-10px) scale(1.1); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </div>
  )
}

export default CompletionAnimation
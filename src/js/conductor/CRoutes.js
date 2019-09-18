import React from 'react'
import { ThemeContext } from './ThemeContext'

export const CRoutes = (props) => {
  const [currentLocation, setCurrentLocation] = React.useState('/')

  // Receive hashhistory update via Keg
  // navigate() wrapper for Keg qeueu add
  setTimeout(() => {
    setCurrentLocation('/team')
  }, 2000)

  return (
    <ThemeContext.Provider value={{ currentLocation }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

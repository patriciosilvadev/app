import React from 'react'
import { ThemeContext } from './ThemeContext'
import Keg from '@joduplessis/keg'

export const CRoutes = (props) => {
  const [currentLocation, setCurrentLocation] = React.useState('/')

  // Receive hashhistory update via Keg
  // navigate() wrapper for Keg qeueu add
  Keg.keg('location').tap('update', async (val, pour) => {
    setCurrentLocation(val)
    pour()
  })

  return (
    <ThemeContext.Provider value={{ currentLocation }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

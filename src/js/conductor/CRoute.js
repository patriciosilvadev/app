import React, { useState } from 'react'
import { ThemeContext } from './ThemeContext'
import queryString from 'query-string'

export const CRoute = (props) => {
  return (
    <ThemeContext.Consumer>
      {value => {
        // If route maths value.location
        // show, if not don't
        // <div>Now loading for {value.currentLocation}</div>
        return (
          <React.Fragment>
            <props.component
              {...props.routeProps}
              currentLocation={value.currentLocation}
            />
          </React.Fragment>
        )
      }}
    </ThemeContext.Consumer>
  )
}

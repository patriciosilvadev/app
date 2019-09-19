import React, { useState } from 'react'
import { ThemeContext } from './ThemeContext'

function matchPathToUrl(pattern, url) {
  const sanitizedUrl = url[0] == '/' ? url.substring(1) : url
  const sanitizedPattern = pattern[0] == '/' ? pattern.substring(1) : pattern
  const sanitizedUrlParts = sanitizedUrl.split('/')
  const sanitizedPatternParts = sanitizedPattern.split('/')
  const patternBoundaries = sanitizedPattern.split('/').map(part => part[0] == ':' ? -1 : part)
  let values = {}

  const passes = patternBoundaries.reduce((pass, part, index) => {
    if (sanitizedUrlParts.length != sanitizedPatternParts.length) return false

    // If the part doesn't equal -1
    // then the 2 should be the same
    // otherwise return false
    if (part != -1) {
      if (sanitizedPatternParts[index] != sanitizedUrlParts[index]) return false
    } else {
      // If the part does equal -1
      // then it's a vairable
      // We need to check that it exists
      if (sanitizedUrlParts[index] == undefined || sanitizedUrlParts[index] == null) return false

      values[sanitizedPatternParts[index]] = sanitizedUrlParts[index]
    }

    return pass ? true : false
  }, true)

  return { passes, values }
}

export const CRoute = (props) => {
  return (
    <ThemeContext.Consumer>
      {value => {
        // If route maths value.location
        // show, if not don't
        // <div>Now loading for {value.currentLocation}</div>
        //
        // const pattern = '/app/team/:teamId/room/:roomId'
        // const url = '/app/team/5ce12ae5ffd420dc2f5a6878/room/coolcoolcool'
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

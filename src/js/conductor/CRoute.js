import React, { useState } from 'react'
import { ThemeContext } from './ThemeContext'

function matchPathToUrl(path, url) {
  const sanitizedUrl = url[0] == '/' ? url.substring(1) : url
  const sanitizedPath = path[0] == '/' ? path.substring(1) : path
  const sanitizedUrlParts = sanitizedUrl.split('/')
  const sanitizedPathParts = sanitizedPath.split('/')
  const pathBoundaries = sanitizedPath.split('/').map(part => part[0] == ':' ? -1 : part)
  let values = {}

  const passes = pathBoundaries.reduce((pass, part, index) => {
    if (sanitizedUrlParts.length != sanitizedPathParts.length) return false

    // If the part doesn't equal -1
    // then the 2 should be the same
    // otherwise return false
    if (part != -1) {
      if (sanitizedPathParts[index] != sanitizedUrlParts[index]) return false
    } else {
      // If the part does equal -1
      // then it's a vairable
      // We need to check that it exists
      if (sanitizedUrlParts[index] == undefined || sanitizedUrlParts[index] == null) return false

      values[sanitizedPathParts[index]] = sanitizedUrlParts[index]
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

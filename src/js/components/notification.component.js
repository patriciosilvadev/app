import React from 'react'
import styled from 'styled-components'
import '../helpers/extensions'
import PropTypes from 'prop-types'

export default function NotificationComponent({ text }) {
  // prettier-ignore
  return (
    <div className="row h55 w-100 p-10 align-content-center align-items-center justify-content-center" style={{ backgroundColor: "#05A6FF", color: "white", textAlign: "center" }}>
      {text}
    </div>
  )
}

NotificationComponent.propTypes = {
  text: PropTypes.string,
}

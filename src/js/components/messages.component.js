import React, { useState, useEffect, memo } from 'react'
import '../helpers/extensions'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Popup, Menu, Avatar, Spinner } from '@weekday/elements'
import MessageComponent from '../components/message.component'

export default memo(props => {
  // prettier-ignore
  return (
    <React.Fragment>
      {props.messages.map((message, index) => {
        return (
          <MessageComponent
            key={index}
            message={message}
            highlight={props.highlight}
            setUpdateMessage={props.setUpdateMessage}
            setReplyMessage={props.setReplyMessage}
          />
        )
      })}
    </React.Fragment>
  )
})

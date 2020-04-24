import React, { useState, useEffect, memo } from 'react'
import '../helpers/extensions'
import styled from 'styled-components'
import { logger } from '../helpers/util'
import { Popup, Menu, Avatar, Spinner } from '@tryyack/elements'
import MessageComponent from '../components/message.component'
import moment from 'moment'

export default memo(props => {
  const sortedMessages = props.messages
    ? props.messages.sort((left, right) => {
        return moment.utc(left.createdAt).diff(moment.utc(right.createdAt))
      })
    : []

  return (
    <React.Fragment>
      {sortedMessages.map((message, index) => {
        let append = false
        let showDate = false
        let previousDate = null
        let previousUserId = null
        const previousIndex = index - 1
        const currentDate = moment(props.messages[index].createdAt)
        const currentUserId = props.messages[index].user ? props.messages[index].user.id : null

        if (previousIndex >= 0) {
          previousDate = moment(props.messages[previousIndex].createdAt)
          previousUserId = props.messages[previousIndex].user ? props.messages[previousIndex].user.id : null

          if (previousUserId != null && currentUserId != null) {
            if (previousUserId == currentUserId && currentDate.format('X') - previousDate.format('X') <= 60) append = true
          }

          if (currentDate.format('DDD') != previousDate.format('DDD')) {
            showDate = true
          }
        }

        return (
          <React.Fragment key={index}>
            {showDate && (
              <DateDivider>
                <DateDividerText>{moment(message.createdAt).format('dddd, MMMM Do')}</DateDividerText>
                <DateDividerLine />
              </DateDivider>
            )}

            <MessageComponent message={message} append={append && !showDate} highlight={props.highlight} setUpdateMessage={props.setUpdateMessage} setReplyMessage={props.setReplyMessage} />
          </React.Fragment>
        )
      })}
    </React.Fragment>
  )
})

const DateDivider = styled.div`
  width: 100%;
  margin-top: 15px;
  margin-bottom: 20px;
  text-align: center;
  position: relative;
`

const DateDividerText = styled.span`
  font-size: 10px;
  z-index: 2;
  position: relative;
  font-weight: 600;
  color: #adb5bd;
  background: white;
  padding: 10px;
  text-transform: uppercase;
`

const DateDividerLine = styled.div`
  z-index: 1;
  position: absolute;
  height: 1px;
  width: 100%;
  background-color: #f2f3f5;
  top: 50%;
  left: 0px;
`

import React, { useState, useEffect, memo } from 'react'
import '../helpers/extensions'
import styled from 'styled-components'
import { logger } from '../helpers/util'
import { Popup, Menu, Avatar, Spinner } from '@weekday/elements'
import MessageComponent from '../components/message.component'
import moment from 'moment'

const DateDivider = styled.div`
  width: 100%;
  margin-top: 15px;
  margin-bottom: 20px;
  text-align: center;
  position: relative;
`

const DateDividerText = styled.span`
  font-size: 12px;
  z-index: 2;
  position: relative;
  font-weight: 400;
  color: #adb5bd;
  font-style: italic;
  background: white;
  padding: 10px;
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

export default memo(props => {
  return (
    <React.Fragment>
      {props.messages.map((message, index) => {
        let append = false
        let showDate = false
        const previousIndex = index - 1
        const currentDate = moment(props.messages[index].createdAt)
        const currentUserId = props.messages[index].user ? props.messages[index].user.id : null
        let previousDate = null
        let previousUserId = null

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
                <DateDividerText>{moment(message.createAt).format('dddd, MMMM Do')}</DateDividerText>
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

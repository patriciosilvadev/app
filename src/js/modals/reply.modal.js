import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import ModalComponent from '../components/modal.component'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Avatar } from '@weekday/elements'
import ComposeComponent from '../components/compose.component'
import moment from 'moment'
import { useSelector, useDispatch } from 'react-redux'



export default function ReplyModal(props) {
  const dispatch = useDispatch()
  const room = useSelector(state => state.room)
  const common = useSelector(state => state.common)

  // prettier-ignore
  return (
    <ModalPortal>
      <ModalComponent
        title="Reply"
        width={600}
        height={500}
        onClose={props.onCancel}>
          <ModalContainer className="h-100 column flexer align-items-stretch">
            <Padding className="column align-items-stretch flexer">
              <Container className="row justify-content-center">
                <Avatar
                  image={props.message.user.image}
                  title={props.message.user.name}
                  className="mr-15"
                  size="medium"
                />

                <div className="column flexer">
                  <div className="row">
                    <Name>
                      {props.message.user.name}
                    </Name>
                    <Meta>{moment(props.message.createdAt).fromNow()}</Meta>
                  </div>
                  <Message>
                    {props.message.message}
                  </Message>
                </div>
              </Container>
            </Padding>

            <ComposeComponent />
          </ModalContainer>
      </ModalComponent>
    </ModalPortal>
  )
}

ReplyModal.propTypes = {
  onOkay: PropTypes.any,
  onCancel: PropTypes.any,
  message: PropTypes.any,
}

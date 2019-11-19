import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@weekday/elements'

const Iframe = styled.iframe`
  border: none;
`

export default function AppModal(props) {
  const user = useSelector(state => state.user)
  const room = useSelector(state => state.room)
  const dispatch = useDispatch()
  const [url, setUrl] = useState(props.url)

  useEffect(() => {
    // If the user has already added a query string
    if (props.url.indexOf('?') == -1) {
      setUrl(`${props.url}?channelId=${room.id}&userId=${user.id}`)
    } else {
      setUrl(`${props.url}&channelId=${room.id}&userId=${user.id}`)
    }
  })

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title={props.title}
        width="75%"
        height="75%"
        onClose={props.onClose}>
        <Iframe
          border="0"
          src={url}
          width="100%"
          height="100%">
        </Iframe>
      </Modal>
    </ModalPortal>
  )
}

AppModal.propTypes = {
  onClose: PropTypes.func,
  url: PropTypes.string,
  title: PropTypes.string,
  payload: PropTypes.any,
}

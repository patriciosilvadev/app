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
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()
  const [url, setUrl] = useState(props.action.url)

  useEffect(() => {
    // If the user has already added a query string
    if (props.action.url.indexOf('?') == -1) {
      setUrl(`${props.action.url}?channelId=${channel.id}&userId=${user.id}`)
    } else {
      setUrl(`${props.action.url}&channelId=${channel.id}&userId=${user.id}`)
    }
  })

  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title={props.action.title}
        width={props.action.width || "75%"}
        height={props.action.height || "75%"}
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
  action: PropTypes.any,
}

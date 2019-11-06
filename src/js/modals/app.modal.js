import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@weekday/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Iframe = styled.iframe`
  border: none;
`

export default function AppModal(props) {
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
          src={`${props.url}?payload=${btoa(JSON.stringify(props.payload))}`}
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

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { updateToast } from '../actions'
import { IconComponent } from '../components/icon.component'
import ModalPortal from '../portals/modal.portal'
import { Button, Modal } from '@weekday/elements'
import { APPSTORE_URL } from '../environment'
import AuthService from '../services/auth.service'

export default function ToastComponent(props) {
  const [text, setText] = useState([])
  const [show, setShow] = useState(true)
  const dispatch = useDispatch()

  useEffect(() => {
    // Fade after 1 second
    setTimeout(() => {
      setShow(false)

      // Remove the toast from the DOM afterr 1 more
      setTimeout(() => {
        dispatch(updateToast(null))
      }, 1000)
    }, 1000)
  }, props.message)

  return <Toast show={show}>{props.message}</Toast>
}

const Toast = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #11171d;
  padding: 10px 20px 10px 20px;
  border-radius: 5px;
  z-index: 99999999999;
  color: #edf0f2;
  font-weight: 600;
  font-size: 14px;
  opacity: ${props => (props.show ? '1' : '0')}
  transition: opacity 1s;
`

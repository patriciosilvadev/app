import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@weekday/elements'
import { IconComponent } from './icon.component'

export default function PanelAttachmentsComponent(props) {
  const user = useSelector(state => state.user)
  const channel = useSelector(state => state.channel)
  const dispatch = useDispatch()

  // prettier-ignore
  return (
    <Container className="column">
      <Header className="row">
        <HeaderTitle>
          Channel Files
        </HeaderTitle>
        <IconComponent
          icon="x"
          size={25}
          color="#040b1c"
          className="mr-5 button"
          onClick={() => props.navigation.history.push('')}
        />
      </Header>
    </Container>
  )
}

PanelAttachmentsComponent.propTypes = {
  onClose: PropTypes.func,
  action: PropTypes.any,
}

const Container = styled.div`
  display: flex;
  width: 300px;
  height: 100%;
  border-left: 1px solid #f1f3f5;
`

const Header = styled.div`
  width: 100%;
  background: transparent;
  border-bottom: 1px solid #f1f3f5;
  background: white;
  padding 15px 25px 15px 25px;
  display: flex;
`

const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  margin-bottom: 2px;
  width: max-content;
  flex: 1;
`

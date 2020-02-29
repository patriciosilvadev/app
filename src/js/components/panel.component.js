import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal } from '@tryyack/elements'
import { IconComponent } from './icon.component'

export default function PanelComponent(props) {
  return (
    <Container className="column">
      <Header className="row">
        <HeaderTitle>{props.title}</HeaderTitle>
        <IconComponent icon="x" size={25} color="#040b1c" className="mr-5 button" onClick={props.onClose} />
      </Header>
      {props.children}
    </Container>
  )
}

PanelComponent.propTypes = {
  children: PropTypes.any,
  onClose: PropTypes.func,
  title: PropTypes.string,
}

const Container = styled.div`
  display: flex;
  width: 350px;
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
  font-size: 18px;
  font-weight: 600;
  font-style: normal;
  color: #040b1c;
  transition: opacity 0.5s;
  display: inline-block;
  margin-bottom: 2px;
  width: max-content;
  flex: 1;
`

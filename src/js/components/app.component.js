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

export default function AppComponent(props) {
  // prettier-ignore
  return (
    <Container className="column">
      <Header className="row">
        <HeaderTitle>
          {props.title}
        </HeaderTitle>
        <FontAwesomeIcon
          onClick={props.onClose}
          className="mr-5 button"
          icon={["fal", "times"]}
          color="#040b1c"
          size="2x"
        />
      </Header>
      <Iframe
        border="0"
        src={`${props.url}?payload=${btoa(JSON.stringify(props.payload))}`}
        width="100%"
        height="100%">
      </Iframe>
    </Container>
  )
}

AppComponent.propTypes = {
  onClose: PropTypes.func,
  url: PropTypes.string,
  title: PropTypes.string,
  payload: PropTypes.any,
}

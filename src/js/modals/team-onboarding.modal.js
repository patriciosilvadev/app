import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button, Modal, Input, Textarea } from '@weekday/elements'

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  background: #f3f3f3;
  position: relative;
`

const Inner = styled.div`
  background: white;
  position: relative;
  height: 90%;
  width: 550px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
`

const Logo = styled.div`
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 1000;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: center;
  align-items: center;
  margin-right: auto;
`

const LogoText = styled.div`
  padding-left: 5px;
  position: relative;
  bottom: 2px;
  color: #007af5;
  font-size: 22px;
  font-weight: 400;
  font-family: 'hk_groteskmedium', helvetica;
`

const Inputs = styled.div`
  position: relative;
  width: 300px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-direction: column;
`

const Text = styled.div``

export default function TeamOnboardingModal(props) {
  // prettier-ignore
  return (
    <ModalPortal>
      <Modal
        title="Create a new team"
        frameless={true}
        width="100%"
        height="100%"
        onClose={props.onCancel}>
        <Container>
          <Inner>
            <img src="./team-onboarding.png" width="90%" />
            <Text className="h1 mb-30 mt-30 color-d3">Start Something</Text>
            <Text className="h3 mb-10 pl-20 pr-20 text-center color-d2">Please enter the shortcode to join this team</Text>
            <Text className="h5 color-d0">Contact your team admin if you do not know the shortcode</Text>
            <Inputs>
              <Input
                placeholder="Team name"
                inputSize="large"
                className="mt-30"
                value=""
                onChange={() => console.log('Cool')}
              />
              <Button
                onClick={() => console.log('Cool')}
                size="large"
                text="Next"
              />
            </Inputs>
          </Inner>

          <Logo className="hide">
            <img src="./logo.png" height="20" alt="Weekday"/>
            <LogoText>weekday</LogoText>
          </Logo>
        </Container>
      </Modal>
    </ModalPortal>
  )
}

TeamOnboardingModal.propTypes = {
  onOkay: PropTypes.any,
  onCancel: PropTypes.any,
}

import React from 'react'
import styled from 'styled-components'
import '../helpers/extensions'
import PropTypes from 'prop-types'

const Container = styled.div`
  background-color: #05A6FF;
  width: 100%;
`

const ActionText = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 800;
  padding: 7px;
  margin-left: auto;
  cursor: pointer;
`

const Text = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 7px;
`

export default function NotificationComponent(props) {
  // prettier-ignore
  return (
    <Container className="row">
      <Text>
        {props.text}
      </Text>
      {props.actionText &&
        <ActionText onClick={props.onActionClick}>
          {props.actionText}
        </ActionText>
      }
    </Container>
  )
}

NotificationComponent.propTypes = {
  text: PropTypes.string,
  actionText: PropTypes.string,
  onActionClick: PropTypes.func,
}

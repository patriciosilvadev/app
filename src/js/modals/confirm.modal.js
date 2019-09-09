import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import ModalComponent from '../components/modal.component'
import ModalPortal from '../portals/modal.portal'
import PropTypes from 'prop-types'
import { Button } from '@weekday/elements'

const BigSolidButton = styled.div`
  background-color: #007af5;
  color: white;
  font-size: 25px;
  font-weight: 600;
  padding: 20px 30px 20px 30px;
  border-radius: 5px;
  transition: background-color 0.25s, color 0.25s;
  cursor: pointer;

  &:hover {
    background-color: #0f081f;
    color: #007af5;
  }

  &:first-child {
    margin-right: 5px;
  }
`

export default function ConfirmModal({ onOkay, onCancel, text, title }) {
  // prettier-ignore
  return (
    <ModalPortal>
      <ModalComponent
        title={title}
        width={400}
        height={250}
        onClose={onCancel}>
          <div className="row justify-content-center pt-30">
            <div className="h5 pl-30 pr-30 center w-light color-dark-0">
              {text}
            </div>
          </div>
          <div className="row justify-content-center pt-30 pb-30">
            <Button jumbo onClick={onOkay} text="Yes" />
            <Button jumbo onClick={onCancel} text="No" />
          </div>
      </ModalComponent>
    </ModalPortal>
  )
}

ConfirmModal.propTypes = {
  onOkay: PropTypes.any,
  onCancel: PropTypes.any,
  text: PropTypes.string,
  title: PropTypes.string,
}

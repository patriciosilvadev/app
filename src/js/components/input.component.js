import React from 'react'
import styled from 'styled-components'

const Label = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 700;
  padding-bottom: 5px;
`

const Input = styled.input`
  border: none;
  flex: 1;
  background: transparent;
  color: #495057;
  font-size: 15px;
  font-weight: 500;
  padding: 10px;
  width: 100%;
  border: 1px solid #ebedef;
  border-radius: 5px;
  resize: none;
  display: block;
  box-sizing: border-box;
  margin-bottom: 20px;

  &::placeholder {
    color: #acb5bd;
  }
`

export function InputComponent(props) {
  return (
    <React.Fragment>
      <Label>{props.label}</Label>
      <Input {...props} />
    </React.Fragment>
  )
}

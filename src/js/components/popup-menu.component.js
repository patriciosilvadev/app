import React from 'react'
import styled from 'styled-components'
import AvatarComponent from '../components/avatar.component'
import PropTypes from 'prop-types'

const Container = styled.div`
  padding: 10px 10px 10px 10px;
  width: 100%;
`

const Divider = styled.div`
  background: #f1f3f5;
  width: 100%;
  height: 2px;
`

const Row = styled.div`
  background: transparent;
  padding: 7px 5px 7px 5px;
  width: 100%;
  border-radius: 10px;
  cursor: ${props => (props.nohover ? null : 'pointer')};

  &:hover {
    background: ${props => (props.nohover ? null : '#f8f9fa')};
  }
`

const IconContainer = styled.div`
  margin-right: 10px;
  margin-left: 5px;
`

const Avatar = styled.div`
  margin-right: 7px;
  margin-left: 3px;
`

const Text = styled.div`
  overflow: hidden;
  font-size: 14px;
  font-weight: 400;
  color: #868e96;
  width: 100%;
  white-space: nowrap;
`

const Label = styled.div`
  overflow: hidden;
  font-size: 12px;
  font-weight: 400;
  color: #cfd4da;
  width: 100%;
  white-space: nowrap;
`

export default function PopupMenuComponent({ items }) {
  // prettier-ignore
  return (
    <Container className="column">
      {items.map((item, index) => {
        if (item.hide) return null

        return (
          <Row
            className="row"
            key={index}
            onClick={item.onClick}
            nohover={item.divider}>

            {item.divider && <Divider />}

            {!item.divider &&
              <React.Fragment>
                {item.image &&
                  <Avatar>
                    <AvatarComponent
                      image={item.image}
                      title={item.text}
                      size="small-medium"
                    />
                  </Avatar>
                }
                {item.icon &&
                  <IconContainer>
                    {item.icon}
                  </IconContainer>
                }
                <div className="column">
                  <Text>{item.text}</Text>
                  {item.label && <Label>{item.label}</Label>}
                </div>
              </React.Fragment>
            }
          </Row>
        )
      })}
    </Container>
  )
}

PopupMenuComponent.propTypes = {
  items: PropTypes.array,
}

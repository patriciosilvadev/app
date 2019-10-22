import React, { useEffect, useState } from 'react'
import '../helpers/extensions'
import moment from 'moment'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { fetchNotifications, updateNotificationRead } from '../actions'

const Container = styled.div`
  flex: 1;
  width: 100%;
  padding: 0px;
  height: 500px;
  overflow: scroll;
`

const Row = styled.div`
  background: transparent;
  padding: 10px;
  width: 100%;
  border-bottom: 1px solid #f1f3f5;
`

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #868e96;
  flex: 1;
`

const Created = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #cfd4da;
`

const Body = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #cfd4da;
`

const Button = styled.div`
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #007af5;
  width: 100%;
  white-space: nowrap;
`

export default function NotificationsComponent(props) {
  const [page, setPage] = useState(1)
  const notifications = useSelector(state => state.notifications)
  const dispatch = useDispatch()

  useEffect(() => {
    // placeholder
  }, [])

  const handleReadButtonClick = (notificationId, read) => {
    dispatch(updateNotificationRead(notificationId, read))
  }

  return (
    <Container className="column flexer">
      {notifications.map((notification, index) => {
        return (
          <Row key={index} className="row">
            <div className="flexer column">
              <div className="row">
                <Title>{notification.title}</Title>
                <Created>{moment(notification.createdAt).fromNow()}</Created>
              </div>
              <Body>{notification.body}</Body>
              <div className="row">
                <Button
                  className="button"
                  onClick={() => handleReadButtonClick(notification.id, !notification.read)}>
                  {notification.read ? "Mark as unread" : "Mark as read"}
                </Button>
              </div>
            </div>
          </Row>
        )
      })}
    </Container>
  )
}

NotificationsComponent.propTypes = {}

import React, { useEffect, useState } from 'react'
import '../helpers/extensions'
import moment from 'moment'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { fetchNotifications, updateNotificationRead } from '../actions'
import { Spinner } from '@weekday/elements'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import '../../images/notifications-empty.png'

const Container = styled.div`
  width: 100%;
  height: 500px;
  overflow: hidden;
`

const Inner = styled.div`
  width: 100%;
  height: 500px;
  overflow: scroll;
`

const Row = styled.div`
  background: transparent;
  padding: 10px;
  width: 100%;
  border-bottom: 1px solid #f1f3f5;
`

const Created = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: #cfd4da;
  margin-left: auto;
`

const Title = styled.div`
  font-size: 14px;
  font-weight:  ${props => props.read ? "400" : "600"};
  color: ${props => props.read ? "#cfd4da" : "#202529"};
  flex: 1;
`

const Body = styled.div`
  font-size: 12px;
  font-weight:  ${props => props.read ? "400" : "600"};
  color: ${props => props.read ? "#cfd4da" : "#343A40"};
  margin-top: 4px;
`

const Button = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #007af5;
  width: 100%;
  margin-top: 4px;
`

const LoadContainer = styled.div`
  background: #F8F9FA;
  border-top: 1px solid #E1E7EB;
  border-bottom: 1px solid #E1E7EB;
  width: 100%;
  position: absolute;
  bottom: 0px;
  left: 0px;
`

const LoadText = styled.div`
  padding: 5px 10px 5px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #adb5bd;
  font-weight: regular;
`

const TitleText = styled.div`
  color: #483545;
  font-size: 14px;
  font-weight: 400;
`

const SubtitleText = styled.div`
  color: #858e96;
  font-size: 12px;
  font-weight: 400;
`

export default function NotificationsComponent(props) {
  const [page, setPage] = useState(1)
  const notifications = useSelector(state => state.notifications)
  const common = useSelector(state => state.common)
  const userId = common.user.id
  const dispatch = useDispatch()

  const handleReadButtonClick = (notificationId, read) => {
    dispatch(updateNotificationRead(notificationId, read))
  }

  const handleLoadButtonClick = () => {
    setPage(page + 1)
    dispatch(fetchNotifications(userId, page))
  }

  return (
    <Container className="column flexer">
      {common.loading && <Spinner />}

      <Inner className="column flexer align-items-center">
        {notifications.map((notification, index) => {
          return (
            <Row key={index} className="row">
              <div className="flexer column">
                <div className="row w-100 flexer">
                  <Title read={notification.read}>{notification.title}</Title>
                  <Created>{moment(notification.createdAt).fromNow()}</Created>
                </div>
                <Body read={notification.read}>{notification.body}</Body>
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

        {notifications.length == 0 &&
          <React.Fragment>
            <img src="/images/notifications-empty.png" width="125" className="mt-40 mb-20" />
            <TitleText>Whoops</TitleText>
            <SubtitleText>You have no notifications</SubtitleText>
          </React.Fragment>
        }

        <LoadContainer
          onClick={() => handleLoadButtonClick()}
          className="button row justify-content-center">
          <FontAwesomeIcon
            icon={["fal", "sync-alt"]}
            color="#adb5bd"
            size="sm"
            className="mt-5 mb-5"
          />
        <LoadText>Refresh</LoadText>
        </LoadContainer>
      </Inner>
    </Container>
  )
}

NotificationsComponent.propTypes = {}

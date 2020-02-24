import React, { useEffect, useState } from 'react'
import '../helpers/extensions'
import moment from 'moment'
import styled from 'styled-components'
import { useSelector, useDispatch } from 'react-redux'
import { hydrateNotifications, updateNotificationRead } from '../actions'
import { Spinner, Popup } from '@tryyack/elements'
import GraphqlService from '../services/graphql.service'
import MessagingService from '../services/messaging.service'
import { IconComponent } from './icon.component'
import { logger } from '../helpers/util'

export default function NotificationsComponent(props) {
  const [page, setPage] = useState(0)
  const notifications = useSelector(state => state.notifications)
  const common = useSelector(state => state.common)
  const user = useSelector(state => state.user)
  const userId = user.id
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [notificationsMenu, setNotificationsMenu] = useState(false)
  const hasNotification = notifications.filter(notification => !notification.read).length > 0

  const fetchNotifications = async userId => {
    setLoading(true)
    setError(false)

    try {
      const { data } = await GraphqlService.getInstance().notifications(userId, page)

      setLoading(false)
      dispatch(hydrateNotifications(data.notifications))
    } catch (e) {
      logger(e)
      setLoading(false)
      setError(e)
    }
  }

  const handleReadButtonClick = async (notificationId, read) => {
    setLoading(true)
    setError(false)

    try {
      await GraphqlService.getInstance().updateNotificationRead(notificationId, read)

      setLoading(false)
      dispatch(updateNotificationRead(notificationId, read))
    } catch (e) {
      setLoading(false)
      setError(false)
    }
  }

  const handleLoadButtonClick = () => {
    setPage(page + 1)
    fetchNotifications(userId)
  }

  // Get all the teams
  useEffect(() => {
    if (user.id) fetchNotifications(user.id)
  }, [user.id])

  return (
    <Popup
      handleDismiss={() => setNotificationsMenu(false)}
      visible={notificationsMenu}
      width={275}
      direction="left-bottom"
      content={
        <Container className="column">
          {loading && <Spinner />}

          <Inner className="column align-items-center">
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
                      <Button className="button" onClick={() => handleReadButtonClick(notification.id, !notification.read)}>
                        {notification.read ? 'Mark as unread' : 'Mark as read'}
                      </Button>
                    </div>
                  </div>
                </Row>
              )
            })}

            {notifications.length == 0 && (
              <React.Fragment>
                <img src="https://yack-app.s3-us-west-2.amazonaws.com/notifications-empty.png" width="125" className="mt-40 mb-20" />
                <TitleText>Whoops</TitleText>
                <SubtitleText>You have no notifications</SubtitleText>
              </React.Fragment>
            )}

            <LoadContainer onClick={() => handleLoadButtonClick()} className="button row justify-content-center">
              <IconComponent icon="refresh" size={15} color="#acb5bd" className="mt-5 mb-5" />
              <LoadText>Refresh</LoadText>
            </LoadContainer>
          </Inner>
        </Container>
      }
    >
      <div style={{ ...props.style }} className="button" onClick={e => setNotificationsMenu(true)}>
        {hasNotification && <Badge />}
        <IconComponent icon="bell" size={20} color={hasNotification ? 'white' : '#475669'} />
      </div>
    </Popup>
  )
}

NotificationsComponent.propTypes = {}

const Badge = styled.span`
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background-color: #007af5;
  border: 2px solid #040b1c;
`

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
  font-weight: ${props => (props.read ? '400' : '600')};
  color: ${props => (props.read ? '#cfd4da' : '#202529')};
  flex: 1;
`

const Body = styled.div`
  font-size: 12px;
  font-weight: ${props => (props.read ? '400' : '600')};
  color: ${props => (props.read ? '#cfd4da' : '#343a40')};
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
  background: #f8f9fa;
  border-top: 1px solid #e1e7eb;
  border-bottom: 1px solid #e1e7eb;
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

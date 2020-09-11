import React from 'react'
import styled from 'styled-components'
import { Subject } from 'rxjs'
import PropTypes from 'prop-types'
import { debounceTime } from 'rxjs/operators'
import GraphqlService from '../services/graphql.service'
import { Popup, User, Members, Spinner } from '@weekday/elements'

export default class QuickUser extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filter: '',
      index: 0,
      members: [],
      loading: false,
      error: false,
    }

    this.filterRef = React.createRef()
    this.onSearch = this.onSearch.bind(this)
    this.onSearch$ = new Subject()
    this.subscription = null
  }

  onSearch(e) {
    const search = e.target.value
    this.setState({ filter: search })
    this.onSearch$.next(search)
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe()
  }

  componentDidMount() {
    this.subscription = this.onSearch$.pipe(debounceTime(250)).subscribe(debounced => this.fetchResults())
  }

  componentDidUpdate() {
    if (!this.filterRef) return
    if (this.filterRef.focus) this.filterRef.focus()
  }

  async fetchResults() {
    if (this.state.filter == '') return this.setState({ members: [] })
    this.setState({ loading: true })

    try {
      const { data } = await GraphqlService.getInstance().searchTeamMembers(this.props.teamId, this.state.filter, 0)

      // Create a results object for the users
      // Dedupe existing users
      const members = data.searchTeamMembers.filter(member => member.user.id != this.props.userId)

      // Update our UI with our results
      this.setState({
        loading: false,
        members,
      })
    } catch (e) {}
  }

  render() {
    return (
      <Popup
        visible={this.props.visible}
        handleDismiss={() => {
          this.setState({ filter: '', members: [] }, () => this.props.handleDismiss())
        }}
        width={this.props.width || 250}
        direction={this.props.direction || 'right-bottom'}
        content={
          <div className="column flexer">
            {this.state.loading && <Spinner />}

            <div className="row">
              <Filter autoFocus ref={ref => (this.filterRef = ref)} placeholder="Search for users" value={this.state.filter} onChange={this.onSearch} />
            </div>

            <MembersContainer>
              <Members
                members={this.state.members}
                handleAccept={member => {
                  this.setState(
                    {
                      filter: '',
                      members: [],
                    },
                    () => {
                      // Process the choice
                      this.props.handleAccept(member)
                    }
                  )
                }}
              />
            </MembersContainer>
          </div>
        }
      >
        {this.props.children}
      </Popup>
    )
  }
}

QuickUser.propTypes = {
  visible: PropTypes.bool,
  width: PropTypes.number,
  direction: PropTypes.string,
  userId: PropTypes.string,
  teamId: PropTypes.string,
  handleAccept: PropTypes.func,
  handleDismiss: PropTypes.func,
  children: PropTypes.any,
}

const MembersContainer = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 100%;
  background: white;
  transform: translateY(100%);
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  overflow: hidden;
  z-index: 10000000;

  @media only screen and (max-width: 768px) {
    border-radius: 0px;
    bottom: none !important;
    transform: translateY(0%);
    position: relative;
    top: 0px !important;
    left: 0px;
    height: fit-content;
  }
`

const Filter = styled.input`
  border: none;
  flex: 1;
  background: transparent;
  color: #acb5bd;
  font-size: 15px;
  font-weight: 400;
  padding: 15px;
  width: 250px;

  &::placeholder {
    color: #acb5bd;
  }
`

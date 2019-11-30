
export function openApp(action) {
  return (dispatch, getState) => {
    switch (action.type) {
      case 'webhook':
        let url
        const { user, channel } = getState()

        // If a user has submitted a command
        // then this will be attached to the webhook, panel or modal
        if (action.payload.url.indexOf('?') == -1) {
          url = `${action.payload.url}?token=${action.token}&userId=${user.id}${action.userCommand ? '&userCommand='+action.userCommand : ''}`
        } else {
          url = `${action.payload.url}&token=${action.token}&userId=${user.id}${action.userCommand ? '&userCommand='+action.userCommand : ''}`
        }

        fetch(url, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(action),
        })
        break

      case 'modal':
        dispatch({
          type: 'APP_MODAL',
          payload: action
        })
        break

      case 'panel':
        dispatch({
          type: 'APP_PANEL',
          payload: action
        })
        break
    }
  }
}

export function closeAppModal() {
  return {
    type: 'APP_MODAL',
    payload: null,
  }
}

export function closeAppPanel() {
  return {
    type: 'APP_PANEL',
    payload: null,
  }
}


export function openApp(action) {
  return (dispatch, getState) => {
    switch (action.type) {
      case 'web':
        let url
        const { user, channel } = getState()

        if (action.url.indexOf('?') == -1) {
          url = `${action.url}?token=${channel.app.token}&userId=${user.id}`
        } else {
          url = `${action.url}&token=${channel.app.token}&userId=${user.id}`
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

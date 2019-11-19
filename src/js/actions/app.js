
export function openApp(action, payload = null, name = null) {
  return (dispatch, getState) => {
    switch (action.type) {
      case 'web':
        fetch(action.url, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify({ action, payload }),
        })
        break

      case 'modal':
        dispatch({
          type: 'APP_MODAL',
          payload: {
            action,
            payload,
          }
        })
        break

      case 'panel':
        dispatch({
          type: 'APP_PANEL',
          payload: {
            action,
            payload,
          }
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


export function openApp(action, payload = null, name = null) {
  return (dispatch, getState) => {
    if (action.type == 'web') {
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
    } else {
      dispatch({
        type: 'APP',
        payload: {
          action,
          payload,
        }
      })
    }
  }
}

export function closeApp() {
  return {
    type: 'APP',
    payload: {
      action: {},
      payload: {},
    },
  }
}

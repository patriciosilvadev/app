import produce from 'immer'

const initialState = {
  id: null, //"5f4cdf94fab1ce9821ea69b3"//,
}

export default (state = initialState, action) =>
  produce(state, draft => {
    switch (action.type) {
      case 'TASK':
        return action.payload
    }
  })

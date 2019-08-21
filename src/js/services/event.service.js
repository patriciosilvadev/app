import EventEmitter from 'eventemitter3'

export default class EventService {
  ee = null

  static get() {
    if (this.ee == null) {
      this.ee = new EventEmitter()
    }

    return this.ee
  }
}

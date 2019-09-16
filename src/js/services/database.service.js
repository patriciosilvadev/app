import PouchDB from 'pouchdb'
import { LOCAL_DB } from '../constants'

export default class DatabaseService {
  static instance
  database

  constructor() {
    this.database = new PouchDB(LOCAL_DB)

    // Get DB info
    this.database.info().then(info => {
      console.log('DB CONNECTED')
    })
  }

  unread(team, room) {
    this.database
      .query(
        doc => {
          emit([doc.team, doc.room])
        },
        { key: [team, room] }
      )
      .then(result => {
        const record = result.rows.flatten()

        // If it does exist, we want to update it
        if (record) return

        // If it does not, then we want to create it
        this.database
          .post({
            team,
            room,
          })
          .then(doc => {
            console.log('CREATE DB ROW', doc)
          })
          .catch(err => {
            console.log('DB ERROR', err)
          })
      })
  }

  read(room) {
    this.database
      .allDocs({ include_docs: true })
      .then(({ rows }) => {
        rows.map(row => {
          if (row.doc.room == room) {
            this.database
              .remove(row.doc)
              .catch(res => {
                console.log('DB REMOVE', res)
              })
              .catch(err => {
                console.error('DB ERROR', err)
              })
          }
        })
      })
      .catch(err => {
        console.log('DB ERROR', err)
      })
  }

  static getInstance() {
    if (this.instance) return this.instance

    // Otherwise create one
    this.instance = new DatabaseService()

    // And return it
    return this.instance
  }
}

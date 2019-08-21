import MessagingService from '../services/messaging.service'

export const sync = store => next => action => {
  // So we can delete teh sync
  let mutableAction = action

  // Store it seperately - so that we don't send along every time
  const sync = mutableAction.sync || null

  // Delete it so it doesn't loop
  delete mutableAction.sync

  // This sends this action to the sync room in SO
  // So everybody that is subscribed to that room
  // will receive this action
  if (sync) MessagingService.getInstance().sync(sync, mutableAction)

  // Move along
  return next(action)
}

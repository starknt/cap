import { cap } from '#cap/cap.mjs'

export default defineEventHandler(async () => {
  return cap.createChallenge()
})

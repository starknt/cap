import z from 'zod'
import { cap } from '#cap/cap.mjs'

const schema = z.object({
  token: z.string(),
  solutions: z.array(z.tuple([z.string(), z.string(), z.string({ coerce: true })])),
})

export default defineEventHandler(async (event) => {
  const { token, solutions } = await readValidatedBody(event, (body) => {
    return schema.parse(body)
  })

  if (!token || !solutions) {
    setResponseStatus(event, 400)
    return { success: false }
  }

  return await cap.redeemChallenge({ token, solutions })
})

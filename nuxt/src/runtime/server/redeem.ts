import type { Solution } from '@cap.js/server'
import { cap } from '#cap/cap.mjs'

function isUndefinedOrNull(value: unknown): value is undefined | null {
  return value === undefined || value === null
}

function validateBody(body: unknown) {
  if (isUndefinedOrNull(body) || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Body is required',
    })
  }

  const { token, solutions } = body as { token: string, solutions: string[] }

  if (isUndefinedOrNull(token) || typeof token !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required',
    })
  }

  if (isUndefinedOrNull(solutions) || !Array.isArray(solutions)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Solutions is required',
    })
  }

  for (const solution of solutions) {
    if (!Array.isArray(solution) || solution.length !== 3 || !solution.every((item, idx) => (typeof item === 'string' && (idx === 0 || idx === 1)) || (typeof item === 'number' && idx === 2))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Solutions must be an array of an like `[string, string, number]` tuple',
      })
    }
  }

  return {
    token,
    solutions,
  } as unknown as Solution
}

export default defineEventHandler(async (event) => {
  const { token, solutions } = await readValidatedBody(event, validateBody)

  if (!token || !solutions) {
    setResponseStatus(event, 400)
    return { success: false }
  }

  return await cap.redeemChallenge({ token, solutions })
})

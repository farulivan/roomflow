import { appConfig } from "./config"

/** Error thrown for any non-2xx API response, carrying the server message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface ErrorBody {
  message?: string
}

/** Prefix for an endpoint scoped to one hotel, e.g. "/hotels/harborline". */
export const hotelPath = (hotelId: string) =>
  `/hotels/${encodeURIComponent(hotelId)}`

/**
 * The single HTTP entry point. Every endpoint function goes through here,
 * so swapping the mock backend for a real one is a base-URL change.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as ErrorBody
      if (body.message) message = body.message
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}

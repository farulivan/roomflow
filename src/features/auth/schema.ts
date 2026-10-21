import { z } from "zod"

/**
 * The single source of truth for the login form: validation rules and the
 * form's value type both derive from this schema. `z.email()` is Zod's
 * current (non-deprecated) email format check; piping it after a `min(1)`
 * check keeps "Email is required" and "Enter a valid email address" as two
 * distinct messages instead of both firing on an empty field.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

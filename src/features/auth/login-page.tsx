import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate, type Location } from "react-router"

import { BrandMark } from "@/components/shared/brand-mark"
import { Credit } from "@/components/shared/credit"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { paths } from "@/lib/paths"

import { useAuth } from "./auth-context"
import { loginSchema, type LoginFormValues } from "./schema"

// .example is reserved for documentation, so this can never reach a real inbox.
const DEMO_EMAIL = "staff@roomflow.example"
const DEMO_PASSWORD = "demo1234"

interface LoginLocationState {
  from?: Location
}

export function LoginPage() {
  const { session, login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const from = (location.state as LoginLocationState | null)?.from
  const redirectTo = from ? `${from.pathname}${from.search}` : paths.home

  if (session) {
    // Already signed in — most likely this render is racing the submit
    // handler's own navigate() just after login() resolved. Redirect to the
    // same place it's headed, so whichever navigation wins is still correct.
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    await login(values)
    await navigate(redirectTo, { replace: true })
  }

  const fillDemoAccount = () => {
    form.setValue("email", DEMO_EMAIL, { shouldValidate: true })
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      <Card className="w-full max-w-[22rem] [--card-spacing:--spacing(6)]">
        <CardHeader className="justify-items-center gap-1.5 text-center">
          <BrandMark className="mb-4" />
          <CardTitle className="text-section">Sign in</CardTitle>
          <CardDescription className="text-balance">
            Guest requests for every hotel you work in, in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            noValidate
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          >
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  aria-invalid={!!form.formState.errors.email}
                  className="h-10"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <FieldContent>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!form.formState.errors.password}
                  className="h-10"
                  {...form.register("password")}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </FieldContent>
            </Field>

            <Button
              type="submit"
              className="mt-1 h-10 w-full text-body"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-0.5 text-center text-sm text-muted-foreground">
          <p className="text-balance">
            Demo account: any password of 6+ characters works.
          </p>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm"
            onClick={fillDemoAccount}
          >
            Use demo account
          </Button>
        </CardFooter>
      </Card>
      <Credit />
    </div>
  )
}

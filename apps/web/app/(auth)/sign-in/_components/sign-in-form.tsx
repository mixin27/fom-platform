"use client"

import { useActionState, useMemo, useState } from "react"
import { ArrowRight, ShieldAlert } from "lucide-react"

import { submitSignInAction } from "@/app/actions"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

type SignInFormProps = {
  initialErrorMessage?: string | null
}

type SignInActionState = {
  errorMessage: string | null
  sessionConflict: {
    platform: string
    activeSessionCount: number
    activeSession: {
      deviceName: string
      lastSeenAt: string
      ipAddress: string | null
    } | null
  } | null
}

const initialSignInActionState: SignInActionState = {
  errorMessage: null,
  sessionConflict: null,
}

export function SignInForm({
  initialErrorMessage = null,
}: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitSignInAction,
    initialSignInActionState
  )
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const errorMessage = state.errorMessage ?? initialErrorMessage
  const conflictSummary = useMemo(() => {
    if (!state.sessionConflict) {
      return null
    }

    const activeSession = state.sessionConflict.activeSession
    if (!activeSession) {
      return "Another device is already signed in on this platform."
    }

    const timestampLabel = formatConflictTimestamp(activeSession.lastSeenAt)
    const locationLabel = activeSession.ipAddress
      ? `IP ${activeSession.ipAddress}`
      : null

    return [activeSession.deviceName, timestampLabel, locationLabel]
      .filter((value) => value && value.trim().length > 0)
      .join(" • ")
  }, [state.sessionConflict])

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      ) : null}

      {state.sessionConflict ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Your session is active in another device.
              </p>
              <p className="mt-1 text-amber-800/80">
                {conflictSummary ??
                  "Another device is already signed in on this platform."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-700/70">
                {state.sessionConflict.activeSessionCount > 1
                  ? `${state.sessionConflict.activeSessionCount} active sessions detected on ${state.sessionConflict.platform}.`
                  : `One active ${state.sessionConflict.platform} session is already open.`}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="owner@shop.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldDescription>
            Your credentials are verified by the backend API and a signed web session cookie is created on success.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          name="logoutOtherDevice"
          value="false"
          size="lg"
          disabled={isPending}
          className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
        >
          Continue
          <ArrowRight data-icon="inline-end" />
        </Button>

        {state.sessionConflict ? (
          <Button
            type="submit"
            name="logoutOtherDevice"
            value="true"
            size="lg"
            disabled={isPending}
            variant="outline"
          >
            Logout another device
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function formatConflictTimestamp(value: string) {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return "recently active"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

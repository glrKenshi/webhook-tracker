"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { WebhookIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { AuthShell, ScreenStatus } from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { AuthApiError } from "@/lib/auth-api";
import type { FieldErrors } from "@/lib/auth-types";

type AuthMode = "sign-in" | "sign-up";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const auth = useAuth();
  const router = useRouter();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (auth.status === "authenticated") {
      router.replace("/");
    }
  }, [auth.status, router]);

  if (auth.status !== "anonymous") {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(mode, email, password, passwordConfirmation);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      if (isSignUp) {
        await auth.signUp(email.trim(), password, passwordConfirmation);
      } else {
        await auth.signIn(email.trim(), password);
      }
      router.replace("/");
    } catch (error) {
      if (error instanceof AuthApiError) {
        setFieldErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HugeiconsIcon icon={WebhookIcon} size={16} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Webhook Inbox</span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight">
        {isSignUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isSignUp
          ? "Register to create endpoints and inspect incoming webhooks."
          : "Enter your email and password to continue."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate aria-busy={pending}>
        <Field
          id={`${formId}-email`}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          disabled={pending}
          onChange={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        <Field
          id={`${formId}-password`}
          label="Password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          error={fieldErrors.password}
          disabled={pending}
          onChange={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        {isSignUp ? (
          <Field
            id={`${formId}-password-confirmation`}
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            error={fieldErrors.password_confirmation}
            disabled={pending}
            onChange={(value) => {
              setPasswordConfirmation(value);
              setFieldErrors((current) => ({ ...current, password_confirmation: undefined }));
            }}
          />
        ) : null}

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending
            ? isSignUp
              ? "Creating account…"
              : "Signing in…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "Need an account? "}
        <Link
          href={isSignUp ? "/login" : "/register"}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        maxLength={type === "password" ? 128 : 255}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validate(
  mode: AuthMode,
  email: string,
  password: string,
  passwordConfirmation: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (mode === "sign-up") {
    if (!passwordConfirmation) {
      errors.password_confirmation = "Confirm your password.";
    } else if (passwordConfirmation !== password) {
      errors.password_confirmation = "Passwords do not match.";
    }
  }

  return errors;
}

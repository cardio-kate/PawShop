'use client';

import { useEffect, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';
import { adminLogin, requestPasswordReset, resetPassword } from '@/actions/auth.actions';
import {
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  type LoginInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
} from '@/lib/validation/auth.schema';

type Step = 'login' | 'forgot' | 'reset' | 'reset-success';

const LINK_CLASSNAME = `cursor-pointer self-center text-body-sm text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

// Action кинул исключение (не аккуратный {success:false, errors}) — обрыв соединения и т.п.,
// architecture.md §3.11 «UI-состояния запроса». Admin-формы без i18n-ключей (CLAUDE.md → «Что не
// локализуется»), поэтому здесь просто строка, не 'errors.generic'.
const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function StaffLoginCard() {
  const [step, setStep] = useState<Step>('login');

  return (
    <div className="gap-lg bg-surface p-xl flex w-[380px] max-w-full flex-col rounded-lg shadow-[0_4px_16px_rgba(14,14,18,0.08)]">
      {/* Визуально страница держится на Logo (design.md — «лапка + PawShop как в Header», без
          отдельного заголовка), но документу всё равно нужен один h1 — иначе у /staff-entry нет
          ни одного heading-элемента и скринридер не может ни перейти к контенту, ни озвучить
          назначение страницы. */}
      <h1 className="sr-only">Staff sign in</h1>
      <Logo className="justify-center" />

      {step === 'login' && <LoginStep onForgotPassword={() => setStep('forgot')} />}
      {step === 'forgot' && <ForgotStep onCodeSent={() => setStep('reset')} />}
      {step === 'reset' && <ResetStep onReset={() => setStep('reset-success')} />}
      {step === 'reset-success' && (
        <ResetSuccessStep onBackToSignIn={() => setStep('login')} />
      )}
    </div>
  );
}

function LoginStep({ onForgotPassword }: { onForgotPassword: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    try {
      // adminLogin() сама делает redirect() на сервере при успехе — сюда управление в этом случае
      // не возвращается вообще (см. actions/auth.actions.ts). Ветка ниже — только на реальный
      // {success:false}.
      const result = await adminLogin(data);
      if (!result.success) {
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof LoginInput, { message });
        }
      }
    } catch (error) {
      // redirect() внутри adminLogin() бросает специальную ошибку, которую должен поймать сам
      // Next.js, а не этот catch — иначе успешный вход показал бы "Something went wrong" вместо
      // перехода в дашборд.
      unstable_rethrow(error);
      setError('root', { message: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <form className="gap-md flex flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
      {errors.root && (
        <p
          role="alert"
          className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
        >
          {errors.root.message}
        </p>
      )}
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Username</span>
        <Input
          {...register('username')}
          autoComplete="username"
          autoFocus
          error={!!errors.username}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        {errors.username && (
          <span id="username-error" role="alert" className="text-body-sm text-error">
            {errors.username.message}
          </span>
        )}
      </label>
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Password</span>
        <Input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          error={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert" className="text-body-sm text-error">
            {errors.password.message}
          </span>
        )}
      </label>
      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <button type="button" onClick={onForgotPassword} className={LINK_CLASSNAME}>
        Forgot password?
      </button>
    </form>
  );
}

function ForgotStep({ onCodeSent }: { onCodeSent: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(requestPasswordResetSchema) });

  async function onSubmit(data: RequestPasswordResetInput) {
    try {
      const result = await requestPasswordReset(data);
      if (!result.success) {
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof RequestPasswordResetInput, { message });
        }
        return;
      }
      onCodeSent();
    } catch {
      setError('root', { message: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <form className="gap-md flex flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
      {errors.root && (
        <p
          role="alert"
          className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
        >
          {errors.root.message}
        </p>
      )}
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Username</span>
        <Input
          {...register('username')}
          autoComplete="username"
          autoFocus
          error={!!errors.username}
          aria-describedby={errors.username ? 'forgot-username-error' : undefined}
        />
        {errors.username && (
          <span id="forgot-username-error" role="alert" className="text-body-sm text-error">
            {errors.username.message}
          </span>
        )}
      </label>
      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending…' : 'Send code'}
      </Button>
    </form>
  );
}

function ResetStep({ onReset }: { onReset: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(data: ResetPasswordInput) {
    try {
      const result = await resetPassword(data);
      if (!result.success) {
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof ResetPasswordInput, { message });
        }
        return;
      }
      onReset();
    } catch {
      setError('root', { message: GENERIC_ERROR_MESSAGE });
    }
  }

  return (
    <form className="gap-md flex flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="text-body-sm text-neutral-500">Code sent to your Telegram</p>
      {errors.root && (
        <p
          role="alert"
          className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md"
        >
          {errors.root.message}
        </p>
      )}
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">Code</span>
        {/* Реальный код — длинная hex-строка (crypto.randomBytes(32).toString('hex'), см.
            architecture.md §3.4), не короткий числовой PIN — inputMode="numeric" из мока показывал
            бы цифровую клавиатуру на телефоне для значения с буквами a-f, отсюда убран. */}
        <Input
          {...register('code')}
          autoComplete="one-time-code"
          autoFocus
          error={!!errors.code}
          aria-describedby={errors.code ? 'code-error' : undefined}
        />
        {errors.code && (
          <span id="code-error" role="alert" className="text-body-sm text-error">
            {errors.code.message}
          </span>
        )}
      </label>
      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">New password</span>
        <Input
          {...register('newPassword')}
          type="password"
          autoComplete="new-password"
          error={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
        />
        {errors.newPassword && (
          <span id="new-password-error" role="alert" className="text-body-sm text-error">
            {errors.newPassword.message}
          </span>
        )}
      </label>
      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Resetting…' : 'Reset password'}
      </Button>
    </form>
  );
}

function ResetSuccessStep({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  const headingRef = useRef<HTMLParagraphElement>(null);

  // Автофокус через ref+эффект, не autoFocus-атрибут: браузерный autofocus формально применяется
  // только к «form-associated»/изначально фокусируемым элементам, на голом <p> (даже с tabIndex={-1})
  // он ненадёжен — проверено вручную в браузере, autoFocus молча не срабатывал.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="gap-md flex flex-col items-center text-center">
      <span className="bg-secondary-tint text-secondary-on-tint flex h-12 w-12 items-center justify-center rounded-full">
        <Check className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="gap-xs flex flex-col">
        {/* tabIndex={-1} — фокусируемый, но не попадающий в обычный Tab-порядок элемент, на который
            переходит фокус при смене шага (иначе после каждого шага фокус улетает на body — ни
            один шаг ниже не двигает фокус сам, кроме автофокуса на первом поле формы). */}
        <p ref={headingRef} tabIndex={-1} className="text-body-md text-neutral-900 outline-none">
          Password updated
        </p>
        <p className="text-body-sm text-neutral-500">You can now sign in with your new password</p>
      </div>
      <Button type="button" variant="secondary" onClick={onBackToSignIn} className="w-full">
        Back to sign in
      </Button>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FOCUS_RING_CLASSNAME } from '@/components/ui/interaction-styles';

type Step = 'login' | 'forgot' | 'reset' | 'reset-success';

// ТЗ §12: 5 неудачных попыток → временная блокировка на 15 минут. Реального adminLogin ещё нет
// (Фаза 7 — только UI на моках), поэтому здесь нечему "проверять" пароль — каждый сабмит формы
// считается неудачной попыткой, чтобы баннер блокировки из design.md → Staff login card оставалось
// чем визуально проверить, а не только описать.
const MAX_LOGIN_ATTEMPTS = 5;

const LINK_CLASSNAME = `cursor-pointer self-center text-body-sm text-neutral-900 transition-colors duration-fast hover:text-paw motion-reduce:transition-none ${FOCUS_RING_CLASSNAME}`;

export function StaffLoginCard() {
  const [step, setStep] = useState<Step>('login');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const locked = failedAttempts >= MAX_LOGIN_ATTEMPTS;

  function handleBackToSignIn() {
    setStep('login');
    setFailedAttempts(0);
  }

  return (
    <div className="flex w-[380px] max-w-full flex-col gap-lg rounded-lg bg-surface p-xl shadow-[0_4px_16px_rgba(14,14,18,0.08)]">
      {/* Визуально страница держится на Logo (design.md — «лапка + PawShop как в Header», без
          отдельного заголовка), но документу всё равно нужен один h1 — иначе у /staff-entry нет
          ни одного heading-элемента и скринридер не может ни перейти к контенту, ни озвучить
          назначение страницы. */}
      <h1 className="sr-only">Staff sign in</h1>
      <Logo className="justify-center" />

      {step === 'login' && (
        <LoginStep
          locked={locked}
          onSubmit={() => setFailedAttempts((count) => count + 1)}
          onForgotPassword={() => setStep('forgot')}
        />
      )}
      {step === 'forgot' && <ForgotStep onCodeSent={() => setStep('reset')} />}
      {step === 'reset' && <ResetStep onReset={() => setStep('reset-success')} />}
      {step === 'reset-success' && <ResetSuccessStep onBackToSignIn={handleBackToSignIn} />}
    </div>
  );
}

function LoginStep({
  locked,
  onSubmit,
  onForgotPassword,
}: {
  locked: boolean;
  onSubmit: () => void;
  onForgotPassword: () => void;
}) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!locked) onSubmit();
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      {locked && (
        <p role="alert" className="rounded-md bg-error-tint px-md py-sm text-body-sm text-error-on-tint">
          Too many failed attempts. Try again in 15 minutes.
        </p>
      )}
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Username</span>
        <Input name="username" autoComplete="username" disabled={locked} required autoFocus />
      </label>
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Password</span>
        <Input name="password" type="password" autoComplete="current-password" disabled={locked} required />
      </label>
      <Button type="submit" variant="primary" disabled={locked} className="w-full">
        Sign in
      </Button>
      <button type="button" onClick={onForgotPassword} className={LINK_CLASSNAME}>
        Forgot password?
      </button>
    </form>
  );
}

function ForgotStep({ onCodeSent }: { onCodeSent: () => void }) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onCodeSent();
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Username</span>
        <Input name="username" autoComplete="username" required autoFocus />
      </label>
      <Button type="submit" variant="primary" className="w-full">
        Send code
      </Button>
    </form>
  );
}

function ResetStep({ onReset }: { onReset: () => void }) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onReset();
  }

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      <p className="text-body-sm text-neutral-500">Code sent to your Telegram</p>
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">Code</span>
        <Input name="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus />
      </label>
      <label className="flex flex-col gap-xs">
        <span className="text-label-md text-neutral-900">New password</span>
        <Input name="newPassword" type="password" autoComplete="new-password" required />
      </label>
      <Button type="submit" variant="primary" className="w-full">
        Reset password
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
    <div className="flex flex-col items-center gap-md text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-tint text-secondary-on-tint">
        <Check className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-xs">
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

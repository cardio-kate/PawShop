'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { submitContactMessage } from '@/actions/contact.actions';
import { contactSchema, type ContactInput } from '@/lib/validation/contact.schema';

// Фаза 7 плана: реальное подключение формы (react-hook-form + zodResolver, тот же контракт, что
// CheckoutClient.tsx/StaffLoginCard.tsx) вместо декоративной Button disabled без onSubmit.
export function ContactClient() {
  const t = useTranslations('Contact');
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', comment: '' },
  });

  async function onSubmit(data: ContactInput) {
    try {
      const result = await submitContactMessage(data);
      if (!result.success) {
        for (const [field, message] of Object.entries(result.errors)) {
          setError(field as 'root' | keyof ContactInput, { message });
        }
        return;
      }
      reset();
      setSent(true);
    } catch {
      setError('root', { message: 'errors.generic' });
    }
  }

  // Единая точка перевода — errors.field.message всегда ключ, независимо от источника (тот же
  // принцип, что fieldError() в CheckoutClient.tsx).
  function fieldError(message?: string): string | undefined {
    return message ? t(message) : undefined;
  }

  if (sent) {
    return (
      <div className="gap-md py-3xl flex flex-col items-center text-center">
        <h2 className="text-h3 text-neutral-900">{t('confirmation.title')}</h2>
        <p className="text-body-md text-neutral-700">{t('confirmation.message')}</p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          {t('confirmation.sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-xl gap-md flex flex-col">
      {errors.root && (
        <p role="alert" className="bg-error-tint px-md py-sm text-body-sm text-error-on-tint rounded-md">
          {fieldError(errors.root.message)}
        </p>
      )}

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">
          {t('form.name')} <span aria-hidden="true">*</span>
        </span>
        <Input
          {...register('name')}
          autoComplete="name"
          error={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="text-body-sm text-error">
            {fieldError(errors.name.message)}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">
          {t('form.email')} <span aria-hidden="true">*</span>
        </span>
        <Input
          type="email"
          {...register('email')}
          autoComplete="email"
          error={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" className="text-body-sm text-error">
            {fieldError(errors.email.message)}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">{t('form.phone')}</span>
        <Input
          type="tel"
          {...register('phone')}
          autoComplete="tel"
          error={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <span id="phone-error" role="alert" className="text-body-sm text-error">
            {fieldError(errors.phone.message)}
          </span>
        )}
      </label>

      <label className="gap-xs flex flex-col">
        <span className="text-label-md text-neutral-900">{t('form.comment')}</span>
        <Textarea {...register('comment')} rows={4} />
      </label>

      <Button type="submit" variant="primary" disabled={isSubmitting} className="mt-sm self-start">
        {isSubmitting ? t('form.sending') : t('form.send')}
      </Button>
    </form>
  );
}

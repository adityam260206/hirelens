import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

type FieldWrapperProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FieldWrapper({ label, htmlFor, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, hint, id, className, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand",
          error && "border-danger",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, id, className, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint}>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand",
          error && "border-danger",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className, options, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldWrapper label={label} htmlFor={inputId} error={error} hint={hint}>
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground",
          "focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

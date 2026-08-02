"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "password" | "textarea";
  required?: boolean;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  rows?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
}

export function FormInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder = "",
  type = "text",
  required = false,
  error,
  touched = false,
  disabled = false,
  rows = 4,
  prefix,
  suffix,
  className,
}: FormInputProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const hasError = error && touched;

  const containerCls = cn(
    "relative flex items-center w-full border bg-[#0c0c0c] transition-colors",
    hasError
      ? "border-red-500/60 focus-within:ring-2 focus-within:ring-red-500/20"
      : "border-[#2a2a2a] focus-within:border-sand/30 focus-within:ring-2 focus-within:ring-sand/10",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const inputCls =
    "flex-1 bg-transparent text-[13px] text-sand placeholder:text-sand/20 px-3 py-3 outline-none disabled:cursor-not-allowed";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[11px] font-mono uppercase tracking-widest text-sand/40">
        {label}
        {required && <span className="text-orange ml-1">*</span>}
      </label>

      <div className={containerCls}>
        {prefix}
        {type === "textarea" ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(inputCls, "resize-none py-3")}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputCls}
          />
        )}
        {suffix}
      </div>

      {hasError && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}

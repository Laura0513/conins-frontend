import { type ReactNode } from "react"

type FormFieldProps = {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

/**
 * Wrapper para campos de formulario con label, indicador required, error y hint.
 * Uso: <FormField label="Nombre" required error={errors.nombre}>
 *         <input ... />
 *      </FormField>
 */
export default function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  )
}

// Clases base para inputs — normal y con error
export const inputClass = (hasError?: boolean) =>
  `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? "border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/30"
      : "border-gray-300 focus:ring-sena/50 focus:border-sena"
  }`

export const selectClass = (hasError?: boolean) =>
  `${inputClass(hasError)} bg-white`

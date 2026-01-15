import { useId } from 'react'
import { Icons } from './Icons'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  /** Position du label : 'top' (défaut), 'left' (inline) */
  labelPosition?: 'top' | 'left'
}

export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 999,
  label,
  className = '',
  size = 'md',
  disabled = false,
  labelPosition = 'top',
}: NumberInputProps) {
  const inputId = useId()

  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const newValue = parseInt(e.target.value) || min
    onChange(Math.max(min, Math.min(max, newValue)))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      handleIncrement()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      handleDecrement()
    }
  }

  // Classes de taille
  const sizeClasses = {
    sm: {
      button: 'w-8 h-8 min-h-0',
      input: 'h-8 min-h-0 w-12 text-sm',
      icon: 'w-3.5 h-3.5',
      label: 'text-xs',
    },
    md: {
      button: 'w-10 h-10 min-h-0',
      input: 'h-10 min-h-0 w-14 text-base',
      icon: 'w-4 h-4',
      label: 'text-sm',
    },
    lg: {
      button: 'w-12 h-12 min-h-0',
      input: 'h-12 min-h-0 w-16 text-lg',
      icon: 'w-5 h-5',
      label: 'text-base',
    },
  }

  const isAtMin = value <= min
  const isAtMax = value >= max

  const buttonBaseClasses = `
    join-item flex items-center justify-center
    bg-base-200 border border-base-300
    text-base-content
    transition-all duration-150 ease-out
    hover:bg-primary hover:text-primary-content hover:border-primary
    focus-visible:z-10
    active:scale-95
    disabled:bg-base-200 disabled:text-base-content/30
    disabled:border-base-300 disabled:cursor-not-allowed
    disabled:hover:bg-base-200 disabled:hover:text-base-content/30
    disabled:active:scale-100
  `

  const inputGroup = (
    <div className="join" role="group" aria-label={label || 'Number input'}>
      {/* Bouton décrement */}
      <button
        type="button"
        className={`${buttonBaseClasses} ${sizeClasses[size].button}`}
        onClick={handleDecrement}
        disabled={isAtMin || disabled}
        aria-label="Diminuer la valeur"
        aria-disabled={isAtMin || disabled}
      >
        <Icons.Minus className={sizeClasses[size].icon} />
      </button>

      {/* Input */}
      <input
        id={inputId}
        type="number"
        className={`
          join-item ${sizeClasses[size].input}
          px-0 text-center font-semibold tabular-nums
          bg-base-100 border-y border-base-300
          transition-colors duration-150
          focus:border-primary focus:bg-base-100
          disabled:bg-base-200 disabled:text-base-content/50 disabled:cursor-not-allowed
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        `}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />

      {/* Bouton incrément */}
      <button
        type="button"
        className={`${buttonBaseClasses} ${sizeClasses[size].button}`}
        onClick={handleIncrement}
        disabled={isAtMax || disabled}
        aria-label="Augmenter la valeur"
        aria-disabled={isAtMax || disabled}
      >
        <Icons.Plus className={sizeClasses[size].icon} />
      </button>
    </div>
  )

  // Variante inline : label à gauche
  if (labelPosition === 'left') {
    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`${sizeClasses[size].label} font-medium text-base-content/80 shrink-0`}
          >
            {label}
          </label>
        )}
        {inputGroup}
      </div>
    )
  }

  // Variante par défaut : label au-dessus
  return (
    <div className={`form-control ${className}`}>
      {label && (
        <label htmlFor={inputId} className="label py-1">
          <span className={`label-text font-medium ${sizeClasses[size].label}`}>
            {label}
          </span>
        </label>
      )}
      {inputGroup}
    </div>
  )
}

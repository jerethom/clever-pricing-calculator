interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 999,
  label,
  className = '',
}: NumberInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min
    onChange(Math.max(min, Math.min(max, newValue)))
  }

  return (
    <div className={`form-control ${className}`}>
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}
      <div className="join">
        <button
          type="button"
          className="btn btn-square join-item"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          -
        </button>
        <input
          type="number"
          className="input input-bordered join-item w-16 px-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
        />
        <button
          type="button"
          className="btn btn-square join-item"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  )
}

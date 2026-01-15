import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { Icons } from './Icons'

export interface EditableTitleProps {
  value: string
  defaultValue: string
  onSave: (newValue: string) => void
  onReset?: () => void
  className?: string
  inputClassName?: string
}

export const EditableTitle = memo(function EditableTitle({
  value,
  defaultValue,
  onSave,
  onReset,
  className = '',
  inputClassName = '',
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isModified = value !== defaultValue

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = useCallback(() => {
    setEditValue(value)
    setIsEditing(true)
  }, [value])

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue)
    }
    setIsEditing(false)
  }, [editValue, value, onSave])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleReset = useCallback(() => {
    if (onReset) {
      onReset()
    } else {
      onSave(defaultValue)
    }
    setIsEditing(false)
  }, [onReset, onSave, defaultValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  if (isEditing) {
    return (
      <div className={`animate-in fade-in duration-200 ${className}`}>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            className={`input input-bordered input-sm flex-1 font-bold text-base min-w-0 ${inputClassName}`}
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nom..."
          />
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10 cursor-pointer"
            onClick={handleSave}
            aria-label="Sauvegarder"
          >
            <Icons.Check className="w-3.5 h-3.5" />
          </button>
          {isModified && (
            <div className="tooltip tooltip-bottom" data-tip={`Reset: ${defaultValue}`}>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-warning hover:bg-warning/10 cursor-pointer"
                onClick={handleReset}
                aria-label="Reinitialiser le nom"
              >
                <Icons.Refresh className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
            onClick={handleCancel}
            aria-label="Annuler"
          >
            <Icons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 group/name ${className}`}>
      <h3 className="font-bold text-base truncate">{value}</h3>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 transition-opacity cursor-pointer"
        onClick={handleStartEdit}
        aria-label="Modifier le nom"
      >
        <Icons.Edit className="w-3 h-3" />
      </button>
    </div>
  )
})

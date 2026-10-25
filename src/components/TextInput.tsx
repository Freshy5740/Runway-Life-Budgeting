import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onCommit: (value: string) => void
}

/** A text box that saves as you type but never lets a slow save overwrite what you're typing. */
export function TextInput({ value, onCommit, ...rest }: TextInputProps) {
  const [text, setText] = useState(value)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(value)
  }, [value])

  return (
    <input
      {...rest}
      value={text}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={() => {
        focused.current = false
        setText(value)
      }}
      onChange={(event) => {
        setText(event.target.value)
        onCommit(event.target.value)
      }}
    />
  )
}

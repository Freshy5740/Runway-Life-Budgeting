import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { centsToInput, parseMoney, type Cents } from '../lib/money'

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  valueCents: Cents | null
  onChangeCents: (cents: Cents | null) => void
}

/**
 * A dollar amount box that saves as you type. It keeps what you typed (like "12.") while you're in
 * it, and tidies the text when you leave.
 */
export function MoneyInput({ valueCents, onChangeCents, ...rest }: MoneyInputProps) {
  const [text, setText] = useState(() => centsToInput(valueCents))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(centsToInput(valueCents))
  }, [valueCents])

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={() => {
        focused.current = false
        setText(centsToInput(valueCents))
      }}
      onChange={(event) => {
        setText(event.target.value)
        onChangeCents(parseMoney(event.target.value))
      }}
    />
  )
}

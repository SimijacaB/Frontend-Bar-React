import { useEffect, useRef, useState } from 'react'

interface CodeInputProps {
  value?: string
  onChange: (v: string) => void
  prefixOptions?: string[]
  unitOptions?: { value: string; label: string }[]
  suffixOptions?: string[]
  required?: boolean
  fixedPrefix?: string
  fixedSuffix?: string
}

const pad = (numStr: string, len: number) => numStr.padStart(len, '0')
const CODE_REGEX = /^([A-Z])(\d{2})-([A-Z]{2,3})-(\d{4})([A-Z])$/i

export default function CodeInput({
  value = '',
  onChange,
  prefixOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  unitOptions = [
    { value: 'ML', label: 'ML' },
    { value: 'ONZ', label: 'ONZ' },
    { value: 'GR', label: 'GR' },
    { value: 'UN', label: 'UN' },
  ],
  suffixOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  fixedPrefix,
  fixedSuffix,
}: CodeInputProps) {
  const [prefix, setPrefix] = useState<string>(fixedPrefix ?? (prefixOptions[0] || 'A'))
  const [rawTwoDigits, setRawTwoDigits] = useState<string>('')
  const [unit, setUnit] = useState<string>(unitOptions[0].value)
  const [rawFourDigits, setRawFourDigits] = useState<string>('')
  const [suffix, setSuffix] = useState<string>(suffixOptions[0] || 'A')
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const isSyncingRef = useRef(false)

  // parse incoming value
  useEffect(() => {
    if (!value) return
    const m = value.match(CODE_REGEX)
    if (m) {
      isSyncingRef.current = true
      // if fixed prefix provided, keep it; otherwise use parsed
      if (!fixedPrefix) setPrefix(m[1].toUpperCase())
      setRawTwoDigits(m[2])
      setUnit(m[3].toUpperCase())
      setRawFourDigits(m[4])
      if (!fixedSuffix) setSuffix(m[5].toUpperCase())
    }
  }, [value, fixedPrefix, fixedSuffix])

  useEffect(() => {
    setHasUserInteracted(false)
  }, [value])

  // combine and emit
  useEffect(() => {
    const two = rawTwoDigits === '' ? '00' : rawTwoDigits.padStart(2, '0')
    const four = rawFourDigits === '' ? '0000' : rawFourDigits.padStart(4, '0')
    // if fixedPrefix/fixedSuffix provided, ensure they are used in combined value
    const p = fixedPrefix ?? prefix
    const s = fixedSuffix ?? suffix
    const combined = `${p}${pad(two, 2)}-${unit}-${pad(four, 4)}${s}`

    if (isSyncingRef.current) {
      if (value && combined.toUpperCase() === value.toUpperCase()) {
        isSyncingRef.current = false
      }
      return
    }

    if (!hasUserInteracted && value && !CODE_REGEX.test(value)) return

    if (combined !== value) onChange(combined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, rawTwoDigits, unit, rawFourDigits, suffix, fixedPrefix, fixedSuffix, value, hasUserInteracted])

  return (
    <div className="w-full flex gap-2 items-center">
      {fixedPrefix ? (
        <div className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-center">{fixedPrefix}</div>
      ) : (
        <select
          value={prefix}
          onChange={(e) => {
            setHasUserInteracted(true)
            setPrefix(e.target.value)
          }}
          className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
        >
          {prefixOptions.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={rawTwoDigits}
        onChange={(e) => {
          setHasUserInteracted(true)
          const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
          setRawTwoDigits(digits)
        }}
        placeholder="00"
        className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-center font-mono"
        style={{ width: '5ch' }}
      />

      <span className="text-slate-400">-</span>

      <select
        value={unit}
        onChange={(e) => {
          setHasUserInteracted(true)
          setUnit(e.target.value)
        }}
        className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
      >
        {unitOptions.map(u => (
          <option key={u.value} value={u.value}>{u.value}</option>
        ))}
      </select>

      <span className="text-slate-400">-</span>

      <input
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={rawFourDigits}
        onChange={(e) => {
          setHasUserInteracted(true)
          const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
          setRawFourDigits(digits)
        }}
        placeholder="0000"
        className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-center font-mono"
        style={{ width: '7ch' }}
      />

      {fixedSuffix ? (
        <div className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-center">{fixedSuffix}</div>
      ) : (
        <select
          value={suffix}
          onChange={(e) => {
            setHasUserInteracted(true)
            setSuffix(e.target.value)
          }}
          className="flex-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
        >
          {suffixOptions.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  )
}

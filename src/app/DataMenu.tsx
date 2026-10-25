import { useEffect, useRef, useState } from 'react'
import { useToast } from '../components/toast'
import { BackupError, exportBackup, parseBackup, restoreBackup } from '../db/backup'
import { todayIso } from '../lib/dates'
import { hrefFor } from './routes'
import { useInstallPrompt } from './useInstallPrompt'

/** The "Backup" menu: export, import, install, privacy. */
export function DataMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { installed, install } = useInstallPrompt()

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !menuRef.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  async function handleExport() {
    setOpen(false)
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `runway-backup-${todayIso()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    toast('Backup saved to your downloads.')
  }

  async function handleImport(file: File) {
    try {
      const tables = parseBackup(await file.text())
      const ok = window.confirm(
        'Importing replaces everything in Runway on this device with the backup. Export first if you want to keep a copy. Continue?',
      )
      if (!ok) return
      await restoreBackup(tables)
      toast('Backup imported.')
    } catch (error) {
      toast(error instanceof BackupError ? error.message : "Couldn't import that file.", {
        tone: 'error',
      })
    }
  }

  return (
    <div className="data-menu" ref={menuRef}>
      <button
        type="button"
        className="bar-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Backup
      </button>
      {open && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={handleExport}>
            Export backup
            <span>Save everything to a file</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              fileRef.current?.click()
            }}
          >
            Import backup…
            <span>Restore from a Runway or prototype file</span>
          </button>
          {install && !installed && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                void install()
              }}
            >
              Install Runway
              <span>Add it to your home screen or desktop</span>
            </button>
          )}
          <a role="menuitem" href={hrefFor('privacy')} onClick={() => setOpen(false)}>
            Privacy
            <span>Where your data lives</span>
          </a>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handleImport(file)
        }}
      />
    </div>
  )
}

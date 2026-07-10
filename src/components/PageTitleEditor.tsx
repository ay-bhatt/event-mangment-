import { useEffect, useState } from 'react'
import { Pencil, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getStoredPageTitle, saveStoredPageTitle, subscribeStoredPageTitles, type PageTitleKey } from '@/lib/page-titles'

type Props = {
  pageKey: PageTitleKey
  defaultTitle: string
}

export function PageTitleEditor({ pageKey, defaultTitle }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(() => getStoredPageTitle(pageKey) || defaultTitle)

  useEffect(() => {
    const unsubscribe = subscribeStoredPageTitles(() => {
      if (!editing) {
        setTitle(getStoredPageTitle(pageKey) || defaultTitle)
      }
    })
    return unsubscribe
  }, [editing, pageKey, defaultTitle])

  const handleSave = () => {
    saveStoredPageTitle(pageKey, title)
    setEditing(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {editing ? (
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[220px]"
          />
          <Button size="sm" className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      ) : (
        <Button size="sm" className="gap-2" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          Rename
        </Button>
      )}
    </div>
  )
}

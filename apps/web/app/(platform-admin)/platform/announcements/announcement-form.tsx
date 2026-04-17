import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

import type { PlatformAnnouncement } from "@/lib/platform/api"

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  return value.slice(0, 16)
}

const audiences = [
  { value: "public", label: "Marketing site" },
  { value: "auth", label: "Auth pages" },
  { value: "tenant", label: "Shop portal" },
  { value: "platform", label: "Platform admin" },
] as const

export function AnnouncementForm({
  action,
  submitLabel,
  announcement,
  returnTo,
}: {
  action: (formData: FormData) => void
  submitLabel: string
  announcement?: PlatformAnnouncement
  returnTo?: string
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {announcement ? (
        <input type="hidden" name="announcement_id" value={announcement.id} />
      ) : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              name="title"
              defaultValue={announcement?.title ?? ""}
              placeholder="Scheduled maintenance window"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Body
            </label>
            <Textarea
              name="body"
              defaultValue={announcement?.body ?? ""}
              placeholder="Describe what users should know and what action they need to take."
              className="min-h-[180px]"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                CTA label
              </label>
              <Input
                name="cta_label"
                defaultValue={announcement?.cta_label ?? ""}
                placeholder="Open billing"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                CTA URL
              </label>
              <Input
                name="cta_url"
                defaultValue={announcement?.cta_url ?? ""}
                placeholder="/dashboard/billing"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Severity
            </label>
            <select
              name="severity"
              defaultValue={announcement?.severity ?? "info"}
              className="h-9 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Status
            </label>
            <select
              name="status"
              defaultValue={announcement?.status ?? "draft"}
              className="h-9 w-full rounded-xl border border-[var(--fom-border-strong)] bg-[var(--fom-admin-surface)] px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Audiences
            </label>
            <div className="grid gap-2 rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] p-3">
              {audiences.map((audience) => (
                <label
                  key={audience.value}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name="audiences"
                    value={audience.value}
                    defaultChecked={
                      announcement?.audiences.includes(audience.value) ?? false
                    }
                  />
                  <span>{audience.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Start time
              </label>
              <Input
                type="datetime-local"
                name="starts_at"
                defaultValue={formatDateTimeLocal(announcement?.starts_at)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                End time
              </label>
              <Input
                type="datetime-local"
                name="ends_at"
                defaultValue={formatDateTimeLocal(announcement?.ends_at)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Sort order
              </label>
              <Input
                type="number"
                name="sort_order"
                min="0"
                defaultValue={String(announcement?.sort_order ?? 0)}
              />
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-surface-variant)] px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="pinned"
                defaultChecked={announcement?.pinned ?? false}
              />
              <span>Pin to the top of its audience feed</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

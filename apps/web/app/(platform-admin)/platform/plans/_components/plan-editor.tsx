"use client"

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type {
  PlatformFeaturePreset,
  PlatformLimitPreset,
  PlatformSettingsPlan,
} from "@/lib/platform/api"
import { formatCurrency } from "@/lib/platform/format"
import {
  createPlatformPlanAction,
  deletePlatformPlanAction,
  updatePlatformPlanAction,
  type PlatformPlanActionResult,
  type PlatformPlanEditorInput,
  type PlatformPlanItemInput,
  type PlatformPlanLimitInput,
} from "../../settings/actions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"

type PlanDraftItem = {
  id: string
  code: string
  label: string
  description: string
  availability_status: "available" | "unavailable"
  sort_order: number
}

type PlanDraftLimit = {
  id: string
  code: string
  label: string
  description: string
  value: string
  sort_order: number
}

type PlanDraft = {
  code: string
  name: string
  description: string
  billing_period: string
  price: string
  currency: string
  is_active: boolean
  marketing_visible: boolean
  sort_order: string
  items: PlanDraftItem[]
  limits: PlanDraftLimit[]
}

function createEmptyItem(index: number): PlanDraftItem {
  return {
    id: `item-${Date.now()}-${index}`,
    code: "",
    label: "",
    description: "",
    availability_status: "available",
    sort_order: index,
  }
}

function createEmptyLimit(index: number): PlanDraftLimit {
  return {
    id: `limit-${Date.now()}-${index}`,
    code: "",
    label: "",
    description: "",
    value: "",
    sort_order: index,
  }
}

function slugifyFeatureCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".")
}

function toDraft(plan?: PlatformSettingsPlan): PlanDraft {
  if (!plan) {
    return {
      code: "",
      name: "",
      description: "",
      billing_period: "monthly",
      price: "0",
      currency: "MMK",
      is_active: true,
      marketing_visible: false,
      sort_order: "0",
      items: [],
      limits: [],
    }
  }

  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    billing_period: plan.billing_period,
    price: String(plan.price),
    currency: plan.currency,
    is_active: plan.is_active,
    marketing_visible: plan.marketing_visible,
    sort_order: String(plan.sort_order),
    items: plan.items.map((item, index) => ({
      id: item.id,
      code: item.code,
      label: item.label,
      description: item.description ?? "",
      availability_status:
        item.availability_status === "unavailable" ? "unavailable" : "available",
      sort_order: item.sort_order ?? index,
    })),
    limits: plan.limits.map((limit, index) => ({
      id: limit.id,
      code: limit.code,
      label: limit.label,
      description: limit.description ?? "",
      value: limit.value === null ? "" : String(limit.value),
      sort_order: limit.sort_order ?? index,
    })),
  }
}

function normalizePlanItems(items: PlanDraftItem[]): PlatformPlanItemInput[] {
  return items
    .map((item, index) => ({
      code: item.code.trim() || slugifyFeatureCode(item.label),
      label: item.label.trim(),
      description: item.description.trim() || null,
      availability_status: item.availability_status,
      sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
    }))
    .filter((item) => item.label.length > 0 && item.code.length > 0)
    .sort((left, right) => left.sort_order - right.sort_order)
}

function normalizePlanLimits(limits: PlanDraftLimit[]): PlatformPlanLimitInput[] {
  return limits
    .map((limit, index) => ({
      code: limit.code.trim() || slugifyFeatureCode(limit.label),
      label: limit.label.trim(),
      description: limit.description.trim() || null,
      value:
        limit.value.trim().length === 0
          ? null
          : Number.parseInt(limit.value, 10) || 0,
      sort_order: Number.isFinite(limit.sort_order) ? limit.sort_order : index,
    }))
    .filter((limit) => limit.label.length > 0 && limit.code.length > 0)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
}

function buildPayload(draft: PlanDraft): PlatformPlanEditorInput {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    billing_period: draft.billing_period.trim(),
    price: Number.parseInt(draft.price, 10) || 0,
    currency: draft.currency.trim().toUpperCase() || "MMK",
    is_active: draft.is_active,
    marketing_visible: draft.marketing_visible,
    sort_order: Number.parseInt(draft.sort_order, 10) || 0,
    items: normalizePlanItems(draft.items),
    limits: normalizePlanLimits(draft.limits),
  }
}

function validateDraft(draft: PlanDraft): string | null {
  if (draft.code.trim().length < 2) {
    return "Plan code must be at least 2 characters."
  }

  if (!/^[a-z0-9_-]+$/.test(draft.code.trim())) {
    return "Plan code can only use lowercase letters, numbers, hyphens, and underscores."
  }

  if (draft.name.trim().length < 2) {
    return "Plan name must be at least 2 characters."
  }

  const price = Number.parseInt(draft.price, 10)
  if (!Number.isFinite(price) || price < 0) {
    return "Price must be a non-negative integer."
  }

  const sortOrder = Number.parseInt(draft.sort_order, 10)
  if (!Number.isFinite(sortOrder) || sortOrder < 0) {
    return "Sort order must be a non-negative integer."
  }

  const items = normalizePlanItems(draft.items)
  if (items.length === 0) {
    return "Select or add at least one feature item before saving."
  }

  if (items.some((item) => !/^[a-z0-9._-]+$/.test(item.code))) {
    return "Plan item codes can only use lowercase letters, numbers, dots, hyphens, and underscores."
  }

  const limits = normalizePlanLimits(draft.limits)
  if (limits.some((limit) => !/^[a-z0-9._-]+$/.test(limit.code))) {
    return "Plan limit codes can only use lowercase letters, numbers, dots, hyphens, and underscores."
  }

  if (
    limits.some(
      (limit) =>
        limit.value != null &&
        (!Number.isFinite(limit.value) || limit.value < 0)
    )
  ) {
    return "Plan limit values must be blank for unlimited or a non-negative integer."
  }

  return null
}

function ActionNotice({
  tone,
  message,
}: {
  tone: "success" | "error"
  message: string
}) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
          : "rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
      }
    >
      {message}
    </div>
  )
}

function PlanMetadataForm({
  draft,
  setDraft,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Input
        value={draft.name}
        onChange={(event) =>
          setDraft((current) => ({ ...current, name: event.target.value }))
        }
        placeholder="Plan name"
      />
      <Input
        value={draft.code}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            code: event.target.value.trim().toLowerCase(),
          }))
        }
        placeholder="plan_code"
      />
      <Input
        type="number"
        min={0}
        value={draft.price}
        onChange={(event) =>
          setDraft((current) => ({ ...current, price: event.target.value }))
        }
        placeholder="Price"
      />
      <Input
        value={draft.currency}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            currency: event.target.value.toUpperCase(),
          }))
        }
        placeholder="Currency"
      />
      <Select
        value={draft.billing_period}
        onValueChange={(value) =>
          setDraft((current) => ({ ...current, billing_period: value }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Billing period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trial">trial</SelectItem>
          <SelectItem value="monthly">monthly</SelectItem>
          <SelectItem value="yearly">yearly</SelectItem>
          <SelectItem value="enterprise">enterprise</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        value={draft.sort_order}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            sort_order: event.target.value,
          }))
        }
        placeholder="Sort order"
      />

      <div className="xl:col-span-2">
        <Textarea
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Short commercial summary for settings and marketing."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3 xl:col-span-2">
        <div>
          <p className="text-sm font-medium text-[var(--fom-ink)]">
            Active in catalog
          </p>
          <p className="text-xs text-muted-foreground">
            Allow shops to subscribe to or renew this plan in their dashboard.
          </p>
        </div>
        <Switch
          checked={draft.is_active}
          onCheckedChange={(checked) =>
            setDraft((current) => ({ ...current, is_active: checked }))
          }
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3 xl:col-span-2">
        <div>
          <p className="text-sm font-medium text-[var(--fom-ink)]">
            Marketing visibility
          </p>
          <p className="text-xs text-muted-foreground">
            Control whether this plan appears on the public landing page.
          </p>
        </div>
        <Switch
          checked={draft.marketing_visible}
          onCheckedChange={(checked) =>
            setDraft((current) => ({ ...current, marketing_visible: checked }))
          }
        />
      </div>
    </div>
  )
}

function PlanItemEditorRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PlanDraftItem
  index: number
  onChange: (next: PlanDraftItem) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-4">
      <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr_0.8fr_auto]">
        <Input
          value={item.label}
          onChange={(event) =>
            onChange({
              ...item,
              label: event.target.value,
            })
          }
          placeholder="Feature label"
        />
        <Input
          value={item.code}
          onChange={(event) =>
            onChange({
              ...item,
              code: slugifyFeatureCode(event.target.value),
            })
          }
          placeholder="feature.code"
        />
        <Select
          value={item.availability_status}
          onValueChange={(value: "available" | "unavailable") =>
            onChange({
              ...item,
              availability_status: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          <Trash2Icon data-icon="inline-start" />
          Remove
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_120px]">
        <Textarea
          value={item.description}
          onChange={(event) =>
            onChange({
              ...item,
              description: event.target.value,
            })
          }
          placeholder="Optional explanation shown under this plan item."
          rows={2}
        />
        <Input
          type="number"
          min={0}
          value={String(item.sort_order)}
          onChange={(event) =>
            onChange({
              ...item,
              sort_order: Number.parseInt(event.target.value, 10) || index,
            })
          }
          placeholder="Sort"
        />
      </div>
    </div>
  )
}

function PlanLimitEditorRow({
  limit,
  index,
  onChange,
  onRemove,
}: {
  limit: PlanDraftLimit
  index: number
  onChange: (next: PlanDraftLimit) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-4">
      <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr_0.7fr_auto]">
        <Input
          value={limit.label}
          onChange={(event) =>
            onChange({
              ...limit,
              label: event.target.value,
            })
          }
          placeholder="Limit label"
        />
        <Input
          value={limit.code}
          onChange={(event) =>
            onChange({
              ...limit,
              code: slugifyFeatureCode(event.target.value),
            })
          }
          placeholder="limit.code"
        />
        <Input
          type="number"
          min={0}
          value={limit.value}
          onChange={(event) =>
            onChange({
              ...limit,
              value: event.target.value,
            })
          }
          placeholder="Blank = unlimited"
        />
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          <Trash2Icon data-icon="inline-start" />
          Remove
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_120px]">
        <Textarea
          value={limit.description}
          onChange={(event) =>
            onChange({
              ...limit,
              description: event.target.value,
            })
          }
          placeholder="Optional explanation shown under this plan limit."
          rows={2}
        />
        <Input
          type="number"
          min={0}
          value={String(limit.sort_order)}
          onChange={(event) =>
            onChange({
              ...limit,
              sort_order: Number.parseInt(event.target.value, 10) || index,
            })
          }
          placeholder="Sort"
        />
      </div>
    </div>
  )
}

function PlanItemsEditor({
  draft,
  setDraft,
  presets,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
  presets: PlatformFeaturePreset[]
}) {
  const [selectedPresetCode, setSelectedPresetCode] = useState("")

  const remainingPresets = useMemo(
    () =>
      presets.filter(
        (preset) => !draft.items.some((item) => item.code === preset.code)
      ),
    [draft.items, presets]
  )

  function updateItem(index: number, next: PlanDraftItem) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? next : item
      ),
    }))
  }

  function removeItem(index: number) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, createEmptyItem(current.items.length)],
    }))
  }

  function addPreset() {
    const preset = remainingPresets.find((item) => item.code === selectedPresetCode)
    if (!preset) {
      return
    }

    setDraft((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: `preset-${preset.code}`,
          code: preset.code,
          label: preset.name,
          description: preset.description,
          availability_status: preset.launch_phase === "future" ? "unavailable" : "available",
          sort_order: current.items.length,
        },
      ],
    }))
    setSelectedPresetCode("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
        <Select value={selectedPresetCode} onValueChange={setSelectedPresetCode}>
          <SelectTrigger>
            <SelectValue placeholder="Add feature from preset" />
          </SelectTrigger>
          <SelectContent>
            {remainingPresets.map((preset) => (
              <SelectItem key={preset.code} value={preset.code}>
                {preset.name} · {preset.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={addPreset} disabled={!selectedPresetCode}>
          Add preset
        </Button>
        <Button type="button" variant="outline" onClick={addItem}>
          <PlusIcon data-icon="inline-start" />
          Custom item
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {presets.slice(0, 6).map((preset) => {
          const selected = draft.items.some((item) => item.code === preset.code)
          return (
            <div
              key={preset.code}
              className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--fom-ink)]">
                  {preset.name}
                </p>
                <Badge variant={selected ? "secondary" : "outline"}>
                  {selected ? "Selected" : preset.launch_phase}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {preset.description}
              </p>
            </div>
          )
        })}
      </div>

      {draft.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--fom-border-subtle)] px-4 py-6 text-sm text-muted-foreground">
          No feature items selected yet. Add from presets or create a custom item.
        </div>
      ) : (
        <div className="space-y-3">
          {draft.items.map((item, index) => (
            <PlanItemEditorRow
              key={item.id}
              item={item}
              index={index}
              onChange={(next) => updateItem(index, next)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanLimitsEditor({
  draft,
  setDraft,
  presets,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
  presets: PlatformLimitPreset[]
}) {
  const [selectedPresetCode, setSelectedPresetCode] = useState("")

  const remainingPresets = useMemo(
    () =>
      presets.filter(
        (preset) => !draft.limits.some((limit) => limit.code === preset.code)
      ),
    [draft.limits, presets]
  )

  function updateLimit(index: number, next: PlanDraftLimit) {
    setDraft((current) => ({
      ...current,
      limits: current.limits.map((limit, limitIndex) =>
        limitIndex === index ? next : limit
      ),
    }))
  }

  function removeLimit(index: number) {
    setDraft((current) => ({
      ...current,
      limits: current.limits.filter((_, limitIndex) => limitIndex !== index),
    }))
  }

  function addLimit() {
    setDraft((current) => ({
      ...current,
      limits: [...current.limits, createEmptyLimit(current.limits.length)],
    }))
  }

  function addPreset() {
    const preset = remainingPresets.find((item) => item.code === selectedPresetCode)
    if (!preset) {
      return
    }

    setDraft((current) => ({
      ...current,
      limits: [
        ...current.limits,
        {
          id: `preset-limit-${preset.code}`,
          code: preset.code,
          label: preset.name,
          description: preset.description,
          value: "",
          sort_order: current.limits.length,
        },
      ],
    }))
    setSelectedPresetCode("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
        <Select value={selectedPresetCode} onValueChange={setSelectedPresetCode}>
          <SelectTrigger>
            <SelectValue placeholder="Add limit from preset" />
          </SelectTrigger>
          <SelectContent>
            {remainingPresets.map((preset) => (
              <SelectItem key={preset.code} value={preset.code}>
                {preset.name} · {preset.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={addPreset} disabled={!selectedPresetCode}>
          Add preset
        </Button>
        <Button type="button" variant="outline" onClick={addLimit}>
          <PlusIcon data-icon="inline-start" />
          Custom limit
        </Button>
      </div>

      {draft.limits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--fom-border-subtle)] px-4 py-6 text-sm text-muted-foreground">
          No limits configured yet. Add from presets or create a custom limit.
        </div>
      ) : (
        <div className="space-y-3">
          {draft.limits.map((limit, index) => (
            <PlanLimitEditorRow
              key={limit.id}
              limit={limit}
              index={index}
              onChange={(next) => updateLimit(index, next)}
              onRemove={() => removeLimit(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PlanEditor({
  mode,
  plan,
  featurePresets,
  limitPresets,
}: {
  mode: "create" | "edit"
  plan: PlatformSettingsPlan | null
  featurePresets: PlatformFeaturePreset[]
  limitPresets: PlatformLimitPreset[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<PlanDraft>(() => toDraft(plan ?? undefined))
  const [localError, setLocalError] = useState<string | null>(null)
  const [result, setResult] = useState<PlatformPlanActionResult | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  const editorKey = `${mode}:${plan?.id ?? "new"}`

  useEffect(() => {
    setDraft(toDraft(plan ?? undefined))
    setLocalError(null)
    setResult(null)
    setActiveTab("details")
  }, [editorKey, plan])

  function handleSubmit() {
    const validationError = validateDraft(draft)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)
    setResult(null)

    startTransition(async () => {
      const payload = buildPayload(draft)
      const submitResult =
        mode === "create"
          ? await createPlatformPlanAction(payload)
          : plan
            ? await updatePlatformPlanAction(plan.id, payload)
            : {
                ok: false as const,
                message: "Plan context is missing.",
              }

      setResult(submitResult)

      if (submitResult.ok) {
        if (mode === "create") {
          router.push(`/platform/plans/${payload.code}`)
        } else {
          router.push(`/platform/plans/${plan?.code ?? payload.code}`)
        }
        router.refresh()
      }
    })
  }

  function handleCancel() {
    if (mode === "create") {
      router.push("/platform/plans")
    } else if (plan) {
      router.push(`/platform/plans/${plan.code}`)
    }
  }

  function handleDelete() {
    if (!plan) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${plan.name}? This only works when no subscriptions still use the plan.`
    )
    if (!confirmed) {
      return
    }

    setResult(null)
    setLocalError(null)

    startTransition(async () => {
      const deleteResult = await deletePlatformPlanAction(plan.id)
      setResult(deleteResult)
      if (deleteResult.ok) {
        router.push("/platform/plans")
        router.refresh()
      }
    })
  }

  const title = mode === "create" ? "Create plan" : `Edit ${plan?.name ?? "plan"}`
  const description =
    mode === "create"
      ? "Pick presets, tune pricing, and define the final feature matrix."
      : "Adjust pricing, visibility, runtime feature items, and numeric limits."

  return (
    <div className="flex flex-col gap-4">
      {result ? (
        result.ok ? (
          <ActionNotice tone="success" message={result.message} />
        ) : (
          <ActionNotice tone="error" message={result.message} />
        )
      ) : null}

      <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
        <CardHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardDescription>Plan editor</CardDescription>
              <CardTitle>{title}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={mode === "edit" && plan?.is_active ? "secondary" : "outline"}
              >
                {mode === "edit" && plan?.is_active ? "Active" : "Draft"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          {localError ? <ActionNotice tone="error" message={localError} /> : null}

          {plan ? (
            <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3 text-sm">
              <p className="font-semibold text-[var(--fom-ink)]">{plan.name}</p>
              <p className="mt-1 text-muted-foreground">
                {plan.shop_count} subscribed shops · Revenue{" "}
                {formatCurrency(plan.collected_revenue, plan.currency)}
              </p>
            </div>
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="line" className="w-full justify-start gap-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-5">
              <PlanMetadataForm draft={draft} setDraft={setDraft} />
            </TabsContent>

            <TabsContent value="features" className="mt-5">
              <PlanItemsEditor
                draft={draft}
                setDraft={setDraft}
                presets={featurePresets}
              />
            </TabsContent>

            <TabsContent value="limits" className="mt-5">
              <PlanLimitsEditor
                draft={draft}
                setDraft={setDraft}
                presets={limitPresets}
              />
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--fom-border-subtle)] pt-4">
            <div className="flex gap-2">
              {mode === "edit" && plan ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete plan
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {mode === "create" ? "Create plan" : "Save changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

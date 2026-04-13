"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheckIcon,
  CircleSlash2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"

import type { PlatformSettingsPlan } from "@/lib/platform/api"
import { formatCurrency } from "@/lib/platform/format"
import {
  createPlatformPlanAction,
  deletePlatformPlanAction,
  updatePlatformPlanAction,
  type PlatformPlanActionResult,
  type PlatformPlanEditorInput,
  type PlatformPlanItemInput,
} from "../actions"
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
import { Textarea } from "@workspace/ui/components/textarea"

type PlanDraftItem = {
  id: string
  code: string
  label: string
  description: string
  availability_status: "available" | "unavailable"
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
  sort_order: string
  items: PlanDraftItem[]
}

type PlatformPlanCatalogEditorProps = {
  plans: PlatformSettingsPlan[]
}

function createEmptyItem(index: number): PlanDraftItem {
  return {
    id: `new-${Date.now()}-${index}`,
    code: "",
    label: "",
    description: "",
    availability_status: "available",
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
      sort_order: "0",
      items: [createEmptyItem(0)],
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
    sort_order: String(plan.sort_order),
    items:
      plan.items.map((item, index) => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description ?? "",
        availability_status:
          item.availability_status === "unavailable" ? "unavailable" : "available",
        sort_order: item.sort_order ?? index,
      })) ?? [],
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

function buildPayload(draft: PlanDraft): PlatformPlanEditorInput {
  return {
    code: draft.code.trim(),
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    billing_period: draft.billing_period.trim(),
    price: Number.parseInt(draft.price, 10) || 0,
    currency: draft.currency.trim().toUpperCase() || "MMK",
    is_active: draft.is_active,
    sort_order: Number.parseInt(draft.sort_order, 10) || 0,
    items: normalizePlanItems(draft.items),
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
    return "Add at least one plan item before saving."
  }

  if (items.some((item) => !/^[a-z0-9._-]+$/.test(item.code))) {
    return "Plan item codes can only use lowercase letters, numbers, dots, hyphens, and underscores."
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
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.8fr_auto]">
        <Input
          value={item.label}
          onChange={(event) =>
            onChange({
              ...item,
              label: event.target.value,
            })
          }
          placeholder="Feature or limit label"
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
          placeholder="Optional short explanation shown under this item."
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

function EditablePlanCard({
  plan,
  onCompleted,
}: {
  plan: PlatformSettingsPlan
  onCompleted: (result: PlatformPlanActionResult) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<PlanDraft>(() => toDraft(plan))
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(toDraft(plan))
    setLocalError(null)
  }, [plan])

  const itemBreakdown = useMemo(() => {
    const available = draft.items.filter(
      (item) => item.availability_status === "available"
    ).length
    const unavailable = draft.items.filter(
      (item) => item.availability_status === "unavailable"
    ).length

    return { available, unavailable }
  }, [draft.items])

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

  function handleSave() {
    const validationError = validateDraft(draft)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)

    startTransition(async () => {
      const result = await updatePlatformPlanAction(plan.id, buildPayload(draft))
      onCompleted(result)
      if (result.ok) {
        router.refresh()
      }
    })
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${plan.name}? This only works when no subscriptions still use the plan.`
    )
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await deletePlatformPlanAction(plan.id)
      onCompleted(result)
      if (result.ok) {
        router.refresh()
      }
    })
  }

  return (
    <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
      <CardHeader className="gap-3 border-b border-[var(--fom-border-subtle)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              {plan.code} · {formatCurrency(plan.price, plan.currency)} · {plan.billing_period}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{plan.shop_count} shops</Badge>
            <Badge variant="outline">
              {itemBreakdown.available} available / {itemBreakdown.unavailable} unavailable
            </Badge>
            <Badge variant={plan.is_active ? "secondary" : "outline"}>
              {plan.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {localError ? <ActionNotice tone="error" message={localError} /> : null}

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
              setDraft((current) => ({ ...current, code: event.target.value }))
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
                currency: event.target.value,
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
        </div>

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

        <div className="flex items-center justify-between rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--fom-ink)]">
              Show on platform pricing surfaces
            </p>
            <p className="text-xs text-muted-foreground">
              Inactive plans stay hidden from public pricing and new selection lists.
            </p>
          </div>
          <Switch
            checked={draft.is_active}
            onCheckedChange={(checked) =>
              setDraft((current) => ({ ...current, is_active: checked }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--fom-ink)]">Plan items</p>
              <p className="text-xs text-muted-foreground">
                These rows drive both the public pricing cards and the owner-facing plan catalog.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addItem}>
              <PlusIcon data-icon="inline-start" />
              Add item
            </Button>
          </div>

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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Collected revenue: {formatCurrency(plan.collected_revenue, plan.currency)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete plan
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              <SparklesIcon data-icon="inline-start" />
              Save plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreatePlanCard({
  onCompleted,
}: {
  onCompleted: (result: PlatformPlanActionResult) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<PlanDraft>(() => toDraft())
  const [localError, setLocalError] = useState<string | null>(null)

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

  function handleCreate() {
    const validationError = validateDraft(draft)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)

    startTransition(async () => {
      const result = await createPlatformPlanAction(buildPayload(draft))
      onCompleted(result)
      if (result.ok) {
        setDraft(toDraft())
        router.refresh()
      }
    })
  }

  return (
    <Card className="border border-dashed border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
      <CardHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
        <CardTitle>Create plan</CardTitle>
        <CardDescription>
          Add a new plan to the commercial catalog and define exactly which items show as available or unavailable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {localError ? <ActionNotice tone="error" message={localError} /> : null}

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
              setDraft((current) => ({ ...current, code: event.target.value }))
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
                currency: event.target.value,
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
        </div>

        <Textarea
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Short commercial summary."
          rows={3}
        />

        <div className="flex items-center justify-between rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--fom-ink)]">Active on pricing</p>
            <p className="text-xs text-muted-foreground">
              Turn this off if the plan should stay hidden until launch.
            </p>
          </div>
          <Switch
            checked={draft.is_active}
            onCheckedChange={(checked) =>
              setDraft((current) => ({ ...current, is_active: checked }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--fom-ink)]">Items</p>
              <p className="text-xs text-muted-foreground">
                Define the exact list the user sees on the plan card.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addItem}>
              <PlusIcon data-icon="inline-start" />
              Add item
            </Button>
          </div>
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
        </div>

        <Button type="button" onClick={handleCreate} disabled={isPending}>
          <PlusIcon data-icon="inline-start" />
          Create plan
        </Button>
      </CardContent>
    </Card>
  )
}

export function PlatformPlanCatalogEditor({
  plans,
}: PlatformPlanCatalogEditorProps) {
  const [result, setResult] = useState<PlatformPlanActionResult | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {result ? (
        result.ok ? (
          <ActionNotice tone="success" message={result.message} />
        ) : (
          <ActionNotice tone="error" message={result.message} />
        )
      ) : null}

      <CreatePlanCard onCompleted={setResult} />

      <div className="grid gap-4">
        {plans.map((plan) => (
          <EditablePlanCard key={plan.id} plan={plan} onCompleted={setResult} />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheckIcon className="h-4 w-4 text-emerald-600" />
              Available items
            </CardTitle>
            <CardDescription>
              Rendered as included capabilities on the marketing page and plan catalog.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleSlash2Icon className="h-4 w-4 text-muted-foreground" />
              Unavailable items
            </CardTitle>
            <CardDescription>
              Rendered as intentionally missing or upgrade-only items for that plan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

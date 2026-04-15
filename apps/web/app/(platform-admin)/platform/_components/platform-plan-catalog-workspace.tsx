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
import {
  BadgeCheckIcon,
  CircleSlash2Icon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import type { PlatformSettingsPlan } from "@/lib/platform/api"
import { PlatformDataTable } from "@/components/platform/platform-data-table"
import { formatCurrency } from "@/lib/platform/format"
import {
  createPlatformPlanAction,
  deletePlatformPlanAction,
  updatePlatformPlanAction,
  type PlatformPlanActionResult,
  type PlatformPlanEditorInput,
  type PlatformPlanLimitInput,
  type PlatformPlanItemInput,
} from "../settings/actions"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
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
  limits: PlanDraftLimit[]
}

type PlanDraftLimit = {
  id: string
  code: string
  label: string
  description: string
  value: string
  sort_order: number
}

type PlatformPlanCatalogWorkspaceProps = {
  plans: PlatformSettingsPlan[]
}

const planLimitCodes = {
  activeStaffMembers: "team.active_staff_members",
} as const

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
      sort_order: "0",
      items: [createEmptyItem(0)],
      limits: [createEmptyLimit(0)],
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
    items: plan.items.map((item, index) => ({
      id: item.id,
      code: item.code,
      label: item.label,
      description: item.description ?? "",
      availability_status:
        item.availability_status === "unavailable" ? "unavailable" : "available",
      sort_order: item.sort_order ?? index,
    })),
    limits:
      plan.limits.length > 0
        ? plan.limits.map((limit, index) => ({
            id: limit.id,
            code: limit.code,
            label: limit.label,
            description: limit.description ?? "",
            value: limit.value === null ? "" : String(limit.value),
            sort_order: limit.sort_order ?? index,
          }))
        : [createEmptyLimit(0)],
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
    return "Add at least one plan item before saving."
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
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.7fr_auto]">
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
          placeholder="Optional explanation shown in the plan workspace."
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

function PlanMetadataForm({
  draft,
  setDraft,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
}) {
  return (
    <>
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
    </>
  )
}

function PlanItemsEditor({
  draft,
  setDraft,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
}) {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--fom-ink)]">Plan items</p>
          <p className="text-xs text-muted-foreground">
            These rows drive both the public pricing cards and the runtime feature catalog.
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
  )
}

function PlanLimitsEditor({
  draft,
  setDraft,
}: {
  draft: PlanDraft
  setDraft: Dispatch<SetStateAction<PlanDraft>>
}) {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--fom-ink)]">Plan limits</p>
          <p className="text-xs text-muted-foreground">
            Use numeric limits for quota-style restrictions such as active staff seats.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addLimit}>
          <PlusIcon data-icon="inline-start" />
          Add limit
        </Button>
      </div>

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
    </div>
  )
}

function PlanFormSheet({
  mode,
  plan,
  open,
  onOpenChange,
  onCompleted,
}: {
  mode: "create" | "edit"
  plan: PlatformSettingsPlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: (result: PlatformPlanActionResult) => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draft, setDraft] = useState<PlanDraft>(() => toDraft(plan ?? undefined))
  const [localError, setLocalError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    if (!open) {
      return
    }

    setDraft(toDraft(plan ?? undefined))
    setLocalError(null)
    setActiveTab("details")
  }, [open, plan])

  const itemBreakdown = useMemo(() => {
    const available = draft.items.filter(
      (item) => item.availability_status === "available"
    ).length
    const unavailable = draft.items.filter(
      (item) => item.availability_status === "unavailable"
    ).length

    return {
      available,
      unavailable,
      limits: normalizePlanLimits(draft.limits).length,
    }
  }, [draft.items, draft.limits])

  function handleSubmit() {
    const validationError = validateDraft(draft)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPlatformPlanAction(buildPayload(draft))
          : plan
            ? await updatePlatformPlanAction(plan.id, buildPayload(draft))
            : {
                ok: false as const,
                message: "Plan context is missing.",
              }

      onCompleted(result)
      if (result.ok) {
        onOpenChange(false)
        router.refresh()
      }
    })
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

    startTransition(async () => {
      const result = await deletePlatformPlanAction(plan.id)
      onCompleted(result)
      if (result.ok) {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  const title = mode === "create" ? "Create plan" : `Edit ${plan?.name ?? "plan"}`
  const description =
    mode === "create"
      ? "Add a subscription plan, define its feature matrix, and set quota-style restrictions."
      : "Adjust pricing, public availability, runtime feature items, and numeric limits."

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] sm:max-w-[960px]"
      >
        <SheetHeader className="border-b border-[var(--fom-border-subtle)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {itemBreakdown.available} available / {itemBreakdown.unavailable} unavailable
              </Badge>
              <Badge variant="outline">{itemBreakdown.limits} limits</Badge>
              {plan ? <Badge variant="outline">{plan.shop_count} shops</Badge> : null}
              <Badge
                variant={
                  mode === "edit" && plan?.is_active ? "secondary" : "outline"
                }
              >
                {mode === "edit" && plan?.is_active ? "Active" : "Draft"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {localError ? <ActionNotice tone="error" message={localError} /> : null}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1">
            <TabsList variant="line" className="w-full justify-start gap-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Feature items</TabsTrigger>
              <TabsTrigger value="limits">Limits</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-5">
              <div className="space-y-5">
                {plan ? (
                  <div className="rounded-2xl border border-[var(--fom-border-subtle)] bg-[var(--fom-admin-surface)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--fom-ink)]">
                      Current commercial footprint
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.shop_count} subscribed shops · Collected revenue{" "}
                      {formatCurrency(plan.collected_revenue, plan.currency)}
                    </p>
                  </div>
                ) : null}
                <PlanMetadataForm draft={draft} setDraft={setDraft} />
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-5">
              <PlanItemsEditor draft={draft} setDraft={setDraft} />
            </TabsContent>

            <TabsContent value="limits" className="mt-5">
              <PlanLimitsEditor draft={draft} setDraft={setDraft} />
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="border-t border-[var(--fom-border-subtle)] bg-muted/10">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {mode === "create" ? "Create plan" : "Save changes"}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function PlatformPlanCatalogWorkspace({
  plans,
}: PlatformPlanCatalogWorkspaceProps) {
  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (left, right) =>
          left.sort_order - right.sort_order || left.name.localeCompare(right.name)
      ),
    [plans]
  )
  const [result, setResult] = useState<PlatformPlanActionResult | null>(null)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const selectedPlan =
    sortedPlans.find((plan) => plan.id === selectedPlanId) ?? null

  function openCreate() {
    setEditorMode("create")
    setSelectedPlanId(null)
    setEditorOpen(true)
  }

  function openEdit(planId: string) {
    setEditorMode("edit")
    setSelectedPlanId(planId)
    setEditorOpen(true)
  }

  return (
    <div className="space-y-4">
      {result ? (
        result.ok ? (
          <ActionNotice tone="success" message={result.message} />
        ) : (
          <ActionNotice tone="error" message={result.message} />
        )
      ) : null}

      <PlatformDataTable
        title="Plan catalog"
        description="Review pricing, runtime access, and quota restrictions without opening every plan inline."
        rows={sortedPlans}
        emptyMessage="No subscription plans are configured yet."
        footer={`Showing ${sortedPlans.length} plan${sortedPlans.length === 1 ? "" : "s"}`}
        toolbar={
          <Button type="button" size="sm" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Create plan
          </Button>
        }
        columns={[
          {
            key: "plan",
            header: "Plan",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  <Badge variant={plan.is_active ? "secondary" : "outline"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {plan.code}
                  {plan.description ? ` · ${plan.description}` : ""}
                </span>
              </div>
            ),
          },
          {
            key: "billing",
            header: "Billing",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(plan.price, plan.currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {plan.billing_period} · sort {plan.sort_order}
                </span>
              </div>
            ),
          },
          {
            key: "features",
            header: "Features",
            render: (plan) => {
              const availableItems = plan.items.filter(
                (item) => item.availability_status === "available"
              ).length
              const unavailableItems = plan.items.filter(
                (item) => item.availability_status === "unavailable"
              ).length

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <BadgeCheckIcon className="size-4 text-emerald-600" />
                    <span>{availableItems} enabled</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CircleSlash2Icon className="size-3.5" />
                    <span>{unavailableItems} unavailable</span>
                  </div>
                </div>
              )
            },
          },
          {
            key: "limits",
            header: "Limits",
            render: (plan) => {
              const staffSeatLimit = plan.limits.find(
                (limit) => limit.code === planLimitCodes.activeStaffMembers
              )

              return (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-foreground">
                    {staffSeatLimit
                      ? staffSeatLimit.value === null
                        ? "Unlimited staff seats"
                        : staffSeatLimit.value === 0
                          ? "Owner only"
                          : `${staffSeatLimit.value} staff seats`
                      : "No numeric limits"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {plan.limits.length} configured limit
                    {plan.limits.length === 1 ? "" : "s"}
                  </span>
                </div>
              )
            },
          },
          {
            key: "usage",
            header: "Usage",
            render: (plan) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground">
                  {plan.shop_count} subscribed shop{plan.shop_count === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Revenue {formatCurrency(plan.collected_revenue, plan.currency)}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-[120px] px-4 py-2.5 text-right",
            cellClassName: "px-4 py-3 text-right",
            render: (plan) => (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEdit(plan.id)}
              >
                <PencilLineIcon data-icon="inline-start" />
                Edit
              </Button>
            ),
          },
        ]}
      />

      <PlanFormSheet
        mode={editorMode}
        plan={selectedPlan}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onCompleted={setResult}
      />
    </div>
  )
}

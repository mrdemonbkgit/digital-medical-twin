# Component Library

> Last Updated: 2025-11-26

## Summary

Reusable React components for Digital Medical Twin. Documents component APIs, usage patterns, and composition guidelines. Check here before creating new components.

## Keywords

`components` `react` `ui` `library` `patterns` `reusable` `props`

## Table of Contents

- [Component Categories](#component-categories)
- [Common Components](#common-components)
- [Event Components](#event-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Composition Patterns](#composition-patterns)

---

## Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Common | `src/components/common/` | Buttons, inputs, modals |
| Event | `src/components/event/` | Event cards, forms, lists |
| Timeline | `src/components/timeline/` | Timeline layout, filters |
| AI | `src/components/ai/` | Chat interface, messages |
| Layout | `src/components/layout/` | Page layouts, navigation |

---

## Common Components

### Button

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Usage
<Button variant="primary" size="md" onClick={handleSave}>
  Save Event
</Button>

<Button variant="danger" loading={isDeleting}>
  Delete
</Button>
```

### Input

```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

// Usage
<Input
  type="text"
  label="Event Title"
  value={title}
  onChange={setTitle}
  error={errors.title}
  required
/>
```

### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Usage
<Modal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Add Event"
  footer={
    <>
      <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  }
>
  <EventForm />
</Modal>
```

### Select

```typescript
interface SelectProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  error?: string;
  required?: boolean;
}

// Usage
<Select
  label="Event Type"
  value={eventType}
  onChange={setEventType}
  options={[
    { value: 'lab_result', label: 'Lab Result' },
    { value: 'doctor_visit', label: 'Doctor Visit' },
  ]}
/>
```

---

## Event Components

### EventCard

```typescript
interface EventCardProps {
  event: HealthEvent;
  isExpanded?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Usage
<EventCard
  event={event}
  isExpanded={expandedId === event.id}
  onToggle={() => toggleExpanded(event.id)}
  onEdit={() => openEditModal(event)}
  onDelete={() => confirmDelete(event.id)}
/>
```

### EventForm

```typescript
interface EventFormProps {
  eventType: EventType;
  initialData?: Partial<HealthEvent>;
  onSubmit: (data: CreateEventRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Usage
<EventForm
  eventType="lab_result"
  initialData={editingEvent}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={isSaving}
/>
```

### EventTypeSelector

```typescript
interface EventTypeSelectorProps {
  value: EventType | null;
  onChange: (type: EventType) => void;
}

// Displays color-coded event type buttons
<EventTypeSelector
  value={selectedType}
  onChange={setSelectedType}
/>
```

### BiomarkerInput

```typescript
interface BiomarkerInputProps {
  biomarkers: Biomarker[];
  onChange: (biomarkers: Biomarker[]) => void;
}

// Handles adding/removing/editing biomarkers
<BiomarkerInput
  biomarkers={biomarkers}
  onChange={setBiomarkers}
/>
```

---

## Form Components

### DatePicker

```typescript
interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
}

// Usage
<DatePicker
  label="Event Date"
  value={eventDate}
  onChange={setEventDate}
  maxDate={new Date()} // No future dates
/>
```

### DateRangePicker

```typescript
interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChangeStart: (date: Date | null) => void;
  onChangeEnd: (date: Date | null) => void;
}

// Usage
<DateRangePicker
  startDate={filters.startDate}
  endDate={filters.endDate}
  onChangeStart={(d) => setFilters({ ...filters, startDate: d })}
  onChangeEnd={(d) => setFilters({ ...filters, endDate: d })}
/>
```

### TagInput

```typescript
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

// Usage
<TagInput
  tags={eventTags}
  onChange={setEventTags}
  suggestions={existingTags}
  placeholder="Add tags..."
/>
```

---

## Layout Components

### PageLayout

```typescript
interface PageLayoutProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

// Usage
<PageLayout
  title="Timeline"
  actions={<Button onClick={openAddModal}>+ Add Event</Button>}
>
  <Timeline events={events} />
</PageLayout>
```

### Sidebar

```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Usage
<Sidebar isOpen={showFilters} onClose={() => setShowFilters(false)}>
  <FilterPanel filters={filters} onChange={setFilters} />
</Sidebar>
```

### EmptyState

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

// Usage
<EmptyState
  icon={<CalendarIcon />}
  title="No events yet"
  description="Start logging your health journey"
  action={<Button onClick={openAddModal}>Add First Event</Button>}
/>
```

---

## Composition Patterns

### Compound Components

```typescript
// Card with subcomponents
<Card>
  <Card.Header>
    <Card.Title>Event Title</Card.Title>
    <Card.Actions>...</Card.Actions>
  </Card.Header>
  <Card.Body>
    Content here
  </Card.Body>
  <Card.Footer>
    Footer content
  </Card.Footer>
</Card>
```

### Render Props

```typescript
// When children need access to internal state
<Expandable>
  {({ isExpanded, toggle }) => (
    <div>
      <button onClick={toggle}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      {isExpanded && <Content />}
    </div>
  )}
</Expandable>
```

### Controlled vs Uncontrolled

```typescript
// Controlled: parent manages state
<Input value={name} onChange={setName} />

// Uncontrolled: component manages state
<Input defaultValue="Initial" ref={inputRef} />

// Prefer controlled for forms that need validation
```

---

## Related Documents

- /docs/development/CODING_STANDARDS.md — Code conventions
- /docs/development/STATE_MANAGEMENT.md — State patterns
- /docs/features/TIMELINE.md — Timeline components usage

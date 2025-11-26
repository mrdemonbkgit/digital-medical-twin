# State Management

> Last Updated: 2025-11-26

## Summary

State management architecture for Digital Medical Twin. Uses React Context for global state and local state for component-specific needs. Covers context structure, state patterns, and data flow.

## Keywords

`state` `context` `react` `management` `data` `flow` `hooks` `global`

## Table of Contents

- [State Architecture](#state-architecture)
- [Context Providers](#context-providers)
- [State Patterns](#state-patterns)
- [Data Flow](#data-flow)
- [Performance Considerations](#performance-considerations)

---

## State Architecture

### State Categories

| Category | Location | Examples |
|----------|----------|----------|
| Global | React Context | User session, events data, AI config |
| Page | Page component | Filters, pagination, modals |
| Component | Local state | Form inputs, expanded state |
| Server | API/Database | Persisted health events |

### Context Structure

```
<AuthProvider>           // User session, login state
  <EventsProvider>       // Health events, CRUD operations
    <AIProvider>         // AI config, chat history
      <App />
    </AIProvider>
  </EventsProvider>
</AuthProvider>
```

---

## Context Providers

### AuthContext

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string) => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

// Usage
const { user, isAuthenticated, login, logout } = useAuth();
```

### EventsContext

```typescript
interface EventsState {
  events: HealthEvent[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    hasMore: boolean;
  };
}

interface EventsActions {
  fetchEvents: (filters?: TimelineFilters) => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<HealthEvent>;
  updateEvent: (id: string, data: UpdateEventRequest) => Promise<HealthEvent>;
  deleteEvent: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

type EventsContextValue = EventsState & EventsActions;

// Usage
const { events, isLoading, createEvent, deleteEvent } = useEvents();
```

### AIContext

```typescript
interface AIState {
  provider: 'openai' | 'google';
  model: string;
  isConfigured: boolean;
  chatHistory: ChatMessage[];
  isProcessing: boolean;
}

interface AIActions {
  configure: (settings: AISettings) => void;
  sendMessage: (message: string) => Promise<string>;
  clearHistory: () => void;
}

type AIContextValue = AIState & AIActions;

// Usage
const { isConfigured, sendMessage, chatHistory } = useAI();
```

---

## State Patterns

### Context Provider Pattern

```typescript
// contexts/EventsContext.tsx

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, initialState);

  const actions = useMemo(() => ({
    fetchEvents: async (filters?: TimelineFilters) => {
      dispatch({ type: 'FETCH_START' });
      try {
        const events = await api.getEvents(filters);
        dispatch({ type: 'FETCH_SUCCESS', payload: events });
      } catch (error) {
        dispatch({ type: 'FETCH_ERROR', payload: error });
      }
    },
    // ... other actions
  }), []);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return context;
}
```

### Reducer Pattern

```typescript
// For complex state with multiple actions

type EventsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: HealthEvent[] }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'ADD_EVENT'; payload: HealthEvent }
  | { type: 'UPDATE_EVENT'; payload: HealthEvent }
  | { type: 'DELETE_EVENT'; payload: string };

function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, events: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
      };
    default:
      return state;
  }
}
```

### Local State Pattern

```typescript
// For component-specific state

function EventCard({ event }: EventCardProps) {
  // UI state - local
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state - local
  const [formData, setFormData] = useState(event);

  // Global state - context
  const { updateEvent, deleteEvent } = useEvents();

  // ...
}
```

---

## Data Flow

### Read Flow

```
Component
    │
    ▼
useEvents() hook
    │
    ▼
EventsContext (state)
    │
    ▼
Render with events data
```

### Write Flow

```
User Action (e.g., save event)
    │
    ▼
Component calls context action
    │
    ▼
Context action calls API
    │
    ▼
API returns response
    │
    ▼
Context updates state (dispatch)
    │
    ▼
Components re-render with new state
```

### Optimistic Updates

```typescript
// For better UX, update UI before API confirms

const deleteEvent = async (id: string) => {
  // Optimistically remove from UI
  dispatch({ type: 'DELETE_EVENT', payload: id });

  try {
    await api.deleteEvent(id);
  } catch (error) {
    // Rollback on failure
    dispatch({ type: 'ROLLBACK_DELETE', payload: id });
    throw error;
  }
};
```

---

## Performance Considerations

### Context Splitting

Split contexts to prevent unnecessary re-renders:

```typescript
// DON'T: One massive context
<AppContext.Provider value={{ user, events, ai, ui }}>

// DO: Separate contexts for separate concerns
<AuthProvider>
  <EventsProvider>
    <AIProvider>
```

### Memoization

```typescript
// Memoize context value to prevent re-renders
const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

// Memoize expensive computations
const filteredEvents = useMemo(
  () => events.filter(e => matchesFilters(e, filters)),
  [events, filters]
);

// Memoize callbacks passed to children
const handleDelete = useCallback(
  (id: string) => deleteEvent(id),
  [deleteEvent]
);
```

### Selective Subscriptions

```typescript
// Custom hooks for specific slices of state
function useEventById(id: string) {
  const { events } = useEvents();
  return useMemo(
    () => events.find(e => e.id === id),
    [events, id]
  );
}
```

---

## Related Documents

- /docs/development/CODING_STANDARDS.md — Code patterns
- /docs/development/COMPONENT_LIBRARY.md — Component composition
- /docs/architecture/SYSTEM_OVERVIEW.md — Overall architecture

# Component Testing with Vitest Browser Mode

- File naming: `*.test.tsx` — these are automatically routed to the browser project
- React Strict Mode is **enabled**
- Run with `pnpm test:component`

## Writing Tests

### Rendering

```tsx
import { render } from "vitest-browser-react";

const screen = await render(<MyComponent prop="value" />);
```

`render()` is **async** — always `await` it. Returns a locator-scoped screen object. Cleanup is automatic before each render.

### Querying Elements

Prefer accessible queries. These return **locators** with built-in retry.

```tsx
screen.getByRole("button", { name: /submit/i });
screen.getByText("ㄱ");
screen.getByLabelText(/email/i);
screen.getByTestId("token-0");
```

For regex-based selectors that match multiple elements, use `.elements()` to get the raw array:

```tsx
expect(screen.getByTestId(/^token-/).elements().length).toBe(3);
```

Note: `.elements()` returns synchronously. Ensure the parent container has already rendered (e.g. via a prior `await expect.element()`) before counting.

### Assertions

Use `expect.element()` — it **auto-retries** until the assertion passes or times out. No `waitFor` needed.

```tsx
await expect.element(screen.getByText("ㄱ")).toBeVisible();
await expect.element(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
await expect.element(screen.getByText("Error")).not.toBeInTheDocument();
```

### Interactions

Locators expose real browser actions via CDP — not synthetic JS events.

```tsx
await screen.getByRole("button", { name: /rotate/i }).click();
await screen.getByRole("textbox").fill("가나다");
await userEvent.keyboard("{Tab}");
await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
```

### Testing Hooks

```tsx
import { renderHook } from "vitest-browser-react";

const { result, act } = await renderHook(() => useMyHook());
await act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

## Cookbook

### Wrapping with Providers

Components that read from `useGame()` need a `GameProvider` wrapper. Create a file-local render helper:

```tsx
import { render } from "vitest-browser-react";
import { GameProvider } from "../../context/game/GameContext";
import { createInitialGameState } from "../../context/game/game-reducer";
import { createWord } from "../../lib/word";

async function renderMyComponent(word: string) {
  const gameState = createInitialGameState(createWord(word)!);
  return render(
    <GameProvider initialState={gameState}>
      <MyComponent />
    </GameProvider>,
  );
}
```

### Asserting Dispatch Calls

Pass a `vi.fn()` dispatch and assert on it after interaction. Type the mock when asserting specific action shapes:

```tsx
const dispatch = vi.fn<(action: GameAction) => void>();
const screen = await render(<Token tile={tile} dispatch={dispatch} />);
await screen.getByTestId("token-0").click();
expect(dispatch).toHaveBeenCalledWith({
  type: "CHARACTER_ROTATE_NEXT",
  payload: { tileId: 0 },
});
```

Use `expect.objectContaining` for negative assertions that only care about the action type:

```tsx
expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "CHARACTER_COMPOSE" }));
```

### Drag and Drop (Pointer Events)

Components use pointer-event-based drag (`onPointerDown`/`onPointerMove`/`onPointerUp`) with `setPointerCapture` and `elementsFromPoint`. The locator `dropTo()` method won't work — dispatch synthetic `PointerEvent`s instead via a helper:

```tsx
function pointerSequence(
  element: HTMLElement,
  events: Array<{ type: string; clientX: number; clientY: number }>,
) {
  for (const { type, clientX, clientY } of events) {
    element.dispatchEvent(
      new PointerEvent(type, {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        isPrimary: true,
      }),
    );
  }
}
```

Typical drag sequence — get the target's center via `getBoundingClientRect()`, then:

```tsx
pointerSequence(sourceElement, [
  { type: "pointerdown", clientX: 0, clientY: 0 },
  { type: "pointermove", clientX: 10, clientY: 0 }, // exceed 4px drag threshold
  { type: "pointermove", clientX: targetCenterX, clientY: targetCenterY },
  { type: "pointerup", clientX: targetCenterX, clientY: targetCenterY },
]);
```

To assert intermediate drag state (e.g. `data-drag-over`), omit `pointerup` and assert before sending it separately.

### Waiting for Async State

`expect.element()` retries automatically, so just assert the final state:

```tsx
await screen.getByRole("button", { name: /submit/i }).click();
await expect.element(screen.getByText("Success")).toBeVisible();
```

### Checking CSS / Visual State

Browser mode renders real CSS, so you can assert on computed styles:

```tsx
const el = screen.getByTestId("token-0");
const element = el.element();
const computedStyles = getComputedStyle(element);
expect(computedStyles.opacity).toBe("0.5");
```

#### CSS Modules class names

CSS Modules mangles class names at build time, so never match against raw strings like `"shaking"`. Import the module and use its values:

```tsx
import styles from "./Token.module.css";

// ✅ matches the mangled class name
await expect.element(screen.getByTestId("token-0")).toHaveClass(styles.shaking);

// ❌ will never match — raw name doesn't exist at runtime
expect(element.className).toContain("shaking");
```

Use `expect.element().toHaveClass()` rather than synchronous `className` checks — it auto-retries, which handles React state updates that add the class after a re-render.

### Testing Keyboard Navigation

```tsx
await screen.getByRole("button", { name: /first/i }).click(); // focus
await userEvent.keyboard("{Tab}");
await expect.element(screen.getByRole("button", { name: /second/i })).toHaveFocus();
```

## Key Differences from @testing-library/react

| @testing-library/react (jsdom)            | vitest-browser-react (real browser)        |
| ----------------------------------------- | ------------------------------------------ |
| `render()` is synchronous                 | `render()` is `async` — always `await`     |
| `screen.getByX()` returns `HTMLElement`   | Returns a **locator** with retry + actions |
| `fireEvent.click()` / `userEvent.click()` | `locator.click()` via CDP                  |
| `waitFor(() => expect(...))`              | `await expect.element(...)` auto-retries   |
| Simulated DOM via jsdom                   | Real Chromium rendering                    |
| Cannot test CSS layout                    | Full CSS / layout / paint                  |

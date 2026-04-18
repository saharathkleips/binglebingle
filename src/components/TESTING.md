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
page.getByTestId("token-0");
```

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

```tsx
import { render } from "vitest-browser-react";
import { GameProvider } from "../../context/game";

const screen = await render(
  <GameProvider initialState={mockState}>
    <MyComponent />
  </GameProvider>,
);
```

For repeated wrapping, create a helper:

```tsx
function renderWithGame(ui: React.ReactElement, state = defaultState) {
  return render(<GameProvider initialState={state}>{ui}</GameProvider>);
}
```

### Asserting Dispatch Calls

Pass a `vi.fn()` dispatch and assert on it after interaction:

```tsx
const dispatch = vi.fn();
const screen = await render(<Token tile={tile} dispatch={dispatch} />);
await screen.getByTestId("token-0").click();
expect(dispatch).toHaveBeenCalledWith({
  type: "CHARACTER_ROTATE_NEXT",
  payload: { tileId: 0 },
});
```

### Drag and Drop

Browser mode uses real pointer events — no need to mock `elementsFromPoint`:

```tsx
const token = screen.getByTestId("token-0");
const slot = screen.getByTestId("slot-1");

await token.dragTo(slot);
```

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
const styles = getComputedStyle(element);
expect(styles.opacity).toBe("0.5");
```

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

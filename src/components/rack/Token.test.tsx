import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Token } from "./Token";
import { character } from "../../lib/character";
import type { Tile, GameAction } from "../../context/game";

function tile(id: number, char: ReturnType<typeof character>): Tile {
  return { id, character: char! };
}

describe("Token", () => {
  it("displays the resolved character", () => {
    const dispatch = vi.fn();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    expect(screen.getByTestId("token-0").textContent).toBe("ㄱ");
  });

  it("dispatches CHARACTER_ROTATE_NEXT on tap when rotatable", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    render(<Token tile={tile(0, character({ choseong: "ㄱ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-0"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_ROTATE_NEXT",
      payload: { tileId: 0 },
    });
  });

  it("dispatches CHARACTER_DECOMPOSE on tap when decomposable but not rotatable", () => {
    const dispatch = vi.fn<(action: GameAction) => void>();
    // ㄲ is a double consonant — not rotatable but decomposable into ㄱ+ㄱ
    render(<Token tile={tile(1, character({ choseong: "ㄲ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-1"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "CHARACTER_DECOMPOSE",
      payload: { tileId: 1 },
    });
  });

  it("does not dispatch on tap when inert", () => {
    const dispatch = vi.fn();
    // ㅁ is not rotatable and not decomposable
    render(<Token tile={tile(2, character({ choseong: "ㅁ" }))} dispatch={dispatch} />);
    fireEvent.click(screen.getByTestId("token-2"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

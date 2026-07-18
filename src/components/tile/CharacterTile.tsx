/**
 * @file CharacterTile.tsx
 *
 * Character-aware wrapper for the shared tile visual primitive.
 */

import type { Character } from "../../lib/character";
import { resolveCharacter } from "../../lib/character";
import { BaseTile } from "./BaseTile";
import type { BaseTileProps } from "./BaseTile";

/** Removes caller-provided children from each BaseTile variant before CharacterTile resolves its own text. */
type BaseTilePropsWithoutChildren<Props> = Props extends unknown ? Omit<Props, "children"> : never;

/** Props for the character-aware tile wrapper. */
export type CharacterTileProps = BaseTilePropsWithoutChildren<BaseTileProps> & {
  /** Game character resolved here so BaseTile can remain presentation-only. */
  character: Character;
};

/**
 * Resolves a game Character and renders it with the shared tile surface.
 *
 * @param props - Visual tile props plus the Character to display.
 */
export function CharacterTile({ character, ...visualProps }: CharacterTileProps) {
  return <BaseTile {...visualProps}>{resolveCharacter(character) ?? ""}</BaseTile>;
}

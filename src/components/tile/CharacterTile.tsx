/**
 * @file CharacterTile.tsx
 *
 * Character-aware wrapper for the shared tile visual primitive.
 */

import type { Character } from "../../lib/character";
import { resolveCharacter } from "../../lib/character";
import { BaseTile } from "./BaseTile";
import type { BaseTileProps } from "./BaseTile";

type BaseTilePropsWithoutChildren<Props> = Props extends unknown ? Omit<Props, "children"> : never;

export type CharacterTileProps = BaseTilePropsWithoutChildren<BaseTileProps> & {
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

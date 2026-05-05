/**
 * @file register.ts
 *
 * One-time GSAP plugin registration. Import from this file (not directly
 * from "gsap") to guarantee Draggable is registered before use.
 */

import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Draggable, useGSAP);

export { gsap, Draggable, useGSAP };

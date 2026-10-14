import type { ComponentProps } from "react";
import { PATH_EV, PATH_J_DOT, PATH_J_STEM, WORDMARK_TRANSFORM } from "./paths";

type SvgProps = Omit<ComponentProps<"svg">, "viewBox" | "children">;

/*
 * Letters are drawn in `currentColor`, so set the ink with a text-* class.
 * The j's dot is always the brand amber.
 */

function Wordmark() {
  return (
    <g transform={WORDMARK_TRANSFORM}>
      <path fill="currentColor" d={`${PATH_EV} ${PATH_J_STEM}`} />
      <path fill="var(--brand-mark)" d={PATH_J_DOT} />
    </g>
  );
}

/** "jev" wordmark. Used in the expanded sidebar. */
export function JevWordmark(props: SvgProps) {
  return (
    <svg viewBox="0 0 556 294" role="img" aria-label="JEV" {...props}>
      <Wordmark />
    </svg>
  );
}

/** The "j" alone, framed square. Used in the collapsed sidebar. */
export function JevMark(props: SvgProps) {
  return (
    <svg viewBox="-80 2 290 290" role="img" aria-label="JEV" {...props}>
      <g transform={WORDMARK_TRANSFORM}>
        <path fill="currentColor" d={PATH_J_STEM} />
        <path fill="var(--brand-mark)" d={PATH_J_DOT} />
      </g>
    </svg>
  );
}

const ICON_STROKE = "#937A5A";
const ICON_PAPER = "#F7EEDC";
const CALCULATOR = "#E89E1C";
const CALCULATOR_FACE = "#FFF3DC";

/**
 * Wordmark + document/calculator icon + tagline. Used on the auth brand panel.
 * The calculator's cut-out stroke uses `--brand-panel` so it blends into the
 * panel it sits on.
 */
export function JevLogo(props: SvgProps) {
  return (
    <svg viewBox="0 0 1046 380" role="img" aria-label="JEV" {...props}>
      <g transform="translate(8,0) scale(1.06)">
        <Wordmark />
      </g>

      <path
        d="M722 26 H893 L956 89 V272 Q956 298 930 298 H722 Q696 298 696 272 V52 Q696 26 722 26 Z"
        fill={ICON_PAPER}
        stroke={ICON_STROKE}
        strokeWidth={18}
        strokeLinejoin="round"
      />
      <path
        d="M893 26 V68 Q893 89 914 89 H956"
        fill="none"
        stroke={ICON_STROKE}
        strokeWidth={18}
        strokeLinejoin="round"
      />
      <rect x={744} y={90} width={118} height={18} rx={9} fill={ICON_STROKE} />
      <rect x={744} y={140} width={118} height={18} rx={9} fill={ICON_STROKE} />
      <rect x={744} y={190} width={90} height={18} rx={9} fill={ICON_STROKE} />

      <rect
        x={846}
        y={128}
        width={190}
        height={180}
        rx={28}
        fill={CALCULATOR}
        stroke="var(--brand-panel)"
        strokeWidth={10}
      />
      <rect x={876} y={158} width={130} height={42} rx={9} fill={CALCULATOR_FACE} />
      {[0, 1, 2].flatMap((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={878 + col * 46}
            y={222 + row * 42}
            width={34}
            height={28}
            rx={7}
            fill={CALCULATOR_FACE}
          />
        )),
      )}

      <text
        x={540}
        y={368}
        textAnchor="middle"
        fontSize={33}
        fontWeight={500}
        letterSpacing={8}
        fill="currentColor"
      >
        JOURNAL • TRIAL BALANCE • JOURNALS
      </text>
    </svg>
  );
}

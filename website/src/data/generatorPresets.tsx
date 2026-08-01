import type {ReactNode} from 'react';

/**
 * The eight presets, described the way the config schema describes them.
 *
 * Wording is condensed from the `preset` field's own Zod `.describe()` text in
 * `src/codegen/generators/**`, which is the single source of truth for what a
 * generator does. If a preset's purpose changes there, change it here too.
 *
 * This is the one place the preset icons live - the landing page, the docs
 * sidebar and the generator doc pages all render them from here, so they can't
 * drift apart.
 */
export type GeneratorPreset = {
  preset: string;
  blurb: string;
  href: string;
  /** Rendered inside a 24x24 viewBox, `currentColor` stroked. */
  icon: ReactNode;
};

export const GENERATOR_PRESETS: GeneratorPreset[] = [
  {
    preset: 'payloads',
    blurb:
      'Typed payload and message models that serialize straight into your wire format.',
    href: '/docs/generators/payloads',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 13h8M8 16h5" />
      </>
    )
  },
  {
    preset: 'parameters',
    blurb:
      'Parameter models that interpolate values into subjects, topics and URL paths.',
    href: '/docs/generators/parameters',
    icon: (
      <>
        <path d="M4 7h6M14 7h6M4 17h6M14 17h6" />
        <circle cx="12" cy="7" r="2.4" />
        <circle cx="12" cy="17" r="2.4" />
      </>
    )
  },
  {
    preset: 'headers',
    blurb:
      'Message header models, with optional runtime validation of what arrives.',
    href: '/docs/generators/headers',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M7 14h4" />
      </>
    )
  },
  {
    preset: 'types',
    blurb:
      'Type aliases and enums derived from the constraints already in your document.',
    href: '/docs/generators/types',
    icon: (
      <>
        <path d="M4 6h16M12 6v13" />
        <path d="M8 19h8" />
      </>
    )
  },
  {
    preset: 'channels',
    blurb:
      'Protocol-specific publish, subscribe, request and reply functions per operation.',
    href: '/docs/generators/channels',
    icon: (
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.2 10.9 15.8 7.1M8.2 13.1l7.6 3.8" />
      </>
    )
  },
  {
    preset: 'client',
    blurb:
      'One class wrapping the channel functions, with connection handling built in.',
    href: '/docs/generators/client',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    )
  },
  {
    preset: 'models',
    blurb:
      'Plain typed models via Modelina, with none of the messaging machinery.',
    href: '/docs/generators/models',
    icon: (
      <>
        <path d="M12 3 21 8v8l-9 5-9-5V8z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    )
  },
  {
    preset: 'custom',
    blurb:
      'Your own render function, fed the parsed document and other generators’ output.',
    href: '/docs/generators/custom',
    icon: (
      <>
        <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
      </>
    )
  }
];

const BY_PRESET = new Map(
  GENERATOR_PRESETS.map((generator) => [generator.preset, generator])
);

export function getGeneratorPreset(preset: string): GeneratorPreset | undefined {
  return BY_PRESET.get(preset);
}

/**
 * The preset's icon, sized by whatever `font-size`/`width` the caller sets and
 * stroked in `currentColor`. Renders nothing for an unknown preset so a typo in
 * a doc's front matter degrades to "no icon" rather than a broken page.
 */
export function GeneratorIcon({preset}: {preset: string}): JSX.Element | null {
  const generator = getGeneratorPreset(preset);
  if (!generator) {
    return null;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {generator.icon}
    </svg>
  );
}

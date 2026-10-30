// Tailwind theme merged from the inline tailwind.config of every Stitch screen (all 15 were identical).
/** @type {import("tailwindcss").Config} */
export default {
  "darkMode": "class",
  "content": [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  "theme": {
    "extend": {
      "colors": {
        "background": "#faf8ff",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#eef0ff",
        "inverse-primary": "#b7c4ff",
        "inverse-surface": "#283044",
        "on-background": "#131b2e",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "on-primary-container": "#cad3ff",
        "on-primary-fixed": "#001551",
        "on-primary-fixed-variant": "#0039b5",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#465c7f",
        "on-secondary-fixed": "#001c3b",
        "on-secondary-fixed-variant": "#314769",
        "on-surface": "#131b2e",
        "on-surface-variant": "#434655",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffc9b7",
        "on-tertiary-fixed": "#390c00",
        "on-tertiary-fixed-variant": "#832700",
        "outline": "#747686",
        "outline-variant": "#c4c5d7",
        "primary": "#0037b0",
        "primary-container": "#1d4ed8",
        "primary-fixed": "#dce1ff",
        "primary-fixed-dim": "#b7c4ff",
        "secondary": "#495f82",
        "secondary-container": "#bfd5fe",
        "secondary-fixed": "#d5e3ff",
        "secondary-fixed-dim": "#b1c7f0",
        "surface": "#faf8ff",
        "surface-bright": "#faf8ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        "surface-container-low": "#f2f3ff",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#d2d9f4",
        "surface-tint": "#2151da",
        "surface-variant": "#dae2fd",
        "tertiary": "#7f2500",
        "tertiary-container": "#a73400",
        "tertiary-fixed": "#ffdbcf",
        "tertiary-fixed-dim": "#ffb59c"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "gutter": "1.5rem",
        "margin": "2rem",
        "space-2xl": "3rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-xl": "2rem"
      },
      "fontFamily": {
        "body-lg": [
          "Inter"
        ],
        "body-md": [
          "Inter"
        ],
        "body-sm": [
          "Inter"
        ],
        "currency-hero": [
          "IBM Plex Mono"
        ],
        "currency-md": [
          "IBM Plex Mono"
        ],
        "currency-sm": [
          "IBM Plex Mono"
        ],
        "display-lg": [
          "Inter"
        ],
        "display-lg-mobile": [
          "Inter"
        ],
        "headline-lg": [
          "Inter"
        ],
        "headline-md": [
          "Inter"
        ],
        "headline-sm": [
          "Inter"
        ],
        "label-md": [
          "Inter"
        ],
        "label-sm": [
          "Inter"
        ]
      },
      "fontSize": {
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "body-md": [
          "15px",
          {
            "lineHeight": "22px",
            "fontWeight": "400"
          }
        ],
        "body-sm": [
          "13px",
          {
            "lineHeight": "18px",
            "fontWeight": "400"
          }
        ],
        "currency-hero": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "currency-md": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "currency-sm": [
          "14px",
          {
            "lineHeight": "20px",
            "fontWeight": "500"
          }
        ],
        "display-lg": [
          "36px",
          {
            "lineHeight": "44px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "display-lg-mobile": [
          "28px",
          {
            "lineHeight": "36px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "headline-lg": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.015em",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-sm": [
          "18px",
          {
            "lineHeight": "24px",
            "fontWeight": "600"
          }
        ],
        "label-md": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.04em",
            "fontWeight": "600"
          }
        ],
        "label-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.02em",
            "fontWeight": "500"
          }
        ]
      }
    }
  },
  "plugins": []
};

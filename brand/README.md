# NeuroCheck — logo

The mark is a seven-point signal line: five segments, one peak. It is the
same shape the site draws in its charts, so the logo and the product read as
one thing.

## Files

| File | Use |
|---|---|
| `logo.svg` | Primary mark, rounded square on brand indigo. Default choice. |
| `logo-mark.svg` | Line only, transparent, `currentColor` — inherits the surrounding text colour. |
| `logo-alert.svg` | Mark with the amber peak dot. Favicon / app icon only. |
| `logo-wordmark.svg` | Mark + "NeuroCheck" for light backgrounds. |
| `logo-wordmark-dark.svg` | Same, for dark backgrounds. |
| `logo-*.png` | Raster exports, transparent background. Number = pixel width. |

Wordmark text is converted to outlines, so the SVGs render correctly
without Space Grotesk installed.

## Colours

| Token | Light | Dark |
|---|---|---|
| Brand indigo | `#3B3FA0` | `#8C90F0` |
| Line on mark | `#FAFAF7` | `#0C0E14` |
| Wordmark text | `#14171F` | `#ECEDF2` |
| Peak accent | `#C97A1F` | `#C97A1F` |

Typeface: **Space Grotesk Bold**, letter-spacing −0.022 em.

## Using it

Inline, so it inherits colour and never depends on an image host:

```html
<span class="brand-mark" aria-hidden="true">
  <svg viewBox="0 0 32 32" fill="none">
    <path d="M4 22 L10 14 L15 18 L21 7 L28 20" stroke="#FAFAF7"
          stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</span>
```

```css
.brand-mark {
  width: 30px; height: 30px; border-radius: 8px;
  background: #3B3FA0; display: grid; place-items: center;
}
.brand-mark svg { width: 20px; height: 20px; display: block; }
```

## Please don't

- Recolour the mark outside the palette above.
- Stretch it — the square is 1:1, the wordmark is 176:40.
- Set it below 24 px; use `logo-mark.svg` on its own if you need smaller.
- Add effects, outlines or shadows to the line.

Corner radius scales with the square: `rx` is 7/32 of the side.

/**
 * Contrast pairs measured against §3.1 semantic tokens (WCAG 2, sRGB approx).
 * Re-verify after any token change in BOTH appearances.
 *
 * Light:
 *   text-primary on surface     ~12.5:1
 *   text-secondary on surface   ~6.8:1
 *   text-tertiary on surface    ~4.8:1  (EXIF — do not lighten)
 *   accent on surface           ~6.8:1
 *   accent-on-fill on accent-fill ~5.2:1
 *
 * Dark:
 *   text-primary on surface     ~15.7:1
 *   text-secondary on surface   ~9.8:1
 *   text-tertiary on surface    ~7.1:1
 *   accent on surface           ~9.8:1
 */
export const CONTRAST_NOTES = true;

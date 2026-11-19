// Keyboard shortcuts for the video player.

export type ShortcutAction = 'toggle-play' | 'frame-back' | 'frame-forward' | 'seek-back' | 'seek-forward'

/** Which action a key does, or null if it is not a shortcut. */
export function shortcutForKey(key: string): ShortcutAction | null {
  switch (key) {
    case ' ':
      return 'toggle-play'
    case ',':
      return 'frame-back'
    case '.':
      return 'frame-forward'
    case 'ArrowLeft':
      return 'seek-back'
    case 'ArrowRight':
      return 'seek-forward'
    default:
      return null
  }
}

/** The bits of a DOM element we need, so tests can pass plain objects. */
export type TargetLike = { tagName: string; isContentEditable?: boolean } | null

/**
 * True when the user is typing in a field, so shortcuts must not fire.
 * Sliders count too: MUI sliders contain an <input type="range"> that uses
 * the arrow keys itself.
 */
export function isTypingTarget(target: TargetLike): boolean {
  if (!target) return false
  const tag = target.tagName.toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
}

/**
 * True when Space should be left alone because a button has focus:
 * the browser already "clicks" a focused button when Space is pressed.
 */
export function isButtonTarget(target: TargetLike): boolean {
  return target?.tagName.toUpperCase() === 'BUTTON'
}

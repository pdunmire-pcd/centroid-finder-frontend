import { describe, expect, it } from 'vitest'
import { isButtonTarget, isTypingTarget, shortcutForKey } from '../../src/components/player/shortcuts'

describe('shortcutForKey', () => {
  it('maps the player keys', () => {
    expect(shortcutForKey(' ')).toBe('toggle-play')
    expect(shortcutForKey(',')).toBe('frame-back')
    expect(shortcutForKey('.')).toBe('frame-forward')
    expect(shortcutForKey('ArrowLeft')).toBe('seek-back')
    expect(shortcutForKey('ArrowRight')).toBe('seek-forward')
  })

  it('ignores other keys', () => {
    expect(shortcutForKey('a')).toBeNull()
    expect(shortcutForKey('Enter')).toBeNull()
  })
})

describe('isTypingTarget', () => {
  it('is true for form fields', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true)
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true)
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true)
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true)
  })

  it('is false for everything else', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget({ tagName: 'BODY' })).toBe(false)
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false)
  })
})

describe('isButtonTarget', () => {
  it('spots buttons', () => {
    expect(isButtonTarget({ tagName: 'BUTTON' })).toBe(true)
    expect(isButtonTarget({ tagName: 'DIV' })).toBe(false)
    expect(isButtonTarget(null)).toBe(false)
  })
})

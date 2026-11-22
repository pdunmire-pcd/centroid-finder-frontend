import { describe, expect, it } from 'vitest'
import {
  PROFILES_STORAGE_KEY,
  readProfiles,
  upsertProfile,
  writeProfiles,
  type ProfileStorage,
} from '../../src/hooks/useColorProfiles'
import type { ColorProfile } from '../../src/types'

/** A tiny in-memory stand-in for localStorage. */
function fakeStorage(initial: Record<string, string> = {}): ProfileStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

const SALAMANDER: ColorProfile = { name: 'Ensatina', samples: [], targetColor: '660005', threshold: 67 }
const BALLOON: ColorProfile = { name: 'Balloon', samples: [], targetColor: 'ff0000', threshold: 120 }

describe('readProfiles / writeProfiles', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage()
    expect(writeProfiles(storage, [SALAMANDER])).toBe(true)
    expect(readProfiles(storage)).toEqual([SALAMANDER])
  })

  it('returns [] for missing, broken or wrong-shaped data', () => {
    expect(readProfiles(null)).toEqual([])
    expect(readProfiles(fakeStorage())).toEqual([])
    expect(readProfiles(fakeStorage({ [PROFILES_STORAGE_KEY]: '{not json' }))).toEqual([])
    expect(readProfiles(fakeStorage({ [PROFILES_STORAGE_KEY]: '{"a":1}' }))).toEqual([])
  })

  it('skips entries that are not profiles', () => {
    const text = JSON.stringify([SALAMANDER, { name: 'half a profile' }])
    expect(readProfiles(fakeStorage({ [PROFILES_STORAGE_KEY]: text }))).toEqual([SALAMANDER])
  })

  it('reports false when storage throws', () => {
    const full: ProfileStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(writeProfiles(full, [SALAMANDER])).toBe(false)
  })
})

describe('upsertProfile', () => {
  it('adds a new profile', () => {
    expect(upsertProfile([SALAMANDER], BALLOON)).toEqual([SALAMANDER, BALLOON])
  })

  it('replaces a profile with the same name', () => {
    const updated = { ...SALAMANDER, threshold: 80 }
    expect(upsertProfile([SALAMANDER, BALLOON], updated)).toEqual([BALLOON, updated])
  })
})

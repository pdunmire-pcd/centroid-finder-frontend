// Saved tracking colors ("profiles"), kept in the browser's localStorage so a
// color sampled on one video can be reused on the next one.

import { useState } from 'react'
import type { ColorProfile } from '../types'

export const PROFILES_STORAGE_KEY = 'centroid-finder.colorProfiles'

/** The two localStorage methods we use. Tests pass in a fake one. */
export type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Checks that something read from storage really looks like a ColorProfile. */
function isColorProfile(value: unknown): value is ColorProfile {
  if (typeof value !== 'object' || value === null) return false
  const profile = value as Record<string, unknown>
  return (
    typeof profile.name === 'string' &&
    typeof profile.targetColor === 'string' &&
    typeof profile.threshold === 'number' &&
    Array.isArray(profile.samples)
  )
}

/** Reads the saved profiles. Broken or missing data gives an empty list. */
export function readProfiles(storage: ProfileStorage | null): ColorProfile[] {
  if (!storage) return []
  try {
    const text = storage.getItem(PROFILES_STORAGE_KEY)
    if (!text) return []
    const parsed: unknown = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.filter(isColorProfile) : []
  } catch {
    return [] // storage blocked or invalid JSON
  }
}

/** Saves the profiles. Returns false if the browser would not let us. */
export function writeProfiles(storage: ProfileStorage | null, profiles: ColorProfile[]): boolean {
  if (!storage) return false
  try {
    storage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
    return true
  } catch {
    return false // e.g. private browsing or storage full
  }
}

/** Adds a profile, replacing any existing profile with the same name. */
export function upsertProfile(profiles: ColorProfile[], profile: ColorProfile): ColorProfile[] {
  return [...profiles.filter((p) => p.name !== profile.name), profile]
}

/** window.localStorage, or null where it is not available (or throws). */
function getStorage(): ProfileStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function useColorProfiles() {
  // the function form reads storage only once, on the first render
  const [profiles, setProfiles] = useState<ColorProfile[]>(() => readProfiles(getStorage()))

  function update(next: ColorProfile[]) {
    setProfiles(next)
    writeProfiles(getStorage(), next) // if this fails, profiles still work until reload
  }

  return {
    profiles,
    saveProfile: (profile: ColorProfile) => update(upsertProfile(profiles, profile)),
    deleteProfile: (name: string) => update(profiles.filter((p) => p.name !== name)),
  }
}

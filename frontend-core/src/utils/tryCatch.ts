export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<[T | null, E | null]> {
  try {
    return [await promise, null] as const;
  } catch (error) {
    return [null, error as E] as const;
  }
}

export function syncTryCatch<T, E = Error>(
  callback: () => T,
): [T | null, E | null] {
  try {
    return [callback(), null] as const;
  } catch (error) {
    return [null, error as E] as const;
  }
}

export async function getGeoClient() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Geolocation timed out')), 5000)
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout)
            resolve(position)
          },
          (error) => {
            clearTimeout(timeout)
            reject(error)
          },
          { maximumAge: 60000, timeout: 5000, enableHighAccuracy: true }
        )
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
    if (!Number.isFinite(pos.coords.latitude) || !Number.isFinite(pos.coords.longitude)) return null
    if (Math.abs(pos.coords.latitude) > 90 || Math.abs(pos.coords.longitude) > 180) return null

    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    }
  } catch {
    return null
  }
}

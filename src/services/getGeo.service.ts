export async function getGeoClient() {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 60000
      })
    })
    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    }
  } catch {
    return null
  }
}

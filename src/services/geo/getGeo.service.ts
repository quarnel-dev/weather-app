export async function getGeoClient() {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        maximumAge: 60000,
        timeout: 5000,
        enableHighAccuracy: true,
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

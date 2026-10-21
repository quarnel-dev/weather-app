export function weatherPayload() {
  return {
    cod: 200,
    name: 'Suzhou',
    sys: { country: 'CN', sunrise: 1761019200, sunset: 1761060000 },
    main: { temp: 20.4, temp_min: 19.2, temp_max: 21.8, feels_like: 20.6, humidity: 50 },
    weather: [{ description: 'clear sky', main: 'Clear', icon: '01d' }],
    wind: { speed: 2.5, deg: 90 },
    clouds: { all: 0 },
    coord: { lat: 31.30408, lon: 120.59538 },
  }
}

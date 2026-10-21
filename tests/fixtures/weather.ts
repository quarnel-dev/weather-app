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

export function forecastPayload() {
  const entry = (date: string, temp: number) => ({
    dt_txt: date,
    main: { temp, temp_min: temp - 1, temp_max: temp + 1, humidity: 60 },
    weather: [{ description: 'light rain', main: 'Rain', icon: '10d' }],
    wind: { speed: 3 },
  })

  return {
    cod: '200',
    list: [entry('2026-10-21 09:00:00', 18), entry('2026-10-21 12:00:00', 20.4), entry('2026-10-22 12:00:00', 19.6)],
  }
}

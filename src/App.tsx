import { useState, useEffect } from "react"
import "./App.css"
import Papa from "papaparse"
import dataFile from "../country/Book1.csv"

function App() {
  const [data, setData] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [countryData, setCountryData] = useState<any[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState("")
  const [search, setSearch] = useState("")

  const columnToShow = ["Municipalities"]

  // Weather descriptions
  const weatherDescriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  }

  // Background classes
  const weatherBackgrounds: { [key: number]: string } = {
    0: "bg-clear",
    1: "bg-clear",
    2: "bg-partly",
    3: "bg-overcast",
    45: "bg-fog",
    48: "bg-fog",
    51: "bg-drizzle",
    53: "bg-drizzle",
    55: "bg-drizzle",
    61: "bg-rain",
    63: "bg-rain",
    65: "bg-rain",
    71: "bg-snow",
    73: "bg-snow",
    75: "bg-snow",
    77: "bg-snow",
    80: "bg-showers",
    81: "bg-showers",
    82: "bg-rain",
    95: "bg-storm",
    96: "bg-storm",
    99: "bg-storm",
  }

  // Normalize municipality names (removes "City of" and region info)
  const normalizeName = (name: string) =>
    name.toLowerCase().replace(/city of |\(.*\)/g, "").trim()

  // Parse CSV
  const loadCSV = () => {
    Papa.parse(dataFile, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        const headers = ["Municipalities", "Population", "Province"]
        const parsedData = results.data.map((row: any) => {
          const obj: any = {}
          headers.forEach((h, i) => {
            obj[h] = row[i]?.trim() || ""
          })
          return obj
        })
        setCountryData(parsedData)
      },
    })
  }

  useEffect(() => {
    loadCSV()
  }, [])

  // Get coordinates by municipality name
  const getCoordinates = async (name: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${name}, Philippines`,
        { headers: { "User-Agent": "weather-app-example" } }
      )
      const data = await res.json()
      if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon }
      }
    } catch (error) {
      console.log("Geocoding error:", error)
    }
    return null
  }

  // Fetch weather
  const fetchWeather = async () => {
    if (!selectedMunicipality) return

    const coords = await getCoordinates(selectedMunicipality)
    if (!coords) {
      setMessage("Coordinates not found for this municipality")
      return
    }

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,weathercode`
      )
      const result = await weatherResponse.json()
      setData(result)
      setMessage("")
    } catch (error) {
      console.log(error)
      setMessage("Failed to fetch weather data")
    }
  }

  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setMessage("Geolocation is not supported by your browser.")
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { "User-Agent": "weather-app-example" } }
            )
            const json = await res.json()
            const city =
              json.address?.city ||
              json.address?.town ||
              json.address?.village ||
              json.address?.municipality ||
              ""
            if (city) {
              // Normalize names before matching
              const exists = countryData.find(
                (row) => normalizeName(row.Municipalities) === normalizeName(city)
              )
              if (exists) setSelectedMunicipality(exists.Municipalities)
              else
                setMessage(
                  `Detected location "${city}" is not in the list. Please search manually.`
                )
            } else {
              setMessage("Unable to detect your city. Please search manually.")
            }
          } catch (err) {
            console.log(err)
            setMessage("Unable to detect your location. Please search manually.")
          }
        },
        (err) => {
          console.log(err)
          setMessage("Unable to detect your location. Please search manually.")
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    if (!selectedMunicipality && countryData.length > 0) {
      detectLocation()
    }
  }, [countryData])

  // Fetch weather when municipality changes
  useEffect(() => {
    fetchWeather()
  }, [selectedMunicipality])

  // Filter search
  const filteredData = countryData.filter((row) =>
    row[columnToShow[0]]?.toLowerCase().includes(search.toLowerCase())
  )

  // Current weather
  const currentCode = data?.hourly?.weathercode?.[0]
  const currentDescription =
    currentCode !== undefined ? weatherDescriptions[currentCode] : "Unknown"
  const backgroundClass =
    currentCode !== undefined ? weatherBackgrounds[currentCode] : "bg-clear"

  const renderWeatherAnimation = () => {
    if (!currentCode) return null

    // Fog animation
    if ([45, 48].includes(currentCode)) {
      return (
        <>
          <div className="fog-layer"></div>
          <div className="fog-layer"></div>
        </>
      )
    }

    // Overcast animation
    if ([3].includes(currentCode)) {
      return (
        <>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
        </>
      )
    }

    // Rain animation
    if ([61, 63, 65, 80, 81, 82].includes(currentCode)) {
      return (
        <div className="rain">
          {Array.from({ length: 50 }).map((_, i) => {
            const style = {
              left: `${Math.random() * 100}%`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
              animationDelay: `${Math.random() * 2}s`,
            }
            return <span key={i} className="raindrop" style={style}></span>
          })}
        </div>
      )
    }

    // Thunderstorm (rain + lightning)
    if ([95, 96, 99].includes(currentCode)) {
      return (
        <>
          <div className="rain">
            {Array.from({ length: 50 }).map((_, i) => {
              const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 2}s`,
              }
              return <span key={i} className="raindrop" style={style}></span>
            })}
          </div>
          <div className="thunder"></div>
        </>
      )
    }

    return null
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${backgroundClass}`}>
      {renderWeatherAnimation()}

      <div className="p-6 relative z-10">
        <h1 className="text-3xl font-bold text-center mb-6 text-white drop-shadow-lg">
          Weather App
        </h1>

        <div className="my-6 max-w-md mx-auto bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-6 shadow-lg flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex flex-col">
            <label
              htmlFor="search"
              className="text-gray-900 font-semibold mb-1 text-sm drop-shadow-md"
            >
              Search Municipality
            </label>
            <input
              type="text"
              id="search"
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Select Municipality */}
          <div className="flex flex-col">
            <label
              htmlFor="country"
              className="text-gray-900 font-semibold mb-1 text-sm drop-shadow-md"
            >
              Choose a Municipality
            </label>
            <select
              name="country"
              id="country"
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select --</option>
              {filteredData.map((row, index) => (
                <option key={index} value={row[columnToShow[0]]}>
                  {row[columnToShow[0]]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="text-red-500 text-center">{message}</p>}

        {data && (
          <div className="my-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-lg">
              Weather in {selectedMunicipality}
            </h2>

            <div className="bg-white/70 p-4 rounded-lg shadow-md text-center mb-6">
              <p className="text-lg font-medium">Condition</p>
              <p className="text-2xl font-bold">{currentDescription}</p>
            </div>

            <div className="bg-blue-100 p-6 rounded-lg shadow-md mb-6 text-center">
              <p className="text-lg">Current Temperature</p>
              <p className="text-4xl font-bold text-blue-600">
                {data.hourly?.temperature_2m[0]}°C
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-lg">
                Next Hours Forecast
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.hourly?.time.slice(0, 8).map((time: string, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-lg shadow text-center"
                  >
                    <p className="text-sm text-gray-500">
                      {new Date(time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {data.hourly.temperature_2m[idx]}°C
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

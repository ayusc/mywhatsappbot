import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import {fileURLToPath} from 'node:url'
import {createCanvas, registerFont} from 'canvas'
import sharp from 'sharp'
import fetch from 'node-fetch'
import weather from 'weather-js'
import dotenv from 'dotenv'
import pkg from 'whatsapp-web.js'

const {Client, LocalAuth, MessageMedia, Poll, GroupChat} = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const city = process.env.CITY || 'Kolkata'
const ZODIAC_SIGN = process.env.ZODIAC_SIGN || 'Gemini'
const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Kolkata'
const imageUrl =
  process.env.IMAGE_URL ||
  'https://i.ibb.co/d4qcHwdj/blank-profile-picture-973460-1280.png'
const intervalMs =
  Number.parseInt(process.env.AUTO_DP_INTERVAL_MS, 10) || 60_000
const SHOW_HOROSCOPE = process.env.SHOW_HOROSCOPE || 'False'

export let autodpInterval = null
const fontPath = path.join(__dirname, 'Lobster-Regular.ttf')
const fontUrl =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/lobster/Lobster-Regular.ttf'

function getDateTimeString() {
  const options = {timeZone: TIME_ZONE, hour12: true}
  const now = new Date()

  const day = now.toLocaleString('en-IN', {weekday: 'short', ...options})
  const dd = now.toLocaleString('en-IN', {day: '2-digit', ...options})
  const mm = now.toLocaleString('en-IN', {month: '2-digit', ...options})
  const yyyy = now.toLocaleString('en-IN', {year: 'numeric', ...options})
  let time = now.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  })

  // Convert "AM"/"PM" to "A.M"/"P.M"
  time = time.replace(/\s?am/, ' A.M').replace(/\s?pm/, ' P.M')

  return `${day} ${dd}.${mm}.${yyyy} ${time}`
}

async function ensureFontDownloaded() {
  if (fs.existsSync(fontPath) && fs.statSync(fontPath).size >= 10_000) return

  await new Promise((resolve, reject) => {
    https
      .get(fontUrl, res => {
        if (res.statusCode !== 200)
          return reject(new Error(`Failed to download font: ${res.statusCode}`))

        const file = fs.createWriteStream(fontPath)
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
        file.on('error', reject)
      })
      .on('error', reject)
  })
}

const imagePath = path.join(__dirname, 'dp.jpg')
const outputImage = path.join(__dirname, 'output.jpg')

async function downloadImage() {
  const file = fs.createWriteStream(imagePath)
  await new Promise((resolve, reject) => {
    https
      .get(imageUrl, res => {
        if (res.statusCode !== 200)
          return reject(
            new Error(`Failed to download image: ${res.statusCode}`)
          )
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
        file.on('error', reject)
      })
      .on('error', reject)
  })
}

async function getWeather() {
  return new Promise(resolve => {
    weather.find({search: city, degreeType: 'C'}, function (error, result) {
      if (error || !result || result.length === 0) {
        console.log('❌ Failed to get weather:', error?.message || 'No results')
        return resolve({
          temperature: 'N/A',
          feelsLike: 'N/A',
          sky: 'N/A',
          windSpeed: 'N/A',
          humidity: 'N/A',
          forecastText: 'N/A',
          rainChance: 'N/A',
        })
      }

      const current = result[0].current || {}
      const forecast = result[0].forecast?.[0] || {}

      const weatherDetails = {
        temperature: current.temperature ? current.temperature + '°C' : 'N/A',
        feelsLike: current.feelslike ? current.feelslike + '°C' : 'N/A',
        sky: current.skytext || 'N/A',
        windSpeed: current.winddisplay || 'N/A',
        humidity: current.humidity ? current.humidity + '%' : 'N/A',
        forecastText: forecast.skytextday || 'N/A',
        rainChance: forecast.precip ? forecast.precip + '%' : 'N/A',
      }

      resolve(weatherDetails)
    })
  })
}

async function getAQI(cityName) {
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`
    )
    const geoData = await geoRes.json()
    if (geoData.length === 0) throw new Error('City not found')

    const {lat, lon} = geoData[0]

    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
    )
    const aqiData = await aqiRes.json()

    const aqi = aqiData?.current?.us_aqi

    if (typeof aqi !== 'number') throw new Error('Invalid AQI data')

    let status = 'N/A'
    if (aqi <= 20) status = 'Excellent'
    else if (aqi <= 50) status = 'Good'
    else if (aqi <= 100) status = 'Moderate'
    else if (aqi <= 125) status = 'Poor'
    else if (aqi <= 150) status = 'Unhealthy for Sensitive Groups'
    else if (aqi <= 200) status = 'Unhealthy'
    else if (aqi <= 300) status = 'Very Unhealthy'
    else status = 'Hazardous'

    return {
      aqi: aqi.toString(),
      status,
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return {
      aqi: 'N/A',
      status: 'N/A',
    }
  }
}

async function getHoroscopes() {
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/horoscope?zodiac=${ZODIAC_SIGN}`
    )
    const data = await response.json()
    const daily = data?.horoscope || 'N/A'
    const sign = data?.sign || 'N/A'
    return {sign, daily}
  } catch (error) {
    console.error("Failed to fetch today's horoscope:", error)
    return {
      sign: 'N/A',
      daily: "Unable to fetch today's horoscope.",
    }
  }
}

async function generateImage() {
  const weatherInfo = await getWeather()
  const aqiresult = await getAQI(city)
  const dateText = getDateTimeString()
  const {daily, sign} = await getHoroscopes()

  const finalText = `     ${dateText}, ${weatherInfo.temperature} (Feels Like ${weatherInfo.feelsLike}), ${city}
Wind ${weatherInfo.windSpeed}, Humidity ${weatherInfo.humidity}, Rainfall Chances ${weatherInfo.rainChance}
Current Condtions: ${weatherInfo.sky}, Today's Forecast: ${weatherInfo.forecastText}
Air Quality Index (AQI): ${aqiresult.aqi} (${aqiresult.status})`

  const image = sharp(imagePath)
  const metadata = await image.metadata()
  const width = metadata.width
  const height = metadata.height

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')

  // Clear and setup canvas
  context.clearRect(0, 0, width, height)

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = 'bold 35px FancyFont'
  context.fillStyle = 'white'
  context.shadowColor = 'rgba(0,0,0,0.5)'
  context.shadowBlur = 8

  const lines = finalText.split('\n')
  const lineHeight = 50
  const startY = height - 150 - ((lines.length - 1) * lineHeight) / 2

  for (const [index, line] of lines.entries()) {
    context.fillText(line.trim(), width / 2, startY + index * lineHeight)
  }

  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.font = '30px FancyFont'
  context.fillStyle = 'white'
  context.shadowColor = 'rgba(0,0,0,0.7)'
  context.shadowBlur = 6

  const safePadding = 300
  const x = safePadding
  let y = 30

  if (process.env.SHOW_HOROSCOPE === 'True') {
    const horoscopeLine = `Today's Horoscope for ${sign}: ${daily}`
    const wrappedLines = wrapText(horoscopeLine, width - safePadding * 2)
    for (const line of wrappedLines) {
      context.fillText(line, x, y)
      y += 35
    }
  }

  function wrapText(text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let line = ''
    for (const word of words) {
      const test = line + word + ' '
      if (context.measureText(test).width > maxWidth) {
        lines.push(line.trim())
        line = word + ' '
      } else {
        line = test
      }
    }

    lines.push(line.trim())
    return lines
  }

  const overlayBuffer = canvas.toBuffer()

  await sharp(imagePath)
    .composite([{input: overlayBuffer, top: 0, left: 0}])
    .jpeg({quality: 100})
    .toFile(outputImage)
}

export default {
  name: '.autodp',
  description:
    'Automatically update profile pic with clock & temp from a static image',

  async execute(message, arguments_, client) {
    if (autodpInterval) {
      await message.reply('⚠️ AutoDP is already running!')
      return
    }

    await ensureFontDownloaded()
    registerFont(fontPath, {family: 'FancyFont'})

    downloadImage()
      .then(() => {
        console.log('Profile pic downloaded.')
      })
      .catch(console.error)

    await message.reply(
      `✅ AutoDP started.\nUpdating every ${intervalMs / 1000}s`
    )

    // Calculate IST-based delay to next interval start
    const now = new Date().toLocaleString('en-IN', {
      timeZone: TIME_ZONE,
    })
    const date = new Date(now)
    const seconds = date.getSeconds()
    const millisUntilNextInterval = intervalMs - ((seconds * 1000) % intervalMs)

    setTimeout(() => {
      // Start interval
      autodpInterval = setInterval(async () => {
        await generateImage()
        const mediadp = await MessageMedia.fromFilePath(outputImage)
        await client.setProfilePicture(mediadp)
        // Await fs.unlink(outputImage);
        console.log('✅ DP updated')
      }, intervalMs)

      // Do the first update exactly on sync
      generateImage()
        .then(async () => {
          const mediadp = await MessageMedia.fromFilePath(outputImage)
          await client.setProfilePicture(mediadp)
          // Await fs.unlink(outputImage);
          console.log('✅ DP updated')
        })
        .catch(() => {})
    }, millisUntilNextInterval)
  },
}

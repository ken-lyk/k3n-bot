import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji } from './utils.js';

//kill -9 $(lsof -t -i:3000)   
// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const { type, data, user } = req.body;
  console.log('req', req);

  console.log('req.body', req.body);

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    if (name === 'test') {
      const username = user.username; // Get the Discord username
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello ${username} ${getRandomEmoji()} ${getRandomEmoji()}`,
        },
      });
    } 
    else if (name === 'currency') {
      console.log('name', name);
      console.log('process.env.OPENEXCHANGERATES_API_KEY', process.env.OPENEXCHANGERATES_API_KEY);
      // 'Authorization': `Bearer ${process.env.OPENEXCHANGERATES_API_KEY}`, 
      try {
        const response = await fetch('https://openexchangerates.org/api/latest.json?app_id=' + process.env.OPENEXCHANGERATES_API_KEY);
        const exchangeRates = await response.json(); // Parse the JSON response

        console.log('exchangeRates', exchangeRates);
        const rates = exchangeRates.rates;
        const currency = rates['MYR'];
        const currencyList = ['USD', 'SGD', 'MYR', 'USD', 'EUR', 'AUD', 'GBP', 'JPY', 'HKD', 'CAD', 'CHF', 'NZD'];
        const currencyString = currencyList.map(currency => `${currency}: ${rates[currency].toFixed(2)}`).join('\n');

        //convert from USD to SGD
        const sgd = rates['SGD'];
        const currencyStringSGD = currencyList.map(currency => `${currency}: ${(rates[currency] / sgd).toFixed(2)}`).join('\n');

        const finalString = 'USD:' + currencyString + '\n\n' + 'SGD:' + currencyStringSGD;
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: finalString
          },
        });
      } catch (error) {
        console.error('Error fetching currency data:', error);
        return res.status(500).json({ error: 'Failed to fetch currency data' });
      }
    }
    else if (name === 'weather') {
      console.log('Fetching weather data from WeatherAPI...');
      try {
        const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHERAPI_API_KEY}&q=Singapore&aqi=no`);
        const weatherData = await weatherResponse.json(); // Parse the JSON response

        console.log('weatherData', weatherData);
        const weatherDescription = weatherData.current.condition.text;
        const temperature = weatherData.current.temp_c;

        const weatherString = `Current weather in Singapore: ${temperature}°C, ${weatherDescription}`;
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: weatherString,
          },
        });
      } catch (error) {
        console.error('Error fetching weather data from WeatherAPI:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data from WeatherAPI' });
      }
      // console.log('Fetching weather data...');
      // try {
      //   const weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/weather?q=London&appid=${process.env.WEATHER_API_KEY}&units=metric`);
      //   const weatherData = await weatherResponse.json(); // Parse the JSON response

      //   console.log('weatherData', weatherData);
      //   const weatherDescription = weatherData.weather[0].description;
      //   const temperature = weatherData.main.temp;

      //   const weatherString = `Current weather in London: ${temperature}°C, ${weatherDescription}`;
      //   return res.send({
      //     type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      //     data: {
      //       content: weatherString,
      //     },
      //   });
      // } catch (error) {
      //   console.error('Error fetching weather data:', error);
      //   return res.status(500).json({ error: 'Failed to fetch weather data' });
      // }
    }
    else if (name === 'about-me') {
      const username = user.username; // Get the Discord username
      let intro = `hello ${username} \n I am a bot created by Ken Lee to help you with your daily needs.`;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: intro,
        },
      });
    }
    else if (name === 'wiki-today') {
      const wikiTodayApi = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${new Date().getMonth()}/${new Date().getDate()}`;
      const response = await fetch(wikiTodayApi);
      const wikiTodayData = await response.json(); // Parse the JSON response
      var wikiTodayString = '';
      let count = 0;
      if(wikiTodayData.events) {
        // wikiTodayString += `${wikiTodayData.events[0].year}: ${wikiTodayData.events[0].text} \n`;
        for (let event of wikiTodayData.events) {
          if (count > 2) {
            break;
          }
          wikiTodayString += `${event.year}: ${event.text} \n`;
          count++;
        }
      }
      // console.log('wikiTodayString', wikiTodayString);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: wikiTodayString,
        },
      });
    }
    else if (name === 'wiki-random') {
      const startTimestamp = new Date('1800-01-01').getTime();
      const endTimestamp = new Date().getTime();
      const randomTimestamp = Math.floor(Math.random() * (endTimestamp - startTimestamp + 1)) + startTimestamp;
      let newDate = new Date(randomTimestamp);

      const wikiTodayApi = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${newDate.getMonth()}/${newDate.getDate()}`;
      // console.log('wikiTodayApi', wikiTodayApi);
      // const response = await fetch(wikiTodayApi);
      // const wikiTodayData = await response.json(); // Parse the JSON response
      // var wikiTodayString = '';
      // let count = 0;
      // if(wikiTodayData.events) {
      //   wikiTodayString += `${wikiTodayData.events[0].year}: ${wikiTodayData.events[0].text} \n`;
      //   // for (let event of wikiTodayData.events) {
      //   //   if (count > 1) {
      //   //     break;
      //   //   }
      //   //   wikiTodayString += `${event.year}: ${event.text} \n`;
      //   //   count++;
      //   // }
      // }
      console.log('wikiTodayString', wikiTodayString);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: wikiTodayApi,
        },
      });
    }
    else {
      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: 'unknown command' });
    }
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.get('/test', async function (req, res) {
  console.log('req.body', req.body);
  console.log('req.headers', req.headers); 
  return res.status(200).json({ message: 'success' });
});

app.listen(PORT, () => {
  console.log('Starting server...');
  console.log('DISCORD_TOKEN', process.env.DISCORD_TOKEN);
  console.log('Listening on port', PORT);
});

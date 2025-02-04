require('dotenv').config()
const whatsAppClientAstana = require("@green-api/whatsapp-api-client");
const whatsAppClientAlmaty = require("@green-api/whatsapp-api-client");
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { DateTime } = require('luxon');
const fs = require("fs");

const filePath = "./numbers.js";
const app = express();
app.use(bodyParser.json());
const userStatesAstana = new Map();
const userStatesAlmaty = new Map();
const menuResponses = require('./menuResponses');
var numbers = require('./numbers');


schedule.scheduleJob('59 23 1 * *', () => {
  const currentTime = DateTime.now().setZone('Asia/Almaty');

  userStatesAstana.clear();
  userStatesAlmaty.clear();
});





const restAPIAstana = whatsAppClientAstana.restAPI({
  idInstance: process.env.ASTANA_PROJECT_ID,
  apiTokenInstance: process.env.ASTANA_API_TOKEN,
});

const restAPIAlmaty = whatsAppClientAlmaty.restAPI({
  idInstance: process.env.ALMATY_PROJECT_ID,
  apiTokenInstance: process.env.ALMATY_API_TOKEN,
});


async function sendMessageAstana(sender, message) {
  try {
    await restAPIAstana.message.sendMessage(sender, null, message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendMessageAlmaty(sender, message) {
  try {
    await restAPIAlmaty.message.sendMessage(sender, null, message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function handleMessageAstana(sender, message) {
  let currentState = userStatesAstana.get(sender) || 'main';
  // console.log(`Current state for ${sender}:`, currentState);

  const menu = menuResponses[currentState];

  if (!menu || !userStatesAstana.get(sender)) {
    currentState = 'main';
    userStatesAstana.set(sender, currentState);
    await sendMessageAstana(sender, menuResponses.main.message);
    await sendMessageAstana(sender, menuResponses.repeat_main.message);
    return;
  }

  const userInput = message.trim();


  const nextState = menu.options[userInput] || menu.options['*'];

  if (nextState == 'freeze' && userInput != 1) {
    return
  }

  if (nextState) {
    currentState = nextState;
    userStatesAstana.set(sender, currentState);

    const newMenu = menuResponses[currentState];
    if (newMenu) {
      await sendMessageAstana(sender, newMenu.message);
      if (nextState == 'main') await sendMessageAstana(sender, menuResponses.repeat_main.message);
    }
  }
}


async function handleMessageAlmaty(sender, message) {
  let currentState = userStatesAlmaty.get(sender) || 'main';
  // console.log(`Current state for ${sender}:`, currentState);

  const menu = menuResponses[currentState];

  if (!menu || !userStatesAlmaty.get(sender)) {
    currentState = 'main';
    userStatesAlmaty.set(sender, currentState);
    await sendMessageAlmaty(sender, menuResponses.main.message);
    await sendMessageAlmaty(sender, menuResponses.repeat_main.message);
    return;
  }

  const userInput = message.trim();


  const nextState = menu.options[userInput] || menu.options['*'];

  if (nextState == 'freeze' && userInput != 1) {
    return
  }

  if (nextState) {
    currentState = nextState;
    userStatesAlmaty.set(sender, currentState);

    const newMenu = menuResponses[currentState];
    if (newMenu) {
      await sendMessageAlmaty(sender, newMenu.message);
      if (nextState == 'main') await sendMessageAlmaty(sender, menuResponses.repeat_main.message);
    }
  }
}

async function  sendWebapiMessage(sender, textMessage){
  const options = {
      url: 'https://c1699.webapi.ai/cmc/user_message',
      method: 'GET',
      qs: {
          user_id: sender,
          auth_token: 'cleb7ru7',
          text: textMessage
      },
      json: true
  };

  request(options, (error, response, body) => {
      if (error) {
          console.error('Error:', error);
      } else {
          console.log('Response:', body);
      }
  });
}


(async () => {
  try {
    await restAPIAstana.settings.setSettings({
      webhookUrl: "http://5.35.107.222:2000/astana/webhook",
      // webhookUrl: "https://1332-147-30-50-104.ngrok-free.app/astana/webhook",
    });

    await restAPIAlmaty.settings.setSettings({
      webhookUrl: "http://5.35.107.222:2000/almaty/webhook",
      // webhookUrl: "https://df8f-147-30-50-104.ngrok-free.app/almaty/webhook",
    });

    const webHookAPIAstana = whatsAppClientAstana.webhookAPI(app, "/astana/webhook");
    const webHookAPIAlmaty = whatsAppClientAlmaty.webhookAPI(app, "/almaty/webhook");

    webHookAPIAstana.onIncomingMessageText(
      async (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
        const formattedNumbers = numbers.map(number => number + "@c.us");
        if (formattedNumbers.includes(sender)) return
        if (data.senderData.chatId == '120363262310260846@g.us') return
        if (sender == '77779537464@c.us' || sender == '77018878770@c.us'){
          sendWebapiMessage(sender, textMessage)
        }
        // if (!ignoredNumbers.includes(sender)) await handleMessageAstana(sender, textMessage);
      }
    );

    webHookAPIAstana.onIncomingMessageExtendedText(
      async (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
        const formattedNumbers = numbers.map(number => number + "@c.us");
        if (formattedNumbers.includes(sender)) return
        if (data.senderData.chatId == '120363262310260846@g.us') return
        // if (!ignoredNumbers.includes(sender)) await handleMessageAstana(sender, data.messageData.extendedTextMessageData.text);
        if (sender == '77779537464@c.us' || sender == '77018878770@c.us'){
          sendWebapiMessage(sender, data.messageData.extendedTextMessageData.text)
        }
      }
    );


    webHookAPIAlmaty.onIncomingMessageText(
      async (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
        if (data.senderData.chatId == '120363262310260846@g.us') return
        // if (!ignoredNumbers.includes(sender)) await handleMessageAlmaty(sender, textMessage);
      }
    );

    webHookAPIAlmaty.onIncomingMessageExtendedText(
      async (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
        if (data.senderData.chatId == '120363262310260846@g.us') return
        // if (!ignoredNumbers.includes(sender)) await handleMessageAlmaty(sender, data.messageData.extendedTextMessageData.text);
      }
    );


    app.get('/alevel_test', (req, res) => {
      res.send('Hello, World!')
    })

    app.get('/webapi_webhook', async (req, res) => {
      var sender = req.query.user_id;
      var text = req.query.text;
      if (text.toLowerCase().includes("вы записаны")) addNumber(sender.replace('@c.us',''));
      text = text.replaceAll('</br>', '').replaceAll('<br>', '')
      await sendMessageAstana(sender, text)
      res.sendStatus(200);
      return
    });

    app.listen(2000, () => {
      console.log(`Started. App listening on port 2000!`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();



function addNumber(newNumber) {
  if (!numbers.includes(newNumber)) {
    numbers.push(newNumber);

    const updatedContent = `const numbers = ${JSON.stringify(numbers, null, 2)};\n\nmodule.exports = numbers;`;

    fs.writeFileSync(filePath, updatedContent);
    // console.log(`Number ${newNumber} added.`);
    numbers = require('./numbers')
  } else {
    // console.log(`Number ${newNumber} already exists.`);
  }
}


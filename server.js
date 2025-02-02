require('dotenv').config()
const whatsAppClientAstana = require("@green-api/whatsapp-api-client");
const whatsAppClientAlmaty = require("@green-api/whatsapp-api-client");
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { DateTime } = require('luxon');
const app = express();
app.use(bodyParser.json());
const userStatesAstana = new Map();
const userStatesAlmaty = new Map();
const menuResponses = require('./menuResponses');



schedule.scheduleJob('59 23 1 * *', () => {
  const currentTime = DateTime.now().setZone('Asia/Almaty');
  console.log(`Resetting user states at ${currentTime.toISO()}`);
  userStatesAstana.clear();
  userStatesAlmaty.clear();
});

const numbers = [
  "77022142405", "77776664649", "77018687009", "77057616430",
  "77017898740", "77766980860", "77025821666", "77014130003",
  "77071545051", "77082517762", "77474012884", "77051560877",
  "77756295008", "77073137413", "77054789294", "77083178364",
  "77784662205", "77085703790", "77472600358", "77075287636",
  "77782932049", "77018011490", "77758595612", "77472318527",
  "77019051117", "77773876011", "77071727049", "77754597772",
  "77026479036", "77087000522", "77077555627", "77477035457",
  "77088434614", "97688108454", "77756443596", "905011160898",
  "77017826169", "77771557021", "77006046464", "77058298828",
  "77076334989", "77478996770", "77753407582", "77002550925",
  "77056183883", "77055235365", "77762822976", "77001170020",
  "77475951758", "77075785096", "77017701138", "77078435882",
  "77023182673", "77002708358", "77472332282", "77029990975",
  "77057156421", "77009632251", "77013582081", "77751454277",
  "77775453019", "77007601900", "77750718309", "77064299284",
  "77473653799", "77711899595", "77783502416", "77075050089",
  "77475551902", "77015331914", "77775127243", "77059102738",
  "77473810607", "77476001285", "77058045856", "77782751114",
  "77777471972", "77756296071", "77051718088", "77758504946",
  "77714361475", "77081038426", "77751093773", "77086282993",
  "77777778844", "77029367540", "77056832479", "77474399783",
  "77767545010", "77055847906", "77012507722", "77772172602",
  "77777237647", "77002717305", "77716286775", "77016253645",
  "77056731043", "77051647711", "77472012521", "77051498910",
  "77470304032", "77084939808", "77710003309", "77786344703",
  "77055815165", "77023017838", "77052930592", "77779108035",
  "77086154771", "77086509138", "77053564214", "77013719510",
  "77013713677", "77714941173", "77757603072", "77766380450",
  "77059625510", "77773770207", "77026715889", "77076660399",
];

// Format the numbers
const ignoredNumbers = numbers.map(number => `${number}@c.us`);


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
        console.log(data)
        if (data.senderData.chatId == '120363262310260846@g.us') return
        if (sender == '77779537464@c.us' || sender == '77018878770@c.us'){
          sendWebapiMessage(sender, textMessage)
        }
        // if (!ignoredNumbers.includes(sender)) await handleMessageAstana(sender, textMessage);
      }
    );

    webHookAPIAstana.onIncomingMessageExtendedText(
      async (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
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
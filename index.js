require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot server is running!');
});
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

const keywords = ["link", "price", "info", "buy"];

async function sendDM(recipientId, message) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/17841434193861699/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: process.env.ACCESS_TOKEN
        })
      }
    );
    const data = await response.json();
    console.log('DM sent:', data);
  } catch (err) {
    console.error('Error sending DM:', err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  console.log('Incoming event:', JSON.stringify(body, null, 2));

  try {
    const changes = body?.entry?.[0]?.changes?.[0];
    if (!changes) return;

    const field = changes?.field;
    const value = changes?.value;

    if (!field || !value) return;

    if (field === 'comments') {
      const commentText = value?.text?.toLowerCase?.();
      const senderId = value?.from?.id;

      if (!commentText || !senderId) {
        console.log('Missing commentText or senderId');
        return;
      }

      for (let keyword of keywords) {
        if (commentText.includes(keyword)) {
          console.log(`Keyword "${keyword}" detected from ${senderId}`);
          await sendDM(senderId, 'Here is your link: https://yourwebsite.com');
          return;
        }
      }
      console.log('No keyword found. Ignoring.');
    }
  } catch (err) {
    console.error('Error processing webhook:', err.message);
  }
});
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
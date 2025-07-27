require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Remplace par tes identifiants Orange COMPLETS
const clientId = process.env.ORANGE_CLIENT_ID || '2e8oEQLmETxzct1JPbNT2KdJZwZHQRCZ';
const clientSecret = process.env.ORANGE_CLIENT_SECRET || 'v9EvCPr1Nwu4GejbLbDhyvE8siau0Pmb0PHGN3KOW7w4';
const senderNumber = process.env.ORANGE_SENDER_NUMBER || '224627826887';
const sender = `tel:+${senderNumber}`;

async function getToken() {
  const res = await axios.post(
    'https://api.orange.com/oauth/v3/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }
  );
  return res.data.access_token;
}

app.post('/send-sms', async (req, res) => {
  let { to, message } = req.body;
  // Force le format international pour la Guinée
  if (!to.startsWith('+224')) {
    to = '+224' + to.replace(/^0+/, '');
  }
  try {
    const token = await getToken();
    const url = `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${senderNumber}/requests`;
    const response = await axios.post(
      url,
      {
        outboundSMSMessageRequest: {
          address: `tel:${to}`,
          senderAddress: sender,
          outboundSMSTextMessage: { message }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    res.json({ success: true, data: response.data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.response?.data || e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Orange SMS API running on port ${PORT}`)); 
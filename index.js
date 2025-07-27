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
  
  console.log('SMS Request received:', { to, message });
  console.log('Environment variables:', {
    clientId: clientId ? 'SET' : 'NOT SET',
    clientSecret: clientSecret ? 'SET' : 'NOT SET',
    senderNumber: senderNumber ? 'SET' : 'NOT SET'
  });
  
  // Force le format international pour la Guinée
  if (!to.startsWith('+224')) {
    to = '+224' + to.replace(/^0+/, '');
  }
  
  try {
    console.log('Getting token...');
    const token = await getToken();
    console.log('Token received:', token ? 'YES' : 'NO');
    
    const url = `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${senderNumber}/requests`;
    console.log('Sending to Orange API:', url);
    
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
    console.log('Orange API response:', response.data);
    res.json({ success: true, data: response.data });
  } catch (e) {
    console.error('Error details:', e.response?.data || e.message);
    res.status(500).json({ success: false, error: e.response?.data || e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Orange SMS API running on port ${PORT}`)); 
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Telegram bot token not found in environment variables');
  process.exit(1); // Exit if bot token is not found
}

const bot = new TelegramBot(token, { polling: true });

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error('Failed to parse service account key:', error);
  process.exit(1); // Exit if service account key is invalid
}

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://clover-ddbe7-default-rtdb.firebaseio.com"
});

const db = getFirestore();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

const webAppUrl = 'http://t.me/CloverMinerBot/ClovrMaster/';

// Handle /start command from Telegram users
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const referral = match[1] ? match[1].trim() : null; // Capture referral code if any

  const welcomeMessage = `
    # How to play Clover ⚡️
    
    💰 Tap to earn
    Tap the screen and collect coins.
    
    📈 LVL
    The more coins you have on your balance, the higher the level of your exchange is and the faster you can earn more coins.
    
    👥 Friends
    Invite your friends and you’ll get bonuses. Help a friend move to the next leagues and you'll get even more bonuses.
    
    🪙 Token listing
    At the end of the season, a token will be released and distributed among the players. Dates will be announced in our announcement channel. Stay tuned!
    
    To get this guide, type /help.`;

  bot.sendMessage(msg.chat.id, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play 🎮', callback_data: `play_${referral || ''}` }],
        [{ text: 'Suscribe to Our Telegram', url: 'https://t.me/+vMBFR8eRy8w2OGY8'}]
      ]
    }
  });
});
// Handle callback query
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const [action, referral] = data.split('_');

  if (action === 'play') {
    const userId = callbackQuery.from.id.toString(); // Ensure userId is a string

    // Validate userId
    if (!userId || userId.trim() === '') {
      console.error('Invalid userId:', userId);
      bot.sendMessage(message.chat.id, 'An error occurred while storing your data. Please try again.');
      return;
    }

    const userData = {
      id: callbackQuery.from.id,
      username: callbackQuery.from.username || 'N/A',
      firstName: callbackQuery.from.first_name || 'N/A',
      lastName: callbackQuery.from.last_name || 'N/A',
      level: 1,
      tapPerClick: 2,
      balance: 0,
      energy: 1000,
      invited: [],
      referralLink: `http://t.me/CloverMinerBot?start=${callbackQuery.from.id}`
    };
    
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        await userRef.set(userData, { merge: true });
        if (referral) {
          await handleReferral(referral, userId);
        }
      }

      bot.editMessageReplyMarkup({
        inline_keyboard: [
          [{ text: 'Start Mining Clover 🍀', url: `${webAppUrl}?userId=${userId}` }]
        ]
      }, {
        chat_id: message.chat.id,
        message_id: message.message_id
      });
    } catch (error) {
      console.error('Error storing user data:', error); // Detailed error logging
      bot.sendMessage(message.chat.id, 'An error occurred while storing your data. Please try again.');
    }
  }
});

// Function to handle referral and update Firestore
const handleReferral = async (referrerId, newUserId) => {
  const referrerRef = db.collection('users').doc(referrerId);
  const referrerDoc = await referrerRef.get();

  if (referrerDoc.exists) {
    await referrerRef.update({
      invited: FieldValue.arrayUnion(newUserId),
      balance: FieldValue.increment(5000)
    });

    const newUserRef = db.collection('users').doc(newUserId);
    await newUserRef.update({
      balance: 5000,
      referrerId: referrerId
    });
  }
};

// Endpoint to update user coins
app.post('/api/users/updateCoins', async (req, res) => {
  const { userId, coinsToAdd, levels } = req.body;

  if (!userId || coinsToAdd === undefined) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const userRef = db.collection('users').doc(userId.toString());

  try {
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        balance: FieldValue.increment(coinsToAdd),
        level: levels
      });
      res.json({ message: 'User coins updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Import the libraries we need
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// Configure Twitter API client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Function to generate a funny tweet using Claude
async function generateFunnyTweet() {
  const prompt = "Write a funny, witty tweet that would make people laugh. Keep it under 280 characters.";
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-sonnet-20240229",
        max_tokens: 150,
        temperature: 0.8,
        system: "You are an expert comedy writer known for clever, witty tweets that go viral.",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Error generating tweet with Claude:', error.response?.data || error.message);
    throw error;
  }
}

// Function to post a tweet
async function postTweet(text) {
  try {
    const result = await twitterClient.v2.tweet(text);
    return result;
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
}

// Function to check if it's time to post
function shouldPost(lastPostTime) {
  // If no last post time, it's the first run
  if (!lastPostTime) return true;
  
  const now = new Date();
  const lastPost = new Date(lastPostTime);
  const hoursSinceLastPost = (now - lastPost) / (1000 * 60 * 60);
  
  // Generate a random hour value between 4 and 10
  const randomHours = 4 + Math.random() * 6;
  
  return hoursSinceLastPost >= randomHours;
}

// Import the Edge Config database
import { get, set } from '@vercel/edge-config';

// Function to get the last post time from database
async function getLastPostTime() {
    try {
      return await get('lastPostTime');
    } catch (error) {
      console.error('Error fetching last post time:', error);
      return null;
    }
  }

// Function to update the last post time in database
async function updateLastPostTime(timeString) {
    try {
      await set('lastPostTime', timeString);
      return true;
    } catch (error) {
      console.error('Error updating last post time:', error);
      return false;
    }
  }

// Main handler function for the API endpoint
export default async function handler(req, res) {
  // Check if it's a scheduled invocation
  if (req.headers['x-vercel-cron']) {
    try {
      // Get time of last post from database
      const lastPostTime = await getLastPostTime();
      
      if (shouldPost(lastPostTime)) {
        // Generate and post a tweet
        const tweetText = await generateFunnyTweet();
        const result = await postTweet(tweetText);
        
        // Update the last post time
        await updateLastPostTime(new Date().toISOString());
        
        return res.status(200).json({ success: true, message: 'Tweet posted successfully', tweet: tweetText });
      } else {
        return res.status(200).json({ success: true, message: 'Not time to post yet' });
      }
    } catch (error) {
      console.error('Error in cron job:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Handle manual invocations or API checks
  return res.status(200).json({ status: 'Bot is active' });
}
// Import the libraries we need
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// Database functions for storing the last post time
// Uses local variable in development and Edge Config in production
let lastPostTimeLocal = null;

// Configure Twitter API client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// Function to generate a funny tweet using Claude
async function generateFunnyTweet() {
    // List of AI pioneers with their brief descriptions
    const pioneers = [
      {
        name: "Elon Musk",
        description: "Founder of xAI, known for bold, provocative statements about AI's future and Mars colonization."
      },
      {
        name: "Sam Altman",
        description: "OpenAI CEO, known for his thoughtful but optimistic perspectives on AI's potential and risks."
      },
      {
        name: "Dario Amodei",
        description: "Anthropic CEO, known for his focus on AI safety and responsible development of AI systems."
      },
      {
        name: "Alan Turing",
        description: "Father of theoretical computer science and AI, known for his brilliant, philosophical approach."
      },
      {
        name: "Marvin Minsky",
        description: "AI pioneer, co-founder of MIT's AI lab, known for his strong opinions and bold predictions."
      },
      {
        name: "Demis Hassabis",
        description: "DeepMind CEO, known for his passion for combining neuroscience and AI."
      },
      {
        name: "Fei-Fei Li",
        description: "Computer vision pioneer, known for her advocacy for human-centered AI and diversity in the field."
      },
      {
        name: "Yann LeCun",
        description: "Deep learning pioneer, known for his technical expertise and occasional social media debates."
      },
      {
        name: "Geoffrey Hinton",
        description: "Godfather of deep learning, known for his breakthrough work on neural networks and recent AI warnings."
      },
      {
        name: "John McCarthy",
        description: "The person who coined the term 'artificial intelligence', known for his logical, theoretical approach."
      }
    ];
    
    // Randomly select a pioneer
    const pioneer = pioneers[Math.floor(Math.random() * pioneers.length)];
    
    // Create a prompt for Claude that includes the pioneer's identity
    const prompt = `Write a funny, witty tweet (under 280 characters) as if it was written by ${pioneer.name}, ${pioneer.description} The tweet should be humorous and relate to AI, technology, or the future in a way that reflects their personality and viewpoints.`;
    
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          temperature: 0.8,
          system: "You are an expert comedy writer who can perfectly mimic the tone, style, and perspectives of different tech personalities.",
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
      
      // Get the generated tweet text
      const tweetText = response.data.content[0].text.trim();
      
      // Format the final tweet with attribution
      return `${tweetText}\n\n- ${pioneer.name} (AI Parody)`;
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
import { createClient } from '@vercel/edge-config';


// Function to get the last post time
async function getLastPostTime() {
    // Check if we're in Vercel production or local development
    if (process.env.VERCEL) {
      // In Vercel, use Edge Config (only import this in production)
      try {
        const { createClient } = await import('@vercel/edge-config');
        const edgeConfig = createClient(process.env.EDGE_CONFIG);
        return await edgeConfig.get('lastPostTime');
      } catch (error) {
        console.error('Error fetching last post time:', error);
        return null;
      }
    } else {
      // In local development, use memory variable
      return lastPostTimeLocal;
    }
  }

// Function to update the last post time
async function updateLastPostTime(timeString) {
    // Check if we're in Vercel production or local development
    if (process.env.VERCEL) {
      // In Vercel, use Edge Config
      try {
        const { createClient } = await import('@vercel/edge-config');
        const edgeConfig = createClient(process.env.EDGE_CONFIG);
        await edgeConfig.set('lastPostTime', timeString);
        return true;
      } catch (error) {
        console.error('Error updating last post time:', error);
        return false;
      }
    } else {
      // In local development, use memory variable
      lastPostTimeLocal = timeString;
      return true;
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
  
  // NEW CODE: Add test endpoint
  if (req.query.test === 'true') {
    try {
      console.log("Test endpoint triggered");
      
      // Generate and post a tweet
      const tweetText = await generateFunnyTweet();
      console.log("Generated tweet:", tweetText);
      
      const result = await postTweet(tweetText);
      
      // Update the last post time
      await updateLastPostTime(new Date().toISOString());
      
      return res.status(200).json({ 
        success: true, 
        message: 'Test tweet posted successfully', 
        tweet: tweetText 
      });
    } catch (error) {
      console.error('Error in test endpoint:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  // Handle manual invocations or API checks
  return res.status(200).json({ status: 'Bot is active' });
}
  

export { generateFunnyTweet, postTweet };


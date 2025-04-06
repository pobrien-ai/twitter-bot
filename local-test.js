// local-test.js
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';

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
      return `${tweetText}\n\n- ${pioneer.name} (AI being AI)`;
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

// Simple test function
async function testBot() {
  try {
    console.log("Generating tweet...");
    const tweetText = await generateFunnyTweet();
    console.log("Generated tweet:", tweetText);
    
    // Uncomment to actually post the tweet
    // console.log("Posting tweet...");
    // const result = await postTweet(tweetText);
    // console.log("Tweet posted successfully:", result);
  } catch (error) {
    console.error("Error testing bot:", error);
  }
}

// Run the test
testBot();
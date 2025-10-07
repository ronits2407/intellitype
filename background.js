// background.js

// This function is responsible for calling the OpenAI API
async function getAICompletion(text, tone) {
  // 1. Retrieve the user's API key from Chrome's local storage.
  // We use a Promise-based wrapper for chrome.storage.local.get for modern async/await syntax.
  const data = await new Promise((resolve) => {
    chrome.storage.local.get(['apiKey'], resolve);
  });

  if (!data.apiKey) {
    console.error("IntelliType Error: API Key not found.");
    // If the key is missing, we can't proceed.
    return { error: "API Key is not set in the extension settings." };
  }

  // 2. Define the API endpoint and the request payload.
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const requestBody = {
    model: 'gpt-3.5-turbo', // A fast and capable model for this task
    messages: [
      {
        role: 'system',
        // This is the prompt that instructs the AI on how to behave.
        content: `You are a helpful writing assistant. Your task is to complete the user's sentence. The completion should be in a ${tone} tone. Provide ONLY the text that completes the sentence, without repeating the user's original text. Keep the completion concise and natural.`
      },
      {
        role: 'user',
        // This is the text the user has typed so far.
        content: text
      }
    ],
    max_tokens: 40, // Limit the length of the suggestion to avoid long, irrelevant responses.
    temperature: 0.7, // A balanced value for creativity and predictability.
  };

  // 3. Make the API call using the fetch API.
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The API key is sent in the Authorization header.
        'Authorization': `Bearer ${data.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        // Handle non-successful HTTP responses (e.g., 401 Unauthorized, 429 Rate Limit)
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        return { error: `API Error: ${errorData.error.message}` };
    }

    const responseData = await response.json();
    const completion = responseData.choices[0].message.content.trim();
    
    // Return the successful completion
    return { completion: completion };

  } catch (error) {
    console.error("IntelliType Network Error:", error);
    // Handle network errors (e.g., user is offline)
    return { error: "Network error or could not connect to the API." };
  }
}

// 4. Set up a listener for messages from other parts of the extension (like content.js).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is asking for a completion.
  if (request.action === "getCompletion") {
    // Call our async function to get the AI completion.
    getAICompletion(request.text, request.tone).then(result => {
      // Send the result (either the completion or an error) back to the content script.
      sendResponse(result);
    });

    // **IMPORTANT**: Return true to indicate that we will be sending a response asynchronously.
    // This keeps the message channel open until our API call is complete.
    return true;
  }
});

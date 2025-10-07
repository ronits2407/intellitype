// content.js

// UPDATED: The new, more specific selector to target ONLY the chat input box.
const WHATSAPP_INPUT_SELECTOR = 'div[role="textbox"][aria-placeholder="Type a message"]';

let lastKnownText = ''; // Variable to store the last text we saw

function checkForTextChange() {
    const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
    
    // If the input box isn't on the page, do nothing.
    if (!inputBox) {
        return;
    }

    const currentText = inputBox.innerText;

    // Check if the text has actually changed since our last check
    if (currentText !== lastKnownText) {
        console.log("User is typing in CHAT BOX:", currentText);
        
        lastKnownText = currentText; // Update the last known text

        // --- Your API call logic will go here ---
    }
}

const observer = new MutationObserver((mutations, obs) => {
  // We check periodically because the input box can be removed and re-added when you switch chats.
  const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
  if (inputBox) {
    console.log("IntelliType: Chat input box found!");
    
    // Start an interval to check for changes periodically.
    setInterval(checkForTextChange, 200); // Check every 200 milliseconds

    obs.disconnect(); // We can stop observing now.
  }
});

// Start observing the document.
observer.observe(document.body, {
  childList: true,
  subtree: true
});


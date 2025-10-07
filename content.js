// content.js

// The specific selector to target ONLY the chat input box.
const WHATSAPP_INPUT_SELECTOR = 'div[role="textbox"][aria-placeholder="Type a message"]';

// --- GLOBAL VARIABLES ---
let lastKnownText = '';
let ghostTextElement = null; // This will hold our <span> element
let currentSuggestion = ''; // This will store the latest AI suggestion
let debounceTimer;

// --- GHOST TEXT CREATION AND MANAGEMENT ---

// Creates the ghost text <span> element and adds it to the page.
function createGhostElement() {
    if (ghostTextElement) return; // Don't create if it already exists
    ghostTextElement = document.createElement('span');
    ghostTextElement.style.position = 'absolute'; // Crucial for positioning
    ghostTextElement.style.color = '#888'; // Greyed-out color
    ghostTextElement.style.pointerEvents = 'none'; // Makes the span unclickable, so you can click "through" it
    ghostTextElement.style.fontFamily = 'inherit'; // Inherits font from the parent
    ghostTextElement.style.fontSize = 'inherit'; // Inherits font size
    ghostTextElement.style.lineHeight = 'inherit'; // Inherits line height
    document.body.appendChild(ghostTextElement);
    console.log("IntelliType: Ghost text element created.");
}

// Positions the ghost text span correctly after the user's text.
function updateGhostTextPosition() {
    const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
    if (!inputBox || !ghostTextElement || !currentSuggestion) return;

    // The magic part: We create a temporary "range" to find the exact coordinates
    // of the end of the text the user has typed.
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(false); // Collapse the range to the end point
        const rect = range.getBoundingClientRect();
        
        ghostTextElement.style.top = `${rect.top}px`;
        ghostTextElement.style.left = `${rect.left}px`;
        ghostTextElement.innerText = currentSuggestion;
    }
}

// Clears the ghost text from the screen.
function clearGhostText() {
    currentSuggestion = '';
    if (ghostTextElement) {
        ghostTextElement.innerText = '';
    }
}

// --- API CALL LOGIC ---

// Triggers the API call to the background script.
function triggerApiCall(text) {
    if (!text) return;
    chrome.storage.local.get(['tone'], (result) => {
        const tone = result.tone || 'Casual'; // Default to 'Casual' if no tone is set
        chrome.runtime.sendMessage(
            { action: "getCompletion", text: text, tone: tone },
            (response) => {
                if (response && response.completion) {
                    currentSuggestion = response.completion;
                    updateGhostTextPosition();
                } else if (response && response.error) {
                    console.error("IntelliType Error:", response.error);
                    clearGhostText();
                }
            }
        );
    });
}

// --- MAIN TYPING DETECTION LOGIC ---

function checkForTextChange() {
    const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
    if (!inputBox) {
        clearGhostText();
        return;
    }

    const currentText = inputBox.innerText;
    if (currentText !== lastKnownText) {
        lastKnownText = currentText;
        clearGhostText(); // Clear old suggestion when user types something new

        // Debounce the API call
        clearTimeout(debounceTimer);
        if (currentText.trim().length > 0) {
            debounceTimer = setTimeout(() => triggerApiCall(currentText), 500); // Wait 500ms after user stops typing
        }
    } else {
        // If text is the same, just ensure position is correct (in case of window resize, etc.)
        updateGhostTextPosition();
    }
}

// --- EVENT LISTENERS ---

// Handles keyboard interactions (Tab to accept, Escape to dismiss).
function handleKeyDown(event) {
    if (!currentSuggestion) return; // Do nothing if there's no suggestion

    const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
    // Check if we are focused inside the WhatsApp input box
    if (inputBox && inputBox.contains(event.target)) {
        if (event.key === 'Tab') {
            event.preventDefault(); // IMPORTANT: Prevents the focus from moving to the next element
            inputBox.innerText += currentSuggestion;
            lastKnownText = inputBox.innerText;
            clearGhostText();

            // This is a trick to move the cursor to the end of the newly inserted text
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(inputBox);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            clearGhostText();
        }
    }
}

// --- INITIALIZATION ---

// Use a MutationObserver to reliably find the input box when it appears.
const observer = new MutationObserver((mutations, obs) => {
  const inputBox = document.querySelector(WHATSAPP_INPUT_SELECTOR);
  if (inputBox) {
    console.log("IntelliType: Chat input box found!");
    createGhostElement();
    setInterval(checkForTextChange, 200);
    document.addEventListener('keydown', handleKeyDown);
    obs.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


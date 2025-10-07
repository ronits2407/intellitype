// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveButton');
  const apiKeyInput = document.getElementById('apiKey');
  const toneSelect = document.getElementById('tone');
  const statusEl = document.getElementById('status');

  // Load saved settings when popup opens
  chrome.storage.local.get(['apiKey', 'tone'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.tone) {
      toneSelect.value = result.tone;
    }
  });

  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value;
    const tone = toneSelect.value;
    
    // Use chrome.storage.local to save the data
    chrome.storage.local.set({ apiKey: apiKey, tone: tone }, () => {
      statusEl.textContent = 'Settings saved!';
      setTimeout(() => { statusEl.textContent = ''; }, 2000);
    });
  });
});
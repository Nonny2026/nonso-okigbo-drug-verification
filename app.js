// Configuration
const SALT = "VERIFYA_SALT_2026";

// Pre-computed SHA-256 hashes of Valid Codes + Salt
// Codes: X7K4P9Q2BZ, M3V8R1T6LD, J9H2C5A8WY, Q2Z7N6F4XR, S5B1U8K3MG, L0T9E4P7HV, D6Y3W2R8CF, P8N5X1Z6QA, V4G7M0S2JB, H1R6L9T3KP
const VALID_HASHES = {
  "12d1bc1b1157cdd5cdc02a99763d96dfe45024067939e9a43146cdf232076397": {
    productName: "Alpha-Cardio Plus 500mg",
    issued: "2026-02-15"
  },
  "8733e582af8d5fc923df98fc66433094bcce3ef6cba0bedb04f5792fa68c1e08": {
    productName: "ImmunoBoost Daily Shield",
    issued: "2025-11-20"
  },
  "e80c9a93eea183e1d1ee7527d86c602c1364c66bd596ea9e551600d66db43dd8": {
    productName: "NeuroFlex Cognitive Support",
    issued: "2026-01-05"
  },
  "53c328b616fd2e135e6b1c77a7d5da89b49eaaf72a9538846ccda2ade4d405d0": {
    productName: "VitaGlow Derma Repair",
    issued: "2025-08-30"
  },
  "979fbd31b21e1b32168b0370881c3fa2340483e3c1d6ac3d5264b297fdab6690": {
    productName: "BioDigest Enzymes Max",
    issued: "2026-03-01"
  },
  "8c499640addd5de19d56d15aac9540ebe859e6a4692f6c9894a5f7fda9b73780": {
    productName: "OmegaCore Essential Oils",
    issued: "2025-12-10"
  },
  "f1d33128691de6edfe4f807064a6e36ea908cd7a716de63fb9cb50e4d1faad82": {
    productName: "SomniWell Sleep Aid",
    issued: "2026-02-02"
  },
  "943e6f8ca39a2b05ad559b816853c1524b148cbf62bcf84a8bc402ecb8c0a213": {
    productName: "ProJoint Mobility Complex",
    issued: "2025-09-18"
  },
  "4ef1b6dda801d350911aad689ade987ca745c006d01f914c078a5f3adfd964c1": {
    productName: "VisionProtect Ocular Guard",
    issued: "2026-01-22"
  },
  "96e5ef6863ae3382b35ac39f8957f66a525b337ed1267b61e6e64a5da8ac69ed": {
    productName: "HeartBeat Pro Q10",
    issued: "2025-10-15"
  }
};

// Hashing Utility
async function hashString(str) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// DOM Elements
const form = document.getElementById('verify-form');
const input = document.getElementById('code-input');
const inputHint = document.getElementById('input-hint');
const submitBtn = document.getElementById('verify-btn');
const btnText = submitBtn.querySelector('.btn-text');
const spinner = submitBtn.querySelector('.spinner');

const resultArea = document.getElementById('result-area');
const resultIcon = document.querySelector('.result-icon');
const resultTitle = document.querySelector('.result-title');
const resultMessage = document.querySelector('.result-message');
const resultDetails = document.querySelector('.result-details');
const detailProductName = document.getElementById('detail-product-name');
const detailTime = document.getElementById('detail-time');
const resetBtn = document.getElementById('reset-btn');

// Icons (SVG)
const iconSuccess = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const iconError = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Client-side rate limiting (UX only)
let attemptCounter = 0;
let lockoutTimer = null;

// Normalization & Validation
function normalizeInput(val) {
  return val.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function updateInputState() {
  const norm = normalizeInput(input.value);
  input.value = norm; // Auto-uppercase and strip instantly
  
  if (norm.length > 0 && norm.length < 10) {
    submitBtn.disabled = true;
    inputHint.textContent = `Need ${10 - norm.length} more characters`;
    inputHint.classList.remove('error');
    input.classList.remove('error');
  } else if (norm.length === 10) {
    submitBtn.disabled = false;
    inputHint.textContent = "Valid format. Ready to verify.";
    inputHint.classList.remove('error');
    input.classList.remove('error');
  } else if (norm.length > 10) {
    input.value = norm.slice(0, 10); // Trim to 10 max just in case
    updateInputState();
  } else {
    submitBtn.disabled = true;
    inputHint.textContent = "10 characters, letters and numbers";
    inputHint.classList.remove('error');
    input.classList.remove('error');
  }
}

// Events
input.addEventListener('input', updateInputState);

// Handle pasting cleanly (debounce built into normal event loop, but we instantly normalize)
input.addEventListener('paste', (e) => {
  e.preventDefault();
  let paste = (e.clipboardData || window.clipboardData).getData('text');
  let cleanPaste = normalizeInput(paste);
  input.value = cleanPaste.slice(0, 10);
  updateInputState();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const codeToVerify = normalizeInput(input.value);
  
  if (codeToVerify.length !== 10) {
      input.classList.add('error');
      inputHint.classList.add('error');
      inputHint.textContent = "Invalid code length. Must be exactly 10 characters.";
      return;
  }
  
  if (attemptCounter >= 5) {
      input.classList.add('error');
      inputHint.classList.add('error');
      inputHint.textContent = "Too many attempts. Please wait 15 seconds.";
      return;
  }

  // Loading State
  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  spinner.classList.remove('hidden');
  input.disabled = true;

  // Simulate network delay for perceived quality & verification feel
  await new Promise(r => setTimeout(r, 800));

  try {
      // Create hash
      const hash = await hashString(codeToVerify + SALT);
      
      const match = VALID_HASHES[hash];
      
      resultArea.classList.remove('hidden', 'success', 'error');
      
      if (match) {
          // Success
          resultArea.classList.add('success');
          resultIcon.innerHTML = iconSuccess;
          resultTitle.textContent = "Authentic Product";
          resultMessage.textContent = "This product code has been verified successfully.";
          
          detailProductName.textContent = match.productName;
          
          const now = new Date();
          const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
          detailTime.textContent = now.toLocaleDateString(undefined, options);
          
          resultDetails.classList.remove('hidden');
          attemptCounter = 0; // Reset
      } else {
          // Failure
          attemptCounter++;
          resultArea.classList.add('error');
          resultIcon.innerHTML = iconError;
          resultTitle.textContent = "Invalid Code";
          resultMessage.textContent = "This code could not be found in our authorized database. Please check for typos and try again.";
          resultDetails.classList.add('hidden');
          
          if (attemptCounter >= 5) {
            startLockout();
          }
      }
      
      // Announce to screen readers
      resultArea.focus(); // or rely on aria-live="polite"
      
  } catch (err) {
      console.error(err);
      inputHint.textContent = "An error occurred during verification. Please try again.";
      inputHint.classList.add('error');
  } finally {
      // Reset UI elements
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
      input.disabled = false;
  }
});

resetBtn.addEventListener('click', () => {
    resultArea.classList.add('hidden');
    input.value = '';
    updateInputState();
    input.focus();
});

function startLockout() {
    let secondsLeft = 15;
    input.disabled = true;
    submitBtn.disabled = true;
    
    lockoutTimer = setInterval(() => {
        secondsLeft--;
        inputHint.classList.add('error');
        inputHint.textContent = `Too many attempts. Next try in ${secondsLeft}s.`;
        if (secondsLeft <= 0) {
            clearInterval(lockoutTimer);
            attemptCounter = 0;
            input.disabled = false;
            input.value = '';
            updateInputState();
        }
    }, 1000);
}

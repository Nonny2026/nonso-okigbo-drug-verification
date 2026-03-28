# Verifya - Health Product Verification
A beautiful, single-page, vanilla frontend application designed for authenticating health product codes securely and easily.

## Features
- **Frontend Only**: Runs entirely in the browser using simple HTML, CSS, and JS (No Next.js or Node overhead).
- **Secure Obfuscation**: Valid verification codes are never stored as plaintext. The app uses the native Web Crypto API to hash inputs (`SHA-256(code + salt)`) and verify them at runtime.
- **Micro-Animations & UI Polish**: Detailed focus states, soft glassmorphism, loader animations, and high quality typography.
- **Accessibility**: ARIA labels, semantic HTML, and dynamic screen-reader status regions.
- **Mobile First**: Fully responsive layout.
- **Rate Limit UX**: Soft client-side timeout to prevent rapid blind guessing (Not natively secure against botting since it's client-side, but great for UX/Demo purposes).

## Code List (For Demo Purposes)
You can test the system with any of the following pre-registered 10-character codes:
1. `X7K4P9Q2BZ`
2. `M3V8R1T6LD`
3. `J9H2C5A8WY`
4. `Q2Z7N6F4XR`
5. `S5B1U8K3MG`
6. `L0T9E4P7HV`
7. `D6Y3W2R8CF`
8. `P8N5X1Z6QA`
9. `V4G7M0S2JB`
10. `H1R6L9T3KP`

*Note: You can paste them lowercase and the app auto-capitalizes, strips spaces/symbols natively.*

## Setup & Running 
Since it is purely frontend technology without any build tooling dependency, simply open `index.html` in your web browser.

Alternatively, if you use VSCode:
1. Open the folder in VSCode.
2. Run the **Live Server** extension to host `index.html`.
3. Try any of the demo codes!

## Modifying Valid Codes
To protect the actual code lists, the demo utilizes client-side hashing (`SHA-256`). If you wish to rotate the salt or add new validation codes, you can run a script or open your browser console, and calculate the new hashes to replace the `VALID_HASHES` object in `app.js`.

**Example to generate a hash using PowerShell:**
```powershell
$salt = "VERIFYA_SALT_2026"
$code = "NEWCODE123"
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($code + $salt)
$hashBytes = $sha256.ComputeHash($bytes)
($hashBytes | ForEach-Object ToString x2) -join ''
```
Then simply add the resulting `hash` string into `app.js` under the `VALID_HASHES` constant mappings.

## Security Disclaimer 
**For Production Use:** This app operates 100% on the client. Therefore, a sufficiently determined attacker could extract the salt and hashed values. This fits perfectly for a lightweight demo or moderate difficulty verification gate, but for sensitive, financial, or strict healthcare anti-counterfeiting applications, verification **must** be moved behind a server API.

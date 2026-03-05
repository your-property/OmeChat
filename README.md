# OmeChat

A production-quality random video chat platform built with pure HTML, CSS, and JavaScript.

## Features

| Feature | Details |
|---|---|
| Video Chat | WebRTC camera access, local + remote video |
| Authentication | Email signup/login + Facebook OAuth |
| Age Gate | 18+ verification required on every visit |
| Country Filter | Match by country (Premium feature) |
| Premium Badge | ⭐ visible to all users, $25 via Payoneer |
| Ban System | Admin bans by email; banned emails cannot re-register |
| Unban Appeal | $5 via Payoneer, reviewed within 24 hours |
| Report System | In-chat report button, reason-based, admin actionable |
| Admin Panel | Full dashboard at `/admin.html` |
| Mobile Friendly | Responsive layout — stacked video on phones |
| Data Export | Download login_details.json and ban_list.json |

---

## File Structure

```
omechat/
│
├── index.html              ← Main landing page + chat room
├── admin.html              ← Admin dashboard
│
├── css/
│   ├── variables.css       ← Design tokens (colors, spacing, fonts)
│   ├── reset.css           ← CSS reset + base styles
│   ├── components.css      ← Buttons, inputs, modals, badges, toasts
│   ├── landing.css         ← Navbar, hero, features, footer
│   ├── chat.css            ← Chat room, video panels, messages
│   └── admin.css           ← Admin layout, tables, sidebar
│
├── js/
│   ├── db.js               ← All data operations (users, bans, reports)
│   ├── auth.js             ← Login, signup, session, Facebook OAuth
│   ├── ui.js               ← Modals, toasts, navbar state, form utils
│   ├── chat-engine.js      ← WebRTC, partner matching, mic/cam controls
│   ├── app.js              ← Main controller (wires everything together)
│   └── admin.js            ← Admin dashboard controller
│
└── README.md
```

---

## Setup Before Deploying

### 1. Update Payment Links
Open `index.html` and `admin.html` and replace:
```
https://payoneer.com/pay/premium   →  your real $25 premium Payoneer link
https://payoneer.com/pay           →  your real $5 unban Payoneer link
```

### 2. Change Admin Password
Open `js/admin.js` and change:
```js
const ADMIN = { username: 'admin', password: 'omechat2025!' };
```
Use a strong, unique password.

### 3. (Optional) Facebook OAuth
In `js/auth.js`, the `loginWithFacebook()` function uses a prompt simulation.
For real Facebook login, replace the function body with the Facebook JavaScript SDK:
```js
// 1. Add to <head>: <script async src="https://connect.facebook.net/en_US/sdk.js"></script>
// 2. Initialize: FB.init({ appId: 'YOUR_APP_ID', version: 'v18.0' })
// 3. Replace loginWithFacebook() body with:
FB.login(response => {
  if (response.authResponse) {
    FB.api('/me', { fields: 'name,email' }, data => {
      // use data.name and data.email
    });
  }
});
```

---

## Publishing on GitHub Pages

### Step 1 — Create a GitHub Account
Go to [github.com](https://github.com) and create a free account.

### Step 2 — Create a New Repository
1. Click **+** → **New repository**
2. Name it `omechat` (or anything you want)
3. Set to **Public**
4. Click **Create repository**

### Step 3 — Upload Files
**Easy way (GitHub web interface):**
1. On the repo page, click **"uploading an existing file"**
2. Open your `omechat` folder and select **all files and folders**
3. Click **Commit changes**

> Note: GitHub web upload doesn't support folders by default.  
> Drag files from each subfolder separately (css/, js/ first, then HTML files).

**Better way (Git command line):**
```bash
# Install Git from git-scm.com if you don't have it
cd path/to/omechat
git init
git add .
git commit -m "Initial OmeChat deploy"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/omechat.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

### Step 5 — Your site is live!
Wait 1–2 minutes, then visit:
```
https://YOURUSERNAME.github.io/omechat
```

### Step 6 — Custom Domain (Optional)
1. Buy a domain from Namecheap, GoDaddy, or Cloudflare
2. In GitHub Pages settings → enter your domain in **Custom domain**
3. In your DNS provider, add a CNAME record:
   - Name: `www` (or `@` for root)
   - Value: `YOURUSERNAME.github.io`

---

## Production Upgrade Notes

For a fully production-ready version, consider:

| What | Current | Production |
|---|---|---|
| Data storage | `localStorage` | MongoDB / PostgreSQL + REST API |
| Real video connections | Simulated | Node.js + Socket.io signaling server |
| TURN server | STUN only (Google) | Deploy coturn for users behind NAT |
| Facebook OAuth | Prompt simulation | Real Facebook SDK + App ID |
| Admin auth | Hardcoded | JWT / server-side sessions |
| Password storage | Plaintext | bcrypt hashing |

### Recommended signaling server (for real video)
```
Hosting: Railway.app or Render.com (free tiers available)
Stack: Node.js + Express + Socket.io + coturn
```

---

## Admin Panel

- URL: `/admin.html`
- Default login: `admin` / `omechat2025!`
- Change the password in `js/admin.js` before going live

### Admin capabilities
- View all users and their status
- Ban users by email with a reason
- Unban users after payment verification
- Activate Premium after payment verification
- View and resolve reports
- Export data as JSON files

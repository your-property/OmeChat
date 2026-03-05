# OmeChat

A random video chat platform similar to OmeTV, with premium features, ban management, and country filtering.

## Features
- **Video Chat** - Random 1-on-1 video calls using WebRTC
- **Auth** - Email signup/login + Facebook OAuth
- **18+ Verification** - Age gate on every visit
- **Country Filter** - Match with users from specific countries (Premium feature)
- **Premium Badge** - $25 via Payoneer - visible ⭐ PREMIUM badge next to your name
- **Ban System** - Admin can ban users; banned emails cannot create new accounts
- **Unban Payment** - $5 via Payoneer to appeal a ban
- **Admin Panel** - `/admin.html` - full user management dashboard
- **Mobile Friendly** - Responsive layout for phones and tablets
- **Report System** - Users can report violations

## File Structure
```
omechat/
├── index.html          # Main app
├── admin.html          # Admin dashboard (admin/omechat2025)
├── css/
│   └── style.css       # All styles
├── js/
│   ├── storage.js      # Data persistence (localStorage)
│   ├── auth.js         # Login, signup, ban logic
│   ├── chat.js         # WebRTC video chat
│   └── app.js          # App logic, modals
├── data/
│   ├── login_details.json   # User data schema
│   └── ban_list.json        # Ban records schema
└── README.md
```

## Payment Links
- **Premium ($25):** https://payoneer.com/pay/premium
- **Unban ($5):** https://payoneer.com/pay
> Replace these with your real Payoneer payment links

## Admin Panel
Go to `/admin.html` — Login: `admin` / `omechat2025`
Change the password in `admin.html` before deploying.

## Deploy on GitHub Pages
1. Push to a GitHub repository
2. Go to Settings → Pages → Source: main branch, /root
3. Your site: `https://yourusername.github.io/omechat`

## Production Upgrade Notes
For a real production app, replace:
- `localStorage` → MongoDB/PostgreSQL backend
- WebRTC simulation → Socket.io signaling server
- Facebook OAuth simulation → Real Facebook SDK
- Admin password → Environment variable

## Technologies
- HTML5, CSS3, Vanilla JavaScript
- WebRTC for video
- Font Awesome icons
- Google Fonts (Rajdhani + Inter)

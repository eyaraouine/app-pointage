---
description: How to deploy the application to Firebase Hosting
---

1. Install Firebase CLI (if not already done)
```powershell
npm install -g firebase-tools
```

2. Login to Firebase
```powershell
firebase login
```

3. Initialize Firebase Hosting
```powershell
firebase init hosting
```
> [!IMPORTANT]
> When asked for the public directory, enter `dist`.
> When asked if it's a single-page app, enter `Yes`.

4. Build the application
```powershell
npm run build
```

5. Deploy to Firebase
```powershell
firebase deploy
```

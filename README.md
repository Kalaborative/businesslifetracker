# Business Life Asset Tracker

A web-based asset tracker for the WePlay "Business Life" game. Track your gift-sending progress toward ride and collectible assets across all 54 levels.

## Features

- **Level-based tracking** - Enter your goal level (1-54) and see exactly how much Gold you need
- **Dual gift tracking** - Track both Lucky Cat (Rides) and Lucky Wolf (Collectibles) gifts side by side
- **Progress counters** - Increment/decrement counters for each asset tier with progress bars and guarantee tracking
- **Probability reference** - View drop rates and Gold Mine Contest buff probabilities for every item
- **Persistent state** - Your progress is saved locally so you can pick up where you left off
- **Mobile-friendly** - Responsive design that works on any device

## Usage

Open `index.html` in any modern web browser. No build tools or server required.

1. Enter your target level (1-54)
2. Click **Start Tracking**
3. Use the **+** / **-** buttons to log gifts sent for each asset tier
4. Gold remaining updates automatically as you track

## Reference Tables

- `Lucky Cat.html` - Drop rates and guarantee thresholds for Ride assets
- `Lucky Wolf.html` - Drop rates and guarantee thresholds for Collectible assets

## Tech Stack

Pure HTML, CSS, and vanilla JavaScript — no dependencies.

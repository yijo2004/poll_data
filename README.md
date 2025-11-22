# Poll Statistics Dashboard

A GitHub Pages website displaying Discord poll statistics and voting patterns.

## Setup for GitHub Pages

1. **Generate the data files:**
   ```bash
   python3 create_info.py  # Generates poll_statistics.txt and poll_statistics.png
   ```

2. **Copy necessary files to the repo:**
   - `all_polls.json` - Poll data
   - `poll_statistics.txt` - Overall statistics
   - `poll_statistics.png` - Statistics infographic
   - `index.html` - Main page
   - `styles.css` - Styling
   - `app.js` - JavaScript logic

3. **For individual user stats (optional):**
   - Run `python3 personal_data.py` to generate user stats files
   - Copy `user_stats_*.txt` files to the repo if you want individual stats available

4. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select source branch (usually `main` or `master`)
   - Select `/ (root)` as the folder
   - Save

The website will be available at `https://yourusername.github.io/repository-name/`

## Features

- **Overview Tab**: Shows overall statistics (Biggest Sheep, Hot Takes, Most Active, etc.)
- **Individual Stats Tab**: View detailed statistics for any user
- **All Polls Tab**: Browse all polls with search functionality

## Note

Python scripts are excluded from the repository (see `.gitignore`). Only the generated data files and website files are included.

# NYU Shanghai Shuttle Planner

A phone-friendly web app for planning shuttle trips around class times. The static app runs on GitHub Pages; `app.py` is an optional local Python server for development. It needs no VPN once published at its public HTTPS URL.

## Deploy with GitHub Pages

1. Create a GitHub repository and add the files in this project to its top level: `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, and `icon.svg`. Include this README. `app.py` and `requirements.txt` are only needed for local Python serving.
2. In that repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose branch **main**, folder **/(root)**, and click **Save**.
5. Wait for the Pages deployment to finish. The public address is `https://YOUR-GITHUB-NAME.github.io/REPOSITORY-NAME/`.
6. Open that HTTPS address on a phone. On iPhone, tap **Share → Add to Home Screen**. On Android, use the browser menu and choose **Install app** or **Add to Home screen**.

## Student guide

1. Open the app and select **Bus departures**.
2. Choose **Mon–Fri**, **Saturday** or **Sunday**, then choose **Dorms → Campus** or **Campus → Dorms**.
3. The Fall 2026 timetable (effective August 31, 2026) is prefilled for both directions. Review it against the current official schedule. To change any list, enter times in 24-hour format separated by commas and tap **Save these departures**. Saturday and Sunday use the same timetable from the PDF.
4. In **Class schedule**, add each class name, day, start time and shuttle direction.
5. The Today screen shows up to the three latest saved buses that depart before each upcoming class. The newest of those is marked **Last bus**.
6. Tap **Enable** to allow browser notifications. While the app is open, it sends a reminder ten minutes before that last departure.
7. To enter times from a file, choose a timetable PDF or screenshot. Review extracted times carefully before saving; image/PDF text recognition can misread times. Class schedule imports show detected times to tap, then the student fills in the class details.

### Fall 2026 departures transcribed from the schedule

The PDF labels the routes **JY to Campus** and **Campus to JY**. In the app these appear as **Dorms → Campus** and **Campus → Dorms**.

| Days | JY / Dorms → Campus | Campus → JY / Dorms |
|---|---|---|
| Monday–Friday | 07:30, 07:45, 08:00, 08:30, 08:45, 09:00, 09:15, 09:30, 10:00, 10:30, 10:45, 11:00, 11:30, 12:15, 13:00, 13:45, 15:15, 16:45, 17:30, 18:15, 19:30 | 09:45, 11:30, 12:45, 13:30, 14:15, 15:00, 15:45, 16:15, 16:45, 17:00, 17:15, 17:45, 18:15, 18:45, 19:15, 19:45, 20:15, 20:45, 21:00, 21:15, 21:30, 21:45, 22:00, 22:15, 22:30, 22:45, 23:00 |
| Saturday–Sunday | 09:00, 09:30, 10:30, 11:30, 12:45, 14:00, 16:30 | 11:00, 16:00, 17:45, 18:45, 19:45, 20:15, 20:45 |

Each student's schedule stays in that browser on that device. No class schedule is uploaded to the repository or server. Clearing browser storage will erase the saved schedule.

## Run locally with Python

```sh
python3 app.py
```

Open `http://localhost:8000`. The project has no Python package dependencies. On a phone, local development is only reachable on the same Wi-Fi and browser notification permission generally requires HTTPS or localhost.

## Notification and import limits

The reminder timer runs in the open app page. GitHub Pages cannot wake a fully closed or suspended phone app, so push reminders while closed need a separate always-on push backend and credentials. This project does not include that service.

PDF and image time recognition load PDF.js and Tesseract.js from public CDNs. If those CDNs are unavailable on a network, students can still open the local file preview and type departures or class times manually. Fall 2026 times were transcribed from the one-page schedule image provided in chat. Verify them against NYU Shanghai's current official schedule before relying on the app.

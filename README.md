# NYU Shanghai Shuttle Planner

A phone-friendly shuttle planning web app. The Fall 2026 timetable is built in as fixed data; students cannot edit it. Students can add class times manually, select multiple days for a recurring class, and see the next three earlier buses. Student schedules are stored only in the browser on that device.

## Try it on a phone

Open the GitHub Pages address: `https://sat10124-jpg.github.io/NYUSH-Shuttlebus-Planner/`.

- iPhone: open the address in Safari, tap **Share**, then **Add to Home Screen**.
- Android: open the address in Chrome, open the browser menu, then choose **Install app** or **Add to Home screen**.

The site is a progressive web app (PWA), so it can be added to a phone's home screen. It is not currently an App Store or Google Play listing. Availability depends on whether the student's network can reach GitHub Pages; a VPN is not required by the app itself, but networks may restrict the host.

## Edit the project yourself

You do not need to download every file just to use the app. To edit the code, open the repository [NYUSH-Shuttlebus-Planner](https://github.com/sat10124-jpg/NYUSH-Shuttlebus-Planner) and either:

1. Click **Code → Download ZIP**, extract the ZIP, and edit the files in a code editor such as VS Code; or
2. Edit a file directly on GitHub with the pencil button, then commit the change.

The main app files are `index.html` (page layout), `styles.css` (appearance), and `app.js` (schedule and app behavior). `sw.js` handles offline caching. `manifest.webmanifest` and `icon.svg` provide install details. `app.py` and `requirements.txt` are only for running a local development server. Changes committed to the `main` branch are published by GitHub Pages when its deployment completes. To work on a downloaded copy and publish edits, push/commit those files to the repository's `main` branch.

For local preview, install Python 3 if needed, open Terminal in the project folder, and run:

```sh
python3 app.py
```

Then visit `http://localhost:8000` on the computer. The phone can preview that local server only if it is on the same Wi-Fi and the computer allows the connection; the public Pages URL is easier for friends to try.

## Student instructions

1. In **Plan when to leave**, choose the estimated time needed to reach the shuttle stop (10 minutes by default). The app subtracts that buffer from each bus departure to show a **Leave by** time.
2. Open **Class schedule**.
3. Enter a class name and start time. Tap **Mon–Fri** for a weekday class, or select any combination of individual days, including Saturday or Sunday.
4. Choose the bus direction and tap **Add class**. Each row can represent one class recurring on all selected days.
5. The **Today** section shows the next classes and up to three buses before each class. The latest of those is marked **Last bus**.
6. Tap **Enable** for a reminder when it is time to leave for the last bus. The app page must remain open for this first version's reminder timer to run.

Schedule upload is optional and best-effort: image recognition can miss or misread times, and it does not reliably understand a timetable's class names and day layout. Use the manual form to enter and verify class details. Uploads and saved class schedules remain on the device.

## Fixed Fall 2026 bus timetable

Transcribed from the one-page schedule image supplied in chat, effective Monday August 31, 2026. The app owner must update this data in `app.js` when the university publishes a new schedule.

| Days | JY / Dorms → Campus | Campus → JY / Dorms |
|---|---|---|
| Monday–Friday | 07:30, 07:45, 08:00, 08:30, 08:45, 09:00, 09:15, 09:30, 10:00, 10:30, 10:45, 11:00, 11:30, 12:15, 13:00, 13:45, 15:15, 16:45, 17:30, 18:15, 19:30 | 09:45, 11:30, 12:45, 13:30, 14:15, 15:00, 15:45, 16:15, 16:45, 17:00, 17:15, 17:45, 18:15, 18:45, 19:15, 19:45, 20:15, 20:45, 21:00, 21:15, 21:30, 21:45, 22:00, 22:15, 22:30, 22:45, 23:00 |
| Saturday–Sunday | 09:00, 09:30, 10:30, 11:30, 12:45, 14:00, 16:30 | 11:00, 16:00, 17:45, 18:45, 19:45, 20:15, 20:45 |

## Current limits and App Store path

- Reminders run in the open app page. Background notifications and location-aware alerts for a closed app are not configured yet.
- GitHub Pages serves the public web app; it does not publish native store apps. A store release would require packaging the web app for iOS and Android, store developer accounts, privacy/support details, and store review. This repository is a usable PWA for a small friend trial now.
- The app has no login or cloud sync. Each person's classes remain in that person's browser and do not transfer automatically between devices.
- GitHub Pages is public, so anyone with the URL can use the app. The timetable is fixed for this version; future timetable changes should be made by the app maintainer and published to everyone.

## Native alert build (in progress)

The `native-alerts` branch adds a Capacitor project setup, on-device scheduled reminders, and a GitHub Actions build for iOS Simulator and Android debug builds. Notifications are scheduled at each class's **Leave by** time. The optional Qiantan campus geofence is configured as a 150 m region; when enabled, it gates campus-to-dorm reminders. Location is not uploaded. The web link does not gain these native features.

The native branch still needs its hosted builds and real-phone permission/geofence checks before it is ready to share as a finished location-aware app.

The repository's **Actions** tab can run the native build workflow. No Node.js or Xcode install is needed on the laptop for that hosted build. To build locally, install Node.js and Xcode for iOS; Android local builds also require Android Studio and its SDK.

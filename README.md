# NOCTURNE – College Event Registration Portal
Tagline: *Where Campus Life Comes Alive.* (change `BRAND` at the top of `script.js`).
A static site for the ORACLE Level 2 Fundamentals of Web Development hackathon: explore college events, view details, register, and manage registrations.

## Features
1. Events rendered from a JavaScript dataset (featured + main list share it)
2. Search by name, filter by category and date (combinable, with reset and empty state)
3. Accessible detail dialog (close button, Escape key)
4. Registration form with required-field and email-syntax validation
5. Duplicate prevention (normalised email + event ID)
6. My Registrations lookup by email
7. Cancellation with confirmation, honouring each event's policy and deadline
8. Local Storage persistence (key `nocturne.registrations.v1`)
9. Live registration counts
10. Capacity checks, re-run immediately before every save

Re-registration policy: after cancelling, a student may register again if registration is open and seats remain.

**Limitation:** Local Storage is per browser and per site address. It is not a database, does not sync across devices, and is not authentication.

## Technologies
HTML5, CSS3, vanilla JavaScript. No build step, no backend.

## Structure
```
college-event-registration-portal/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run in VS Code
1. Open the folder in VS Code. 2. Install the Live Server extension. 3. Right-click `index.html` → *Open with Live Server*.

## Upload to GitHub
1. Create a new repository on github.com (name of your choice). 2. Upload the four files (*Add file → Upload files*) so `index.html` is at the repository root, then commit.

## Publish with GitHub Pages
1. Repository *Settings → Pages*. 2. Under *Build and deployment*, choose *Deploy from a branch*, select your main branch and the `/ (root)` folder, then save.
3. After a minute or two, the page shows your site URL at the top of the Pages settings. Open it and run through the testing checklist yourself.

## Notes for your report
Sample images load from Unsplash; if one fails, a built-in gradient fallback appears. Take your own screenshots and record your own test results after running the site.
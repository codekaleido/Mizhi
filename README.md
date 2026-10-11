# Mizhi

A minimal, view-only photography gallery. Oversized type, floating 3D photo layers, a cursor-responsive contour background, automatic masonry layout, and a full-screen viewer.

## Open it

Double-click **index.html**. No installation or build is needed. You can also use VS Code's Live Server. The included photographs are **sample images from Unsplash, not your personal work**. Replace them before publishing your own collection. Image source URLs are in CREDITS.md.

The optional Google Fonts request improves the typography. System fonts are used when offline. Photographs and all application code are local; there are no tracking scripts, API keys, or server dependencies.

## Add or remove photos — without installing anything

1. Put your JPG, PNG, WebP, AVIF, or GIF in **assets/photos/**. Convert HEIC phone images to JPEG first. Prefer images around 1600–2400 pixels wide for fast loading.
2. Open **photos.js** in VS Code.
3. Add an object to the list to post a picture, or remove its object to unlist it. Keep commas between entries. The order of entries is the gallery's order; the first photo is the central hero image.

```js
window.MIZHI_PHOTOS = [
  {
    "id": "evening-light",
    "src": "assets/photos/evening-light.jpg",
    "title": "Evening light",
    "alt": "Warm evening sunlight falling across a quiet street"
  }
];
```

Use forward slashes in paths and simple filenames such as `evening-light.jpg`. Paths and capitalization must exactly match the image. `title` is the small caption; `alt` describes the photo for screen-reader users. Optional `width` and `height` values reserve the correct space before loading. Actual proportions are detected automatically. Remove stale dimensions if you replace an image with a different crop.

Removing an entry hides the image from the gallery. To remove the publicly accessible image file too, delete that file from **assets/photos/** and commit the deletion. Existing copies and Git history are separate from the live website.

## Optional local add/delete commands

If Node.js is installed, open a terminal in this folder. No npm install is needed.

```sh
# Copy a photo into the project and append it to the gallery
node scripts/photos.mjs add "C:/Users/YourName/Pictures/beach.jpg" "Evening at the beach"

# Find the ID of a photo
node scripts/photos.mjs list

# Unlist a photo by its ID
node scripts/photos.mjs remove evening-at-the-beach

# Rebuild from ALL image files in assets/photos, sorted by filename
node scripts/photos.mjs sync
```

The remove command preserves the original image file. Delete that file yourself to remove it from the public folder. **sync includes every image in the folder**, so it will re-add an unlisted image if its file is still present. Prefix filenames with `01-`, `02-`, etc. to control sync order. Alternatively, edit photos.js to choose any order.

## Publish manually on GitHub Pages

1. Extract this ZIP. Create a GitHub repository named `mizhi` (or another name).
2. Upload the **contents of the mizhi folder** into the repository root. `index.html` must be at the root, alongside `styles.css`, `app.js`, `photos.js`, and `assets/`.
3. Commit the files to your main branch.
4. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/ (root)**, and save.
5. Open the Pages URL shown by GitHub when deployment finishes. For a normal project repository, it is usually `https://YOUR-USERNAME.github.io/mizhi/`.

When changing photographs, commit both the updated **photos.js** and any new or deleted image files. GitHub Pages publishes the changes. Do not upload the ZIP as the website; extract it first.

All asset paths are relative, so the site supports a repository subpath as well as a custom domain. No build command, environment variables, database, or hosting subscription is needed for the site itself.

## Who can edit?

There are no upload, delete, login, or admin controls in the public interface, and no write API. Changes are made only in your local files or by people with write access to your GitHub repository. Keep repository write access restricted to yourself. Visitors can view the site and its public images/source; they cannot publish edits to your repository through this page. A password hidden in frontend JavaScript would not provide security, so this project has none.

## Customize

- **styles.css:** colors in `:root`, typography, spacing and motion styling.
- **index.html:** page title and tiny labels.
- **photos.js:** photo order, paths, captions and accessible descriptions.
- **app.js:** masonry sizing, photo viewer, 3D hover and animated contour field.
- **scripts/photos.mjs:** optional local content management; never executed by the webpage.

The viewer supports Escape, left/right arrow keys and mobile swipes. Tab navigation and visible focus styles are included. The header's three-line motion button pauses animation; the operating system's reduced-motion preference is respected automatically. No edits are saved through the viewer.

## Verification

JavaScript syntax, image decoding, local file references, and the local photo-management workflow were checked during packaging. A browser visual review was unavailable in the build environment. Preview index.html on your desktop and phone before publishing your final photos.

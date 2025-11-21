Project Commands

Quick reference for linting, running the functions emulator, and deploying.

🧹 Linting
Run ESLint
npm run lint

Run ESLint directly
npx eslint .

Auto-fix lint errors
npx eslint . --fix

🧪 Emulator (Functions Only)

Start the local emulator for Cloud Functions only:

firebase emulators:start --only functions


Or if you have it in an npm script:

npm run emulator:functions


(Rename the script if needed.)

🚀 Deploy

Deploy Cloud Functions:

firebase deploy --only functions


Deploy all Firebase resources (if ever needed):

firebase deploy
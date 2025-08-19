
# How to Publish and Manage Your Competition App

Welcome! This guide provides the step-by-step instructions to deploy your application to the web, making it accessible to your judges and the public.

## Prerequisites

Before you can deploy, you need to install the Firebase Command Line Interface (CLI). This is a tool that lets you manage and deploy your Firebase project from your computer.

1.  **Install Node.js:** If you don't have it, install Node.js from the official website: [https://nodejs.org/](https://nodejs.org/)
2.  **Install Firebase CLI:** Open your computer's terminal (like Command Prompt, PowerShell, or Terminal on Mac) and run this command:
    ```bash
    npm install -g firebase-tools
    ```

## Step 1: Log in to Firebase

You need to connect the Firebase CLI to your Google account.

1.  In your terminal, run the following command:
    ```bash
    firebase login
    ```
2.  This will open a browser window asking you to log in with your Google account. Choose the same account you used to create this project.

## Step 2: Create Organizer Accounts

Your application is now configured to use Firebase Authentication for organizers. You need to create at least one organizer account.

1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Select your project (`jlks-paradip`).
3.  In the left-hand menu, go to **Build > Authentication**.
4.  Click the **"Get started"** button.
5.  In the "Sign-in method" tab, click on **"Email/Password"** and enable it.
6.  Go to the **"Users"** tab and click **"Add user"**.
7.  Enter the email and a secure password for your first organizer. You can add more organizers here at any time.

These are the credentials you will use to log into the Organizer's Dashboard.

## Step 3: Set Up Security Rules

To protect your data, you need to set up Firestore Security Rules. These rules define who can read and write data.

1.  In the **[Firebase Console](https://console.firebase.google.com/)**, go to **Build > Firestore Database**.
2.  Go to the **"Rules"** tab.
3.  Replace the existing rules with the following and click **"Publish"**:

    ```
    rules_version = '2';

    service cloud.firestore {
      match /databases/{database}/documents {

        // Helper function to check if a user is an authenticated organizer
        function isOrganizer() {
          return request.auth != null;
        }

        // Public users can submit a registration, but only organizers can read them.
        match /registrations/{registrationId} {
            allow create: if true;
            allow read, write, delete: if isOrganizer();
        }

        // Schools can be read by anyone, but only created, updated,
        // or deleted by an organizer.
        match /schools/{schoolId} {
          allow read: if true;
          allow write: if isOrganizer();
        }

        // Judges can be read by anyone, but only managed by an organizer.
        match /judges/{judgeId} {
          allow read: if true;
          allow write: if isOrganizer();
        }

        // Categories can be read by anyone, but only managed by an organizer.
        match /categories/{categoryId} {
          allow read: if true;
          allow write: if isOrganizer();
        }
        
        // Settings can be read by anyone, but only written by an organizer
        match /settings/{settingId} {
            allow read: if true;
            allow write: if isOrganizer();
        }

        // Scores and Feedback can be written by anyone (judges),
        // but can only be deleted by an organizer during a competition reset.
        match /scores/{scoreId} {
          allow read: if true;
          allow create, update: if true;
          allow delete: if isOrganizer();
        }

        match /feedbacks/{feedbackId} {
          allow read: if true;
          allow create, update: if true;
          allow delete: if isOrganizer();
        }
      }
    }
    ```

## Step 4: Deploy Your Application

This is the final step to put your application on the internet!

1.  Navigate to your project's code directory in your terminal.
2.  Run the following command to deploy your app:
    ```bash
    firebase deploy --only hosting
    ```
3.  The command will run for a minute or two. When it's finished, it will display a **"Hosting URL"**. This is the public link to your application!

You can share this URL with your judges and audience.

Congratulations! Your competition scoring application is now live. You can re-run the `firebase deploy --only hosting` command anytime you make changes to your app that you want to publish.

    
<div align="center">

  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Gemini_API-AI-orange?style=flat-square&logo=google" alt="Gemini API" />

</div>

<br />
<br />

# Muktavidya

A lightweight, privacy-conscious platform for generating and rendering AI-powered mathematical solutions.

<br />

Muktavidya is built to provide seamless, accurate, and beautifully rendered math solutions.

By leveraging the Gemini API and a modern web stack, it offers a responsive and robust experience for users who need fast answers without compromising their privacy.

The application relies on anonymous architecture, avoiding heavy user identity providers. Everything is stored locally, ensuring complete ownership of your data.

<br />
<br />

## Features

<br />

*   **AI-Powered Solving**
    Integrates with the Gemini API to break down complex mathematical problems into understandable steps.

<br />

*   **Beautiful Typography**
    Employs KaTeX and custom Markdown rendering for crystal-clear mathematical equations on all devices.

<br />

*   **Privacy First**
    Operates without heavy user authentication. Your history and settings are stored locally on your device via IndexedDB.

<br />

*   **Responsive Design**
    Features a carefully crafted interface utilizing Tailwind CSS, ensuring perfect alignment and readability across mobile and desktop environments.

<br />

*   **Lightning Fast**
    Built on Next.js 16 App Router for optimal performance, fast loading, and an excellent user experience.

<br />
<br />

## Technology Stack

<br />

The project relies on a curated set of modern tools to ensure both performance and maintainability:

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **AI Integration:** Google Gemini API SDK
*   **Math Rendering:** KaTeX and React Markdown
*   **Local Storage:** IndexedDB
*   **Rate Limiting:** Upstash Redis

<br />
<br />

## Getting Started

<br />

Follow these steps to set up the project locally.

<br />

### 1. Installation

Clone the repository to your local machine, then install the dependencies:

```bash
npm install
```

<br />

### 2. Configuration

Configure your environment variables in your local environment. You will need to set up your Gemini API key and Upstash Redis credentials for the application to function correctly.

<br />

### 3. Running the Server

Start the local development server:

```bash
npm run dev &
```

Open your browser and navigate to `http://localhost:3000`.

<br />
<br />

## Architecture Notes

<br />

Muktavidya embraces a minimalist philosophy.

We avoid heavy database drivers and third-party authentication services to maintain a lightweight footprint. State management is handled natively, and rate-limiting is implemented via browser-driven validation combined with server-side IP tracking.

The aesthetic focuses on clarity, featuring a strict dark mode with frosted zinc and diffused electric blue elements.

<br />
<br />

## License

This project is licensed under the MIT License.

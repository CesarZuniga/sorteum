# Sorteum

Sorteum is a modern, feature-rich raffle management platform built with Next.js 15 and Supabase. It allows administrators to create and manage raffles, while providing users with a seamless experience to browse, participate, and track raffle outcomes.

## Key Features

-   **Raffle Management**: Create, update, and delete raffles with ease. Set ticket prices, deadlines, and images.
-   **Ticket System**: Secure ticket purchasing and reservation system.
-   **Real-time Updates**: Live status updates for raffles and tickets.
-   **Admin Dashboard**: Comprehensive dashboard for managing raffles, viewing sales, and tracking performance.
-   **Internationalization (i18n)**: Built-in support for multiple languages using `next-intl`.
-   **Responsive Design**: Fully responsive UI built with Tailwind CSS and Shadcn UI, looking great on all devices.
-   **Secure Authentication**: User and admin authentication via Supabase Auth.

## Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (based on Radix UI)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
-   **Forms**: React Hook Form + Zod
-   **Icons**: Lucide React

## Getting Started

### Prerequisites

-   Node.js 18+
-   pnpm (recommended) or npm/yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd sorteum
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up Environment Variables:
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### Running the Application

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components
│   ├── ui/           # Shadcn UI primitives
│   └── ...           # Custom components
├── lib/              # Utility functions, data fetching, and definitions
├── hooks/            # Custom React hooks
├── messages/         # i18n translation files
└── firebase/         # Firebase configuration (if applicable)
```

## Scripts

-   `pnpm dev`: Starts the development server with Turbopack.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server.
-   `pnpm lint`: Runs the linter.
-   `pnpm typecheck`: Runs TypeScript type checking.

## Learn More

To learn more about the technologies used in this project, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
-   [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS.

# AI Rules for Sorteum Digital Development

This document outlines the core technologies used in the Sorteum Digital application and provides clear guidelines on which libraries to use for specific functionalities. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen tech stack.

## Tech Stack Overview

*   **Frontend Framework**: Next.js for building the user interface and handling routing.
*   **Styling**: Tailwind CSS for all styling, providing a utility-first approach for responsive and consistent designs.
*   **UI Components**: shadcn/ui, built on Radix UI, for accessible and customizable UI components.
*   **Icons**: Lucide React for a comprehensive set of vector icons.
*   **State Management**: Standard React hooks (`useState`, `useEffect`, `useMemo`, `useActionState`) for component-level and form state.
*   **Form Handling & Validation**: React Hook Form for robust form management, paired with Zod for schema-based validation.
*   **Date & Time Utilities**: `date-fns` for efficient date manipulation and formatting.
*   **AI Integration**: Genkit AI, utilizing the Google GenAI plugin, for intelligent features like winner selection and notifications.
*   **Backend/Data Layer**: Firebase (Firestore for database, Auth for authentication) for data persistence and user management.
*   **Server-side Logic**: Next.js Server Actions for handling server-side data mutations and API calls.

## Library Usage Rules

To maintain a consistent and efficient codebase, please follow these guidelines when developing new features or modifying existing ones:

*   **UI Components**:
    *   **Always** use components from `shadcn/ui` (e.g., `Button`, `Card`, `Input`, `Table`, `Dialog`, `Toast`).
    *   If a required component is not available in `shadcn/ui` or needs significant customization, create a new component in `src/components/` that composes `shadcn/ui` primitives or uses raw HTML with Tailwind CSS. **Do not modify existing `shadcn/ui` files.**
*   **Styling**:
    *   **Exclusively** use Tailwind CSS classes for all styling. Avoid inline styles or separate CSS files (except for global styles in `src/app/globals.css`).
    *   Ensure designs are responsive by utilizing Tailwind's responsive utility classes.
*   **Icons**:
    *   **Always** use icons from the `lucide-react` library.
*   **Forms**:
    *   For any form creation or management, **always** use `react-hook-form`.
    *   For form validation, **always** use `zod` schemas in conjunction with `react-hook-form`'s resolvers.
*   **Date & Time**:
    *   For any date parsing, formatting, or manipulation, **always** use functions from `date-fns`.
*   **Data Persistence (Firebase)**:
    *   For interacting with Firestore, use the custom hooks and utilities provided in `src/firebase/` (e.g., `useCollection`, `useDoc`).
    *   For write operations (create, update, delete) to Firestore, **always** use the non-blocking functions from `src/firebase/non-blocking-updates.tsx` (e.g., `addDocumentNonBlocking`, `updateDocumentNonBlocking`, `deleteDocumentNonBlocking`).
    *   For Firebase Authentication, use the provided non-blocking functions in `src/firebase/non-blocking-login.tsx`.
*   **Server-side Actions**:
    *   For any data mutations or operations that require server-side logic, **always** use Next.js Server Actions (defined in `src/lib/actions.ts`).
*   **AI Functionality**:
    *   All AI-related logic should be implemented using Genkit AI flows and prompts, as demonstrated in `src/ai/flows/`.
*   **Routing**:
    *   Utilize Next.js App Router for all navigation and page structures. Keep routes organized within the `src/app/` directory.
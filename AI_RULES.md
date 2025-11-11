# AI Rules for Sorteum Digital

This document outlines the core technologies and best practices for developing the Sorteum Digital application.

## Tech Stack Overview:

*   **Next.js**: A React framework for building full-stack web applications, enabling server-side rendering, static site generation, and API routes.
*   **React**: The primary JavaScript library for building interactive user interfaces.
*   **TypeScript**: A strongly typed superset of JavaScript that enhances code quality and developer experience.
*   **Tailwind CSS**: A utility-first CSS framework used for rapid and consistent styling across the application.
*   **shadcn/ui**: A collection of beautifully designed, accessible, and customizable UI components built with Radix UI and Tailwind CSS.
*   **Radix UI**: A low-level UI component library providing unstyled, accessible primitives for building design systems.
*   **Lucide React**: An extensive icon library for incorporating scalable vector graphics into the UI.
*   **Firebase**: Google's platform for developing mobile and web applications, used here for authentication (Firebase Auth) and real-time database (Firestore).
*   **Genkit AI**: An open-source framework for building AI-powered applications, integrated with Google GenAI for generative AI capabilities.
*   **Zod**: A TypeScript-first schema declaration and validation library, used for data validation.
*   **React Hook Form**: A performant, flexible, and extensible forms library for React.
*   **date-fns**: A comprehensive and consistent toolset for manipulating JavaScript dates.

## Library Usage Guidelines:

*   **UI Components**: Prioritize `shadcn/ui` components for all UI elements. If a specific component is not available or requires significant customization, create a new component using Radix UI primitives and style it with Tailwind CSS. **Do not modify `shadcn/ui` component files directly.**
*   **Styling**: All styling must be done using **Tailwind CSS utility classes**. Avoid writing custom CSS in separate files unless it's for global styles (e.g., `globals.css`).
*   **Icons**: Use icons exclusively from the `lucide-react` library.
*   **Forms**: Implement forms using `react-hook-form` for state management and validation. Use `zod` for defining and validating form schemas.
*   **Date Handling**: Use `date-fns` for all date formatting, parsing, and manipulation tasks.
*   **Backend & Data**: Utilize Firebase for authentication and Firestore for database interactions. Leverage the provided Firebase utility hooks and functions (e.g., `useCollection`, `useDoc`, `non-blocking-updates`) for data access and manipulation.
*   **AI Integration**: All AI-related functionalities, such as winner selection and notifications, should be implemented using `Genkit AI` flows, integrating with `Google GenAI`.
*   **Routing**: Follow Next.js's file-system based routing conventions.
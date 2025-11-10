# **App Name**: Sorteum Digital

## Core Features:

- Admin Authentication: Secure login for administrators using Firebase Auth.
- Raffle Management: CRUD functionality for raffles including name, description, image, price, and ticket management.
- Ticket Purchase: Users can purchase tickets without registration, providing name, email, and phone number.
- Ticket Status Updates: Real-time updates on ticket availability and status (available, reserved, paid) displayed visually.
- Payment Confirmation: Admin confirms payments manually, updating ticket status to 'paid confirmed'.
- Automated Text Messaging of Lottery Results: After lottery completion, the app automatically texts the results to all participants. The tool is used to choose the winner or winners according to preset criteria.
- Dashboard Metrics: Display key metrics such as active raffles, tickets sold, and confirmed payments.

## Style Guidelines:

- Primary color: Golden Yellow (#FFB300) to convey excitement and value.
- Background color: Light Gray (#E5E5E5), a desaturated tint of the primary, for a clean backdrop.
- Accent color: Dark Yellow (#D69500), slightly darker than the primary for contrast.
- Body and headline font: 'Inter', a sans-serif font, providing a clean and modern user interface.
- Use clear, intuitive icons sourced from Quasar's icon set to represent raffle actions and status.
- Implement a grid layout using Quasar's QCard and QTable components to organize raffles and tickets effectively.
- Use subtle animations for transitions and status updates to enhance user engagement.
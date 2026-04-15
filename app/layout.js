import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata = {
  title: 'TaskManager',
  description: 'Application de gestion de projets et tâches',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Partie gauche : formulaire */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-12">
          {/* Logo */}
          <Image
            src="/images/logo.svg"
            alt="Abricot"
            width={180}
            height={50}
            priority
          />

          {/* Formulaire */}
          <div>
            <h1 className="text-3xl font-bold text-orange-700 mb-8">
              Connexion
            </h1>

            {error && (
              <p className="text-red-800 text-sm mb-6 p-3 bg-red-50 rounded">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className="w-full border-b border-gray-300 bg-white text-gray-900 px-3 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full border-b border-gray-300 bg-white text-gray-900 px-3 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-gray-900 text-white py-3 px-8 rounded-full mt-2 hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <Link
              href="#"
              className="text-orange-700 text-sm mt-6 inline-block hover:underline"
            >
              Mot de passe oublié?
            </Link>
          </div>

          {/* Lien inscription */}
          <div className="text-sm text-gray-700">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-orange-700 hover:underline">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>

      {/* Partie droite : image */}
      <div className="hidden lg:block w-1/2 relative min-h-screen">
  <Image
    src="/images/login_back.jpg"
    alt="Background"
    fill
    className="object-cover"
    priority
  />
</div>
    </main>
  );
}
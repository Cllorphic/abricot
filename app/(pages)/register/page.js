'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError(
        'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre'
      );
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
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
              Inscription
            </h1>

            {error && (
              <p className="text-red-800 text-sm mb-6 p-3 bg-red-50 rounded">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  className="w-full border-b border-gray-300 bg-white text-gray-900 px-3 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  className="w-full border-b border-gray-300 bg-white text-gray-900 px-3 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby="password-hint"
                  className="w-full border-b border-gray-300 bg-white text-gray-900 px-3 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p id="password-hint" className="text-xs text-gray-700 mt-2">
                  Min. 8 caractères, une majuscule, une minuscule, un chiffre
                </p>
              </div>

              <button
                type="submit"
                className="bg-gray-900 text-white py-3 px-8 rounded-full mt-2 hover:bg-gray-800 transition-colors disabled:opacity-50 w-fit"
                disabled={isLoading}
              >
                {isLoading ? 'Inscription...' : "S'inscrire"}
              </button>
            </form>
          </div>

          {/* Lien connexion */}
          <div className="text-sm text-gray-700">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-orange-700 hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* Partie droite : image */}
      <div className="hidden lg:block w-1/2 relative">
        <Image
          src="/images/signin_back.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </main>
  );
}
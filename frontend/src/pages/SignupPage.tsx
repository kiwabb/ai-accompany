import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signup as apiSignup } from '../api/client';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiSignup({ username, email, password });
      // After successful signup, redirect to login
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cozy-cream flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-cozy-pastelGreen/30">
          {/* Header Section */}
          <div className="bg-cozy-pastelGreen/20 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cozy-pastelGreen to-cozy-pastelBlue" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="font-heading text-3xl text-cozy-text mb-2">{t('auth.signupTitle')}</h1>
              <p className="text-cozy-text-light">{t('auth.signupSubtitle')}</p>
            </motion.div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-cozy-softRed/10 text-cozy-softRed p-3 rounded-xl text-sm text-center border border-cozy-softRed/20"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-cozy-text ml-1" htmlFor="username">
                  {t('auth.username')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cozy-text-light group-focus-within:text-cozy-warmOrange transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-cozy-lightPink/30 border border-transparent rounded-2xl text-cozy-text placeholder-cozy-text-light/50 focus:outline-none focus:ring-2 focus:ring-cozy-warmOrange/50 focus:bg-white transition-all duration-200"
                    placeholder={t('auth.usernamePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-cozy-text ml-1" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cozy-text-light group-focus-within:text-cozy-warmOrange transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-cozy-lightPink/30 border border-transparent rounded-2xl text-cozy-text placeholder-cozy-text-light/50 focus:outline-none focus:ring-2 focus:ring-cozy-warmOrange/50 focus:bg-white transition-all duration-200"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-cozy-text ml-1" htmlFor="password">
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cozy-text-light group-focus-within:text-cozy-warmOrange transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-cozy-lightPink/30 border border-transparent rounded-2xl text-cozy-text placeholder-cozy-text-light/50 focus:outline-none focus:ring-2 focus:ring-cozy-warmOrange/50 focus:bg-white transition-all duration-200"
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-2xl shadow-sm text-cozy-text bg-cozy-warmOrange hover:bg-cozy-warmOrange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cozy-warmOrange disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <span>{t('auth.signupButton')}</span>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-cozy-text-light">
                {t('auth.hasAccount')}{' '}
                <Link 
                  to="/login" 
                  className="font-bold text-cozy-warmOrange hover:text-cozy-warmOrange/80 transition-colors"
                >
                  {t('auth.goToLogin')}
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cozy-pastelGreen/20 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cozy-pastelBlue/20 blur-3xl" />
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;

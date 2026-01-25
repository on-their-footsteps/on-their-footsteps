import React from 'react'
import { BrowserRouter as Router, Routes, Route, unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { GamificationProvider } from './context/GamificationContext'
import { ThemeProvider } from './context/ThemeContext'

// Layout
import Layout from './components/layout/Layout'

// Pages
import Home from './pages/Home'
import Characters from './pages/Characters'
import CharacterDetail from './pages/CharacterDetail'
import Categories from './pages/Categories'
import Learning from './pages/Learning'
import Timeline from './pages/Timeline'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

// Styles
import './styles/main.css'

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <GamificationProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/characters" element={<Characters />} />
                  <Route path="/characters/:idOrSlug" element={<CharacterDetail />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/learning/:categoryId" element={<Learning />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    fontFamily: '"Noto Sans Arabic", sans-serif',
                  },
                }}
              />
            </Router>
          </GamificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
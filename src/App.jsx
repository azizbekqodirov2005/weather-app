import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Toast from './components/Error/Toast';
import ErrorBoundary from './components/Error/ErrorBoundary';
import LocationSheet from './components/Location/LocationSheet';
import InstallSheet from './components/Install/InstallSheet';
import Dashboard from './pages/Dashboard';
import { SettingsProvider } from './context/SettingsContext';
import { WeatherProvider } from './context/WeatherContext';
import { InstallProvider } from './context/InstallContext';

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <InstallProvider>
          <WeatherProvider>
            <div className="app" id="top">
              <Header />
              <main className="app__main container">
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </main>
              <Footer />
              <Toast />
              <LocationSheet />
              <InstallSheet />
            </div>
          </WeatherProvider>
        </InstallProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

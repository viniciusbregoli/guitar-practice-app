import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { PracticePage } from './pages/PracticePage';
import { SongsPage } from './pages/SongsPage';
import { ProgressPage } from './pages/ProgressPage';
import { MetronomePage } from './pages/MetronomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/metronome" element={<MetronomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

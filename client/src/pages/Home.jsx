import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const { data } = await api.get('/health');
        setApiStatus({ success: true, message: data.message });
      } catch (error) {
        setApiStatus({ success: false, message: 'API Offline ❌' });
      }
    };
    checkAPI();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-cream to-white px-4">
        <h1 className="text-6xl md:text-8xl font-display font-light text-black mb-4 text-center">HOMA</h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 text-center">Authentic Japanese Skincare</p>
        <Button onClick={() => navigate('/shop')} variant="primary" size="lg">Explore Collection</Button>
      </section>

      {/* API Status */}
      <section className="py-12 text-center">
        {apiStatus && (
          <div className={`inline-block px-6 py-3 rounded-lg ${apiStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {apiStatus.success ? 'API Connected ✅' : 'API Offline ❌'}
          </div>
        )}
      </section>
    </div>
  );
}

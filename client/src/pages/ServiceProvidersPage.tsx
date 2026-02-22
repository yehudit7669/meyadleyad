import { useSearchParams } from 'react-router-dom';
import BrokerSlider from '../components/providers/BrokerSlider';
import ServiceProviderSlider from '../components/providers/ServiceProviderSlider';

export default function ServiceProvidersPage() {
  const [searchParams] = useSearchParams();
  
  // Get cities from URL params
  const citiesParam = searchParams.get('cities');
  const selectedCities = citiesParam ? citiesParam.split(',') : [];
  const cityId = selectedCities.length === 1 ? selectedCities[0] : undefined;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* שורת מתווכים */}
      <BrokerSlider cityId={cityId} />

      {/* שורת נותני שירות */}
      <ServiceProviderSlider cityId={cityId} />
    </div>
  );
}

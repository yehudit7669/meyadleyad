import React, { useState } from 'react';
import { ServiceProviderType } from '../types';
import { Eye, EyeOff } from 'lucide-react';
import { useCities } from '../hooks/useCities';
import TermsModal from './TermsModal';

interface WizardData {
  // שלב 1
  serviceProviderType: ServiceProviderType | '';
  // שלב 2
  firstName: string;
  lastName: string;
  phonePersonal: string;
  email: string;
  password: string;
  confirmPassword: string;
  // שלב 3
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  website: string;
  // שלב 4 (למתווכים בלבד)
  brokerLicenseNumber: string;
  brokerCityId: string;
  // שלב 5
  weeklyDigestOptIn: boolean;
  // שלב 6
  termsAccepted: boolean;
  declarationAccepted: boolean;
}

interface ServiceProviderWizardProps {
  onSubmit: (data: WizardData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

const SERVICE_PROVIDER_TYPES = [
  { value: 'BROKER', label: 'מתווך' },
  { value: 'LAWYER', label: 'עורך דין' },
  { value: 'APPRAISER', label: 'שמאי' },
  { value: 'DESIGNER_ARCHITECT', label: 'מעצב פנים / אדריכל' },
  { value: 'MORTGAGE_ADVISOR', label: 'יועץ משכנתאות' },
] as const;

const ServiceProviderWizard: React.FC<ServiceProviderWizardProps> = ({
  onSubmit,
  onCancel,
  loading,
  error,
}) => {
  const { data: cities, isLoading: citiesLoading } = useCities();
  const [currentStep, setCurrentStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [data, setData] = useState<WizardData>({
    serviceProviderType: '',
    firstName: '',
    lastName: '',
    phonePersonal: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    website: '',
    brokerLicenseNumber: '',
    brokerCityId: '',
    weeklyDigestOptIn: true,
    termsAccepted: false,
    declarationAccepted: false,
  });

  const [stepErrors, setStepErrors] = useState<string>('');

  const validateStep = (step: number): boolean => {
    setStepErrors('');

    switch (step) {
      case 1:
        if (!data.serviceProviderType) {
          setStepErrors('יש לבחור סוג נותן שירות');
          return false;
        }
        break;
      case 2:
        if (!data.firstName.trim()) {
          setStepErrors('שם פרטי הוא שדה חובה');
          return false;
        }
        if (!data.lastName.trim()) {
          setStepErrors('שם משפחה הוא שדה חובה');
          return false;
        }
        if (!data.phonePersonal.trim() || data.phonePersonal.length < 9) {
          setStepErrors('מספר טלפון אישי הוא שדה חובה (לפחות 9 ספרות)');
          return false;
        }
        if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setStepErrors('כתובת אימייל לא תקינה');
          return false;
        }
        if (data.password.length < 6) {
          setStepErrors('הסיסמה חייבת להכיל לפחות 6 תווים');
          return false;
        }
        if (data.password !== data.confirmPassword) {
          setStepErrors('הסיסמאות אינן תואמות');
          return false;
        }
        break;
      case 3:
        if (!data.businessName.trim()) {
          setStepErrors('שם העסק/המשרד הוא שדה חובה');
          return false;
        }
        if (!data.businessAddress.trim()) {
          setStepErrors('כתובת המשרד היא שדה חובה');
          return false;
        }
        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
          setStepErrors('כתובת אתר אינטרנט לא תקינה (חייבת להתחיל ב-http:// או https://)');
          return false;
        }
        break;
      case 4:
        if (data.serviceProviderType === 'BROKER') {
          if (!data.brokerLicenseNumber.trim()) {
            setStepErrors('מספר רישיון תיווך הוא שדה חובה למתווכים');
            return false;
          }
          if (!data.brokerCityId) {
            setStepErrors('יש לבחור אזור פעילות');
            return false;
          }
        }
        break;
      case 5:
        // שלב 5 הוא העדפות למתווכים, תנאים ללא-מתווכים
        if (data.serviceProviderType === 'BROKER') {
          // למתווכים - העדפות
          break;
        } else {
          // ללא-מתווכים - תנאים
          if (!data.termsAccepted) {
            setStepErrors('יש לאשר את תנאי השימוש');
            return false;
          }
          if (!data.declarationAccepted) {
            setStepErrors('יש לאשר את ההצהרה');
            return false;
          }
        }
        break;
      case 6:
        // שלב 6 קיים רק למתווכים - תנאים
        if (!data.termsAccepted) {
          setStepErrors('יש לאשר את תנאי השימוש');
          return false;
        }
        if (!data.declarationAccepted) {
          setStepErrors('יש לאשר את ההצהרה');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // דלג על שלב 4 אם לא מתווך
      if (currentStep === 3 && data.serviceProviderType !== 'BROKER') {
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    // חזור לשלב 3 אם לא מתווך ומשלב 5
    if (currentStep === 5 && data.serviceProviderType !== 'BROKER') {
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    await onSubmit(data);
  };

  const updateData = (field: keyof WizardData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setStepErrors('');
  };

  const totalSteps = data.serviceProviderType === 'BROKER' ? 6 : 5;

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-black">
            שלב {currentStep} מתוך {totalSteps}
          </span>
          <span className="text-xs text-black">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {(error || stepErrors) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error || stepErrors}
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1ServiceType
            selectedType={data.serviceProviderType}
            onSelect={(type) => updateData('serviceProviderType', type)}
          />
        )}

        {currentStep === 2 && (
          <Step2PersonalDetails
            data={data}
            onChange={updateData}
          />
        )}

        {currentStep === 3 && (
          <Step3BusinessDetails
            data={data}
            onChange={updateData}
          />
        )}

        {currentStep === 4 && data.serviceProviderType === 'BROKER' && (
          <Step4BrokerDetails
            data={data}
            onChange={updateData}
            cities={cities}
            citiesLoading={citiesLoading}
          />
        )}

        {((currentStep === 5 && data.serviceProviderType === 'BROKER') || 
          (currentStep === 4 && data.serviceProviderType !== 'BROKER')) && (
          <Step5Preferences
            weeklyDigestOptIn={data.weeklyDigestOptIn}
            onChange={(value) => updateData('weeklyDigestOptIn', value)}
          />
        )}

        {((currentStep === 6 && data.serviceProviderType === 'BROKER') || 
          (currentStep === 5 && data.serviceProviderType !== 'BROKER')) && (
          <Step6Terms
            termsAccepted={data.termsAccepted}
            declarationAccepted={data.declarationAccepted}
            onChangeTerms={(value) => updateData('termsAccepted', value)}
            onChangeDeclaration={(value) => updateData('declarationAccepted', value)}
            onOpenTermsModal={() => setShowTermsModal(true)}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          type="button"
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          disabled={loading}
        >
          {currentStep === 1 ? 'ביטול' : 'חזרה'}
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold disabled:opacity-50"
            disabled={loading}
          >
            המשך
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'שולח...' : 'השלם הרשמה'}
          </button>
        )}
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

// Step 1: בחירת סוג נותן שירות
const Step1ServiceType: React.FC<{
  selectedType: string;
  onSelect: (type: ServiceProviderType) => void;
}> = ({ selectedType, onSelect }) => (
  <div>
    <h2 className="text-2xl font-bold text-black mb-2">בחר את סוג נותן השירות</h2>
    <p className="text-black mb-6">באיזה תחום אתה עוסק?</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {SERVICE_PROVIDER_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onSelect(type.value as ServiceProviderType)}
          className={`p-6 border-2 rounded-lg text-right transition-all ${
            selectedType === type.value
              ? 'border-primary-600 bg-primary-50 shadow-md'
              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold text-black">{type.label}</div>
        </button>
      ))}
    </div>
  </div>
);

// Step 2: פרטים אישיים
const Step2PersonalDetails: React.FC<{
  data: WizardData;
  onChange: (field: keyof WizardData, value: string) => void;
}> = ({ data, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-black mb-2">פרטים אישיים</h2>
      <p className="text-black mb-6">מלא את הפרטים האישיים שלך</p>

      <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-black mb-1">
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-black mb-1">
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phonePersonal" className="block text-sm font-medium text-black mb-1">
          טלפון אישי <span className="text-red-500">*</span>
        </label>
        <input
          id="phonePersonal"
          type="tel"
          value={data.phonePersonal}
          onChange={(e) => onChange('phonePersonal', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="050-1234567"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
          אימייל <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
          סיסמה <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            minLength={6}
            required
            aria-required="true"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-xs text-black mt-1">לפחות 6 תווים</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
          אימות סיסמה <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

// Step 3: פרטי עסק
const Step3BusinessDetails: React.FC<{
  data: WizardData;
  onChange: (field: keyof WizardData, value: string) => void;
}> = ({ data, onChange }) => (
  <div>
    <h2 className="text-2xl font-bold text-black mb-2">פרטי עסק/משרד</h2>
    <p className="text-black mb-6">מלא את פרטי העסק או המשרד שלך</p>

    <div className="space-y-4">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-black mb-1">
          שם העסק/המשרד <span className="text-red-500">*</span>
        </label>
        <input
          id="businessName"
          type="text"
          value={data.businessName}
          onChange={(e) => onChange('businessName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="businessAddress" className="block text-sm font-medium text-black mb-1">
          כתובת משרד <span className="text-red-500">*</span>
        </label>
        <input
          id="businessAddress"
          type="text"
          value={data.businessAddress}
          onChange={(e) => onChange('businessAddress', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="רחוב, מספר בית, עיר"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="businessPhone" className="block text-sm font-medium text-black mb-1">
          טלפון עסק (אופציונלי)
        </label>
        <input
          id="businessPhone"
          type="tel"
          value={data.businessPhone}
          onChange={(e) => onChange('businessPhone', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="03-1234567"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-black mb-1">
          אתר אינטרנט (אופציונלי)
        </label>
        <input
          id="website"
          type="url"
          value={data.website}
          onChange={(e) => onChange('website', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://www.example.com"
        />
      </div>
    </div>
  </div>
);

// Step 4: פרטי מתווך (רק למתווכים)
const Step4BrokerDetails: React.FC<{
  data: WizardData;
  onChange: (field: keyof WizardData, value: string) => void;
  cities?: any[];
  citiesLoading: boolean;
}> = ({ data, onChange, cities, citiesLoading }) => (
  <div>
    <h2 className="text-2xl font-bold text-black mb-2">פרטי תיווך</h2>
    <p className="text-black mb-6">מלא את הפרטים הספציפיים למתווכים</p>

    <div className="space-y-4">
      <div>
        <label htmlFor="brokerLicenseNumber" className="block text-sm font-medium text-black mb-1">
          מספר רישיון תיווך <span className="text-red-500">*</span>
        </label>
        <input
          id="brokerLicenseNumber"
          type="text"
          value={data.brokerLicenseNumber}
          onChange={(e) => onChange('brokerLicenseNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="brokerCityId" className="block text-sm font-medium text-black mb-1">
          אזור פעילות <span className="text-red-500">*</span>
        </label>
        <select
          id="brokerCityId"
          value={data.brokerCityId}
          onChange={(e) => onChange('brokerCityId', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          aria-required="true"
          disabled={citiesLoading}
        >
          <option value="">
            {citiesLoading ? 'טוען ערים...' : 'בחר עיר'}
          </option>
          {cities && cities.length > 0 ? (
            cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.nameHe || city.name}
              </option>
            ))
          ) : (
            !citiesLoading && <option value="" disabled>אין ערים זמינות</option>
          )}
        </select>
        {cities && cities.length > 0 && (
          <p className="text-xs text-black mt-1">
            בחר את אזור הפעילות העיקרי שלך
          </p>
        )}
      </div>
    </div>
  </div>
);

// Step 5: העדפות
const Step5Preferences: React.FC<{
  weeklyDigestOptIn: boolean;
  onChange: (value: boolean) => void;
}> = ({ weeklyDigestOptIn, onChange }) => (
  <div>
    <h2 className="text-2xl font-bold text-black mb-2">העדפות</h2>
    <p className="text-black mb-6">הגדר את העדפות התקשורת שלך</p>

    <div className="space-y-4">
      <label className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={weeklyDigestOptIn}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
        />
        <div className="flex-1">
          <div className="font-medium text-black">גיליון נכסים שבועי</div>
          <div className="text-sm text-black mt-1">
            קבל עדכון שבועי על נכסים חדשים והזדמנויות באזור שלך
          </div>
        </div>
      </label>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>שים לב:</strong> בשלב זה הגדרת ההעדפה נשמרת במערכת, אך שליחת המיילים תופעל בשלב מאוחר יותר.
      </div>
    </div>
  </div>
);

// Step 6: תנאים והצהרות
const Step6Terms: React.FC<{
  termsAccepted: boolean;
  declarationAccepted: boolean;
  onChangeTerms: (value: boolean) => void;
  onChangeDeclaration: (value: boolean) => void;
  onOpenTermsModal: () => void;
}> = ({ termsAccepted, declarationAccepted, onChangeTerms, onChangeDeclaration, onOpenTermsModal }) => (
  <div>
    <h2 className="text-2xl font-bold text-black mb-2">תנאים והצהרות</h2>
    <p className="text-black mb-6">יש לאשר את התנאים הבאים להשלמת ההרשמה</p>

    <div className="space-y-4">
      <label className="flex items-start gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => onChangeTerms(e.target.checked)}
          className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          required
          aria-required="true"
        />
        <div className="flex-1">
          <div className="font-medium text-black">
            אני מאשר שקראתי ואני מסכים{' '}
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="text-primary-600 hover:underline"
            >
              לתקנון ולתנאי השימוש
            </button>
            {' '}<span className="text-red-500">*</span>
          </div>
          <div className="text-sm text-black mt-1">
            תנאי השימוש כוללים הסכמה למדיניות הפרטיות ולכללי השימוש באתר
          </div>
        </div>
      </label>

      <label className="flex items-start gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={declarationAccepted}
          onChange={(e) => onChangeDeclaration(e.target.checked)}
          className="mt-1 w-5 h-5 text-primary-600 rounded-lg focus:ring-primary-500"
          required
          aria-required="true"
        />
        <div className="flex-1">
          <div className="font-medium text-black">
            אני מצהיר שכל הפרטים שמסרתי נכונים ומדויקים <span className="text-red-500">*</span>
          </div>
          <div className="text-sm text-black mt-1">
            מסירת פרטים שגויים עלולה לגרום לחסימת החשבון או לפעולות משפטיות
          </div>
        </div>
      </label>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>שים לב:</strong> לאחר ההרשמה תישלח אליך הודעת אימייל לאימות כתובת הדוא"ל.
        עד לאישור האימייל, חלק מהפונקציות עשויות להיות מוגבלות.
      </div>
    </div>
  </div>
);

export default ServiceProviderWizard;

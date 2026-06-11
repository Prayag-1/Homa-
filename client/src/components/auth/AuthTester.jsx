import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AddressMapPicker } from '../shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const initialRegister = {
  name: '',
  phoneNumber: '',
  password: '',
  birthday: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Nepal',
};

const initialLogin = {
  phoneNumber: '',
  password: '',
};

const initialVerify = {
  phoneNumber: '',
  code: '',
};

function FieldGroup({ title, children }) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_20px_60px_rgba(26,20,16,0.08)] backdrop-blur">
      <h2 className="mb-5 text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function AuthTester() {
  const { user, accessToken, logout, refreshUser } = useAuth();
  const [health, setHealth] = useState('Checking...');
  const [storedToken, setStoredToken] = useState(() => localStorage.getItem('accessToken'));
  const [registerData, setRegisterData] = useState(initialRegister);
  const [loginData, setLoginData] = useState(initialLogin);
  const [verifyData, setVerifyData] = useState(initialVerify);
  const [busy, setBusy] = useState(null);
  const [meData, setMeData] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get('/health');
        setHealth(data.message || 'API online');
      } catch {
        setHealth('API offline');
      }
    };

    checkHealth();
  }, []);

  const tokenPreview = useMemo(() => {
    const token = storedToken || accessToken;
    if (!token) return 'No access token stored';
    return `${token.slice(0, 18)}...${token.slice(-8)}`;
  }, [accessToken, storedToken]);

  const registerAddressPreview = useMemo(
    () =>
      [
        registerData.line1,
        registerData.line2,
        registerData.city,
        registerData.state,
        registerData.postalCode,
        registerData.country,
      ]
        .filter(Boolean)
        .join(', '),
    [
      registerData.city,
      registerData.country,
      registerData.line1,
      registerData.line2,
      registerData.postalCode,
      registerData.state,
    ],
  );

  const setField = (setter) => (event) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setBusy('register');

    try {
      const payload = {
        name: registerData.name,
        phoneNumber: registerData.phoneNumber,
        password: registerData.password,
        birthday: registerData.birthday,
        address: {
          line1: registerData.line1,
          line2: registerData.line2,
          city: registerData.city,
          state: registerData.state,
          postalCode: registerData.postalCode,
          country: registerData.country,
        },
      };

      const { data } = await api.post('/auth/register', payload);
      setVerifyData((current) => ({ ...current, phoneNumber: registerData.phoneNumber }));
      toast.success('Registration created. Check the OTP panel.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setBusy('verify');

    try {
      const { data } = await api.post('/auth/verify-phone', verifyData);
      localStorage.setItem('accessToken', data.data.accessToken);
      setStoredToken(data.data.accessToken);
      setMeData(data.data.user);
      toast.success('Phone verified and session started');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    setBusy('resend');
    try {
      const { data } = await api.post('/auth/resend-verification', {
        phoneNumber: verifyData.phoneNumber,
      });
      toast.success('Verification code resent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Resend failed');
    } finally {
      setBusy(null);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy('login');

    try {
      const { data } = await api.post('/auth/login', loginData);
      localStorage.setItem('accessToken', data.data.accessToken);
      setStoredToken(data.data.accessToken);
      setMeData(data.data.user);
      toast.success('Logged in successfully');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setBusy(null);
    }
  };

  const handleMe = async () => {
    setBusy('me');
    try {
      const { data } = await api.get('/auth/me');
      setMeData(data.data.user);
      toast.success('Loaded profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile fetch failed');
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    setBusy('logout');
    try {
      await logout();
      setStoredToken(null);
      setMeData(null);
      toast.success('Logged out');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Logout failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7e9de_0%,#f5f0ea_40%,#fdfaf7_100%)] px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.35em] text-black/50">Backend smoke test</p>
            <h1 className="font-display text-5xl font-semibold md:text-7xl">Phone auth verifier</h1>
            <p className="mt-3 max-w-2xl text-base text-black/70">
              Register with phone number, verify the OTP, then log in and confirm protected session endpoints.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/80 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">API status</p>
            <p className="mt-2 text-lg font-medium">{health}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <FieldGroup title="1. Register">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Name" name="name" value={registerData.name} onChange={setField(setRegisterData)} placeholder="John Doe" />
                <Input label="Phone Number" name="phoneNumber" value={registerData.phoneNumber} onChange={setField(setRegisterData)} placeholder="+9779812345678" />
                <Input label="Password" name="password" type="password" value={registerData.password} onChange={setField(setRegisterData)} placeholder="Minimum 8 characters" />
                <Input label="Birthday" name="birthday" type="date" value={registerData.birthday} onChange={setField(setRegisterData)} />
                <Input label="Address Line 1" name="line1" value={registerData.line1} onChange={setField(setRegisterData)} placeholder="Street, house, apartment" />
                <Input label="Address Line 2" name="line2" value={registerData.line2} onChange={setField(setRegisterData)} placeholder="Optional" />
                <Input label="City" name="city" value={registerData.city} onChange={setField(setRegisterData)} />
                <Input label="State" name="state" value={registerData.state} onChange={setField(setRegisterData)} />
                <Input label="Postal Code" name="postalCode" value={registerData.postalCode} onChange={setField(setRegisterData)} />
                <Input label="Country" name="country" value={registerData.country} onChange={setField(setRegisterData)} />
              </div>
              <AddressMapPicker
                address={registerAddressPreview}
                title="Address preview"
                description="Leaflet previews the location tied to the address you entered."
              />
              <Button type="button" variant="primary" size="lg" loading={busy === 'register'} onClick={handleRegister} className="w-full">
                Register and send OTP
              </Button>
            </FieldGroup>

            <FieldGroup title="2. Verify phone">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Phone Number" name="phoneNumber" value={verifyData.phoneNumber} onChange={setField(setVerifyData)} placeholder="+9779812345678" />
                <Input label="OTP Code" name="code" value={verifyData.code} onChange={setField(setVerifyData)} placeholder="6-digit code" />
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <Button type="button" variant="primary" size="lg" loading={busy === 'verify'} onClick={handleVerify} className="w-full">
                  Verify and create session
                </Button>
                <Button type="button" variant="outline" size="lg" loading={busy === 'resend'} onClick={handleResend} className="w-full">
                  Resend OTP
                </Button>
              </div>
            </FieldGroup>

            <FieldGroup title="3. Login">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Phone Number" name="phoneNumber" value={loginData.phoneNumber} onChange={setField(setLoginData)} placeholder="+9779812345678" />
                <Input label="Password" name="password" type="password" value={loginData.password} onChange={setField(setLoginData)} placeholder="Your password" />
              </div>
              <Button type="button" variant="primary" size="lg" loading={busy === 'login'} onClick={handleLogin} className="w-full">
                Login
              </Button>
            </FieldGroup>
          </div>

          <aside className="space-y-6">
            <FieldGroup title="Session">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-black/50">Access token</p>
                  <p className="break-all rounded-xl bg-black/5 px-3 py-2 font-mono text-xs">{tokenPreview}</p>
                </div>
                <div>
                  <p className="text-black/50">Authenticated user</p>
                  <pre className="overflow-auto rounded-xl bg-black/5 p-3 text-xs">
                    {JSON.stringify(user || meData, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Button type="button" variant="outline" size="lg" loading={busy === 'me'} onClick={handleMe}>
                  Load /me
                </Button>
                <Button type="button" variant="ghost" size="lg" loading={busy === 'logout'} onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </FieldGroup>

            <FieldGroup title="What to check">
              <ul className="space-y-3 text-sm text-black/75">
                <li>- Registration rejects invalid phone, missing birthday, or incomplete address.</li>
                <li>- OTP verification returns an access token and sets the refresh cookie.</li>
                <li>- `/auth/me` only works after the access token is stored.</li>
                <li>- Refresh flow restores the session from the httpOnly cookie.</li>
              </ul>
            </FieldGroup>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AddressMapPicker } from '../components/shared';

const initialForm = {
  name: '',
  email: '',
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

export default function Register() {
  const navigate = useNavigate();
  const { register, verifyAccount, resendVerification } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [verification, setVerification] = useState({
    target: '',
    code: '',
  });
  const [step, setStep] = useState('register');
  const [busy, setBusy] = useState(false);

  const targetValue = useMemo(
    () => (verificationMethod === 'email' ? form.email : form.phoneNumber),
    [verificationMethod, form.email, form.phoneNumber],
  );

  const addressPreview = useMemo(
    () => [form.line1, form.line2, form.city, form.state, form.postalCode, form.country].filter(Boolean).join(', '),
    [form.city, form.country, form.line1, form.line2, form.postalCode, form.state],
  );

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        verificationMethod,
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        birthday: form.birthday,
        address: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
      };
      const response = await register(payload);
      setVerification({
        target: response.data?.target || targetValue,
        code: '',
      });
      setStep('verify');
      toast.success(`Verification code sent to your ${verificationMethod}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await verifyAccount(verificationMethod, verification.target, verification.code);
      toast.success('Account verified');
      navigate('/user/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setBusy(true);
    try {
      const response = await resendVerification(verificationMethod, verification.target || targetValue);
      toast.success('Verification code resent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,#f7e9de_0%,#f5f0ea_45%,#fdfaf7_100%)]">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(26,20,16,0.12)] backdrop-blur">
        <p className="mb-2 text-sm uppercase tracking-[0.35em] text-black/45">Create account</p>
        <h1 className="font-display text-5xl font-semibold">Sign up</h1>
        <p className="mt-3 text-sm text-black/65">
          Choose email or phone verification, then enter the code to finish registration.
        </p>

        {step === 'register' ? (
          <form onSubmit={onRegister} className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Name" name="name" value={form.name} onChange={onChange} placeholder="John Doe" />
              <Input label="Phone number" name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder="+9779812345678" required />
              <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="At least 8 characters" />
              <Input label="Birthday" name="birthday" type="date" value={form.birthday} onChange={onChange} />
              <Input label="Country" name="country" value={form.country} onChange={onChange} />
              <Input label="City" name="city" value={form.city} onChange={onChange} />
              <Input label="State" name="state" value={form.state} onChange={onChange} />
              <Input label="Postal Code" name="postalCode" value={form.postalCode} onChange={onChange} />
              <Input label="Address Line 1" name="line1" value={form.line1} onChange={onChange} />
              <Input label="Address Line 2" name="line2" value={form.line2} onChange={onChange} />
            </div>

            <AddressMapPicker
              address={addressPreview}
              title="Address preview"
              description="Leaflet previews the location associated with the address details you entered."
            />

            <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
              <p className="mb-3 text-sm font-medium">Verification method</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="verificationMethod"
                    value="email"
                    checked={verificationMethod === 'email'}
                    onChange={() => setVerificationMethod('email')}
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="verificationMethod"
                    value="phone"
                    checked={verificationMethod === 'phone'}
                    onChange={() => setVerificationMethod('phone')}
                  />
                  Phone
                </label>
              </div>
              <div className="mt-4">
                {verificationMethod === 'email' && (
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="name@email.com"
                  />
                )}
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
              Register and send code
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="mt-8 space-y-5">
            <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm">
              Code sent to <span className="font-medium">{verification.target || targetValue}</span>
            </div>
            <Input
              label="Verification code"
              name="code"
              value={verification.code}
              onChange={(event) => setVerification((current) => ({ ...current, code: event.target.value }))}
              placeholder="6-digit code"
            />
            <div className="flex flex-col gap-3 md:flex-row">
              <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
                Verify account
              </Button>
              <Button type="button" variant="outline" size="lg" loading={busy} onClick={onResend} className="w-full">
                Resend code
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-black/70">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-black underline underline-offset-4">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

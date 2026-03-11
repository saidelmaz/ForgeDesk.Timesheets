import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await register(form.email, form.password, form.firstName, form.lastName);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 mb-5">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-[15px]">Get started with ForgeDesk Timesheets</p>
      </div>
      <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} required />
              <Input label="Last Name" value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} required />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
            <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
            <Button type="submit" className="w-full" size="lg" isLoading={loading}>Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

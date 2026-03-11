import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate('/');
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 mb-5">
          <Clock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-[15px]">Sign in to ForgeDesk Timesheets</p>
      </div>
      <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@arco.be" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Admin123!" />
            <Button type="submit" className="w-full" size="lg" isLoading={loading}>Sign in</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Login: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/reviewer', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invoice Analyser</h1>
          <p className="text-muted-foreground mt-1">Automated Invoice Processing System</p>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Central Login Required</CardTitle>
            <CardDescription className="text-center">
              Invoice Analyzer is available only through your NIFO session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Open Invoice Analyzer from the NIFO main application so the shared JWT can be passed into this tool.
              </div>
              <Button type="button" className="w-full h-11" onClick={() => { window.location.href = '/'; }}>
                Open NIFO
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Secure access through NIFO
        </p>
      </div>
    </div>
  );
};

export default Login;

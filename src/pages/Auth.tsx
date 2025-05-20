
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Wine } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Auth: React.FC = () => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  const { login, registerClient, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLoginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Por favor ingrese email y contraseña');
      return;
    }
    
    try {
      console.log("Intentando iniciar sesión con:", email);
      await login(email, password);
      // Navigation is handled by the useEffect hook when user state updates
    } catch (error: any) {
      console.error("Login error in form handler:", error);
      
      // More specific error messages
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Credenciales inválidas. Verifique su email y contraseña.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email no confirmado. Verifique su bandeja de entrada.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Demasiados intentos. Inténtalo más tarde.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setLoginError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: errorMessage,
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!registerEmail || !registerPassword || !registerName || !registerAddress) {
      setRegisterError('Por favor complete todos los campos');
      return;
    }
    
    try {
      await registerClient({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        address: registerAddress
      });
      // Login is handled within registerClient if successful
    } catch (error: any) {
      console.error("Registration error in form handler:", error);
      
      let errorMessage = 'Error al registrarse';
      
      if (error.message) {
        if (error.message.includes("User already registered")) {
          errorMessage = "Este email ya está registrado.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setRegisterError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Wine className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">LiquiStock</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestión de Inventarios</p>
        </div>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLoginWithEmail}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@liquistock.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {loginError}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                  </Button>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Usuario administrador:</p>
                    <p className="mt-1">
                      joancanizales08@gmail.com / sircega161004
                    </p>
                    <p className="mt-2">Otros usuarios de demostración:</p>
                    <p className="mt-1">
                      oficinista@licorhub.com / oficinista123<br/>
                      bodeguero@licorhub.com / bodeguero123<br/>
                      domiciliario@licorhub.com / domiciliario123<br/>
                      cliente@licorhub.com / cliente123
                    </p>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Registrarse</CardTitle>
                <CardDescription>
                  Crea una cuenta nueva como cliente
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre Completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Correo Electrónico</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-address">Dirección</Label>
                    <Input
                      id="register-address"
                      type="text"
                      placeholder="Calle Principal #123"
                      value={registerAddress}
                      onChange={(e) => setRegisterAddress(e.target.value)}
                      required
                    />
                  </div>
                  {registerError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {registerError}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Cargando...' : 'Registrarse'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;

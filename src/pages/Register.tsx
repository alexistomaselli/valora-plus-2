import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Register = () => {
  const [email, setEmail] = useState(''); // Email del usuario para autenticación
  const [fullName, setFullName] = useState(''); // Nombre completo del usuario
  const [workshopEmail, setWorkshopEmail] = useState(''); // Email del taller (opcional)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tallerName, setTallerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>\-]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>-)');
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    // Validar email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, introduce un email válido",
        variant: "destructive"
      });
      return false;
    }

    // Validar nombre del usuario
    if (!fullName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Tu nombre completo es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    // Validar nombre del taller
    if (!tallerName.trim()) {
      toast({
        title: "Nombre del taller requerido",
        description: "El nombre del taller es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    // Validar contraseña
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        title: "Contraseña inválida",
        description: passwordErrors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas introducidas no son iguales",
        variant: "destructive"
      });
      return false;
    }

    // Validar términos y condiciones
    if (!acceptTerms) {
      toast({
        title: "Términos requeridos",
        description: "Debes aceptar los términos y condiciones",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Registrar usuario con Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
           data: {
             workshop_name: tallerName
           }
         }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Crear perfil del taller
        await createWorkshopAndProfile(data.user.id);
        
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Revisa tu email para confirmar tu cuenta y luego podrás iniciar sesión.",
        });
        
        // Redirigir al login
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al crear tu cuenta. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkshopAndProfile = async (userId: string) => {
    try {
      // 1. Crear el workshop con información básica
      const { data: workshop, error: workshopError } = await supabase
        .from('workshops')
        .insert({
          name: tallerName, // Nombre del taller
          email: null, // Se completará desde el panel de cuenta
          phone: null, // Se completará desde el panel de cuenta
          address: null // Se completará desde el panel de cuenta
        })
        .select()
        .single();

      if (workshopError) {
        console.error('Error creating workshop:', workshopError);
        throw workshopError;
      }

      // 2. Actualizar el perfil del usuario con el workshop_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName, // Usar el nombre del usuario
          workshop_id: workshop.id,
          phone: null // Se completará desde el panel de cuenta
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

    } catch (error) {
      console.error('Error in createWorkshopAndProfile:', error);
      toast({
        title: "Advertencia",
        description: "Tu cuenta se creó correctamente, pero hubo un problema configurando el taller. Contacta con soporte.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calculator className="h-8 w-8 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">Valora Plus</span>
          </div>
          <p className="text-primary-foreground/80">Registra tu taller para empezar</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm border-border/50 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Registrar Taller</span>
            </CardTitle>
            <CardDescription>
              Crea tu cuenta para empezar a analizar la rentabilidad de tu taller
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Tu email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu.email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                  <p className="text-sm text-muted-foreground">
                    Este será tu email para iniciar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Tu nombre completo *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taller">Nombre del taller *</Label>
                  <Input
                    id="taller"
                    placeholder="Mi Taller Mecánico"
                    value={tallerName}
                    onChange={(e) => setTallerName(e.target.value)}
                    required
                    className="transition-all duration-300 focus:shadow-glow"
                  />
                  <p className="text-sm text-muted-foreground">
                    Podrás completar más información desde tu panel de cuenta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:shadow-glow pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*(),.?":{}|{'<>'}-)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="transition-all duration-300 focus:shadow-glow pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    Acepto los{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      términos y condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      política de privacidad
                    </Link>
                    . Doy mi consentimiento para el tratamiento de mis datos según el RGPD.
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>

              {/* Enlaces dentro del recuadro */}
              <div className="text-center space-y-2 mt-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Inicia sesión
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  ¿Necesitas ayuda?{' '}
                  <Link to="/contact" className="text-primary hover:underline">
                    Contáctanos
                  </Link>
                </p>
              </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6 text-primary-foreground/60 text-sm">
          <p>🔒 Tus datos están protegidos con cifrado de extremo a extremo</p>
          <p className="mt-1">3 análisis gratuitos al mes • Sin tarjeta de crédito</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
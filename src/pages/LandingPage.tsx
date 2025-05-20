
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header/Navbar */}
      <header className="border-b border-border py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl font-bold">L</div>
            <h1 className="text-xl font-serif font-semibold">LIKISTOCK</h1>
          </div>

          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                  <Link to="#features">Características</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                  <Link to="#about">Nosotros</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                  <Link to="/auth">Iniciar Sesión</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="container max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
            Sistema de Gestión de Inventarios para Distribuidoras de Licores
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Controla tu inventario, gestiona pedidos y optimiza la distribución de tus productos de forma eficiente y sencilla.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Comenzar Ahora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="#features">Conocer Más</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-secondary">
        <div className="container">
          <h2 className="text-3xl font-serif font-semibold mb-12 text-center">Características Principales</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Control de Inventario</h3>
              <p className="text-muted-foreground">Gestiona tu stock en múltiples bodegas con alertas de niveles bajos y seguimiento en tiempo real.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Gestión de Pedidos</h3>
              <p className="text-muted-foreground">Procesa pedidos de clientes eficientemente y realiza seguimiento desde la solicitud hasta la entrega.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Reportes y Análisis</h3>
              <p className="text-muted-foreground">Obtén estadísticas detalladas y reportes personalizados para optimizar tu negocio.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Gestión de Entregas</h3>
              <p className="text-muted-foreground">Coordina rutas de distribución y asigna domiciliarios fácilmente.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Facturación Integrada</h3>
              <p className="text-muted-foreground">Genera facturas automáticamente y mantén un registro organizado de tus transacciones.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-serif font-medium mb-3">Control de Usuarios</h3>
              <p className="text-muted-foreground">Asigna roles específicos a tu equipo: administrador, oficinista, bodeguero y domiciliario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-serif font-semibold mb-8 text-center">Sobre LIKISTOCK</h2>
          
          <p className="text-lg mb-6">
            LIKISTOCK es un sistema de gestión integral diseñado específicamente para distribuidoras de licores, 
            atendiendo las necesidades únicas de este sector con un enfoque en la eficiencia y facilidad de uso.
          </p>
          
          <p className="text-lg mb-6">
            Nuestro sistema permite a las distribuidoras optimizar sus procesos logísticos, 
            mejorar el servicio al cliente y maximizar sus ganancias mediante un control detallado de sus operaciones.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-accent">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl font-serif font-semibold mb-6">¿Listo para optimizar tu distribuidora?</h2>
          <p className="text-lg mb-8">
            Comienza a utilizar LIKISTOCK hoy mismo y transforma la gestión de tu negocio.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Regístrate Ahora</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-serif text-lg font-bold">L</div>
                <p className="text-lg font-serif">LIKISTOCK</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">© 2025 LIKISTOCK. Todos los derechos reservados.</p>
            </div>
            
            <div className="flex gap-6">
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos</Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link>
              <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">Acceder</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

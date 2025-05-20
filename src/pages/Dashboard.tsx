
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Package, Users, ShoppingCart } from 'lucide-react';
import { getProducts } from '@/services/inventory.service';
import { getAllOrders } from '@/services/order.service';
import { getAllUsers } from '@/services/user.service';
import { useToast } from "@/hooks/use-toast"

const Dashboard: React.FC = () => {
  const { user, hasAccess, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast()
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadData = async () => {
      try {
        const products = await getProducts();
        setProductCount(products.length);

        const orders = await getAllOrders();
        setOrderCount(orders.length);

        const users = await getAllUsers(user?.role);
        setUserCount(users.length);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        })
      }
    };

    loadData();
  }, [user, navigate, toast]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de productos en el inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de órdenes registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gráfico
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Porcentaje de productos en stock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Bienvenido, {user.name}</h2>
        <p className="text-muted-foreground">
          Este es el panel de administración de LiquiStock. Aquí puedes gestionar
          el inventario, las órdenes y los usuarios.
        </p>
      </div>

      <div className="mt-6">
        {hasAccess(['admin']) && (
          <Button onClick={() => navigate('/usuarios')}>
            Gestionar Usuarios
          </Button>
        )}
        <Button variant="destructive" className="ml-4" onClick={() => logout()}>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from '@/hooks/useAuth';
import { useInventoryService } from '@/hooks/useInventoryService';

interface MovementHistoryProps {
  warehouseId?: string;
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ warehouseId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const { 
    products,
    warehouses,
    movements,
    loading,
    error,
    loadMovements,
    addMovement
  } = useInventoryService();
  
  const [type, setType] = useState<string>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (warehouseId) {
      setSelectedWarehouse(warehouseId);
    }
  }, [warehouseId]);

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedWarehouse || !quantity) {
      return;
    }

    try {
      const newMovement = {
        product_id: selectedProduct,
        warehouse_id: selectedWarehouse,
        type: type as 'entrada' | 'salida' | 'transferencia' | 'ajuste',
        quantity: parseInt(quantity),
        responsible_id: userId,
        notes
      };
      
      await addMovement(newMovement);
      
      // Reset form and refresh data
      setType('entrada');
      setSelectedProduct('');
      setSelectedWarehouse('');
      setQuantity('');
      setNotes('');
      await loadMovements();
      
      toast({
        title: "Movimiento registrado",
        description: "El movimiento de inventario se ha registrado correctamente."
      });
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento de inventario.",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Historial de Movimientos</h2>

      {/* Formulario para agregar movimientos */}
      <form onSubmit={handleAddMovement} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo de Movimiento</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product">Producto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="warehouse">Bodega</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una bodega" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Cantidad"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales"
          />
        </div>

        <Button type="submit" className="mt-4">Agregar Movimiento</Button>
      </form>

      {/* Tabla de historial de movimientos */}
      {loading && <p>Cargando movimientos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Historial de movimientos de inventario</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Bodega</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="font-medium">{movement.type || movement.movement_type}</TableCell>
                <TableCell>{movement.product?.name}</TableCell>
                <TableCell>{movement.warehouse?.name}</TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell>{movement.responsible?.name || 'Sistema'}</TableCell>
                <TableCell>{movement.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MovementHistory;

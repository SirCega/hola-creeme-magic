import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Badge
} from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOrderService } from '@/services/order.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Invoices page component
const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isViewInvoiceDialogOpen, setIsViewInvoiceDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { loadInvoices, payInvoice } = useOrderService();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const data = await loadInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error loading invoices:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las facturas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [loadInvoices, toast]);

  const filteredInvoices = invoices.filter((invoice) => {
    const searchMatch =
      invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    let statusMatch = true;
    if (statusFilter !== 'todos') {
      statusMatch = invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    }

    return searchMatch && statusMatch;
  });

  const viewInvoiceDetails = (invoice) => {
    setCurrentInvoice(invoice);
    setIsViewInvoiceDialogOpen(true);
  };

  const handleCloseViewInvoiceDialog = () => {
    setIsViewInvoiceDialogOpen(false);
  };

  const handlePayInvoice = async (invoiceId) => {
    try {
      const updatedInvoice = await payInvoice(invoiceId);
      if (updatedInvoice) {
        // Optimistically update the UI
        setInvoices(prevInvoices =>
          prevInvoices.map(invoice =>
            invoice.id === invoiceId ? updatedInvoice : invoice
          )
        );
        toast({
          title: "Éxito",
          description: "Factura pagada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo pagar la factura",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast({
        title: "Error",
        description: "No se pudo pagar la factura",
        variant: "destructive",
      });
    }
  };

  const generateInvoicePDF = async (invoice) => {
    const input = document.getElementById(`invoice-content-${invoice.id}`);
    if (!input) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF de la factura",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF de la factura",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Facturas</CardTitle>
          <CardDescription>Gestiona todas las facturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2 w-1/2">
              <Input
                placeholder="Buscar facturas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Cargando facturas...</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No se encontraron facturas</TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'pagada' ? 'default' : 
                               invoice.status === 'cancelada' ? 'destructive' :
                               invoice.status === 'pendiente' ? 'secondary' :
                               invoice.status === 'vencida' ? 'outline' : 'default'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Acciones
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewInvoiceDetails(invoice)}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)}>
                              Generar PDF
                            </DropdownMenuItem>
                            {invoice.status !== 'pagada' && (
                              <DropdownMenuItem onClick={() => handlePayInvoice(invoice.id)}>
                                Marcar como pagada
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewInvoiceDialogOpen} onOpenChange={setIsViewInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {currentInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de Factura {currentInvoice.invoiceNumber}</DialogTitle>
                <DialogDescription>
                  Cliente: {currentInvoice.customerName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">ID de Factura:</p>
                    <p className="text-sm">{currentInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fecha de Emisión:</p>
                    <p className="text-sm">{new Date(currentInvoice.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cliente:</p>
                    <p className="text-sm">{currentInvoice.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nº de Orden:</p>
                    <p className="text-sm">{currentInvoice.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado:</p>
                    <p className="text-sm">{currentInvoice.status}</p>
                  </div>
                </div>
                
                {currentInvoice.items && currentInvoice.items.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Productos:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName || `Producto ${item.product_id}`}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-right mt-4">
                      <p className="text-sm font-medium">Subtotal: ${currentInvoice.subtotal?.toFixed(2)}</p>
                      <p className="text-sm font-medium">Impuestos: ${currentInvoice.tax?.toFixed(2)}</p>
                      <p className="text-sm font-medium">Total: ${currentInvoice.total?.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewInvoiceDialogOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;

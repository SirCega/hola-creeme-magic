
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, FileDown, Receipt, Printer, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useOrderService } from '@/hooks/useOrderService';
import { Invoice } from '@/types/order-types';
import { useAuth } from '@/hooks/useAuth';

const Invoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const orderService = useOrderService();
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      await orderService.loadInvoices();
      setInvoices(orderService.invoices);
    };
    
    loadData();
  }, [orderService.invoices]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' || 
      (invoice.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (invoice.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    if (user?.role === 'cliente') {
      return matchesSearch && matchesStatus && invoice.customerName === user.name;
    } else {
      return matchesSearch && matchesStatus;
    }
  });

  const viewInvoice = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };
  
  const payInvoice = async (invoiceId: string) => {
    try {
      const updatedInvoice = await orderService.payInvoice(invoiceId);
      if (updatedInvoice) {
        setInvoices(invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const printInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    setInvoiceToPrint(invoice);
    setTimeout(() => {
      window.print();
      setInvoiceToPrint(null);
    }, 150);
  };

  const downloadInvoicePDF = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    setInvoiceToPrint(invoice);
    setTimeout(async () => {
      if (invoiceRef.current) {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        pdf.save(`Factura_${invoice.invoiceNumber}.pdf`);
      }
      setInvoiceToPrint(null);
    }, 300);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Pendiente</Badge>;
      case 'pagada':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Pagada</Badge>;
      case 'cancelada':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderInvoiceContent = (invoice: Invoice | null) => (
    invoice ? (
      <div ref={invoiceRef} style={{ padding: '32px', maxWidth: '700px', margin: '0 auto', background: 'white', color: '#111', fontFamily: 'sans-serif' }}>
        <h1 style={{ marginBottom: 0 }}>LicorHub</h1>
        <p style={{marginTop:0, fontSize:'14px', color: '#888'}}>Factura #{invoice.invoiceNumber}</p>
        <hr />
        <div style={{ display:'flex', justifyContent:'space-between', margin: '18px 0'}}>
          <div>
            <b>Cliente:</b> {invoice.customerName} <br />
            <b>Dirección:</b> {invoice.customerAddress}
          </div>
          <div>
            <b>Fecha:</b> {new Date(invoice.date || invoice.issue_date).toLocaleDateString()} <br />
            <b>Estado:</b> {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </div>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f9f9f9'}}>
              <th style={{border:'1px solid #ddd', padding:'8px'}}>Producto</th>
              <th style={{border:'1px solid #ddd', padding:'8px'}}>Cantidad</th>
              <th style={{border:'1px solid #ddd', padding:'8px'}}>Precio Unit.</th>
              <th style={{border:'1px solid #ddd', padding:'8px'}}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, i) => (
              <tr key={i}>
                <td style={{border:'1px solid #ddd', padding:'8px'}}>{item.productName}</td>
                <td style={{border:'1px solid #ddd', padding:'8px', textAlign:'center'}}>{item.quantity}</td>
                <td style={{border:'1px solid #ddd', padding:'8px', textAlign:'right'}}>${item.price.toFixed(2)}</td>
                <td style={{border:'1px solid #ddd', padding:'8px', textAlign:'right'}}>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:'18px', textAlign:'right'}}>
          <b>Subtotal:</b> ${(invoice.subtotal || 0).toFixed(2)}<br />
          <b>IVA (19%):</b> ${(invoice.tax || 0).toFixed(2)}<br />
          <b style={{fontSize:'18px'}}>Total:</b> ${(invoice.total || invoice.total_amount).toFixed(2)}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6">
      <div style={{ display: invoiceToPrint ? 'block' : 'none', position:'fixed', left:'-100vw', top:0, zIndex:-1 }}>
        {renderInvoiceContent(invoiceToPrint)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Facturas</CardTitle>
              <CardDescription>
                Administra las facturas generadas a partir de pedidos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar factura..."
                  className="pl-8 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm" className="h-9">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Reporte
            </Button>
          </div>
            
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{invoice.orderNumber}</TableCell>
                      <TableCell>{new Date(invoice.date || invoice.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">${(invoice.total || invoice.total_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewInvoice(invoice)}
                          >
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hidden sm:flex" 
                            onClick={() => printInvoice(invoice.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="hidden sm:flex" 
                            onClick={() => downloadInvoicePDF(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No se encontraron facturas que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          {currentInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Receipt className="mr-2 h-5 w-5" />
                    Factura #{currentInvoice.invoiceNumber}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => printInvoice(currentInvoice.id)}
                    >
                      <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadInvoicePDF(currentInvoice.id)}
                    >
                      <Download className="h-4 w-4 mr-2" /> Descargar PDF
                    </Button>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Fecha: {new Date(currentInvoice.date || currentInvoice.issue_date).toLocaleDateString()}
                  &nbsp;|&nbsp;Estado: {currentInvoice.status.charAt(0).toUpperCase() + currentInvoice.status.slice(1)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Datos de Cliente</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Cliente:</span> {currentInvoice.customerName}</p>
                      <p><span className="font-medium">Dirección:</span> {currentInvoice.customerAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Datos de Facturación</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nº de Factura:</span> {currentInvoice.invoiceNumber}</p>
                      <p><span className="font-medium">Nº de Pedido:</span> {currentInvoice.orderNumber}</p>
                      <p><span className="font-medium">Fecha Emisión:</span> {new Date(currentInvoice.date || currentInvoice.issue_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Detalle de Productos</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(currentInvoice.items || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <span>${(currentInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">IVA (19%):</span>
                    <span>${(currentInvoice.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-lg font-bold">
                    <span>Total:</span>
                    <span>${(currentInvoice.total || currentInvoice.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {currentInvoice.status === 'pendiente' && (
                  <Button 
                    onClick={() => {
                      payInvoice(currentInvoice.id);
                      setIsInvoiceDialogOpen(false);
                    }}
                  >
                    Marcar como Pagada
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setIsInvoiceDialogOpen(false)}
                >
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

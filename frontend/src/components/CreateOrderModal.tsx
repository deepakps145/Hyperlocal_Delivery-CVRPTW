import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createOrder } from '../services/api';
import { X, GripHorizontal } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export function CreateOrderModal({ isOpen, onClose, onOrderCreated, selectedLocation }: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [priority, setPriority] = useState('2');
  const [weight, setWeight] = useState('1.0');
  const [timeWindowStart, setTimeWindowStart] = useState('');
  const [timeWindowEnd, setTimeWindowEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Draggable state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset position to center-ish when opened
      setPosition({ x: window.innerWidth / 2 - 300, y: 100 });
      // Set default start time to today
      const now = new Date();
      // Format to YYYY-MM-DDTHH:mm
      const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setTimeWindowStart(localIso);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      alert('Please select delivery location on the map (click on the background map)');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customer_name: customerName,
        delivery_address: deliveryAddress,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        priority: parseInt(priority),
        weight: parseFloat(weight),
        delivery_time_start: timeWindowStart ? new Date(timeWindowStart).toISOString() : null,
        delivery_time_end: timeWindowEnd ? new Date(timeWindowEnd).toISOString() : null,
      };

      await createOrder(orderData);
      alert('Order created successfully!');
      onOrderCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCustomerName('');
    setDeliveryAddress('');
    setPriority('2');
    setWeight('1.0');
    setTimeWindowStart('');
    setTimeWindowEnd('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] pointer-events-none">
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="absolute bg-slate-900 border border-slate-700 rounded-lg shadow-2xl pointer-events-auto flex flex-col w-[600px] max-h-[80vh]"
        style={{ 
          left: position.x, 
          top: position.y,
        }}
      >
        {/* Draggable Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-slate-800 cursor-move bg-slate-800/50 rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-white font-semibold">
            <GripHorizontal className="w-5 h-5 text-slate-400" />
            Create New Order
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-slate-300">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="text-slate-300">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter delivery address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-300">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="1">High (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">Low (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-slate-300">Weight (kg) - Capacity Check</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeWindowStart" className="text-slate-300">Delivery Window Start</Label>
                <Input
                  id="timeWindowStart"
                  type="datetime-local"
                  value={timeWindowStart}
                  onChange={(e) => setTimeWindowStart(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeWindowEnd" className="text-slate-300">Delivery Window End</Label>
                <Input
                  id="timeWindowEnd"
                  type="datetime-local"
                  value={timeWindowEnd}
                  onChange={(e) => setTimeWindowEnd(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                Delivery Location
              </Label>
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 text-center">
                {selectedLocation ? (
                  <div className="text-emerald-400">
                    Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                ) : (
                  <div className="text-slate-400">
                    Click on the background map to select a location
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedLocation}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
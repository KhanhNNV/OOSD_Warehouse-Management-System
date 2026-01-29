import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { ScannerModal } from "@/components/scanner/ScannerModal";

interface ScannerButtonProps extends ButtonProps {
  onScanResult: (result: string) => void;
}

export function ScannerButton({ 
  onScanResult, 
  className, 
  children, 
  ...props 
}: ScannerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleScanSuccess = (text: string) => {
    onScanResult(text);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size={children ? "default" : "icon"} 
        onClick={() => setIsOpen(true)}
        className={className} 
        title="Quét mã vạch"
        {...props}
      >
        <ScanBarcode className={children ? "mr-2 w-5 h-5" : "w-5 h-5"} />
        {children}
      </Button>

      <ScannerModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StockBadge from './StockBadge';
import type { Product } from '@/types';

interface Props {
  product: Product;
  currency: string;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductCard({ product, currency, canManage, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{product.name}</p>
            {!product.active && <Badge variant="outline">Inactive</Badge>}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {product.sku ? `${product.sku} · ` : ''}{product.category ?? 'Uncategorized'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StockBadge product={product} />
          <span className="text-sm font-semibold">{currency} {product.unitPrice.toFixed(2)}</span>
          {canManage && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit product"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete product"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

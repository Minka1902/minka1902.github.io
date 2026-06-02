import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export function isLowStock(product: Product): boolean {
  const threshold = product.lowStockThreshold ?? 0;
  return product.stockQty <= threshold;
}

export default function StockBadge({ product }: Props) {
  const low = isLowStock(product);
  const out = product.stockQty <= 0;
  return (
    <Badge variant={out ? 'destructive' : low ? 'outline' : 'secondary'}>
      {out ? 'Out of stock' : `${product.stockQty} in stock`}
      {low && !out ? ' · low' : ''}
    </Badge>
  );
}

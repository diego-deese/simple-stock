import React from 'react';
import ProductItemBase, { ProductItemBaseProps } from '@components/ProductItemBase';

export default function ProductItemDesperdicio(props: ProductItemBaseProps) {
  // For desperdicio we show the stock row
  return <ProductItemBase {...props} variantColor={undefined} showStock={true} />;
}

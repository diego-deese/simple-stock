import React from 'react';
import ProductItemBase, { ProductItemBaseProps } from '@components/ProductItemBase';
import { colors } from '@theme/colors';

const ENTREGAS_COLOR = colors.success;

export default function EntregaItem(props: ProductItemBaseProps) {
  return <ProductItemBase {...props} variantColor={ENTREGAS_COLOR} showStock={false} />;
}

export const SOUTH_AFRICA_NATIONWIDE_SHIPPING_FEE = 75

export const getNationwideShippingFee = (subtotal: number) =>
  subtotal > 0 ? SOUTH_AFRICA_NATIONWIDE_SHIPPING_FEE : 0


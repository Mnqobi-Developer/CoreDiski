import type { CheckoutState } from './checkoutTypes.ts'

export const createInitialCheckoutState = (): CheckoutState => ({
  form: {
    billingAddress: '',
    billingSameAsShipping: true,
    shippingAddress: '',
  },
  notice: null,
  paymentPageOpened: false,
})

import type { Notice } from '../../shared/types/notice.ts'
import type { CartLineItem } from '../cart/cartTypes.ts'

export type CheckoutFormValues = {
  billingAddress: string
  billingSameAsShipping: boolean
  shippingAddress: string
}

export type CheckoutState = {
  form: CheckoutFormValues
  notice: Notice | null
}

export type CheckoutCustomerDetails = {
  email: string
  name: string
}

export type RenderCheckoutPageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  customer: CheckoutCustomerDetails
  form: CheckoutFormValues
  lines: CartLineItem[]
  notice: Notice | null
  shipping: number
  subtotal: number
  total: number
}

import { supabase } from '../../lib/supabase.ts'
import { normalizeShopProduct } from '../shop/shopCatalog.ts'
import type { CartLineItem } from '../cart/cartTypes.ts'
import type { OrderRecord } from './orderTypes.ts'

type OrderRow = {
  created_at: string
  email: string
  id: string
  items: unknown
  payment_status: OrderRecord['paymentStatus']
  shipping_address: string
  status: OrderRecord['status']
  total: number
  user_id: string
}

const orderColumns = [
  'id',
  'user_id',
  'email',
  'shipping_address',
  'items',
  'total',
  'payment_status',
  'status',
  'created_at',
].join(',\n')

const isValidStoredOrderItem = (value: unknown): value is CartLineItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CartLineItem>

  return (
    typeof candidate.lineId === 'string' &&
    typeof candidate.quantity === 'number' &&
    typeof candidate.size === 'string' &&
    typeof candidate.subtotal === 'number' &&
    Boolean(candidate.product && typeof candidate.product === 'object')
  )
}

const parseOrderItems = (value: unknown): CartLineItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isValidStoredOrderItem)
    .map((item) => ({
      ...item,
      product: normalizeShopProduct(item.product),
    }))
}

const mapOrderRow = (row: OrderRow): OrderRecord => ({
  createdAt: row.created_at,
  email: row.email,
  id: row.id,
  items: parseOrderItems(row.items),
  paymentStatus: row.payment_status,
  shippingAddress: row.shipping_address,
  status: row.status,
  total: Number(row.total),
  userId: row.user_id,
})

const mapOrderToRow = (order: OrderRecord) => ({
  email: order.email,
  id: order.id,
  items: order.items,
  payment_status: order.paymentStatus,
  shipping_address: order.shippingAddress,
  status: order.status,
  total: order.total,
  user_id: order.userId,
})

export const listOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(orderColumns)
    .order('created_at', { ascending: false })
    .returns<OrderRow[]>()

  if (error || !data) {
    return { data: [] as OrderRecord[], error }
  }

  return { data: data.map(mapOrderRow), error: null }
}

export const createOrderRecord = async (order: OrderRecord) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(mapOrderToRow(order))
    .select(orderColumns)
    .single<OrderRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapOrderRow(data), error: null }
}

export const updateOrderRecord = async (order: OrderRecord) => {
  const { data, error } = await supabase
    .from('orders')
    .update(mapOrderToRow(order))
    .eq('id', order.id)
    .select(orderColumns)
    .single<OrderRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapOrderRow(data), error: null }
}

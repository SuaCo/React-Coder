import { collection, query, where, documentId, getDocs, writeBatch, addDoc } from "firebase/firestore"
import { useCart } from "../../Context/CartContext"

import { db } from '../services/firebase/firebaseConfig'

import { useNotification } from "../../Notification/notification"
import { useState } from "react"

import { useNavigate } from "react-router-dom"
import "../Checkout/Checkout.css"

const Checkout = () => {
    const [loading, setLoading] = useState(false)
    const { cart, total, clearCart } = useCart()

    const { setNotification } = useNotification()

    const navigate = useNavigate()

    const createOrder = async () => {
        setLoading(true)
        const objOrder = {
            buyer: {
                name: 'Sebastian Suarez',
                phone: '123456789',
                email: 'sebastian@example.com'
            },
            items: cart,
            total
        }

        try {
            const ids = cart.map(prod => prod.id)

            const productsRef = query(collection(db, 'products'), where(documentId(), 'in', ids))
    
            const { docs } = await getDocs(productsRef)
    
            const batch = writeBatch(db)
    
            const outOfStock = []
    
            docs.forEach(doc => {
                const fieldsDoc = doc.data()
                const stockDb = fieldsDoc.stock
    
                const productAddedToCart = cart.find(prod => prod.id === doc.id)
                const prodQuantity = productAddedToCart?.quantity
    
                if(stockDb >= prodQuantity) {
                    //updateDoc
                    batch.update(doc.ref, { stock: stockDb - prodQuantity })
                } else {
                    outOfStock.push({ id: doc.id, ...fieldsDoc})
                }
            })
    
            if(outOfStock.length === 0) {
                batch.commit()
                
                const ordersRef = collection(db, 'orders')
    
                const { id } = await addDoc(ordersRef, objOrder)
                setNotification('success', 'Gracias por tu compra. La orden fue generada correctamente, el id es: ' + id)
                clearCart()
                navigate('/')
            } else {
                setNotification('error', 'hay productos que no tienen stock')
            }
        } catch (error) {
            setNotification('error', 'hubo un error en la generacion de la orden')
        } finally {
            setLoading(false)
        }
    }

    if(loading) {
        return (
            <h1>Se esta generando su orden...</h1>
        )
    }

    return (
        <>
        <h1 className="CartList">Checkout</h1>
            <div className="CartResumen">
                <input className="Field" type="text" name="name"  placeholder="Nombre" />
                <input className="Field" type="text" name="phone"  placeholder="Teléfono" />
                <input className="Field" type="email" name="email" placeholder="Correo electrónico" />
                <button className="Option" onClick={createOrder}>Generar orden de compra</button>
            </div>
           
                

      </>
    )
}

export default Checkout 
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart') 

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const [productInCart] = cart.filter(product => product.id === productId);

      // const productInCart = cart.find(product => product.id === productId);
      const productStock: Stock = (await api.get(`/stock/${productId}`)).data;

      if (productStock.amount === 0 || productInCart && (productInCart.amount + 1) > productStock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
      }
      else {
        if (productInCart) {
          updateProductAmount({ productId: productInCart.id, amount: productInCart.amount + 1 });
        } else {
          const product: Product = (await api.get(`/products/${productId}`)).data;
          const newCart = [...cart, { ...product, amount: 1 }];
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
      
    } catch (error) {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const [productInCart] = cart.filter(product => product.id === productId);
      if (!productInCart) {
        throw new Error;
      }

      const newCart = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart)
      
    } catch (error) {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount <= 0) {
        return
      }

      const productStock: Stock = (await api.get(`/stock/${productId}`)).data;
 
      if(amount <= productStock.amount) {
        const newCart = cart.map(product => {

          if (product.id === productId){
            product.amount = amount
          }

          return product
        });
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
      
    } catch (error) {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

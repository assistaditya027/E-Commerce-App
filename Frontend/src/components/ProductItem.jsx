import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { useContext } from 'react';

const ProductItem = ({ id, image, name, price }) => {
  const { currency } = useContext(ShopContext);

  return (
    <Link to={`/product/${id}`} className="text-gray-700 dark:text-gray-200 cursor-pointer">
      <div className="relative overflow-hidden aspect-[4/5] w-full bg-gray-100">
        <img
          src={image[0]}
          className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition ease-in-out"
          alt=""
        />
      </div>
      <p className="pt-3 pb-1 text-sm">{name}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {currency}
        {price}
      </p>
    </Link>
  );
};

export default ProductItem;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateCartAdd = ({ itemId, size }) => {
  if (!isNonEmptyString(itemId)) return 'itemId is required';
  if (!isNonEmptyString(size)) return 'size is required';
  return null;
};

export const validateCartUpdate = ({ itemId, size, quantity }) => {
  if (!isNonEmptyString(itemId)) return 'itemId is required';
  if (!isNonEmptyString(size)) return 'size is required';
  if (typeof quantity !== 'number' || !Number.isFinite(quantity))
    return 'quantity must be a number';
  return null;
};

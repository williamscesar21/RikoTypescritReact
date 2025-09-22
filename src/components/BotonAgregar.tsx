import React from 'react';

interface BotonAgregarProps {
  onAgregar: () => void;
  texto?: string;
  className?: string;
}

const BotonAgregar: React.FC<BotonAgregarProps> = ({
  onAgregar,
  texto = 'Agregar',
  className = 'add-button',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAgregar();
  };

  return (
    <button className={className} onClick={handleClick}>
      {texto}
    </button>
  );
};

export default BotonAgregar;

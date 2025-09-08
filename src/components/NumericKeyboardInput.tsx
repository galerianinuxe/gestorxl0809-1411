
import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface NumericKeyboardInputProps {
  value: number;
  onChange: (value: number) => void;
}

const NumericKeyboardInput: React.FC<NumericKeyboardInputProps> = ({
  value,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState(String(value));

  // Atualiza o valor tanto no componente pai quanto localmente
  const updateValue = (val: string) => {
    setInternalValue(val);
    const num = parseFloat(val.replace(",", "."));
    if (!isNaN(num)) {
      onChange(num);
    } else {
      onChange(0); // Se o campo ficar inválido
    }
  };

  const handleNumberClick = (digit: string) => {
    let newValue = internalValue === "0" ? digit : internalValue + digit;
    // Prevenir múltiplos pontos
    if (digit === "." && internalValue.includes(".")) return;
    if (digit === "," && internalValue.includes(",")) return;
    if (digit === "." && internalValue.includes(",")) return;
    newValue = newValue.replace(",", "."); // trata vírgula como separador decimal
    updateValue(newValue);
  };

  const handleBackspace = () => {
    let newValue = internalValue.slice(0, -1) || "0";
    updateValue(newValue);
  };

  const handleClear = () => {
    updateValue("0");
  };

  // Quando o pai muda o valor, atualizar input localmente
  React.useEffect(() => {
    setInternalValue(String(value));
  }, [value]);

  return (
    <div className="flex flex-col items-center py-2 w-full">
      <div
        className="w-[140%] max-w-[370px] mx-auto text-center font-bold mb-6"
        style={{
          fontSize: "3rem", // 50% maior que 2rem (antes era 2rem/2.5rem)
          color: "#4fd683",
          background: "transparent",
          border: "none",
          boxShadow: "none",
          lineHeight: "1.2",
          minHeight: "60px", // para manter o alinhamento visual
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none"
        }}
      >
        {internalValue}
      </div>

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto my-0">
        {[..."123456789"].map((n) => (
          <button
            key={n}
            type="button"
            className="bg-gray-900 text-white text-2xl font-semibold py-3 rounded hover:bg-green-700 transition border border-white"
            onClick={() => handleNumberClick(n)}
          >
            {n}
          </button>
        ))}
        {/* Zero e ponto */}
        <button
          type="button"
          className="bg-gray-900 text-white text-2xl font-semibold py-3 rounded hover:bg-green-700 transition border border-white"
          onClick={() => handleNumberClick("0")}
        >
          0
        </button>
        <button
          type="button"
          className="bg-gray-900 text-white text-2xl font-semibold py-3 rounded hover:bg-green-700 transition border border-white"
          onClick={() => handleNumberClick(".")}
        >
          ,
        </button>
        {/* Backspace */}
        <button
          type="button"
          className="bg-red-700 text-white text-2xl font-semibold py-3 rounded hover:bg-red-900 transition border border-white"
          onClick={handleBackspace}
        >
          ⌫
        </button>
      </div>
      <button
        type="button"
        className="mt-2 text-xs underline text-gray-300"
        onClick={handleClear}
      >
        Limpar
      </button>
    </div>
  );
};

export default NumericKeyboardInput;

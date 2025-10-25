import React, { createContext, useContext, useState, ReactNode } from "react";

interface TitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export const TitleProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [title, setTitle] = useState<string>("");

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  );
};

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (context === undefined) {
    throw new Error("useTitle must be used within a TitleProvider");
  }
  return context;
};

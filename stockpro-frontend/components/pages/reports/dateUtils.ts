export const getCurrentYearRange = () => {
  const year = new Date().getFullYear();

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
};


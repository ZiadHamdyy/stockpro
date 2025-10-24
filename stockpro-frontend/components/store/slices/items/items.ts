import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Item, ItemGroup, Unit } from './itemsApi';

interface ItemsState {
  items: Item[];
  itemGroups: ItemGroup[];
  units: Unit[];
  selectedItem: Item | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ItemsState = {
  items: [],
  itemGroups: [],
  units: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<Item[]>) => {
      state.items = action.payload;
    },
    setItemGroups: (state, action: PayloadAction<ItemGroup[]>) => {
      state.itemGroups = action.payload;
    },
    setUnits: (state, action: PayloadAction<Unit[]>) => {
      state.units = action.payload;
    },
    setSelectedItem: (state, action: PayloadAction<Item | null>) => {
      state.selectedItem = action.payload;
    },
    addItem: (state, action: PayloadAction<Item>) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action: PayloadAction<Item>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    addItemGroup: (state, action: PayloadAction<ItemGroup>) => {
      state.itemGroups.push(action.payload);
    },
    updateItemGroup: (state, action: PayloadAction<ItemGroup>) => {
      const index = state.itemGroups.findIndex(group => group.id === action.payload.id);
      if (index !== -1) {
        state.itemGroups[index] = action.payload;
      }
    },
    removeItemGroup: (state, action: PayloadAction<string>) => {
      state.itemGroups = state.itemGroups.filter(group => group.id !== action.payload);
    },
    addUnit: (state, action: PayloadAction<Unit>) => {
      state.units.push(action.payload);
    },
    updateUnit: (state, action: PayloadAction<Unit>) => {
      const index = state.units.findIndex(unit => unit.id === action.payload.id);
      if (index !== -1) {
        state.units[index] = action.payload;
      }
    },
    removeUnit: (state, action: PayloadAction<string>) => {
      state.units = state.units.filter(unit => unit.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setItems,
  setItemGroups,
  setUnits,
  setSelectedItem,
  addItem,
  updateItem,
  removeItem,
  addItemGroup,
  updateItemGroup,
  removeItemGroup,
  addUnit,
  updateUnit,
  removeUnit,
  setLoading,
  setError,
  clearError,
} = itemsSlice.actions;

export default itemsSlice.reducer;


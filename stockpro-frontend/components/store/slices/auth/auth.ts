import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
    token: string | null;
    user: any;
  }
  
  const initialState: AuthState = {
    token: null,
    user: null,
  };


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, accessToken } = action.payload;
            state.token = accessToken;
            state.user = user;
        },
        logOut: (state) => {
            state.token = null;
            state.user = null;
        }
    }
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentToken = (state: any) => state.auth.token;
export const selectCurrentUser = (state: any) => state.auth.user;

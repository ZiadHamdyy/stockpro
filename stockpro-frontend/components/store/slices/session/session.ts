import { createSlice } from "@reduxjs/toolkit";

interface SessionState {
    id: string | null,
    ipAddress: string | null,
    userAgent: string | null,
    status: string | null,
    createdAt: string | null,
    updatedAt: string | null,
    isCurrent: boolean | null,
}

const initialState: SessionState = {
    id: null,
    ipAddress: null,
    userAgent: null,
    status: null,
    createdAt: null,
    updatedAt: null,
    isCurrent: null,
};

const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {
        getAllSessions: (state, action) => {
            const session = action.payload as SessionState;
            state.id = session.id;
            state.ipAddress = session.ipAddress;
            state.userAgent = session.userAgent;
            state.status = session.status;
            state.createdAt = session.createdAt;
            state.updatedAt = session.updatedAt;
            state.isCurrent = session.isCurrent;
        },
    }
});

export const { getAllSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
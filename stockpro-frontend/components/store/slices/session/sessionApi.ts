import { apiSlice } from "../../ApiSlice";
import { getAllSessions } from "./session";

interface SessionState {
  id: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isCurrent: boolean | null;
}

export const sessionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder: any) => ({
    getSessions: builder.query({
      query: () => "sessions",
      async onQueryStarted(_: any, { dispatch, queryFulfilled }: any) {
        try {
          const { data } = await queryFulfilled;
          if (data.length > 0) {
            dispatch(getAllSessions(data[0]));
          }
        } catch (error) {
          console.error("Error fetching Sessions:", error);
        }
      },
    }),
  }),
});

export const { useGetSessionsQuery } = sessionApiSlice;
